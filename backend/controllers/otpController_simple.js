const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Simple file-based database
const DB_FILE = path.join(__dirname, '../data/users.json');

// In-memory OTP storage
const otpStore = {};
const lockStore = {};
const verifiedEmails = new Set();

// Ensure data directory exists
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

// Initialize database
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

// Email transporter - using Ethereal for testing
let transporter;
async function getTransporter() {
  if (!transporter) {
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      // Use the working Ethereal credentials
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'watlbqiafpbjws7l@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'eKUKFRytq6vW3bV2ue'
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'brevo') {
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_KEY
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'gmail') {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }
  return transporter;
}

async function sendOtpEmail(toEmail, otpCode) {
  try {
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_SERVICE === 'ethereal' 
        ? '"BCA-B Portal" <test@ethereal.email>'
        : `"3BCA-B Activity Portal" <${process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your OTP Code - BCA-B Activity Portal',
      text: `Your verification code is: ${otpCode}. It expires in 90 seconds.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #3b7dd8;">BCA-B Activity Portal</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #3b7dd8; text-align: center; margin: 20px 0; letter-spacing: 5px;">
            ${otpCode}
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 90 seconds. If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // For Ethereal, show preview URL
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 OTP sent to ${toEmail}`);
      console.log(`📎 Preview URL: ${previewUrl}`);
    } else {
      console.log(`📧 OTP sent to ${toEmail}: ${info.messageId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Email error:', error.message);
    throw error;
  }
}

// File-based user management
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
    }
    
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    return user;
  } catch (error) {
    console.error('DB write error:', error.message);
    // Return mock user if DB fails
    return {
      id: 'temp_user',
      email: email.toLowerCase(),
      full_name: 'User',
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

// Send OTP
exports.sendOtp = async (req, res) => {
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
    
    // Store OTP
    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Send email
    await sendOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'Verification code sent successfully!', {
      email: trimmedEmail,
      expiresIn: 90,
      note: process.env.EMAIL_SERVICE === 'ethereal' 
        ? 'Check console for email preview URL (no real email sent)' 
        : 'Check your email inbox'
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    return sendPayload(res, 500, false, `Failed to send code: ${error.message}`);
  }
};

// Verify OTP
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

    // Check lock
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];

    // Check OTP
    if (!record || Date.now() > record.expiresAt) {
      if (record) delete otpStore[trimmedEmail];
      return sendPayload(res, 400, false, 'Code expired. Please request a new one.');
    }

    record.attempts += 1;
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

    // Success!
    delete otpStore[trimmedEmail];
    delete lockStore[trimmedEmail];
    verifiedEmails.add(trimmedEmail);

    // Create/update user
    const user = await createOrGetUser(trimmedEmail);
    
    console.log(`✅ OTP verified for: ${trimmedEmail}`);
    console.log(`👤 User: ${user.full_name} (${user.login_count} logins)`);

    return sendPayload(res, 200, true, 'Login successful!', {
      verified: true,
      email: trimmedEmail,
      user: {
        id: user.id,
        name: user.full_name,
        department: user.department,
        loginCount: user.login_count
      },
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    return sendPayload(res, 500, false, 'Verification failed. Please try again.');
  }
};

// Resend OTP
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

    // Check lock
    const lockTime = lockStore[trimmedEmail];
    if (lockTime && Date.now() < lockTime) {
      const remaining = Math.ceil((lockTime - Date.now()) / 1000);
      return sendPayload(res, 400, false, `Too many failed attempts. Try again in ${remaining} seconds.`);
    }

    const record = otpStore[trimmedEmail];
    const now = Date.now();

    // Check cooldown
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

    // Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 10);

    otpStore[trimmedEmail] = {
      hashedOtp,
      expiresAt: now + 90 * 1000,
      lastSentAt: now,
      attempts: 0,
    };

    // Send email
    await sendOtpEmail(trimmedEmail, otp);

    return sendPayload(res, 200, true, 'New verification code sent!', {
      email: trimmedEmail,
      expiresIn: 90
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return sendPayload(res, 500, false, `Failed to resend code: ${error.message}`);
  }
};

// Check email
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
      existsInDb: exists,
      message: isValid 
        ? (exists ? 'Email exists in system' : 'New user email')
        : 'Invalid email domain'
    });
  } catch (error) {
    console.error('Check email error:', error.message);
    return sendPayload(res, 500, false, 'Email check failed.');
  }
};