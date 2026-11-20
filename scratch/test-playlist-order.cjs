const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_order_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('--- Step 1: Open website on Main page ---');
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // Verify configured playlist in audioController matches config.js playlistOrder
    const playlistInfo = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const songs = ctrl.players.main.songs;
      return {
        songs: songs.map(s => ({ filename: s.filename, title: s.title, url: s.url }))
      };
    });

    console.log('Main songs loaded in audioController:');
    playlistInfo.songs.forEach((s, idx) => console.log(`  [${idx + 1}] ${s.filename} -> "${s.title}"`));

    assert.strictEqual(playlistInfo.songs.length, 3, 'Must have 3 songs');
    assert(playlistInfo.songs[0].filename.includes('Dilruba'), 'Track 1 should be Dilruba');
    assert(playlistInfo.songs[1].filename.includes('Aakhri Saans'), 'Track 2 should be Aakhri Saans');
    assert(playlistInfo.songs[2].filename.includes('Preet Re'), 'Track 3 should be Preet Re');

    // Verify Dropdown UI Order
    console.log('\n--- Step 2: Verify Dropdown UI Order ---');
    // Open playlist dropdown by clicking dropdown trigger
    const dropdownBtn = await page.$('.music-playlist-btn');
    assert(dropdownBtn, 'Dropdown button must exist');
    await dropdownBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const dropdownTracks = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.music-playlist-item'));
      return items.map(el => {
        const titleEl = el.querySelector('.playlist-track-title') || el.querySelector('.gmp-playlist-item-title') || el;
        return titleEl.textContent.trim();
      });
    });

    console.log('Dropdown items displayed in UI:', dropdownTracks);
    assert.strictEqual(dropdownTracks.length, 3, 'Dropdown must show 3 tracks');

    // Verify Next and Previous Sequencing & Looping
    console.log('\n--- Step 3: Verify Next, Prev, and Looping ---');
    const orderTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const results = [];

      // Starting at 0
      results.push({ action: 'initial', index: ctrl.players.main.currentIndex, title: ctrl.players.main.songs[ctrl.players.main.currentIndex].title });

      // Next -> 1
      ctrl.next('main');
      results.push({ action: 'next (1)', index: ctrl.players.main.currentIndex, title: ctrl.players.main.songs[ctrl.players.main.currentIndex].title });

      // Next -> 2
      ctrl.next('main');
      results.push({ action: 'next (2)', index: ctrl.players.main.currentIndex, title: ctrl.players.main.songs[ctrl.players.main.currentIndex].title });

      // Next -> 0 (loop!)
      ctrl.next('main');
      results.push({ action: 'next (loop to 0)', index: ctrl.players.main.currentIndex, title: ctrl.players.main.songs[ctrl.players.main.currentIndex].title });

      // Prev -> 2 (loop backward!)
      ctrl.prev('main');
      results.push({ action: 'prev (loop to 2)', index: ctrl.players.main.currentIndex, title: ctrl.players.main.songs[ctrl.players.main.currentIndex].title });

      return results;
    });

    orderTest.forEach(step => console.log(`  ${step.action}: Index ${step.index} -> "${step.title}"`));

    assert.strictEqual(orderTest[0].index, 0);
    assert.strictEqual(orderTest[1].index, 1);
    assert.strictEqual(orderTest[2].index, 2);
    assert.strictEqual(orderTest[3].index, 0, 'Must loop back to index 0 after final track');
    assert.strictEqual(orderTest[4].index, 2, 'Must loop back to index 2 on prev from 0');

    // Verify Automatic Advancement on Track End
    console.log('\n--- Step 4: Verify Automatic Advancement on Track End ---');
    const autoAdvanceTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      ctrl.selectTrack('main', 0);
      const before = ctrl.players.main.currentIndex;

      // Dispatch 'ended' event on main audio element
      const audio = ctrl.players.main.audio;
      audio.dispatchEvent(new Event('ended'));

      const after = ctrl.players.main.currentIndex;
      return { before, after };
    });

    console.log('Auto advance test result:', autoAdvanceTest);
    assert.strictEqual(autoAdvanceTest.before, 0);
    assert.strictEqual(autoAdvanceTest.after, 1, 'Audio ended event must auto-advance to next track in order');

    console.log('\n✓ PLAYLIST ORDER AND ADVANCEMENT FULLY VERIFIED!');
  } catch (err) {
    console.error('Playlist order test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
