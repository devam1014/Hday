const fs = require('fs');

// Check media_1794329682295_29e9ff91.jpg size
const stat = fs.statSync('C:\\Users\\devam\\.gemini\\antigravity\\brain\\52d7baf4-2555-4e56-bbbd-735b69f5e818\\.user_uploaded\\media_1794329682295_29e9ff91.jpg');
console.log('stat:', stat.size);
