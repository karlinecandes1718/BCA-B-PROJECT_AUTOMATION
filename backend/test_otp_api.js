const fetch = require('node-fetch');

console.log('🧪 TESTING OTP API ENDPOINTS\n');

const BASE_URL = 'http://localhost:5001/api';
const TEST_EMAIL = 'test.student@bcah.christuniversity.in';

async function testSendOtp() {
  console.log('=== 1. TESTING SEND OTP ===');
  
  try {
    const response = await fetch(`${BASE_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    const data = await response.json();
    
    console.log(`📤 Request: POST /send-otp`);
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ OTP send endpoint working!');
      return true;
    } else {
      console.log('❌ OTP send failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error testing send OTP: ${error.message}`);
    return false;
  }
}

async function testVerifyOtp() {
  console.log('\n=== 2. TESTING VERIFY OTP (with dummy code) ===');
  
  try {
    const response = await fetch(`${BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        otp: '123456'  // This will fail, but tests the endpoint
      })
    });
    
    const data = await response.json();
    
    console.log(`📤 Request: POST /verify-otp`);
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 OTP: 123456 (dummy)`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    // We expect this to fail since it's a dummy OTP
    if (response.status === 400 && data.message) {
      console.log('✅ Verify OTP endpoint working (correctly rejected dummy OTP)');
      return true;
    } else {
      console.log('❌ Unexpected response from verify OTP');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error testing verify OTP: ${error.message}`);
    return false;
  }
}

async function testCheckEmail() {
  console.log('\n=== 3. TESTING CHECK EMAIL ===');
  
  try {
    const response = await fetch(`${BASE_URL}/check-email?email=${encodeURIComponent(TEST_EMAIL)}`);
    const data = await response.json();
    
    console.log(`📤 Request: GET /check-email`);
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Check email endpoint working!');
      return true;
    } else {
      console.log('❌ Check email failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error testing check email: ${error.message}`);
    return false;
  }
}

async function runApiTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  const sendOtpOk = await testSendOtp();
  const verifyOtpOk = await testVerifyOtp();
  const checkEmailOk = await testCheckEmail();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Send OTP: ${sendOtpOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Verify OTP: ${verifyOtpOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Check Email: ${checkEmailOk ? '✅ Working' : '❌ Failed'}`);
  
  if (sendOtpOk && verifyOtpOk && checkEmailOk) {
    console.log('\n🎉 ALL API ENDPOINTS WORKING!');
    console.log('✅ Ready for full OTP testing');
    console.log('\n📝 TO TEST WITH REAL EMAIL:');
    console.log('1. Open: http://localhost:3001');
    console.log('2. Enter your @bcah.christuniversity.in email');
    console.log('3. Check backend console for OTP code');
    console.log('4. Check your email inbox for the OTP');
    console.log('5. Enter the code to complete login');
  } else {
    console.log('\n⚠️  SOME API ENDPOINTS FAILED');
    console.log('Please check the backend server logs');
  }
}

// Check if fetch is available, install if needed
try {
  require('node-fetch');
} catch (e) {
  console.log('❌ node-fetch not found. Installing...');
  console.log('Run: npm install node-fetch@2');
  process.exit(1);
}

runApiTests().catch(console.error);