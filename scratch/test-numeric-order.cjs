const assert = require('assert');

// 1. Test extractNumericValue and numericSortCompare
function extractNumericValue(filename) {
  if (!filename || typeof filename !== 'string') return Infinity;
  const name = filename.split('?')[0].split('/').pop().trim();
  const leading = name.match(/^(\d+)/);
  if (leading) return parseInt(leading[1], 10);
  const trailing = name.match(/(?:^|[^\d])(\d+)\.[^/.]+$/);
  if (trailing) return parseInt(trailing[1], 10);
  return Infinity;
}

function numericSortCompare(a, b) {
  const fileA = typeof a === 'string' ? a : a?.filename || a?.name || '';
  const fileB = typeof b === 'string' ? b : b?.filename || b?.name || '';

  const numA = extractNumericValue(fileA);
  const numB = extractNumericValue(fileB);

  if (numA !== numB) {
    return numA - numB;
  }

  return fileA.localeCompare(fileB, undefined, { numeric: true, sensitivity: 'base' });
}

function formatTitle(rawFilename, customTitle) {
  if (customTitle && typeof customTitle === 'string' && customTitle.trim() !== '') {
    return customTitle.trim();
  }

  let clean = rawFilename
    .replace(/\.[^/.]+$/, '')
    .replace(/\s*[\(\[](Official\s*(Video|Audio|Track|Music|Song)?|Full\s*Song|Audio|Video|Lyric\s*Video)[\)\]]/gi, '')
    .replace(/\b(Full\s*Song|Official\s*Audio|Official\s*Video)\b/gi, '')
    .replace(/\s+[|I]\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/^\d+$/.test(clean)) {
    return `Song ${parseInt(clean, 10)}`;
  }

  return clean || rawFilename;
}

console.log('=== TEST 1: Ascending Numerical Sort with 1, 2, 3, 10 ===');
const input1 = ['10.mp3', '2.mp3', '1.mp3', '3.mp3'];
input1.sort(numericSortCompare);
console.log('Result 1:', input1);
assert.deepStrictEqual(input1, ['1.mp3', '2.mp3', '3.mp3', '10.mp3']);
console.log('[PASS] Test 1: 1 -> 2 -> 3 -> 10 (10 is after 3, NOT after 1)');

console.log('\n=== TEST 2: Multiple Extensions (.mp3, .wav, .ogg, .m4a, .webm) ===');
const input2 = ['10.webm', '5.m4a', '2.mp3', '1.mp3', '4.ogg', '3.wav'];
input2.sort(numericSortCompare);
console.log('Result 2:', input2);
assert.deepStrictEqual(input2, ['1.mp3', '2.mp3', '3.wav', '4.ogg', '5.m4a', '10.webm']);
console.log('[PASS] Test 2: Multi-extension sorting preserves numerical order');

console.log('\n=== TEST 3: Gaps and Missing Numbers ===');
const input3 = ['10.mp3', '1.mp3', '3.mp3'];
input3.sort(numericSortCompare);
console.log('Result 3:', input3);
assert.deepStrictEqual(input3, ['1.mp3', '3.mp3', '10.mp3']);
console.log('[PASS] Test 3: Missing numbers (2, 4-9) are skipped gracefully');

console.log('\n=== TEST 4: Leading zeroes ===');
const input4 = ['10.mp3', '01.mp3', '02.mp3'];
input4.sort(numericSortCompare);
console.log('Result 4:', input4);
assert.deepStrictEqual(input4, ['01.mp3', '02.mp3', '10.mp3']);
console.log('[PASS] Test 4: Leading zeroes sort numerically');

console.log('\n=== TEST 5: Title Formatting ===');
assert.strictEqual(formatTitle('1.mp3'), 'Song 1');
assert.strictEqual(formatTitle('02.wav'), 'Song 2');
assert.strictEqual(formatTitle('10.mp3'), 'Song 10');
assert.strictEqual(formatTitle('1 - Happy Birthday.mp3'), '1 - Happy Birthday');
console.log('[PASS] Test 5: Pure numeric files format as Song 1, Song 2, Song 10');

console.log('\nALL UNIT LOGIC CHECKS PASSED!');
