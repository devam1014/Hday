const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_btn_vis');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Inspect the button visibility, bounding box, and styles
    const btnInfo = await page.evaluate(() => {
      const btn = document.querySelector('.overlay-message-button');
      if (!btn) return { error: 'Button not found' };
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      const textSpan = btn.querySelector('.overlay-message-btn-text');
      const textStyle = textSpan ? window.getComputedStyle(textSpan) : null;
      return {
        text: btn.textContent.trim(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        background: style.background || style.backgroundColor,
        border: style.border,
        boxShadow: style.boxShadow,
        zIndex: style.zIndex,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        textColor: textStyle ? textStyle.color : null,
        fontSize: textStyle ? textStyle.fontSize : null,
      };
    });

    console.log('Button Info:', btnInfo);

    // Take screenshot of the button and countdown page
    const screenshotPath = path.join(process.cwd(), 'scratch', 'visible_message_for_you_button.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved screenshot to:', screenshotPath);

    // Click button to ensure it still opens instructions modal cleanly
    await page.click('.overlay-message-button');
    await new Promise((r) => setTimeout(r, 500));
    const modalOpen = await page.evaluate(() => !!document.querySelector('.countdown-instruction-card'));
    console.log('Instructions modal opens on click:', modalOpen);

    const modalScreenshotPath = path.join(process.cwd(), 'scratch', 'instruction_modal_open.png');
    await page.screenshot({ path: modalScreenshotPath });
    console.log('Saved modal screenshot to:', modalScreenshotPath);
  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    await browser.close();
  }
})();
