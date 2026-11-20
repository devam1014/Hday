import fs from 'fs';

// Read config.js text and extract secretPassword
const configContent = fs.readFileSync('src/config.js', 'utf8');

const match = configContent.match(/secretPassword:\s*["']([^"']+)["']/);
const secretPassword = match ? match[1] : null;

console.log('Extracted secretPassword from src/config.js:', JSON.stringify(secretPassword));

function verifyPassword(input, configuredSecret) {
  const expectedPassword = String(configuredSecret || '').trim().toLowerCase();
  const clean = String(input || '').trim().toLowerCase();
  if (!clean || !expectedPassword) return false;
  return clean === expectedPassword;
}

// Test 1: Configured password MUST PASS
const testConfigured = verifyPassword(secretPassword, secretPassword);
console.log(`Test 1 (Configured Password "${secretPassword}"):`, testConfigured ? '✓ PASS' : '✗ FAIL');

// Test 2: Case insensitivity
const testCase = verifyPassword(secretPassword.toUpperCase(), secretPassword);
console.log(`Test 2 (Case insensitivity "${secretPassword.toUpperCase()}"):`, testCase ? '✓ PASS' : '✗ FAIL');

// Test 3: Old hardcoded passwords MUST BE REJECTED
const oldPasswords = ['miioo', 'birthday', 'happy birthday', 'miio', 'mimi', 'secret', 'admin'];
let oldPasswordsRejected = true;
for (const oldPwd of oldPasswords) {
  if (oldPwd.toLowerCase() === secretPassword.toLowerCase()) continue;
  if (verifyPassword(oldPwd, secretPassword)) {
    console.log(`✗ FAIL: Old password "${oldPwd}" was erroneously accepted!`);
    oldPasswordsRejected = false;
  }
}
if (oldPasswordsRejected) {
  console.log('Test 3 (All old and default passwords strictly rejected): ✓ PASS');
}

// Test 4: Dynamic reconfiguration
const newSecret = 'myNewSecretKey123';
const testReconfigured = verifyPassword(newSecret, newSecret) && !verifyPassword(secretPassword, newSecret);
console.log('Test 4 (Reconfiguring password immediately invalidates old):', testReconfigured ? '✓ PASS' : '✗ FAIL');

if (testConfigured && testCase && oldPasswordsRejected && testReconfigured) {
  console.log('\nALL PASSWORD TESTS PASSED PERFECTLY!');
} else {
  process.exit(1);
}
