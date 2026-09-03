const nodemailer = require('nodemailer');

function buildWelcomeEmail(toEmail, otpCode, userName = 'Student') {
  const welcomeText = `Welcome to 3BCA-B Activity Portal, ${userName}!`;
  
  return {
    from: `"3BCA-B Activity Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${welcomeText} Your Verification Code`,
    text: `
${welcomeText}

Your verification code is: ${otpCode}

This code will expire in 30 seconds. Please enter it on the login page to access your activity portal.

Best regards,
Department of Computer Applications
Christ University
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - 3BCA-B Activity Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b7dd8 0%, #2a5eb8 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🎉 ${welcomeText}</h1>
      <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Department of Computer Applications · Christ University</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <p style="font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 20px;">Hello ${userName},</p>
      <p style="font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 30px;">Welcome to the 3BCA-B Activity Portal! Your verification code is ready.</p>
      
      <!-- OTP Box -->
      <div style="background-color: #f0f7ff; border: 2px dashed #3b7dd8; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 15px; color: #555; font-size: 16px;">Your verification code is:</p>
        <div style="font-size: 36px; font-weight: 800; color: #3b7dd8; letter-spacing: 8px; margin: 15px 0;">${otpCode}</div>
        <p style="margin: 15px 0 0; color: #777; font-size: 14px;">⏰ Expires in 30 seconds</p>
      </div>
      
      <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">Enter this code on the login page to access your activity portal.</p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 11px; border-top: 1px solid #eee;">
      <p style="margin: 0;">This is an automated message from the 3BCA-B Activity Portal system.</p>
      <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} Department of Computer Applications, Christ University</p>
    </div>
    
  </div>
</body>
</html>
    `,
  };
}

// Gmail delivery method
async function tryGmailDelivery(emailOptions) {
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;
  
  console.log('📤 Trying Gmail SMTP...');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
    connectionTimeout: 8000, // 8 second timeout
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
  
  const info = await transporter.sendMail(emailOptions);
  return { success: true, messageId: info.messageId, method: 'Gmail' };
}

// Ethereal delivery method (always works)
async function tryEtherealDelivery(emailOptions) {
  console.log('📤 Trying Ethereal Email (guaranteed delivery)...');
  
  // Create test account dynamically
  const testAccount = await nodemailer.createTestAccount();
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
  
  const info = await transporter.sendMail({
    ...emailOptions,
    from: '"BCA-B Activity Portal (TEST)" <noreply@ethereal.email>'
  });
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log('📧 Ethereal Preview URL:', previewUrl);
  console.log('📧 Open this URL to see the email (copy the URL above)');
  
  return { success: true, messageId: info.messageId, method: 'Ethereal', previewUrl };
}

// Alternative Gmail SMTP configuration
async function tryAlternativeGmail(emailOptions) {
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;
  
  console.log('📤 Trying alternative Gmail SMTP configuration...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: gmailUser, pass: gmailPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
  
  const info = await transporter.sendMail(emailOptions);
  return { success: true, messageId: info.messageId, method: 'Gmail Alternative' };
}

/**
 * Sends REAL OTP email with multiple fallback methods
 */
async function sendOtpEmail(toEmail, otpCode, userName = 'Student') {
  try {
    const devMode = process.env.DEV_MODE === 'true';
    const showOtpInConsole = process.env.SHOW_OTP_IN_CONSOLE === 'true';
    
    console.log('\n📧 ===== ClassArchive OTP DELIVERY =====');
    console.log('📧 To:', toEmail);
    console.log('📧 User:', userName);
    console.log('📧 Code:', otpCode);
    
    // Always show OTP in console for reference
    if (showOtpInConsole) {
      console.log('\n🔥 ClassArchive OTP:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 USER:', userName);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🔥 ================================\n');
    }
    
    // Return immediately in dev mode for instant response
    if (devMode) {
      console.log('📧 DEVELOPMENT MODE: Instant ClassArchive OTP');
      return true;
    }
    
    // Build email content
    const emailOptions = buildWelcomeEmail(toEmail, otpCode, userName);
    
    // Try multiple email delivery methods in order
    const deliveryMethods = [
      { name: 'Gmail SMTP', method: () => tryGmailDelivery(emailOptions) },
      { name: 'Alternative Gmail', method: () => tryAlternativeGmail(emailOptions) },
      { name: 'Ethereal (Backup)', method: () => tryEtherealDelivery(emailOptions) }
    ];
    
    let lastError = null;
    
    for (const delivery of deliveryMethods) {
      try {
        console.log(`\n📤 Attempting: ${delivery.name}`);
        const result = await delivery.method();
        
        if (result.success) {
          console.log(`\n🎉 SUCCESS! Email sent via ${result.method}!`);
          console.log('📧 ===================================');
          console.log('📧 To:', toEmail);
          console.log('📧 User:', userName);
          console.log('📧 Method:', result.method);
          console.log('📧 Message ID:', result.messageId);
          
          if (result.previewUrl) {
            console.log('📧 Preview URL:', result.previewUrl);
            console.log('📧 ⚠️  Copy the URL above to view the test email!');
          }
          
          console.log('📧 ===================================');
          
          if (result.method === 'Gmail' || result.method === 'Gmail Alternative') {
            console.log('📧 ✅ CHECK YOUR REAL GMAIL INBOX NOW!');
            console.log('📧 ✅ Also check SPAM/PROMOTIONS folder!');
          } else {
            console.log('📧 ✅ Test email sent - check preview URL above');
          }
          
          console.log('📧 ===================================\n');
          return true;
        }
      } catch (error) {
        console.log(`❌ ${delivery.name} failed:`, error.message);
        lastError = error;
        continue; // Try next method
      }
    }
    
    throw new Error(`All email delivery methods failed. Last error: ${lastError?.message}`);
    
  } catch (error) {
    console.error('\n❌ ALL EMAIL METHODS FAILED:');
    console.error('❌ Error:', error.message);
    
    // Ultimate fallback: console only
    if (process.env.SHOW_OTP_IN_CONSOLE === 'true') {
      console.log('\n🆘 ULTIMATE FALLBACK - CONSOLE ONLY:');
      console.log('🔑 EMAIL:', toEmail);
      console.log('🔑 USER:', userName);
      console.log('🔑 OTP CODE:', otpCode);
      console.log('🆘 Use this code to login!');
      console.log('🆘 ================================\n');
      return true;
    }
    
    throw error;
  }
}

/**
 * Test email delivery with multiple methods
 */
async function testEmailDelivery() {
  try {
    console.log('🧪 Testing email delivery methods...');
    
    const testEmail = process.env.EMAIL_USER || 'shruthika.sharon@bcah.christuniversity.in';
    const testOTP = '123456';
    const testName = 'Shruthika Sharon';
    
    const success = await sendOtpEmail(testEmail, testOTP, testName);
    return success;
    
  } catch (error) {
    console.error('❌ Email delivery test failed:', error.message);
    return false;
  }
}

module.exports = { 
  sendOtpEmail, 
  testEmailDelivery 
};