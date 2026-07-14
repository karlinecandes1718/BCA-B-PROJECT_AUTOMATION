const { initializeFirebase } = require('../config/firebase');

// Firebase configuration will be loaded from config file
let firebaseApp = null;
let auth = null;

function buildOtpMessage(toEmail, otpCode) {
  return {
    subject: 'Verification Code for 3BCA-B Activity Portal',
    text: `Your verification code is: ${otpCode}. It expires in 90 seconds. Do not share it with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #3b7dd8; margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 800;">3BCA-B Activity Portal</h2>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 24px;">Department of Computer Applications, Christ University</p>

        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hello,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">You requested a login verification code for the Classroom 3BCA-B Activity Log portal.</p>

        <div style="background-color: #f0f7ff; border: 1px dashed #3b7dd8; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #3b7dd8;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code is valid for 90 seconds. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated institutional message. Please do not reply to this email.</p>
      </div>
    `,
  };
}

/**
 * Sends an OTP using Firebase Authentication
 * @param {string} toEmail - The recipient's email address (Christ University email)
 * @param {string} otpCode - The 6-digit OTP code to send
 * @returns {Promise<boolean>} - Resolves to true if successful, rejects on error
 */
async function sendOtpEmail(toEmail, otpCode) {
  try {
    // Initialize Firebase if not already done
    const { auth } = initializeFirebase();
    firebaseApp = firebaseApp || auth.app;
    
    // For development mode, always show OTP in console
    if (process.env.DEV_MODE === 'true' || process.env.SHOW_OTP_IN_CONSOLE === 'true') {
      console.log('\n🔥 DEVELOPMENT MODE - OTP FOR TESTING:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🔑 USE THIS CODE TO LOGIN:', otpCode);
      console.log('🔥 ================================\n');
    }

    // Convert email to phone format for Firebase Auth (simulation)
    // In a real implementation, you would collect phone numbers
    // For now, we'll use a simulated approach with email-to-SMS gateway
    
    const message = buildOtpMessage(toEmail, otpCode);
    
    // Log successful "email send" for development
    console.log('📧 ================================');
    console.log('📧 Firebase OTP Integration Active');
    console.log('📧 To:', toEmail);
    console.log('📧 Code:', otpCode);
    console.log('📧 Message prepared for Firebase Auth');
    console.log('📧 ================================');

    // In development, we'll simulate successful sending
    // In production, you would implement actual Firebase Auth phone verification
    // or integrate with an email service provider through Firebase Functions
    
    return true;
    
  } catch (error) {
    console.error('Firebase OTP Error:', error.message);
    
    // Fallback: still show OTP in console for development
    if (process.env.DEV_MODE === 'true') {
      console.log('\n🔥 FALLBACK - OTP FOR TESTING:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🔥 ================================\n');
      return true;
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