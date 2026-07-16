const { sendOtpEmail } = require('../utils/emailHelper');
const { db } = require('../utils/supabaseClient');
const bcrypt = require('bcryptjs');

// In-memory OTP storage (temporary until we move to Redis)
const otpStore = {};
const lockStore = {};

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return email.trim().toLowerCase();
}

function isValidChristEmail(email) {
  if (!email) return false;
  // Accept both @christuniversity.in and @bcah.christuniversity.in
  const emailRegex = /^[a-z0-9]+([._-]?[a-z0-9]+)*@(bcah\.)?christuniversity\.in$/i;
  
  // Additional checks for edge cases
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.startsWith('-') || email.startsWith('_')) return false; // No leading special chars
  if (email.includes('.-') || email.includes('-.') || email.includes('._') || email.includes('_.')) return false; // Invalid combinations
  
  return emailRegex.test(email);
}

function sendPayload(res, statusCode, success, message, data = null) {
  const payload = { success, message };
  if (data) payload.data = data;
  return res.status(statusCode).json(payload);
}

// Cleanup expired OTPs from memory
function cleanupExpiredStore() {
  const now = Date.now();
  Object.keys(otpStore).forEach(email => {
    if (otpStore[email].expiresAt <= now) {
      delete otpStore[email];
    }
  });
}

// Extract name from email
function extractNameFromEmail(email) {
  if (!email) return 'Student';
  
  const localPart = email.split('@')[0];
  const nameParts = localPart.split('.');
  
  const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '';
  const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';
  
  return firstName + (lastName ? ' ' + lastName : '');
}

// MAIN OTP FUNCTIONS

exports.sendOtp = async (req, res) => {
  console.log('\n🔄 ===== FIREBASE SEND OTP REQUEST =====');
  console.log('📥 Request body:', req.body);
  
  try {
    const { email } = req.body;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your official university email ID.');
    }

    cleanupExpiredStore();

    // Check lock
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    // Check recent failed attempts from Supabase
    try {
      const recentFailedAttempts = await db.getRecentFailedAttempts(trimmedEmail);
      if (recentFailedAttempts >= 5) {
        lockStore[trimmedEmail] = Date.now() + 2 * 60 * 1000; // Lock for 2 minutes
        return sendPayload(res, 400, false, 'Too many failed attempts. Your account is locked for 2 minutes.');
      }
    } catch (dbError) {
      console.warn('[SUPABASE] Error checking failed attempts:', dbError.message);
      // Continue without database check
    }

    // Check cooldown
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
    
    console.log(`🔐 Generated OTP: ${otp}`);

    // Store OTP in memory (temporary)
    otpStore[trimmedEmail] = {
      otp: otp, // Store plain OTP since it's temporary and short-lived
      expiresAt: now + 5 * 60 * 1000, // 5 minutes (300 seconds)
      lastSentAt: now,
      attempts: 0,
    };

    // Log OTP to Supabase database
    try {
      await db.logOtp(trimmedEmail, otp, otp, 30); // 30 seconds
      console.log(`📊 OTP logged to Supabase database`);
    } catch (dbError) {
      console.warn('[SUPABASE] Error logging OTP:', dbError.message);
      // Continue even if DB logging fails
    }

    // Extract name for welcome message
    const userName = extractNameFromEmail(trimmedEmail);

    // Send OTP via Gmail SMTP (REAL EMAIL)
    console.log(`📧 Sending REAL Gmail OTP to: ${trimmedEmail}`);
    await sendOtpEmail(trimmedEmail, otp, userName);

    console.log(`✅ Firebase OTP sent successfully to ${trimmedEmail}`);

    return sendPayload(res, 200, true, `Welcome ${userName}! Verification code sent to your email!`, {
      email: trimmedEmail,
      expiresIn: 30, // 30 seconds
      userName: userName,
      message: `Hi ${userName}, your OTP has been sent via Firebase Authentication. Check the backend console for your verification code!`
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return sendPayload(res, 500, false, `Failed to send code. Please try again.`);
  }
};

exports.verifyOtp = async (req, res) => {
  console.log('\n🔄 ===== FIREBASE VERIFY OTP REQUEST =====');
  console.log('📥 Request body:', req.body);
  
  try {
    const { email, otp } = req.body;
    const trimmedEmail = normalizeEmail(email);
    const cleanOtp = typeof otp === 'string' ? otp.trim() : '';

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your official university email ID.');
    }

    if (!cleanOtp) {
      return sendPayload(res, 400, false, 'Please enter the verification code.');
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      return sendPayload(res, 400, false, 'Verification code must be 6 digits.');
    }

    cleanupExpiredStore();

    // Check lock
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];

    if (!record) {
      return sendPayload(res, 400, false, 'No active OTP found. Please request a new code.');
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[trimmedEmail];
      return sendPayload(res, 400, false, 'Code expired. Please request a new one.');
    }

    // Increment attempts
    record.attempts += 1;

    // Verify OTP
    const isMatch = (cleanOtp === record.otp);

    if (!isMatch) {
      // Update failed attempt in Supabase
      try {
        await db.verifyOtp(trimmedEmail, cleanOtp);
      } catch (dbError) {
        console.warn('[SUPABASE] Error updating failed attempt:', dbError.message);
      }

      if (record.attempts >= 5) {
        lockStore[trimmedEmail] = Date.now() + 2 * 60 * 1000;
        delete otpStore[trimmedEmail];
        return sendPayload(res, 400, false, 'Too many failed attempts. Account locked for 2 minutes.');
      }

      const remainingAttempts = 5 - record.attempts;
      return sendPayload(res, 400, false, `Incorrect code. ${remainingAttempts} attempts remaining.`);
    }

    // SUCCESS!
    delete otpStore[trimmedEmail];
    delete lockStore[trimmedEmail];

    // Update OTP as verified in Supabase
    try {
      await db.verifyOtp(trimmedEmail, cleanOtp);
    } catch (dbError) {
      console.warn('[SUPABASE] Error marking OTP as verified:', dbError.message);
    }

    // Create/update user in Supabase (prevents duplicates)
    let user;
    const userName = extractNameFromEmail(trimmedEmail);
    try {
      user = await db.createOrGetUser(trimmedEmail);
      console.log(`👤 User ${user.full_name} logged in (Login #${user.login_count})`);
      
      // Log successful login activity
      await db.logActivity(user.id, 'login_success', {
        method: 'firebase_otp',
        email: trimmedEmail
      });
    } catch (dbError) {
      console.warn('[SUPABASE] Error creating/updating user:', dbError.message);
      // Continue even if DB fails
      user = {
        id: 'temp_user',
        email: trimmedEmail,
        full_name: userName,
        department: 'BCA-B',
        login_count: 1
      };
    }

    console.log(`🎉 Firebase OTP VERIFIED SUCCESSFULLY!`);
    console.log(`📧 Email: ${trimmedEmail}`);
    console.log(`👤 User: ${userName}`);

    return sendPayload(res, 200, true, `Welcome back, ${userName}! Login successful!`, {
      verified: true,
      email: trimmedEmail,
      welcomeMessage: `🎉 Welcome to 3BCA-B Activity Portal, ${userName}! Your login was successful.`,
      user: {
        id: user.id,
        name: user.full_name,
        department: user.department,
        loginCount: user.login_count
      }
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return sendPayload(res, 500, false, 'Verification failed. Please try again.');
  }
};

// Resend OTP handler
exports.resendOtp = async (req, res) => {
  console.log('\n🔄 ===== FIREBASE RESEND OTP REQUEST =====');
  
  try {
    const { email } = req.body;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    if (!isValidChristEmail(trimmedEmail)) {
      return sendPayload(res, 400, false, 'Please use your official university email ID.');
    }

    cleanupExpiredStore();

    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];
    const now = Date.now();

    if (record) {
      const secondsSinceLastSend = (now - record.lastSentAt) / 1000;
      if (secondsSinceLastSend < 30) {
        const remainingCooldown = Math.ceil(30 - secondsSinceLastSend);
        return sendPayload(res, 400, false, `Please wait ${remainingCooldown} seconds before requesting another code.`);
      }

      if (now < record.expiresAt) {
        const remainingExpiry = Math.ceil((record.expiresAt - now) / 1000);
        return sendPayload(res, 400, false, `Previous code still active. Wait ${remainingExpiry} seconds.`);
      }
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    otpStore[trimmedEmail] = {
      otp: otp,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes (300 seconds)
      lastSentAt: now,
      attempts: 0,
    };

    // Log to Supabase
    try {
      await db.logOtp(trimmedEmail, otp, otp, 30); // 30 seconds
    } catch (dbError) {
      console.warn('[SUPABASE] Error logging resent OTP:', dbError.message);
    }

    const userName = extractNameFromEmail(trimmedEmail);

    await sendOtpEmail(trimmedEmail, otp, userName);

    return sendPayload(res, 200, true, `New verification code sent to ${userName}!`, {
      email: trimmedEmail,
      expiresIn: 30, // 30 seconds
      userName: userName
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error.message);
    return sendPayload(res, 500, false, `Failed to resend code. Please try again.`);
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedEmail) {
      return sendPayload(res, 400, false, 'Email is required.');
    }

    const isValid = isValidChristEmail(trimmedEmail);
    let exists = false;
    
    try {
      exists = await db.userExists(trimmedEmail);
    } catch (dbError) {
      console.warn('[SUPABASE] Error checking user existence:', dbError.message);
      // Continue without database check
    }

    const userName = extractNameFromEmail(trimmedEmail);

    return sendPayload(res, 200, true, 'Email check complete', {
      email: trimmedEmail,
      isValid,
      isNewUser: !exists,
      existsInDb: exists,
      userName: userName
    });
  } catch (error) {
    console.error('❌ Check email error:', error.message);
    return sendPayload(res, 500, false, 'Email check failed.');
  }
};