const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 EMAIL SERVICE DIAGNOSTIC TEST\n');

console.log('=== CURRENT CONFIGURATION ===');
console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'not set'}`);
console.log(`DEV_MODE: ${process.env.DEV_MODE || 'not set'}`);
console.log(`SHOW_OTP_IN_CONSOLE: ${process.env.SHOW_OTP_IN_CONSOLE || 'not set'}`);

if (process.env.EMAIL_SERVICE === 'brevo') {
  console.log(`\n=== BREVO CONFIGURATION ===`);
  console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER || 'not set'}`);
  console.log(`BREVO_SMTP_KEY: ${process.env.BREVO_SMTP_KEY ? '***set***' : 'not set'}`);
  console.log(`BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL || 'not set'}`);
} else if (process.env.EMAIL_SERVICE === 'gmail') {
  console.log(`\n=== GMAIL CONFIGURATION ===`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'not set'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***set***' : 'not set'}`);
} else if (process.env.EMAIL_SERVICE === 'ethereal') {
  console.log(`\n=== ETHEREAL CONFIGURATION ===`);
  console.log(`No credentials needed for Ethereal`);
}

async function testCurrentService() {
  const service = (process.env.EMAIL_SERVICE || 'ethereal').toLowerCase();
  const recipient = 'shruthika.sharon@bcah.christuniversity.in';
  
  console.log(`\n=== TESTING ${service.toUpperCase()} SERVICE ===`);
  
  try {
    let transporter;
    let fromEmail;
    
    if (service === 'brevo') {
      const brevoUser = process.env.BREVO_SMTP_USER;
      const brevoPass = process.env.BREVO_SMTP_KEY;
      
      if (!brevoUser || !brevoPass) {
        console.log('❌ Brevo credentials missing in .env');
        return false;
      }
      
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: brevoUser, pass: brevoPass }
      });
      
      fromEmail = `"${process.env.BREVO_SENDER_NAME || 'BCA-B Portal'}" <${process.env.BREVO_SENDER_EMAIL || brevoUser}>`;
      
    } else if (service === 'gmail') {
      const gmailUser = process.env.EMAIL_USER;
      const gmailPass = process.env.EMAIL_PASS;
      
      if (!gmailUser || !gmailPass) {
        console.log('❌ Gmail credentials missing in .env');
        return false;
      }
      
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass }
      });
      
      fromEmail = `"BCA-B Activity Portal" <${gmailUser}>`;
      
    } else {
      // Ethereal (default)
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'watlbqiafpbjws7l@ethereal.email',
          pass: 'eKUKFRytq6vW3bV2ue'
        }
      });
      
      fromEmail = '"BCA-B Portal (TEST)" <test@ethereal.email>';
    }
    
    console.log('🔗 Testing connection...');
    await transporter.verify();
    console.log('✅ Connection successful!');
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: `Email Service Test - ${service.toUpperCase()}`,
      text: `This is a test email from the ${service} service.\n\nIf you receive this, your ${service} configuration is working.`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ ${service.toUpperCase()} Service Test</h2>
        <p>Your ${service} email service is working correctly!</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>`
    };
    
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ SUCCESS! Email sent successfully');
    console.log(`📧 Service: ${service}`);
    console.log(`📧 To: ${recipient}`);
    
    if (service === 'ethereal') {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('💡 Note: This is a test email - check the preview link');
    } else {
      console.log('📧 Check your inbox (and spam folder)');
    }
    
    return true;
    
  } catch (error) {
    console.log(`\n❌ ERROR with ${service}: ${error.message}`);
    
    if (service === 'brevo' && error.message.includes('Unauthorized IP')) {
      console.log('\n🔐 IP AUTHORIZATION REQUIRED');
      console.log('You need to authorize your IP address in Brevo:');
      console.log('1. Log in to https://app.brevo.com');
      console.log('2. Go to Settings → SMTP & API');
      console.log('3. Find "Authorized IPs" section');
      console.log('4. Add your current IP address');
      console.log('\n💡 Quick fix: Switch to Gmail or Ethereal instead');
    } else if (service === 'gmail' && error.message.includes('Authentication')) {
      console.log('\n🔐 GMAIL APP PASSWORD REQUIRED');
      console.log('You need an App Password for Gmail:');
      console.log('1. Go to https://myaccount.google.com/security');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Go to https://myaccount.google.com/apppasswords');
      console.log('4. Generate App Password for "Mail"');
    }
    
    return false;
  }
}

async function recommendSolution() {
  console.log('\n=== RECOMMENDED SOLUTION ===');
  
  const service = process.env.EMAIL_SERVICE || 'ethereal';
  
  if (service === 'brevo') {
    console.log('🔧 Your current service: BREVO');
    console.log('📋 Options:');
    console.log('1. Authorize IP in Brevo dashboard (15 minutes)');
    console.log('2. Switch to Gmail (10 minutes)');
    console.log('3. Switch to Ethereal (immediate, testing only)');
  } else if (service === 'gmail') {
    console.log('🔧 Your current service: GMAIL');
    console.log('📋 Options:');
    console.log('1. Generate App Password (5 minutes)');
    console.log('2. Switch to Ethereal (immediate, testing only)');
  } else {
    console.log('🔧 Your current service: ETHEREAL');
    console.log('✅ Ethereal should work immediately for testing');
    console.log('📋 For production, switch to:');
    console.log('1. Gmail (requires App Password)');
    console.log('2. Brevo (requires IP authorization)');
  }
  
  console.log('\n💡 QUICKEST FIX RIGHT NOW:');
  console.log('1. Edit backend/.env file');
  console.log('2. Set: EMAIL_SERVICE=ethereal');
  console.log('3. Set: DEV_MODE=true');
  console.log('4. Set: SHOW_OTP_IN_CONSOLE=true');
  console.log('5. Save and restart server');
  console.log('6. OTP will show in console for testing');
}

// Run tests
async function runDiagnostics() {
  console.log('🚀 Starting email service diagnostics...\n');
  
  const success = await testCurrentService();
  
  if (!success) {
    console.log('\n⚠️ Current email service failed.');
    await recommendSolution();
  }
  
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Check the recommendations above');
  console.log('2. Try the quickest fix first');
  console.log('3. Your OTP system WILL work with Ethereal');
  console.log('4. For production, fix Brevo or Gmail');
}

runDiagnostics().catch(console.error);