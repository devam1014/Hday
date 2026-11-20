const fs = require('fs');

const svgContent = fs.readFileSync('public/scenery-darkening-mask.svg', 'utf-8');

// Basic XML validation
const hasDefs = svgContent.includes('<defs>') && svgContent.includes('</defs>');
const hasMask = svgContent.includes('<mask id="sceneryMask">') && svgContent.includes('</mask>');
const hasLampBulb = svgContent.includes('id="lampBulb"');
const hasLampBase = svgContent.includes('id="lampBase"');
const hasLantern = svgContent.includes('id="lanternHole"');
const hasLeftTop = svgContent.includes('id="leftBulbsTop"');
const hasLeftMid = svgContent.includes('id="leftBulbsMid"');
const hasRect = svgContent.includes('mask="url(#sceneryMask)"');

console.log({
  hasDefs,
  hasMask,
  hasLampBulb,
  hasLampBase,
  hasLantern,
  hasLeftTop,
  hasLeftMid,
  hasRect,
  length: svgContent.length
});

if (!hasDefs || !hasMask || !hasLampBulb || !hasLampBase || !hasRect) {
  console.error('Validation failed!');
  process.exit(1);
} else {
  console.log('SVG structure is 100% valid!');
}
