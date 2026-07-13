const fetch = require('node-fetch');

console.log('🚀 IMMEDIATE OTP TEST - Ethereal Email\n');

const BASE_URL = 'http://localhost:5002/api';
const TEST_EMAIL = 'shruthika.sharon@bcah.christuniversity.in';

async function sendOtpAndGetCode() {
  console.log('=== STEP 1: SENDING OTP ===');
  console.log(`📧 Sending OTP to: ${TEST_EMAIL}`);
  console.log('💡 Using Ethereal email service (no inbox delivery needed)\n');
  
  try {
    const response = await fetch(`${BASE_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    const data = await response.json();
    
    console.log(`📤 Response Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ OTP SENT SUCCESSFULLY!');
      console.log('📋 What happens now:');
      console.log('1. OTP generated (e.g., 123456)');
      console.log('2. Email sent via Ethereal (test service)');
      console.log('3. OTP shown in backend console (DEV_MODE=true)');
      console.log('4. Check backend terminal for OTP code');
      console.log('\n👀 Look in the backend terminal for:');
      console.log('🔥 DEVELOPMENT MODE - OTP FOR TESTING:');
      console.log('🔑 EMAIL: your-email@bcah.christuniversity.in');
      console.log('🔑 OTP CODE: 123456');
      console.log('🔑 USE THIS CODE TO LOGIN: 123456');
      console.log('🔥 ================================');
      
      return true;
    } else {
      console.log('\n❌ Failed to send OTP:', data.message);
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('\n💡 Make sure backend server is running:');
    console.log('1. Open new terminal');
    console.log('2. cd backend');
    console.log('3. npm start');
    return false;
  }
}

console.log(`
=============================================
📧 ETHERAL EMAIL TEST
=============================================

ADVANTAGES:
✅ Works immediately - no setup needed
✅ Shows OTP in console for testing
✅ Perfect for development
✅ No inbox checking required

WHAT TO EXPECT:
1. OTP will be shown in BACKEND console
2. No email will go to your Gmail inbox
3. Use the OTP from console to login
4. System works 100% for testing

FOR PRODUCTION:
1. Contact Brevo to activate SMTP: contact@sendinblue.com
2. Or use Gmail with App Password
3. Keep DEV_MODE=false for production

=============================================
`);

sendOtpAndGetCode().then(success => {
  if (success) {
    console.log('\n🎉 TEST COMPLETE!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check backend terminal for OTP code');
    console.log('2. Use that code on the frontend login');
    console.log('3. You should be able to login successfully');
    console.log('\n🔧 To fix Brevo for production:');
    console.log('1. Email Brevo: contact@sendinblue.com');
    console.log('2. Request SMTP activation');
    console.log('3. Update .env with EMAIL_SERVICE=brevo');
  } else {
    console.log('\n❌ TEST FAILED');
    console.log('\n💡 Quick fixes:');
    console.log('1. Start backend server: cd backend && npm start');
    console.log('2. Check if port 5001 is free');
    console.log('3. Make sure .env has EMAIL_SERVICE=ethereal');
  }
}).catch(console.error);