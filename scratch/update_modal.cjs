const fs = require('fs');
let s = fs.readFileSync('src/components/VideoMemoriesModal.jsx', 'utf8').replace(/\r\n/g, '\n');
s = s.replace(
  'src={videoSrc}\n            playsInline',
  'src={videoSrc}\n            poster="/memories_poster.jpg"\n            playsInline'
);
fs.writeFileSync('src/components/VideoMemoriesModal.jsx', s, 'utf8');
console.log('Updated VideoMemoriesModal.jsx successfully');
