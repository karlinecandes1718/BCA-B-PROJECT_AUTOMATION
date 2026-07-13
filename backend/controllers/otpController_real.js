const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Database file
const DB_FILE = path.join(__dirname, '../data/users.json');

// In-memory OTP storage
const otpStore = {};
const lockStore = {};

// Initialize database
async function initDatabase() {
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify({ users: [] }, null, 2));
    }
  } catch (error) {
    console.error('Database init error:', error.message);
  }
}

initDatabase();

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

// REAL EMAIL FUNCTION - Sends to actual inbox
async function sendRealOtpEmail(toEmail, otpCode) {
  const emailService = process.env.EMAIL_SERVICE || 'ethereal';
  
  console.log(`\n📧 SENDING REAL OTP to: ${toEmail}`);
  console.log(`📧 Using service: ${emailService}`);
  
  try {
    let transporter;
    let fromEmail;
    
    if (emailService === 'gmail') {
      // Gmail configuration
      const gmailUser = process.env.EMAIL_USER;
      const gmailPass = process.env.EMAIL_PASS;
      
      if (!gmailUser || !gmailPass) {
        throw new Error('Gmail credentials missing in .env file');
      }
      
      console.log(`📧 Gmail user: ${gmailUser}`);
      
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587, // Try 587 first (TLS), fallback to 465 (SSL)
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      fromEmail = `"BCA-B Activity Portal" <${gmailUser}>`;
      
    } else if (emailService === 'brevo') {
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
      // Fallback to Ethereal for testing
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
    
    if (emailService === 'ethereal') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`✅ Preview URL: ${previewUrl}`);
      console.log(`⚠️ Note: Using Ethereal - no real email sent`);
    } else {
      console.log(`✅ Real email sent to inbox`);
      console.log(`📧 Check: ${toEmail} (and spam folder)`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ EMAIL SEND FAILED: ${error.message}`);
    
    // Provide helpful error messages
    if (emailService === 'gmail' && error.message.includes('Invalid login')) {
      console.log(`\n🔑 GMAIL AUTHENTICATION ERROR:`);
      console.log(`1. Enable 2-Step Verification: https://myaccount.google.com/security`);
      console.log(`2. Generate App Password: https://myaccount.google.com/apppasswords`);
      console.log(`3. Select "Mail" → "Other" → Name: "BCA-B Portal"`);
      console.log(`4. Use 16-character password (remove spaces) in .env`);
    } else if (emailService === 'brevo' && error.message.includes('Authentication')) {
      console.log(`\n🔑 BREVO AUTHENTICATION ERROR:`);
      console.log(`1. Sign up: https://app.brevo.com/signup`);
      console.log(`2. Get SMTP key: Settings → SMTP & API`);
      console.log(`3. Update .env with correct credentials`);
    }
    
    throw error;
  }
}

// User management functions
async function userExists(email) {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    return db.users.some(user => user.email === email.toLowerCase());
  } catch (error) {
    console.error('DB read error:', error.message);
    return false;
  }
}

async function createOrGetUser(email) {
  try {
    const normalizedEmail = email.toLowerCase();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    
    // Find existing user
    let user = db.users.find(u => u.email === normalizedEmail);
    const now = new Date().toISOString();
    
    if (user) {
      // Update existing user
      user.login_count = (user.login_count || 0) + 1;
      user.last_login_at = now;
      user.updated_at = now;
      console.log(`👤 Existing user: ${user.full_name} (Login #${user.login_count})`);
    } else {
      // Create new user
      const emailPrefix = normalizedEmail.split('@')[0];
      const fullName = emailPrefix
        .split(/[._]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      
      user = {
        id: 'user_' + Date.now() + Math.random().toString(36).substr(2, 9),
        email: normalizedEmail,
        full_name: fullName,
        department: 'BCA-B',
        is_active: true,
        login_count: 1,
        first_login_at: now,
        last_login_at: now,
        created_at: now,
        updated_at: now
      };
      
      db.users.push(user);
      console.log(`👤 New user created: ${fullName}`);
    }
    
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    return user;
  } catch (error) {
    console.error('DB write error:', error.message);
    return {
      id: 'temp_user',
      email: email.toLowerCase(),
      full_name: 'Student',
      department: 'BCA-B',
      login_count: 1
    };
  }
}

// Cleanup expired OTPs
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

    // Store OTP
    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Send REAL email
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

    // Create/update user
    const user = await createOrGetUser(trimmedEmail);
    
    console.log(`🎉 OTP VERIFIED SUCCESSFULLY!`);
    console.log(`👤 User: ${user.full_name}`);
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

// Other functions remain the same
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
    const exists = await userExists(trimmedEmail);

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