import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const audioChecks = [
  { section: 'Countdown & Fireworks', file: 'public/audio/welcome.mp3' },
  { section: 'Fireworks sound FX (burst)', file: 'public/audio/burst_large.wav' },
  { section: 'Fireworks sound FX (medium)', file: 'public/audio/burst_medium.wav' },
  { section: 'Fireworks sound FX (crackle)', file: 'public/audio/burst_crackle.wav' },
  { section: 'Fireworks sound FX (launch)', file: 'public/audio/launch.wav' },
  { section: 'Main Birthday Track 1', file: 'public/music/1.mp3' },
  { section: 'Main Birthday Track 2', file: 'public/music/2.mp3' },
  { section: 'Main Birthday Track 3', file: 'public/music/3.mp3' },
  { section: 'Sad Gallery Track', file: 'public/sad-songs/PHIR KABHI (Reprise) Full Song  M.S. DHONI  Arijit Singh  Sushant Singh, Disha Patani.mp3' },
  { section: 'Happy Gallery Track', file: 'public/happy-songs/1.m4a' },
  { section: 'Q&A Section Track 1', file: 'public/QNA-music/1.mp3' },
  { section: 'Q&A Section Track 2', file: 'public/QNA-music/2.mp3' },
  { section: 'Final Message Video 1', file: 'public/last-msg/1.mp4' },
  { section: 'Final Message Video 2', file: 'public/last-msg/2.mp4' },
];

console.log('--- Checking All Required Media & Audio Files on Disk ---');
let allExist = true;

for (const item of audioChecks) {
  const fullPath = path.join(rootDir, item.file);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    console.error(`[FAIL] MISSING: ${item.section} -> ${item.file}`);
    allExist = false;
  } else {
    const stat = fs.statSync(fullPath);
    console.log(`[PASS] ${item.section}: ${item.file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
}

if (!allExist) {
  process.exit(1);
} else {
  console.log('\nAll audio & media asset files verified successfully on disk!');
}
