const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { db } = require('../utils/supabaseClient');

// In-memory OTP storage (temporary until we move to Redis)
const otpStore = {};
const lockStore = {};

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return email.trim().toLowerCase();
}

function isValidChristEmail(email) {
  if (!email) return false;
  // Strict validation for @bcah.christuniversity.in
  return /^[a-z0-9._%+\-]+@bcah\.christuniversity\.in$/i.test(email);
}

function sendPayload(res, statusCode, success, message, data = null) {
  const payload = { success, message };
  if (data) payload.data = data;
  return res.status(statusCode).json(payload);
}

// REAL EMAIL FUNCTION - Uses Brevo to send actual emails
async function sendRealOtpEmail(toEmail, otpCode) {
  const emailService = process.env.EMAIL_SERVICE || 'brevo';
  
  console.log(`\n📧 SENDING REAL OTP to: ${toEmail}`);
  console.log(`📧 Using service: ${emailService}`);
  
  try {
    let transporter;
    let fromEmail;
    
    if (emailService === 'brevo') {
      // Brevo configuration
      const brevoUser = process.env.BREVO_SMTP_USER;
      const brevoPass = process.env.BREVO_SMTP_KEY;
      const senderEmail = process.env.BREVO_SENDER_EMAIL || brevoUser;
      
      if (!brevoUser || !brevoPass) {
        throw new Error('Brevo credentials missing in .env file');
      }
      
      console.log(`📧 Brevo user: ${brevoUser}`);
      
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: brevoUser,
          pass: brevoPass
        }
      });
      
      fromEmail = `"${process.env.BREVO_SENDER_NAME || 'BCA-B Activity Portal'}" <${senderEmail}>`;
      
    } else {
      // Fallback (shouldn't happen with your config)
      console.log('⚠️ Using Ethereal (testing only)');
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'watlbqiafpbjws7l@ethereal.email',
          pass: 'eKUKFRytq6vW3bV2ue'
        }
      });
      
      fromEmail = '"BCA-B Portal" <test@ethereal.email>';
    }
    
    // Verify connection
    console.log('🔗 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified');
    
    // Create email
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Your OTP Code - BCA-B Activity Portal',
      text: `
BCA-B Activity Portal - Verification Code

Your verification code is: ${otpCode}

This code will expire in 90 seconds.

Please enter this code on the login page to continue.

If you didn't request this code, please ignore this email.

---
Department of Computer Applications
Christ University
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b7dd8 0%, #2a5eb8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 40px; }
    .otp-box { background: #f0f7ff; border: 2px dashed #3b7dd8; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 48px; font-weight: 800; color: #3b7dd8; letter-spacing: 8px; margin: 10px 0; }
    .info { color: #666; line-height: 1.6; font-size: 15px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    .highlight { color: #3b7dd8; font-weight: 600; }
    .email-address { background: #f8f9fa; padding: 10px; border-radius: 6px; margin: 10px 0; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 BCA-B Activity Portal</h1>
      <p>Department of Computer Applications · Christ University</p>
    </div>
    
    <div class="content">
      <p class="info">Hello,</p>
      <p class="info">You requested a verification code for the <span class="highlight">3BCA-B Activity Portal</span>.</p>
      
      <div class="otp-box">
        <p style="margin: 0 0 15px; color: #555; font-size: 16px;">Your verification code is:</p>
        <div class="otp-code">${otpCode}</div>
        <p style="margin: 15px 0 0; color: #777; font-size: 14px;">⏰ Expires in 90 seconds</p>
      </div>
      
      <p class="info">Enter this code on the login page to complete your verification.</p>
      
      <div class="email-address">
        📧 Sent to: ${toEmail}
      </div>
      
      <p class="info" style="color: #888; font-size: 14px; margin-top: 30px;">
        <strong>Note:</strong> If you didn't request this code, you can safely ignore this email.
        For security reasons, please don't share this code with anyone.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the BCA-B Activity Portal system.</p>
      <p>© ${new Date().getFullYear()} Department of Computer Applications, Christ University</p>
    </div>
  </div>
</body>
</html>
      `
    };
    
    // Send email
    console.log('📤 Sending OTP email...');
    const info = await transporter.sendMail(mailOptions);
    
    // Log results
    console.log(`\n✅ REAL OTP SENT SUCCESSFULLY!`);
    console.log(`✅ To: ${toEmail}`);
    console.log(`✅ Code: ${otpCode}`);
    console.log(`✅ Message ID: ${info.messageId}`);
    
    if (emailService === 'brevo') {
      console.log(`✅ Real email sent to inbox via Brevo`);
      console.log(`📧 Check: ${toEmail} (and spam folder)`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ EMAIL SEND FAILED: ${error.message}`);
    
    if (error.message.includes('Authentication')) {
      console.log(`\n🔑 BREVO AUTHENTICATION ERROR:`);
      console.log(`1. Check Brevo SMTP key in .env file`);
      console.log(`2. Verify Brevo account is active`);
      console.log(`3. Check daily limits (300 emails/day free)`);
    }
    
    throw error;
  }
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

// MAIN OTP FUNCTIONS

exports.sendOtp = async (req, res) => {
  console.log('\n🔄 ===== SEND OTP REQUEST =====');
  console.log('📥 Request:', req.body);
  
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

    // Check lock
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    // Check recent failed attempts from Supabase
    const recentFailedAttempts = await db.getRecentFailedAttempts(trimmedEmail);
    if (recentFailedAttempts >= 5) {
      lockStore[trimmedEmail] = Date.now() + 2 * 60 * 1000; // Lock for 2 minutes
      return sendPayload(res, 400, false, 'Too many failed attempts. Your account is locked for 2 minutes.');
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
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    console.log(`🔐 Generated OTP: ${otp}`);

    // Store OTP in memory (temporary)
    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Log OTP to Supabase database
    try {
      await db.logOtp(trimmedEmail, otp, hashedOtp, 90);
      console.log(`📊 OTP logged to Supabase database`);
    } catch (dbError) {
      console.error('[SUPABASE] Error logging OTP:', dbError.message);
      // Continue even if DB logging fails
    }

    // Send REAL email via Brevo
    await sendRealOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'Verification code sent to your email!', {
      email: trimmedEmail,
      expiresIn: 90,
      note: 'Check your email inbox (and spam folder)'
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    return sendPayload(res, 500, false, `Failed to send code: ${error.message}`);
  }
};

exports.verifyOtp = async (req, res) => {
  console.log('\n🔄 ===== VERIFY OTP REQUEST =====');
  console.log('📥 Request:', req.body);
  
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
    const isMatch = await bcrypt.compare(cleanOtp, record.hashedOtp);

    if (!isMatch) {
      // Update failed attempt in Supabase
      try {
        await db.verifyOtp(trimmedEmail, cleanOtp);
      } catch (dbError) {
        console.error('[SUPABASE] Error updating failed attempt:', dbError.message);
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
      console.error('[SUPABASE] Error marking OTP as verified:', dbError.message);
    }

    // Create/update user in Supabase (prevents duplicates)
    let user;
    try {
      user = await db.createOrGetUser(trimmedEmail);
      console.log(`👤 User ${user.full_name} logged in (Login #${user.login_count})`);
      
      // Log successful login activity
      await db.logActivity(user.id, 'login_success', {
        method: 'otp',
        email: trimmedEmail
      });
    } catch (dbError) {
      console.error('[SUPABASE] Error creating/updating user:', dbError.message);
      // Continue even if DB fails
      user = {
        id: 'temp_user',
        email: trimmedEmail,
        full_name: 'Student',
        department: 'BCA-B',
        login_count: 1
      };
    }

    console.log(`🎉 OTP VERIFIED SUCCESSFULLY!`);
    console.log(`📧 Email: ${trimmedEmail}`);

    return sendPayload(res, 200, true, 'Login successful!', {
      verified: true,
      email: trimmedEmail,
      user: {
        id: user.id,
        name: user.full_name,
        department: user.department,
        loginCount: user.login_count
      }
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    return sendPayload(res, 500, false, 'Verification failed. Please try again.');
  }
};

// Other functions
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
    const hashedOtp = await bcrypt.hash(otp, 10);

    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Log to Supabase
    try {
      await db.logOtp(trimmedEmail, otp, hashedOtp, 90);
    } catch (dbError) {
      console.error('[SUPABASE] Error logging resent OTP:', dbError.message);
    }

    await sendRealOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'New verification code sent!', {
      email: trimmedEmail,
      expiresIn: 90
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return sendPayload(res, 500, false, `Failed to resend code: ${error.message}`);
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
    const exists = await db.userExists(trimmedEmail);

    return sendPayload(res, 200, true, 'Email check complete', {
      email: trimmedEmail,
      isValid,
      isNewUser: !exists,
      existsInDb: exists
    });
  } catch (error) {
    console.error('Check email error:', error.message);
    return sendPayload(res, 500, false, 'Email check failed.');
  }
};