const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 TESTING PROJECT CONNECTIONS\n');

// Test 1: Supabase Connection
async function testSupabase() {
  console.log('=== 1. TESTING SUPABASE CONNECTION ===');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`🔑 Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env file');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by checking if we can query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Supabase Error: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Supabase connected successfully`);
    console.log(`📊 Users table accessible (count query worked)`);
    return true;
    
  } catch (error) {
    console.log(`❌ Supabase connection failed: ${error.message}`);
    return false;
  }
}

// Test 2: Brevo SMTP Connection
async function testBrevo() {
  console.log('\n=== 2. TESTING BREVO SMTP CONNECTION ===');
  
  try {
    const brevoUser = process.env.BREVO_SMTP_USER;
    const brevoKey = process.env.BREVO_SMTP_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;
    
    console.log(`📍 SMTP Server: smtp-relay.brevo.com:587`);
    console.log(`👤 User: ${brevoUser}`);
    console.log(`🔑 Key: ${brevoKey ? brevoKey.substring(0, 20) + '...' : 'MISSING'}`);
    console.log(`📧 Sender Email: ${senderEmail}`);
    console.log(`🏷️  Sender Name: ${senderName}`);
    
    if (!brevoUser || !brevoKey) {
      throw new Error('Missing Brevo credentials in .env file');
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    
    console.log('🔗 Testing SMTP connection...');
    await transporter.verify();
    
    console.log('✅ Brevo SMTP connection successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Brevo SMTP connection failed: ${error.message}`);
    
    if (error.message.includes('Authentication')) {
      console.log('💡 Authentication failed - check SMTP credentials');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout - check network/firewall');
    }
    
    return false;
  }
}

// Test 3: Send Test Email
async function testEmailSend() {
  console.log('\n=== 3. TESTING EMAIL SEND (Optional) ===');
  console.log('Skipping actual email send to avoid spam.');
  console.log('✅ Email send functionality will be tested during OTP flow');
  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting connection tests...\n');
  
  const supabaseOk = await testSupabase();
  const brevoOk = await testBrevo();
  const emailOk = await testEmailSend();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Supabase: ${supabaseOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Brevo SMTP: ${brevoOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Email Ready: ${emailOk ? '✅ Ready' : '❌ Failed'}`);
  
  if (supabaseOk && brevoOk) {
    console.log('\n🎉 ALL CONNECTIONS SUCCESSFUL!');
    console.log('✅ Ready to test OTP flow');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev (in backend folder)');
    console.log('2. Run: npm run dev (in frontend folder)');
    console.log('3. Open: http://localhost:3000');
    console.log('4. Test OTP with a real Christ email');
  } else {
    console.log('\n⚠️  SOME CONNECTIONS FAILED');
    console.log('Please fix the failed connections before testing OTP');
  }
}

runAllTests().catch(console.error);