const nodemailer = require('nodemailer');

async function testBrevo() {
  console.log('🔧 Testing Brevo SMTP Configuration\n');
  
  console.log('BEFORE TESTING:');
  console.log('1. Sign up FREE: https://app.brevo.com/signup');
  console.log('2. Go to: Settings → SMTP & API');
  console.log('3. Copy: SMTP Login and SMTP Key\n');
  
  // Brevo configuration
  const brevoConfig = {
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'YOUR_BREVO_SMTP_LOGIN', // Replace with your Brevo SMTP Login
      pass: 'YOUR_BREVO_SMTP_KEY'    // Replace with your Brevo SMTP Key
    }
  };
  
  // Your Christ University email
  const recipientEmail = 'shruthika.sharon@bcah.christuniversity.in';
  
  try {
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport(brevoConfig);
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Brevo connection successful!\n');
    
    // Send test email
    const testEmail = {
      from: '"BCA-B Activity Portal" <noreply@bca-portal.com>',
      to: recipientEmail,
      subject: 'Test OTP - BCA-B Activity Portal',
      text: `Your test OTP code is: 123456\n\nThis confirms your email service is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white; text-align: center;">
            <h1 style="margin: 0;">🎉 BCA-B Activity Portal</h1>
            <p style="opacity: 0.9;">Email Service Test Successful</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333;">Test OTP Code</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #dee2e6;">
              <div style="font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 10px;">123456</div>
              <p style="color: #6c757d; margin-top: 10px;">This is a test OTP code</p>
            </div>
            <p style="color: #495057;">If you receive this email, your Brevo SMTP configuration is working correctly!</p>
            <p style="color: #6c757d; font-size: 14px;">
              Sent to: ${recipientEmail}<br>
              Service: Brevo SMTP<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            Department of Computer Applications · Christ University
          </div>
        </div>
      `
    };
    
    console.log('Sending test email to:', recipientEmail);
    const info = await transporter.sendMail(testEmail);
    
    console.log('\n✅ SUCCESS!');
    console.log('✅ Test email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('\n📧 Check your email inbox at:', recipientEmail);
    console.log('📧 Also check spam folder if not in inbox');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    
    if (error.message.includes('Authentication')) {
      console.log('\n🔑 Authentication Issue:');
      console.log('1. Verify Brevo SMTP Login and Key');
      console.log('2. Check: Settings → SMTP & API in Brevo');
      console.log('3. Make sure account is activated (check email)');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 Connection Issue:');
      console.log('1. Check internet connection');
      console.log('2. Verify host: smtp-relay.brevo.com');
    } else {
      console.log('\n🔧 General Issue:');
      console.log('1. Check Brevo account status');
      console.log('2. Verify email in Brevo dashboard');
    }
    
    return false;
  }
}

console.log(`
=============================================
📧 BREVO SMTP TEST
=============================================

ADVANTAGES OVER GMAIL:
✅ No 2-Step Verification needed
✅ Higher email deliverability  
✅ Free tier: 300 emails/day
✅ Better for transactional emails
✅ Easy setup (5 minutes)

STEPS:
1. Sign up: https://app.brevo.com/signup
2. Go to: Settings → SMTP & API
3. Copy SMTP Login and SMTP Key
4. Edit this file with your credentials
5. Run test

=============================================
`);

testBrevo().catch(console.error);