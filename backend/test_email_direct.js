const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailDelivery() {
  console.log('📧 Testing Email Delivery System\n');
  
  // Read current environment
  const emailService = process.env.EMAIL_SERVICE || 'brevo';
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoKey = process.env.BREVO_SMTP_KEY;
  
  console.log('Current Configuration:');
  console.log('EMAIL_SERVICE:', emailService);
  console.log('BREVO_SMTP_USER:', brevoUser ? '✓ Set' : '✗ Not set');
  console.log('BREVO_SMTP_KEY:', brevoKey ? '✓ Set (' + brevoKey.substring(0, 20) + '...)' : '✗ Not set');
  
  console.log('\n🔍 Analyzing Brevo Key Format:');
  if (brevoKey) {
    if (brevoKey.startsWith('xkeysib-')) {
      console.log('⚠️  This looks like an API key format, not SMTP key');
      console.log('⚠️  SMTP keys are usually 20-30 characters, not API keys');
    } else if (brevoKey.length > 50) {
      console.log('⚠️  Key is very long (' + brevoKey.length + ' chars)');
      console.log('⚠️  SMTP keys are usually shorter');
    } else {
      console.log('✓ Key length seems reasonable:', brevoKey.length, 'chars');
    }
  }
  
  console.log('\n🔄 Testing Brevo Connection...');
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey
      }
    });
    
    await transporter.verify();
    console.log('✅ Brevo connection successful!');
    
    // Try sending a test email
    const testEmail = {
      from: '"BCA-B Portal" <' + brevoUser + '>',
      to: brevoUser, // Send to yourself
      subject: 'Test OTP Email - System Check',
      text: 'This is a test email to verify OTP delivery works.',
      html: '<h3>OTP System Test</h3><p>If you receive this, OTP emails will work!</p>'
    };
    
    console.log('\n📤 Sending test email to:', brevoUser);
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('📧 Check your email inbox and spam folder');
    
  } catch (error) {
    console.log('❌ Brevo test failed:', error.message);
    
    if (error.message.includes('535')) {
      console.log('\n🔑 AUTHENTICATION FAILURE - Common fixes:');
      console.log('1. Go to Brevo dashboard: https://app.brevo.com');
      console.log('2. Navigate to: Settings → SMTP & API');
      console.log('3. Click "SMTP" tab');
      console.log('4. Copy the "SMTP Login" and "SMTP Key" (not API key)');
      console.log('5. Update .env file with correct credentials');
      console.log('\n⚠️  Note: Brevo SMTP key is DIFFERENT from API key');
    }
  }
  
  console.log('\n🔄 Testing Gmail Fallback...');
  
  // Check if we have Gmail credentials in .env.example
  console.log('Checking for Gmail setup...');
  console.log('To use Gmail instead:');
  console.log('1. Edit backend/.env file');
  console.log('2. Change EMAIL_SERVICE=gmail');
  console.log('3. Set EMAIL_USER=your_gmail@gmail.com');
  console.log('4. Set EMAIL_PASS=16_char_app_password');
  console.log('\n📚 Gmail App Password Guide:');
  console.log('1. Enable 2-Step Verification: https://myaccount.google.com/security');
  console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('3. Select "Mail" and device "Other"');
  console.log('4. Use the 16-character password (remove spaces)');
  
  console.log('\n🎯 RECOMMENDATION:');
  console.log('Since Brevo authentication is failing, either:');
  console.log('A) Fix Brevo credentials (get correct SMTP key)');
  console.log('B) Switch to Gmail (easier for testing)');
  console.log('C) Use Ethereal for development (no setup needed)');
}

testEmailDelivery().catch(console.error);