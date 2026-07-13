const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('🔧 Testing Gmail SMTP Configuration\n');
  
  // Your Christ University email
  const gmailUser = 'shruthika.sharon@bcah.christuniversity.in';
  
  console.log('Testing with email:', gmailUser);
  console.log('NOTE: You need 16-character App Password (not regular password)\n');
  
  // Try different configurations
  const configs = [
    {
      name: 'Port 465 (SSL)',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true
    },
    {
      name: 'Port 587 (TLS)',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    },
    {
      name: 'Port 25',
      host: 'smtp.gmail.com',
      port: 25,
      secure: false
    }
  ];
  
  for (const config of configs) {
    console.log(`\n=== Testing: ${config.name} ===`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: gmailUser,
          pass: 'YOUR_APP_PASSWORD_HERE' // Replace with your 16-char app password
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      console.log('Attempting connection...');
      await transporter.verify();
      console.log('✅ Connection successful!');
      
      // Try sending test email
      const testEmail = {
        from: `"BCA-B Portal" <${gmailUser}>`,
        to: gmailUser, // Send to yourself
        subject: 'Test OTP Email',
        text: 'This is a test OTP: 123456',
        html: '<p>This is a test OTP: <strong>123456</strong></p>'
      };
      
      const info = await transporter.sendMail(testEmail);
      console.log('✅ Test email sent!');
      console.log('Message ID:', info.messageId);
      console.log('Check your email inbox (and spam folder)');
      
      return true;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      
      // Provide specific help based on error
      if (error.message.includes('Invalid login')) {
        console.log('\n🔑 Authentication Issue:');
        console.log('1. Enable 2-Step Verification: https://myaccount.google.com/security');
        console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
        console.log('3. Select "Mail" and device "Other"');
        console.log('4. Use 16-character password (remove spaces)');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('\n🌐 Connection Issue:');
        console.log('Try different port or check firewall');
      }
    }
  }
  
  console.log('\n⚠️ All configurations failed. Try Brevo instead (easier setup).');
  return false;
}

// Instructions
console.log(`
=============================================
🔐 GMAIL OTP TEST
=============================================

BEFORE RUNNING:
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Edit this file: Replace 'YOUR_APP_PASSWORD_HERE' with your 16-char password
4. Remove spaces from app password

QUICK FIX: Use Brevo instead (recommended)
- Sign up: https://app.brevo.com/signup
- Get SMTP key in 2 minutes
- More reliable than Gmail

=============================================
`);

testGmail().catch(console.error);