function testSort(files) {
  function detectMediaType(filename) {
    if (/\.(mp4|webm|mov)$/i.test(filename || '')) return 'video';
    return 'image';
  }

  const items = files.map((filename) => {
    const match = filename.match(/^(\d+)/);
    const number = match ? parseInt(match[1], 10) : 9999;
    return {
      filename,
      number,
      type: detectMediaType(filename)
    };
  });

  items.sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
  });

  return items;
}

const sampleFiles = [
  '10.mp4',
  '1.jpg',
  '2.mp4',
  '11.mov',
  '3.png',
  '5.jpg',
  '4.mp4',
  '20.jpg',
  '2.jpg' // tie breaker with different extension
];

const sorted = testSort(sampleFiles);
console.log('Input:', sampleFiles);
console.log('Sorted output:');
sorted.forEach((item, idx) => console.log(`  ${idx + 1}. [${item.type.toUpperCase()}] ${item.filename} (number: ${item.number})`));

// Verify natural sort order
const filenames = sorted.map(s => s.filename);
const expectedOrder = ['1.jpg', '2.jpg', '2.mp4', '3.png', '4.mp4', '5.jpg', '10.mp4', '11.mov', '20.jpg'];
const pass = JSON.stringify(filenames) === JSON.stringify(expectedOrder);
console.log('\nNatural numerical sort check:', pass ? '✓ PASS' : '✗ FAIL');

if (!pass) process.exit(1);
