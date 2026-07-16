// Quick test for email validation fix

function isValidChristEmail(email) {
  if (!email) return false;
  // Strict validation for @bcah.christuniversity.in with additional checks
  const emailRegex = /^[a-z0-9]+([._-]?[a-z0-9]+)*@bcah\.christuniversity\.in$/i;
  
  // Additional checks for edge cases
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.startsWith('-') || email.startsWith('_')) return false; // No leading special chars
  if (email.includes('.-') || email.includes('-.') || email.includes('._') || email.includes('_.')) return false; // Invalid combinations
  
  return emailRegex.test(email);
}

console.log('Testing email validation fixes:');
console.log('');

const testEmails = [
  'test..double@bcah.christuniversity.in', // Should be false now
  'test.student@bcah.christuniversity.in', // Should be true
  '.test@bcah.christuniversity.in', // Should be false
  'test.@bcah.christuniversity.in', // Should be false  
  'test.-name@bcah.christuniversity.in', // Should be false
  'test_name@bcah.christuniversity.in', // Should be true
  'test-name@bcah.christuniversity.in', // Should be true
];

testEmails.forEach(email => {
  const result = isValidChristEmail(email);
  console.log(`${result ? '✅' : '❌'} ${email} -> ${result}`);
});

console.log('');
console.log('Expected: Only valid single-dot, underscore, and hyphen emails should pass');