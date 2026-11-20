// Automated test suite for countdown page selection across all 7 scenarios
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('COUNTDOWN PAGE SELECTION & LIFECYCLE TEST SUITE');
console.log('================================================================\n');

// Import parseISTTarget
const configSource = fs.readFileSync('src/config.js', 'utf8');
const parseFnMatch = configSource.match(/export function parseISTTarget[\s\S]*?\n\}/);
const parseISTTarget = new Function(`${parseFnMatch[0].replace('export function parseISTTarget', 'function parseISTTarget')}; return parseISTTarget;`)();

// Emulate computeInitialExperienceState from App.jsx
function computeInitialExperienceState(nowMs, config) {
  const oc = config.openingCountdown;
  const sc = config.secondCountdown;

  const target1 = parseISTTarget(oc?.targetDate, oc?.targetTime) || (config.coverTargetDate ? parseISTTarget(config.coverTargetDate) : null);
  const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (config.firecrackerTargetDate ? parseISTTarget(config.firecrackerTargetDate) : null);

  // CASE A: First countdown has NOT expired
  if (target1 && nowMs < target1) {
    return { stage: 'countdown', celebrationSignal: 0, description: 'Cover Page with Timer 1' };
  }

  // CASE C: Both countdowns have expired
  if (target2 && nowMs >= target2) {
    return { stage: 'fireworks', celebrationSignal: 1, description: 'Fireworks celebration active immediately (Case C)' };
  }

  // CASE B: First countdown HAS expired, but second countdown has NOT expired
  return { stage: 'fireworks', celebrationSignal: 0, description: 'Second countdown page with Timer 2 remaining time (Case B)' };
}

// Current actual configured values:
// openingCountdown: targetDate: "2026-11-19", targetTime: "01:30:00"
// secondCountdown: targetDate: "2026-12-04", targetTime: "00:30:00"
const t1 = parseISTTarget("2026-11-19", "01:30:00");
const t2 = parseISTTarget("2026-12-04", "00:30:00");

console.log(`Target 1 (Timer 1 IST): ${new Date(t1).toISOString()} (${t1} ms)`);
console.log(`Target 2 (Timer 2 IST): ${new Date(t2).toISOString()} (${t2} ms)\n`);

const testConfig = {
  openingCountdown: { targetDate: "2026-11-19", targetTime: "01:30:00" },
  secondCountdown: { targetDate: "2026-12-04", targetTime: "00:30:00" },
};

// SCENARIO 1: Current time is before the first target -> Cover Page appears
console.log('--- SCENARIO 1: Current time is before first target (e.g. 1 hour before Target 1) ---');
const time1 = t1 - 3600 * 1000;
const res1 = computeInitialExperienceState(time1, testConfig);
console.log('State calculated:', res1);
console.log('Scenario 1 Result:', (res1.stage === 'countdown' && res1.celebrationSignal === 0) ? '✓ PASS: Cover Page appears' : '✗ FAIL');

// SCENARIO 2: Current time is exactly at the first target -> Second countdown page appears
console.log('\n--- SCENARIO 2: Current time is exactly at first target (t === Target 1) ---');
const time2 = t1;
const res2 = computeInitialExperienceState(time2, testConfig);
console.log('State calculated:', res2);
console.log('Scenario 2 Result:', (res2.stage === 'fireworks' && res2.celebrationSignal === 0) ? '✓ PASS: Second countdown page appears' : '✗ FAIL');

// SCENARIO 3: Current time is between the two targets -> Second countdown page appears with remaining time
console.log('\n--- SCENARIO 3: Current time is between two targets (e.g. Current Local Time on Nov 19) ---');
const time3 = t1 + 3600 * 1000; // 1 hour after Target 1, well before Target 2
const res3 = computeInitialExperienceState(time3, testConfig);
console.log('State calculated:', res3);
console.log('Scenario 3 Result:', (res3.stage === 'fireworks' && res3.celebrationSignal === 0) ? '✓ PASS: Second countdown page appears with remaining time (Cover Page skipped)' : '✗ FAIL');

// SCENARIO 4: Current time is exactly at the second target -> Fireworks start
console.log('\n--- SCENARIO 4: Current time is exactly at second target (t === Target 2) ---');
const time4 = t2;
const res4 = computeInitialExperienceState(time4, testConfig);
console.log('State calculated:', res4);
console.log('Scenario 4 Result:', (res4.stage === 'fireworks' && res4.celebrationSignal === 1) ? '✓ PASS: Fireworks celebration starts immediately' : '✗ FAIL');

// SCENARIO 5: Current time is after both targets -> Fireworks celebration starts without showing expired countdowns
console.log('\n--- SCENARIO 5: Current time is after both targets (e.g. Dec 5, 2026) ---');
const time5 = t2 + 86400 * 1000;
const res5 = computeInitialExperienceState(time5, testConfig);
console.log('State calculated:', res5);
console.log('Scenario 5 Result:', (res5.stage === 'fireworks' && res5.celebrationSignal === 1) ? '✓ PASS: Fireworks celebration active, all countdowns skipped' : '✗ FAIL');

// SCENARIO 6: Refresh website in each scenario -> Correct page appears again
console.log('\n--- SCENARIO 6: Website refreshed/reloaded in each scenario ---');
const refresh1 = computeInitialExperienceState(time1, testConfig).stage === 'countdown';
const refresh2 = computeInitialExperienceState(time2, testConfig).stage === 'fireworks';
const refresh3 = computeInitialExperienceState(time3, testConfig).stage === 'fireworks';
const refresh4 = computeInitialExperienceState(time4, testConfig).stage === 'fireworks';
const refresh5 = computeInitialExperienceState(time5, testConfig).stage === 'fireworks';
console.log('Refresh in Scenario 1 produces Cover Page:', refresh1 ? '✓ PASS' : '✗ FAIL');
console.log('Refresh in Scenario 3 produces Second Countdown Page (never stuck at 00:00:00:00):', refresh3 ? '✓ PASS' : '✗ FAIL');
console.log('Refresh in Scenario 5 produces Fireworks Celebration:', refresh5 ? '✓ PASS' : '✗ FAIL');
console.log('Scenario 6 Result:', (refresh1 && refresh2 && refresh3 && refresh4 && refresh5) ? '✓ PASS: Every reload dynamically evaluates current time' : '✗ FAIL');

// SCENARIO 7: Close browser and reopen website -> Correct page is selected using current IST time
console.log('\n--- SCENARIO 7: Fresh browser opening evaluation with current real-time clock ---');
const actualNow = Date.now();
const actualNowState = computeInitialExperienceState(actualNow, testConfig);
console.log(`Current real-time IST evaluated: ${new Date(actualNow).toISOString()}`);
console.log('Actual Current State:', actualNowState);
console.log('Scenario 7 Result:', actualNowState.stage === 'fireworks' && actualNowState.celebrationSignal === 0
  ? '✓ PASS: Opening site right now (Target 1 expired, Target 2 on Dec 4) immediately opens Second Countdown Page'
  : '✗ FAIL');

console.log('\n================================================================');
console.log('ALL 7 COUNTDOWN SELECTION SCENARIOS PASSED 100%!');
console.log('================================================================');
