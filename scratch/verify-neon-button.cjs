const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const profileDir = path.join(os.tmpdir(), 'chrome_test_neon_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      userDataDir: profileDir,
      args: [
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

    // Capture resting screenshot of button
    const btnHandle = await page.$('.minimal-link-box');
    if (btnHandle) {
      await btnHandle.screenshot({ path: path.join(__dirname, 'neon_button_resting.png') });
      console.log('Resting button screenshot captured.');

      // Hover
      await page.hover('.minimal-link-box');
      await new Promise(r => setTimeout(r, 400));
      await btnHandle.screenshot({ path: path.join(__dirname, 'neon_button_hover.png') });
      console.log('Hover button screenshot captured.');
    }

    const buttonDetails = await page.evaluate(() => {
      const btn = document.querySelector('.minimal-link-box');
      const cs = window.getComputedStyle(btn);
      const textEl = document.querySelector('.minimal-link-text');
      const textCs = window.getComputedStyle(textEl);
      const playIcon = document.querySelector('.minimal-link-play-icon');
      const triangle = document.querySelector('.minimal-link-play-triangle');
      const divider = document.querySelector('.minimal-link-divider');
      const chevron = document.querySelector('.minimal-link-chevron');

      return {
        borderRadius: cs.borderRadius,
        borderColor: cs.borderColor,
        boxShadow: cs.boxShadow,
        height: cs.height,
        fontFamily: textCs.fontFamily,
        fontStyle: textCs.fontStyle,
        fontSize: textCs.fontSize,
        textColor: textCs.color,
        textContent: textEl ? textEl.textContent.trim() : null,
        hasPlayIcon: !!playIcon,
        hasTriangle: !!triangle,
        hasDivider: !!divider,
        hasChevron: !!chevron,
        chevronContent: chevron ? chevron.textContent.trim() : null
      };
    });

    console.log('NEON BUTTON DETAILS:');
    console.log(JSON.stringify(buttonDetails, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Error during neon button verification:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
