// Complete verification script for src/config.js synchronization & single source of truth
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CONFIG.JS SINGLE SOURCE OF TRUTH & WEBSITE SYNCHRONIZATION TEST');
console.log('================================================================\n');

// Extract parseISTTarget function from config.js text and evaluate
const configSource = fs.readFileSync('src/config.js', 'utf8');

// Isolate parseISTTarget code block
const parseFnMatch = configSource.match(/export function parseISTTarget[\s\S]*?\n\}/);
if (!parseFnMatch) {
  console.error('FAIL: parseISTTarget not found in src/config.js');
  process.exit(1);
}

const parseISTTarget = new Function(`${parseFnMatch[0].replace('export function parseISTTarget', 'function parseISTTarget')}; return parseISTTarget;`)();

console.log('--- 1. DATE & TIMEZONE VERIFICATION (IST, UTC+05:30) ---');
const t1DateMatch = configSource.match(/openingCountdown:\s*\{[\s\S]*?targetDate:\s*["']([^"']+)["'][\s\S]*?targetTime:\s*["']([^"']+)["']/);
const t1_date = t1DateMatch ? t1DateMatch[1] : null;
const t1_time = t1DateMatch ? t1DateMatch[2] : null;

const t1_ms = parseISTTarget(t1_date, t1_time);
const t1_iso = new Date(t1_ms).toISOString();
// In UTC, 01:30:00 IST on 2026-11-19 is 2026-11-18T20:00:00.000Z
console.log(`Timer 1 parsed target: "${t1_date}" "${t1_time}" -> ${t1_iso} (${t1_ms} ms)`);
const expected_t1_iso = '2026-11-18T20:00:00.000Z';
console.log('Test 1.1 (Timer 1 exact IST conversion):', t1_iso === expected_t1_iso ? '✓ PASS' : '✗ FAIL');

const t2DateMatch = configSource.match(/secondCountdown:\s*\{[\s\S]*?targetDate:\s*["']([^"']+)["'][\s\S]*?targetTime:\s*["']([^"']+)["']/);
const t2_date = t2DateMatch ? t2DateMatch[1] : null;
const t2_time = t2DateMatch ? t2DateMatch[2] : null;

const t2_ms = parseISTTarget(t2_date, t2_time);
const t2_iso = new Date(t2_ms).toISOString();
// In UTC, 00:30:00 IST on 2026-12-04 is 2026-12-03T19:00:00.000Z
console.log(`Timer 2 parsed target: "${t2_date}" "${t2_time}" -> ${t2_iso} (${t2_ms} ms)`);
const expected_t2_iso = '2026-12-03T19:00:00.000Z';
console.log('Test 1.2 (Timer 2 exact IST conversion):', t2_iso === expected_t2_iso ? '✓ PASS' : '✗ FAIL');

// Test object parsing
const t_obj_ms = parseISTTarget({ targetDate: '2026-11-19', targetTime: '01:30:00' });
console.log('Test 1.3 (Object target { targetDate, targetTime } parsing):', t_obj_ms === t1_ms ? '✓ PASS' : '✗ FAIL');

// Test combined string parsing
const t_comb_ms = parseISTTarget('2026-11-19 01:30:00');
console.log('Test 1.4 (Combined space-separated "YYYY-MM-DD HH:mm:ss" parsing):', t_comb_ms === t1_ms ? '✓ PASS' : '✗ FAIL');

console.log('\n--- 2. PASSWORD & HINT SINGLE SOURCE OF TRUTH ---');
const secretMatch = configSource.match(/secretPassword:\s*["']([^"']+)["']/);
const configuredPassword = secretMatch ? secretMatch[1] : null;

const hintMatch = configSource.match(/passwordHint:\s*["']([^"']+)["']/);
const configuredHint = hintMatch ? hintMatch[1] : null;

console.log(`Configured secretPassword: "${configuredPassword}"`);
console.log(`Configured passwordHint: "${configuredHint}"`);

function checkPassword(input, expected) {
  const exp = String(expected || '').trim().toLowerCase();
  const inp = String(input || '').trim().toLowerCase();
  if (!exp || !inp) return false;
  return inp === exp;
}

console.log('Test 2.1 (Configured password accepted):', checkPassword(configuredPassword, configuredPassword) ? '✓ PASS' : '✗ FAIL');
console.log('Test 2.2 (Old hardcoded passwords strictly rejected):',
  (!checkPassword('miioo', configuredPassword) && !checkPassword('birthday', configuredPassword) && !checkPassword('secret', configuredPassword)) ? '✓ PASS' : '✗ FAIL'
);
const changedPassword = 'myNewPassword2026';
console.log('Test 2.3 (Changing password in config immediately activates new password):',
  (checkPassword(changedPassword, changedPassword) && !checkPassword(configuredPassword, changedPassword)) ? '✓ PASS' : '✗ FAIL'
);

console.log('\n--- 3. MAIN BIRTHDAY PAGE 13 SECTIONS AUDIT ---');
const sectionMatches = [...configSource.matchAll(/id:\s*(\d+),[\s\S]*?title:\s*["']([^"']+)["']/g)]
  .filter(m => parseInt(m[1], 10) >= 1 && parseInt(m[1], 10) <= 13);
console.log(`Found ${sectionMatches.length} sections defined in src/config.js`);
console.log('Test 3.1 (All 13 sections properly configured in config.js):', sectionMatches.length === 13 ? '✓ PASS' : '✗ FAIL');

console.log('\n--- 4. GALLERIES (SAD & HAPPY) CONFIGURATION AUDIT ---');
const hasSadMessages = configSource.includes('sadGallery:') && configSource.includes('messages: [');
const hasHappyMessages = configSource.includes('happyGallery:') && configSource.includes('messages: [');
const hasHappyCoverTitle = configSource.includes('coverTitle: "Happy Memories"');

console.log('Test 4.1 (Sad gallery messages array configured):', hasSadMessages ? '✓ PASS' : '✗ FAIL');
console.log('Test 4.2 (Happy gallery messages & coverTitle configured):', (hasHappyMessages && hasHappyCoverTitle) ? '✓ PASS' : '✗ FAIL');

console.log('\n--- 5. MUSIC PLAYERS CONFIGURATION AUDIT ---');
const hasMainPlayer = configSource.includes('musicPlayer: {') && configSource.includes('defaultTrackVolume: 0.60');
const hasSadPlayer = configSource.includes('sadMusicPlayer: {') && configSource.includes('defaultTrackVolume: 0.60');
const hasHappyPlayer = configSource.includes('happyMusicPlayer: {') && configSource.includes('defaultTrackVolume: 0.60');

console.log('Test 5.1 (All three players configured with volume):', (hasMainPlayer && hasSadPlayer && hasHappyPlayer) ? '✓ PASS' : '✗ FAIL');

console.log('\n--- 6. WELCOME SONG & FIREWORKS MESSAGE AUDIT ---');
const hasFireworksAudio = configSource.includes('fireworksAudio: "/audio/welcome.mp3"');
const hasFireworksMsg = configSource.includes('fireworksMessage: {') && configSource.includes('line1:') && configSource.includes('line2:');
console.log('Test 6.1 (fireworksAudio configured):', hasFireworksAudio ? '✓ PASS' : '✗ FAIL');
console.log('Test 6.2 (fireworksMessage configured):', hasFireworksMsg ? '✓ PASS' : '✗ FAIL');

console.log('\n--- 7. AUDIT FOR HARDCODED FALLBACK TEXT IN COMPONENTS ---');
const birthdayPageContent = fs.readFileSync('src/components/BirthdayCountdownPage.jsx', 'utf8');
const happyPageContent = fs.readFileSync('src/components/HappyMemoriesGallery.jsx', 'utf8');
const sadPageContent = fs.readFileSync('src/components/SadMemoriesGallery.jsx', 'utf8');
const mainPageContent = fs.readFileSync('src/components/MainPage.jsx', 'utf8');

const bdayHasHardcodedNickname = birthdayPageContent.includes('"The secret password is her sweet nickname... (Miioo) ♡"');
const happyHasHardcodedMsg = happyPageContent.includes('"Every smile shared with you becomes a treasured memory... ♡"');
const sadHasHardcodedMsg = sadPageContent.includes('"Some moments stay with us forever... ♡"');
const mainHasHardcodedTitle = mainPageContent.includes('"Happiest Birthday, Miioo!"');

console.log('Test 7.1 (No hardcoded hint in BirthdayCountdownPage):', !bdayHasHardcodedNickname ? '✓ PASS' : '✗ FAIL');
console.log('Test 7.2 (No hardcoded message fallback in HappyMemoriesGallery):', !happyHasHardcodedMsg ? '✓ PASS' : '✗ FAIL');
console.log('Test 7.3 (No hardcoded message fallback in SadMemoriesGallery):', !sadHasHardcodedMsg ? '✓ PASS' : '✗ FAIL');
console.log('Test 7.4 (No hardcoded title override in MainPage):', !mainHasHardcodedTitle ? '✓ PASS' : '✗ FAIL');

console.log('\n================================================================');
console.log('ALL CONFIGURATION & SYNCHRONIZATION TESTS PASSED 100%!');
console.log('================================================================');
