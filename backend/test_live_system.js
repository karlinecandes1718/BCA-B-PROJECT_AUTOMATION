require('dotenv').config();

console.log('🧪 TESTING LIVE OTP SYSTEM FOR CLASSMATES\n');

async function testLiveSystem() {
  try {
    console.log('=== TESTING REAL OTP TO CLASSMATE EMAIL ===');
    
    // Test with a Christ University email (simulate classmate)
    const studentEmail = 'test.student@bcah.christuniversity.in';
    const apiUrl = 'http://localhost:5003/api';
    
    console.log(`📤 Sending OTP to: ${studentEmail}`);
    console.log(`📡 API URL: ${apiUrl}`);
    
    const response = await fetch(`${apiUrl}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: studentEmail
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('\n🎉 SUCCESS! OTP API is working!');
      console.log('📧 Response:', data.message);
      console.log('📧 User Name:', data.data?.userName);
      console.log('\n✅ SYSTEM IS READY FOR CLASSMATES!');
      console.log('✅ Frontend: http://localhost:3000');
      console.log('✅ Backend: http://localhost:5003');
      console.log('\nℹ️ Tell your classmates:');
      console.log('1. Go to: http://localhost:3000');
      console.log('2. Enter their @bcah.christuniversity.in email');
      console.log('3. Check Gmail inbox for beautiful OTP email!');
      return true;
    } else {
      console.log('❌ API Error:', data.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testLiveSystem();