const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../utils/emailHelper');
const { db } = require('../utils/supabaseClient');

// In-memory OTP storage for active sessions
// Structure: { [email]: { hashedOtp, expiresAt, lastSentAt, attempts } }
const otpStore = {};

// In-memory brute force lock store
// Structure: { [email]: lockUntilTimestamp }
const lockStore = {};

function normalizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmedEmail = email.trim().toLowerCase();
  return trimmedEmail || null;
}

function isValidChristEmail(email) {
  if (!email) {
    return false;
  }

  // Specifically check for @bcah.christuniversity.in domain
  return /^[a-z0-9._%+\-]+@bcah\.christuniversity\.in$/i.test(email);
}

function sendPayload(res, statusCode, success, message, data = null) {
  const payload = { success, message };

  if (data) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
}

function cleanupExpiredStore() {
  const now = Date.now();
  let removedOtpEntries = 0;

  for (const email in otpStore) {
    if (otpStore[email].expiresAt <= now) {
      delete otpStore[email];
      removedOtpEntries += 1;
    }
  }

  for (const email in lockStore) {
    if (lockStore[email] <= now) {
      delete lockStore[email];
    }
  }

  if (removedOtpEntries > 0) {
    console.log(`[CLEANUP] Removed ${removedOtpEntries} expired OTP entry(ies) from memory.`);
  }
}

/**
 * Periodic clean-up task to delete expired OTPs from memory.
 */
setInterval(cleanupExpiredStore, 60 * 1000); // Run cleanup every 1 minute

/**
 * 1. POST /api/send-otp
 * Generates and sends a new OTP with Supabase integration
 */
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    // Validate Christ University email domain
    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your Christ University email ID (@bcah.christuniversity.in).');
    }

    cleanupExpiredStore();

    // Check if user is locked due to too many failed attempts
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    // Check recent failed attempts from database
    const recentFailedAttempts = await db.getRecentFailedAttempts(trimmedEmail);
    if (recentFailedAttempts >= 5) {
      lockStore[trimmedEmail] = Date.now() + 2 * 60 * 1000; // Lock for 2 minutes
      return sendPayload(res, 400, false, 'Too many failed attempts. Your account is locked for 2 minutes.');
    }

    // Check cooldown for resending OTP
    const record = otpStore[trimmedEmail];
    const now = Date.now();
    
    if (record) {
      const secondsSinceLastSend = (now - record.lastSentAt) / 1000;
      if (secondsSinceLastSend < 30) {
        const remainingCooldown = Math.ceil(30 - secondsSinceLastSend);
        return sendPayload(res, 400, false, `Please wait ${remainingCooldown} seconds before requesting another code.`);
      }
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Store in memory for quick verification
    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000, // 90 seconds
      lastSentAt: now,
      attempts: 0,
    };

    // Log OTP to Supabase database
    try {
      await db.logOtp(trimmedEmail, otp, hashedOtp, 90);
      console.log(`[OTP] Generated and logged verification code for ${trimmedEmail}`);
    } catch (dbError) {
      console.error('[SUPABASE] Error logging OTP:', dbError.message);
      // Continue even if DB logging fails - OTP is still sent
    }

    // Send OTP email
    await sendOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'Verification code sent to your Christ email.', {
      email: trimmedEmail,
      expiresIn: 90,
    });
  } catch (error) {
    console.error('[OTP ERROR] send-otp:', error.message);
    
    // Check if it's an email authentication error
    if (error.message.includes('Authentication failed') || error.message.includes('535')) {
      return sendPayload(res, 500, false, 'Email service configuration error. Please contact administrator.');
    }
    
    return sendPayload(res, 500, false, `Failed to send code: ${error.message}`);
  }
};

/**
 * 2. POST /api/verify-otp
 * Validates the verification code submitted by the user with Supabase integration
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const trimmedEmail = normalizeEmail(email);
    const cleanOtp = typeof otp === 'string' ? otp.trim() : '';

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your Christ University email ID (@bcah.christuniversity.in).');
    }

    if (!cleanOtp) {
      return sendPayload(res, 400, false, 'Please enter the verification code.');
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return sendPayload(res, 400, false, 'Verification code must be 6 digits.');
    }

    cleanupExpiredStore();

    // Check if user is locked
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];

    // Check if OTP exists and is not expired
    if (!record || Date.now() > record.expiresAt) {
      if (record) {
        delete otpStore[trimmedEmail];
      }
      return sendPayload(res, 400, false, 'Code expired. Please request a new one.');
    }

    // Increment attempts
    record.attempts += 1;

    // Verify OTP
    const isMatch = await bcrypt.compare(cleanOtp, record.hashedOtp);

    if (!isMatch) {
      // Update failed attempt in database
      try {
        await db.verifyOtp(trimmedEmail, cleanOtp); // This will increment attempts in DB
      } catch (dbError) {
        console.error('[SUPABASE] Error updating failed attempt:', dbError.message);
      }

      if (record.attempts >= 5) {
        lockStore[trimmedEmail] = Date.now() + 2 * 60 * 1000; // Lock for 2 minutes
        delete otpStore[trimmedEmail];
        return sendPayload(res, 400, false, 'Too many failed attempts. Your account is locked for 2 minutes.');
      }

      const remainingAttempts = 5 - record.attempts;
      return sendPayload(res, 400, false, `Incorrect code. Please try again. ${remainingAttempts} attempts remaining.`);
    }

    // OTP verified successfully
    delete otpStore[trimmedEmail];
    delete lockStore[trimmedEmail];

    // Update OTP as verified in database
    try {
      await db.verifyOtp(trimmedEmail, cleanOtp);
    } catch (dbError) {
      console.error('[SUPABASE] Error marking OTP as verified:', dbError.message);
    }

    // Create or update user in Supabase (prevents duplicates)
    let user;
    try {
      user = await db.createOrGetUser(trimmedEmail);
      console.log(`[OTP] Successful verification for ${trimmedEmail}, User ID: ${user.id}`);
      
      // Log successful login activity
      await db.logActivity(user.id, 'login_success', {
        method: 'otp',
        email: trimmedEmail
      });
    } catch (dbError) {
      console.error('[SUPABASE] Error creating/updating user:', dbError.message);
      // Continue even if DB fails - user can still login
    }

    console.log(`[OTP] Successful verification for ${trimmedEmail}`);

    return sendPayload(res, 200, true, 'Verification successful.', {
      verified: true,
      email: trimmedEmail,
      userId: user?.id,
      userDetails: user ? {
        fullName: user.full_name,
        rollNumber: user.roll_number,
        department: user.department,
        loginCount: user.login_count
      } : null
    });
  } catch (error) {
    console.error('[OTP ERROR] verify-otp:', error.message);
    
    // Log failed verification attempt
    try {
      const trimmedEmail = normalizeEmail(req.body?.email);
      if (trimmedEmail) {
        await db.logOtp(trimmedEmail, 'FAILED', 'failed_attempt', 0);
      }
    } catch (dbError) {
      console.error('[SUPABASE] Error logging failed attempt:', dbError.message);
    }
    
    return sendPayload(res, 500, false, 'Internal Server Error');
  }
};

/**
 * 3. POST /api/resend-otp
 * Enforces cooldown rules and sends a fresh OTP
 */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your Christ University email ID (@bcah.christuniversity.in).');
    }

    cleanupExpiredStore();

    // Check if user is locked
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];
    const now = Date.now();

    // Check cooldown and expiry rules
    if (record) {
      const secondsSinceLastSend = (now - record.lastSentAt) / 1000;

      if (secondsSinceLastSend < 30) {
        const remainingCooldown = Math.ceil(30 - secondsSinceLastSend);
        return sendPayload(res, 400, false, `Please wait ${remainingCooldown} seconds before requesting another code.`);
      }

      if (now < record.expiresAt) {
        const remainingExpiry = Math.ceil((record.expiresAt - now) / 1000);
        return sendPayload(res, 400, false, `Previous code is still active. Please wait ${remainingExpiry} seconds to request a new one.`);
      }
    }

    // Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Update memory store
    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Log new OTP to database
    try {
      await db.logOtp(trimmedEmail, otp, hashedOtp, 90);
      console.log(`[OTP] Resent and logged verification code for ${trimmedEmail}`);
    } catch (dbError) {
      console.error('[SUPABASE] Error logging resent OTP:', dbError.message);
    }

    // Send email
    await sendOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'A new verification code has been sent.', {
      email: trimmedEmail,
      expiresIn: 90,
    });
  } catch (error) {
    console.error('[OTP ERROR] resend-otp:', error.message);
    
    if (error.message.includes('Authentication failed') || error.message.includes('535')) {
      return sendPayload(res, 500, false, 'Email service configuration error. Please contact administrator.');
    }
    
    return sendPayload(res, 500, false, `Failed to resend code: ${error.message}`);
  }
};

/**
 * 4. GET /api/check-email
 * Check if email is valid Christ email and not duplicate
 */
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    // Validate Christ University email domain
    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 200, false, 'Invalid email domain. Please use @bcah.christuniversity.in email.', {
        isValid: false,
        reason: 'invalid_domain'
      });
    }

    // Check if email already exists in database (prevents duplicates)
    const emailExists = await db.userExists(trimmedEmail);
    
    return sendPayload(res, 200, true, 'Email is valid.', {
      isValid: true,
      email: trimmedEmail,
      isNewUser: !emailExists,
      existsInDb: emailExists
    });
  } catch (error) {
    console.error('[OTP ERROR] check-email:', error.message);
    return sendPayload(res, 500, false, 'Internal Server Error');
  }
};