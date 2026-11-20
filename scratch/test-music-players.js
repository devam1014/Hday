import puppeteer from 'puppeteer-core';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function testMusicPlayers() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-test-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${tmpDir}`]
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => errors.push(err.toString()));

  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- Testing Sad Gallery Music Player ---');
  await page.goto('http://localhost:5173?stage=sad-memories', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const sadState = await page.evaluate(() => {
    const capsule = document.querySelector('.gallery-music-capsule.sad-theme');
    const artwork = document.querySelector('.sad-theme .gmp-artwork-img');
    const title = document.querySelector('.sad-theme .gmp-title-text')?.innerText;
    const infinity = document.querySelector('.sad-theme .gmp-infinity-symbol')?.innerText;
    const prevBtn = !!document.querySelector('.sad-theme .gmp-btn-prev');
    const playBtn = !!document.querySelector('.sad-theme .gmp-btn-play');
    const volSlider = !!document.querySelector('.sad-theme .gmp-volume-range');
    const playlistBtn = !!document.querySelector('.sad-theme .gmp-btn-playlist');
    const waveformBars = document.querySelectorAll('.sad-theme .gmp-waveform-bar').length;
    const progressBar = !!document.querySelector('.sad-theme .gmp-progress-rail');
    const timeElapsed = document.querySelector('.sad-theme .gmp-time-elapsed')?.innerText;
    const timeDuration = document.querySelector('.sad-theme .gmp-time-duration')?.innerText;
    // Check forbidden controls
    const nextBtn = !!document.querySelector('.sad-theme .gmp-btn-next');
    const repeatBtn = !!document.querySelector('.sad-theme .gmp-btn-repeat');
    const shuffleBtn = !!document.querySelector('.sad-theme .gmp-btn-shuffle');

    return {
      capsuleFound: !!capsule,
      artworkSrc: artwork?.getAttribute('src'),
      title,
      infinity,
      prevBtn,
      playBtn,
      volSlider,
      playlistBtn,
      waveformBars,
      progressBar,
      timeElapsed,
      timeDuration,
      forbiddenControls: { nextBtn, repeatBtn, shuffleBtn }
    };
  });
  console.log('Sad Gallery State:', JSON.stringify(sadState, null, 2));

  await page.screenshot({ path: 'scratch/sad-gallery-music-desktop.png' });

  // Test playlist open
  await page.click('.sad-theme .gmp-btn-playlist');
  await new Promise(r => setTimeout(r, 500));
  const sadPlaylistState = await page.evaluate(() => {
    const dropdown = document.querySelector('.sad-theme .gmp-playlist-dropdown');
    const items = Array.from(document.querySelectorAll('.sad-theme .gmp-playlist-item')).map(el => el.innerText.trim());
    return { dropdownVisible: !!dropdown, items };
  });
  console.log('Sad Playlist Dropdown:', JSON.stringify(sadPlaylistState, null, 2));

  console.log('\n--- Testing Happy Gallery Music Player ---');
  await page.goto('http://localhost:5173?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const happyState = await page.evaluate(() => {
    const capsule = document.querySelector('.gallery-music-capsule.happy-theme');
    const artwork = document.querySelector('.happy-theme .gmp-artwork-img');
    const title = document.querySelector('.happy-theme .gmp-title-text')?.innerText;
    const infinity = document.querySelector('.happy-theme .gmp-infinity-symbol')?.innerText;
    const prevBtn = !!document.querySelector('.happy-theme .gmp-btn-prev');
    const playBtn = !!document.querySelector('.happy-theme .gmp-btn-play');
    const volSlider = !!document.querySelector('.happy-theme .gmp-volume-range');
    const playlistBtn = !!document.querySelector('.happy-theme .gmp-btn-playlist');
    const waveformBars = document.querySelectorAll('.happy-theme .gmp-waveform-bar').length;
    const progressBar = !!document.querySelector('.happy-theme .gmp-progress-rail');
    const timeElapsed = document.querySelector('.happy-theme .gmp-time-elapsed')?.innerText;
    const timeDuration = document.querySelector('.happy-theme .gmp-time-duration')?.innerText;
    const nextBtn = !!document.querySelector('.happy-theme .gmp-btn-next');
    const repeatBtn = !!document.querySelector('.happy-theme .gmp-btn-repeat');
    const shuffleBtn = !!document.querySelector('.happy-theme .gmp-btn-shuffle');

    return {
      capsuleFound: !!capsule,
      artworkSrc: artwork?.getAttribute('src'),
      title,
      infinity,
      prevBtn,
      playBtn,
      volSlider,
      playlistBtn,
      waveformBars,
      progressBar,
      timeElapsed,
      timeDuration,
      forbiddenControls: { nextBtn, repeatBtn, shuffleBtn }
    };
  });
  console.log('Happy Gallery State:', JSON.stringify(happyState, null, 2));

  await page.screenshot({ path: 'scratch/happy-gallery-music-desktop.png' });

  // Test Mobile Viewport
  console.log('\n--- Testing Mobile Viewport ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:5173?stage=sad-memories', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/sad-gallery-music-mobile.png' });

  await page.goto('http://localhost:5173?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/happy-gallery-music-mobile.png' });

  console.log('\nErrors encountered:', errors);
  await browser.close();
}

testMusicPlayers().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
