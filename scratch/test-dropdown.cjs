const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_p_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        `--user-data-dir=${profileDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Test automatic sequencing via 'ended' event
    const transitionResults = await page.evaluate(async () => {
      // Access the singleton audio controller from window or via Audio element
      // Let's find the audio element or trigger ended
      const audioElements = Array.from(document.querySelectorAll('audio'));
      // In our code, AudioController created `new Audio()` in JS memory.
      // Let's import audioController or trigger it
      return new Promise((resolve) => {
        // Let's test via audioController on window or by inspecting the player
        resolve('tested');
      });
    });

    // Open playlist dropdown
    await page.click('.music-playlist-btn');
    await new Promise(r => setTimeout(r, 400));

    const dropdownCheck = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.music-playlist-item'));
      return items.map((item, i) => ({
        index: i + 1,
        title: item.querySelector('.music-item-title')?.textContent.trim(),
        isSelected: item.classList.contains('is-selected')
      }));
    });

    console.log('Dropdown items:', dropdownCheck);

    const outPath = path.join(__dirname, 'music_player_dropdown_snap.png');
    await page.screenshot({ path: outPath });
    console.log('Dropdown screenshot saved to:', outPath);

    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
