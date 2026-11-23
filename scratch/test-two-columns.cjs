const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_twocol');

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

    // Click Message For You button
    await page.click('.overlay-message-button');
    await new Promise((r) => setTimeout(r, 600));

    // Verify modal data
    const modalData = await page.evaluate(() => {
      const card = document.querySelector('.countdown-instruction-card');
      if (!card) return { error: 'Card not open' };

      const leftCol = card.querySelector('.instruction-col-left');
      const rightCol = card.querySelector('.instruction-col-right');
      const divider = card.querySelector('.instruction-columns-divider');

      const leftHeading = leftCol ? leftCol.querySelector('.countdown-instruction-heading').textContent.trim() : null;
      const leftItems = leftCol ? Array.from(leftCol.querySelectorAll('.instruction-item-text')).map(el => el.textContent.trim()) : [];

      const rightHeading = rightCol ? rightCol.querySelector('.countdown-instruction-heading').textContent.trim() : null;
      const rightItems = rightCol ? Array.from(rightCol.querySelectorAll('.instruction-item-text')).map(el => el.textContent.trim()) : [];

      const rect = card.getBoundingClientRect();
      const leftRect = leftCol ? leftCol.getBoundingClientRect() : null;
      const rightRect = rightCol ? rightCol.getBoundingClientRect() : null;

      return {
        cardWidth: Math.round(rect.width),
        hasDivider: !!divider,
        leftHeading,
        leftItemsCount: leftItems.length,
        leftItems,
        rightHeading,
        rightItemsCount: rightItems.length,
        rightItems,
        isSideBySide: leftRect && rightRect ? leftRect.right < rightRect.left : false,
      };
    });

    console.log('Two-Column Modal Data:', JSON.stringify(modalData, null, 2));

    const screenshotPath = path.join(process.cwd(), 'scratch', 'two_column_instruction_card.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Saved screenshot to:', screenshotPath);

    // Test close button
    await page.click('.countdown-modal-close');
    await new Promise((r) => setTimeout(r, 400));
    const closed = await page.evaluate(() => !document.querySelector('.countdown-instruction-card'));
    console.log('Closed via close button:', closed);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
