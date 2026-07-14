const { initializeFirebase } = require('../config/firebase');
const nodemailer = require('nodemailer');

// Gmail SMTP transporter for real email delivery
let emailTransporter = null;

function initializeEmailService() {
  if (!emailTransporter) {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    
    if (emailService === 'gmail') {
      const gmailUser = process.env.EMAIL_USER;
      const gmailPass = process.env.EMAIL_PASS;
      
      if (!gmailUser || !gmailPass) {
        console.warn('⚠️ Gmail credentials not configured. Emails will not be sent.');
        return null;
      }
      
      emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailPass
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });
      
      console.log('✅ Gmail SMTP transporter initialized');
    }
  }
  
  return emailTransporter;
}

function buildOtpMessage(toEmail, otpCode, userName = 'Student') {
  const welcomeText = `Welcome to 3BCA-B Activity Portal, ${userName}!`;
  
  return {
    subject: `${welcomeText} Your Verification Code`,
    text: `
${welcomeText}

Your verification code is: ${otpCode}

This code will expire in 90 seconds. Please enter it on the login page to access your activity portal.

If you didn't request this code, you can safely ignore this email.

Best regards,
Department of Computer Applications
Christ University
    `,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #3b7dd8; margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 800;">🎉 ${welcomeText}</h2>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 24px;">Department of Computer Applications, Christ University</p>

        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello ${userName},</p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Welcome to the 3BCA-B Activity Portal! Your verification code is ready.</p>

        <div style="background-color: #f0f7ff; border: 1px dashed #3b7dd8; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #3b7dd8;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code is valid for 90 seconds. Enter it on the login page to access your activity portal.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 13px; color: #475569; margin: 0;"><strong>What you can do:</strong></p>
          <ul style="font-size: 12px; color: #64748b; margin: 8px 0 0 15px; padding: 0;">
            <li>View and log workshop activities</li>
            <li>Track seminar attendance</li>
            <li>Access guest lecture records</li>
            <li>Participate in hackathon logs</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated message from 3BCA-B Activity Portal. Please do not reply to this email.</p>
      </div>
    `,
  };
}

/**
 * Sends an OTP email using Gmail SMTP or shows in console for development
 * @param {string} toEmail - The recipient's email address (Christ University email)
 * @param {string} otpCode - The 6-digit OTP code to send
 * @param {string} userName - The user's name for personalization
 * @returns {Promise<boolean>} - Resolves to true if successful, rejects on error
 */
async function sendOtpEmail(toEmail, otpCode, userName = 'Student') {
  try {
    const devMode = process.env.DEV_MODE === 'true';
    const showOtpInConsole = process.env.SHOW_OTP_IN_CONSOLE === 'true';
    
    // Always show OTP in console if enabled (helpful for debugging)
    if (showOtpInConsole) {
      console.log('\n🔥 OTP FOR REFERENCE:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 USER:', userName);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🔥 ================================\n');
    }
    
    // If in development mode, only show console OTP
    if (devMode) {
      console.log('📧 DEVELOPMENT MODE: Not sending real email');
      return true;
    }
    
    // Initialize email service for production
    const transporter = initializeEmailService();
    
    if (!transporter) {
      throw new Error('Email service not configured. Please set up Gmail SMTP credentials.');
    }
    
    // Verify SMTP connection
    console.log('🔗 Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    
    // Build personalized email content
    const message = buildOtpMessage(toEmail, otpCode, userName);
    
    const mailOptions = {
      from: `"3BCA-B Activity Portal" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: message.subject,
      text: message.text,
      html: message.html,
    };
    
    // Send the actual email
    console.log(`📤 Sending REAL OTP email to: ${toEmail}`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
    console.log('📧 To:', toEmail);
    console.log('📧 User:', userName);
    console.log('📧 Code:', otpCode);
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 CHECK YOUR GMAIL INBOX (and spam folder)!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email Send Error:', error.message);
    
    // Fallback: show OTP in console if email fails
    if (process.env.SHOW_OTP_IN_CONSOLE === 'true') {
      console.log('\n🆘 EMAIL FAILED - CONSOLE FALLBACK:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 USER:', userName);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🆘 Use this code to login!');
      console.log('🆘 ================================\n');
      return true; // Continue despite email failure
    }
    
    throw error;
  }
}

/**
 * Alternative method for phone-based OTP using Firebase Auth
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} otpCode - The 6-digit OTP code
 * @returns {Promise<boolean>} - Resolves to true if successful
 */
async function sendOtpSMS(phoneNumber, otpCode) {
  try {
    const { auth } = initializeFirebase();
    
    // This would implement Firebase phone authentication
    // const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    
    console.log('📱 SMS OTP prepared for:', phoneNumber);
    console.log('📱 Code:', otpCode);
    
    return true;
  } catch (error) {
    console.error('Firebase SMS Error:', error.message);
    throw error;
  }
}

module.exports = { sendOtpEmail, sendOtpSMS };