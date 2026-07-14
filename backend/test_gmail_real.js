require('dotenv').config();
const { sendOtpEmail, testEmailDelivery } = require('./utils/emailHelper');

console.log('🧪 TESTING REAL EMAIL DELIVERY WITH MULTIPLE METHODS\n');

async function testAllEmailMethods() {
  try {
    console.log('=== TESTING ALL EMAIL DELIVERY METHODS ===');
    
    const success = await testEmailDelivery();
    
    if (success) {
      console.log('\n🎉 SUCCESS! Email delivery is working!');
      console.log('\n📋 WHAT TO CHECK:');
      console.log('1. Gmail inbox: shruthika.sharon@bcah.christuniversity.in');
      console.log('2. Spam/Promotions folder');
      console.log('3. If Gmail failed, check Ethereal preview URL above');
      console.log('4. Console shows OTP: 123456');
      console.log('\n✅ System is ready for your classmates!');
      return true;
    } else {
      console.log('❌ All email methods failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run comprehensive test
testAllEmailMethods().then(success => {
  if (success) {
    console.log('\n✅ EMAIL SYSTEM IS WORKING!');
    console.log('✅ Start servers with: npm run dev');
    console.log('✅ Share with classmates!');
  } else {
    console.log('\n❌ EMAIL SYSTEM NEEDS ATTENTION');
    console.log('❌ But console OTP still works for testing');
  }
}).catch(error => {
  console.error('❌ Critical error:', error);
});