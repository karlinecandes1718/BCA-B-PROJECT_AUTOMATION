const fetch = require('node-fetch');

console.log('🎯 TESTING COMPLETE FIREBASE OTP FLOW\n');

const BASE_URL = 'http://localhost:5002/api';
const TEST_EMAIL = 'student.test@bcah.christuniversity.in';

// Step 1: Send OTP
async function sendOtp() {
  console.log('=== STEP 1: SEND OTP ===');
  
  const response = await fetch(`${BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL })
  });
  
  const data = await response.json();
  console.log(`📤 Send OTP Status: ${response.status}`);
  console.log(`📄 Response:`, JSON.stringify(data, null, 2));
  
  return response.ok && data.success;
}

// Step 2: Get OTP from console (simulated user input)
function getOtpFromUser() {
  console.log('\n=== STEP 2: GET OTP CODE ===');
  console.log('📝 In a real scenario, you would:');
  console.log('1. Check Firebase Auth console for the OTP code');
  console.log('2. Or check your email/SMS for the OTP');
  console.log('3. Enter the OTP code in the frontend');
  
  // For testing, we'll simulate getting OTP from Firebase logs
  console.log('💡 For this test, use the OTP shown in the backend console above');
  return '123456'; // This would be the actual OTP from Firebase
}

// Step 3: Verify OTP
async function verifyOtp(otpCode) {
  console.log('\n=== STEP 3: VERIFY OTP ===');
  
  const response = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: TEST_EMAIL,
      otp: otpCode 
    })
  });
  
  const data = await response.json();
  console.log(`📤 Verify OTP Status: ${response.status}`);
  console.log(`📄 Response:`, JSON.stringify(data, null, 2));
  
  return response.ok && data.success;
}

// Complete flow test
async function testCompleteFlow() {
  console.log('🚀 STARTING COMPLETE OTP FLOW TEST\n');
  
  try {
    // Step 1: Send OTP
    const sendSuccess = await sendOtp();
    if (!sendSuccess) {
      console.log('❌ Failed to send OTP');
      return false;
    }
    console.log('✅ Step 1: OTP sent successfully');
    
    // Step 2: Get OTP (simulated)
    const otpCode = getOtpFromUser();
    console.log('✅ Step 2: OTP code obtained');
    
    // Small delay to simulate user entering OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Verify OTP
    const verifySuccess = await verifyOtp(otpCode);
    if (!verifySuccess) {
      console.log('❌ Failed to verify OTP');
      return false;
    }
    console.log('✅ Step 3: OTP verified successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in complete flow test:', error.message);
    return false;
  }
}

// Run the test
async function runTest() {
  const success = await testCompleteFlow();
  
  console.log('\n=== FLOW TEST RESULT ===');
  if (success) {
    console.log('🎉 COMPLETE OTP FLOW WORKING!');
    console.log('✅ All steps completed successfully');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Enter any @bcah.christuniversity.in email');
    console.log('3. Check Firebase Auth console or backend console for OTP code');
    console.log('4. Enter the OTP to login');
    console.log('5. You should be redirected to the dashboard');
  } else {
    console.log('❌ FLOW TEST FAILED');
    console.log('Please check the backend logs for errors');
  }
}

runTest().catch(console.error);