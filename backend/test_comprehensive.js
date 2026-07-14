require('dotenv').config();

console.log('🧪 COMPREHENSIVE API TESTING\n');

const BASE_URL = 'http://localhost:5003/api';

// Test data sets
const testCases = {
  validEmails: [
    'test.student@bcah.christuniversity.in',
    'shruthika.sharon@bcah.christuniversity.in',
    'student.name123@bcah.christuniversity.in'
  ],
  invalidEmails: [
    '',
    'invalid-email',
    'test@gmail.com',
    'student@christuniversity.in',
    'test@bcah.christuniversity.com',
    'test.student@bcah.christuniversity.in.fake',
    null,
    undefined,
    123,
    'test..double@bcah.christuniversity.in'
  ],
  validOTPs: ['123456', '000000', '999999'],
  invalidOTPs: [
    '',
    '12345',    // too short
    '1234567',  // too long
    'abcdef',   // letters
    '12345a',   // mixed
    '12 34 56', // spaces
    null,
    undefined
  ],
  adminNames: {
    valid: ['shruthika', 'karline', 'deepanshu', 'SHRUTHIKA', 'Karline', 'DeePanShu'],
    invalid: ['admin', 'test', 'user', '', null, 'shruthika123', 'fake-name']
  }
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data: data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('=== 1. HEALTH CHECK TEST ===');
  
  try {
    const response = await fetch('http://localhost:5003/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test 2: Send OTP with valid emails
async function testSendOTPValid() {
  console.log('\n=== 2. SEND OTP - VALID EMAILS ===');
  let passed = 0;
  
  for (const email of testCases.validEmails) {
    console.log(`Testing: ${email}`);
    const result = await makeRequest('/send-otp', 'POST', { email });
    
    if (result.success && result.data.success) {
      console.log(`✅ ${email} - SUCCESS`);
      passed++;
    } else {
      console.log(`❌ ${email} - FAILED:`, result.data?.message || result.error);
    }
  }
  
  console.log(`Passed: ${passed}/${testCases.validEmails.length}`);
  return passed === testCases.validEmails.length;
}

// Test 3: Send OTP with invalid emails
async function testSendOTPInvalid() {
  console.log('\n=== 3. SEND OTP - INVALID EMAILS (Should Fail) ===');
  let passed = 0;
  
  for (const email of testCases.invalidEmails) {
    console.log(`Testing: ${email}`);
    const result = await makeRequest('/send-otp', 'POST', { email });
    
    if (!result.success || !result.data.success) {
      console.log(`✅ ${email} - Correctly rejected`);
      passed++;
    } else {
      console.log(`❌ ${email} - Should have been rejected!`);
    }
  }
  
  console.log(`Passed: ${passed}/${testCases.invalidEmails.length}`);
  return passed === testCases.invalidEmails.length;
}

// Test 4: Verify OTP with invalid codes
async function testVerifyOTPInvalid() {
  console.log('\n=== 4. VERIFY OTP - INVALID CODES (Should Fail) ===');
  let passed = 0;
  const testEmail = 'test@bcah.christuniversity.in';
  
  for (const otp of testCases.invalidOTPs) {
    console.log(`Testing OTP: ${otp}`);
    const result = await makeRequest('/verify-otp', 'POST', { 
      email: testEmail, 
      otp: otp 
    });
    
    if (!result.success || !result.data.success) {
      console.log(`✅ OTP "${otp}" - Correctly rejected`);
      passed++;
    } else {
      console.log(`❌ OTP "${otp}" - Should have been rejected!`);
    }
  }
  
  console.log(`Passed: ${passed}/${testCases.invalidOTPs.length}`);
  return passed === testCases.invalidOTPs.length;
}

// Test 5: Check email validation
async function testEmailCheck() {
  console.log('\n=== 5. EMAIL CHECK ENDPOINT ===');
  let passed = 0;
  
  // Valid email
  const validResult = await makeRequest('/check-email?email=test@bcah.christuniversity.in', 'GET');
  if (validResult.success && validResult.data.data?.isValid) {
    console.log('✅ Valid email correctly identified');
    passed++;
  } else {
    console.log('❌ Valid email validation failed');
  }
  
  // Invalid email
  const invalidResult = await makeRequest('/check-email?email=test@gmail.com', 'GET');
  if (invalidResult.success && !invalidResult.data.data?.isValid) {
    console.log('✅ Invalid email correctly identified');
    passed++;
  } else {
    console.log('❌ Invalid email validation failed');
  }
  
  console.log(`Passed: ${passed}/2`);
  return passed === 2;
}

// Test 6: Rate limiting (attempt multiple requests quickly)
async function testRateLimit() {
  console.log('\n=== 6. RATE LIMITING TEST ===');
  
  const promises = [];
  const testEmail = 'rate.test@bcah.christuniversity.in';
  
  // Send 20 rapid requests
  for (let i = 0; i < 20; i++) {
    promises.push(makeRequest('/send-otp', 'POST', { email: testEmail }));
  }
  
  const results = await Promise.all(promises);
  const blocked = results.filter(r => r.status === 429).length;
  
  if (blocked > 0) {
    console.log(`✅ Rate limiting active - ${blocked}/20 requests blocked`);
    return true;
  } else {
    console.log('❌ Rate limiting not working - all requests passed');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive API testing...\n');
  
  const tests = [
    { name: 'Health Check', test: testHealthCheck },
    { name: 'Send OTP - Valid Emails', test: testSendOTPValid },
    { name: 'Send OTP - Invalid Emails', test: testSendOTPInvalid },
    { name: 'Verify OTP - Invalid Codes', test: testVerifyOTPInvalid },
    { name: 'Email Check Validation', test: testEmailCheck },
    { name: 'Rate Limiting', test: testRateLimit }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      results.push({ name, passed });
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ ${name} - Test crashed:`, error.message);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log('='.repeat(50));
  
  let totalPassed = 0;
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (passed) totalPassed++;
  });
  
  console.log(`\n🎯 Overall: ${totalPassed}/${results.length} tests passed`);
  
  if (totalPassed === results.length) {
    console.log('🎉 ALL API TESTS PASSED!');
  } else {
    console.log('⚠️  Some tests failed - review above for details');
  }
  
  return totalPassed === results.length;
}

runAllTests();