const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmailSimple() {
  console.log('🔧 Testing Gmail SMTP Configuration\n');
  
  const gmailUser = process.env.EMAIL_USER || 'shruthika.sharon@bcah.christuniversity.in';
  const gmailPass = process.env.EMAIL_PASS || 'YOUR_16_CHAR_APP_PASSWORD_HERE';
  
  console.log('Testing with email:', gmailUser);
  
  if (gmailPass === 'YOUR_16_CHAR_APP_PASSWORD_HERE') {
    console.log('\n❌ ERROR: You need to set your Gmail App Password!');
    console.log('1. Follow the guide in GMAIL_APP_PASSWORD_GUIDE.md');
    console.log('2. Update EMAIL_PASS in .env file');
    console.log('3. Run this test again');
    return;
  }
  
  try {
    console.log('\n🔗 Testing connection to Gmail SMTP...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    
    // Send test email
    const testEmail = {
      from: `"BCA-B Activity Portal" <${gmailUser}>`,
      to: gmailUser, // Send to yourself
      subject: '✅ OTP System Test - Gmail Working!',
      text: 'This test confirms your Gmail SMTP is working. OTP emails will now be delivered!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Gmail OTP System Test</h1>
            <p style="opacity: 0.9; margin-top: 10px;">Your email configuration is working!</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">OTP System Status: <span style="color: #34a853;">✅ WORKING</span></h2>
            <p>This test confirms that:</p>
            <ul>
              <li>✅ Gmail SMTP is properly configured</li>
              <li>✅ App password is correct</li>
              <li>✅ Emails can be sent successfully</li>
              <li>✅ OTP system will now deliver codes to your inbox</li>
            </ul>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #4285f4;">
              <p style="margin: 0; color: #495057;">
                <strong>Next Steps:</strong><br>
                1. Start the backend server: <code>npm run dev</code><br>
                2. Go to http://localhost:3000<br>
                3. Enter your Christ University email<br>
                4. Check this email for OTP codes!
              </p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              <strong>Note:</strong> If you don't see this email in your inbox, check your spam folder and mark it as "Not spam".
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            Department of Computer Applications · Christ University
          </div>
        </div>
      `
    };
    
    console.log('\n📤 Sending test email to:', gmailUser);
    const info = await transporter.sendMail(testEmail);
    
    console.log('\n✅ SUCCESS! Test email sent!');
    console.log('✅ Message ID:', info.messageId);
    console.log('\n📧 Check your email at:', gmailUser);
    console.log('📧 Also check spam folder if not in inbox');
    console.log('\n🚀 OTP System is now ready to use!');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔑 AUTHENTICATION ISSUE:');
      console.log('1. Make sure 2-Step Verification is enabled');
      console.log('2. Verify app password is correct (16 chars, no spaces)');
      console.log('3. Try regenerating app password');
      console.log('4. Check guide: GMAIL_APP_PASSWORD_GUIDE.md');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🌐 CONNECTION ISSUE:');
      console.log('1. Check internet connection');
      console.log('2. Try port 465 instead:');
      console.log('   Change "port: 587" to "port: 465"');
      console.log('   Change "secure: false" to "secure: true"');
    } else {
      console.log('\n🔧 GENERAL ISSUE:', error.message);
    }
    
    console.log('\n💡 QUICK FIX: Try Ethereal for development (no setup):');
    console.log('1. Change EMAIL_SERVICE=ethereal in .env');
    console.log('2. Run: node test_otp_flow.js');
  }
}

testGmailSimple().catch(console.error);