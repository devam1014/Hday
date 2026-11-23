const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_msg');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const testReport = {};

  try {
    console.log('Navigating to countdown page...');
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Type into the password field to test preservation
    await page.type('.overlay-password-input', 'testsecret');
    const typedVal = await page.evaluate(() => document.querySelector('.overlay-password-input').value);
    console.log('Typed password before modal open:', typedVal);

    // 1. Click Message For You button
    await page.click('.overlay-message-button');
    await new Promise((r) => setTimeout(r, 600));

    // Verify modal is open and inspect heading & items
    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.countdown-instruction-card');
      const heading = modal ? modal.querySelector('.countdown-instruction-heading').textContent.trim() : null;
      const items = modal ? Array.from(modal.querySelectorAll('.instruction-item-text')).map(el => el.textContent.trim()) : [];
      const closeBtn = modal ? modal.querySelector('.countdown-modal-close') : null;
      return {
        isOpen: !!modal,
        heading,
        items,
        hasCloseBtn: !!closeBtn,
      };
    });
    console.log('Modal Data:', modalData);
    testReport.modalData = modalData;

    // 2. Test closing via Close button
    await page.click('.countdown-modal-close');
    await new Promise((r) => setTimeout(r, 400));
    const isClosed1 = await page.evaluate(() => !document.querySelector('.countdown-instruction-card'));
    const passwordAfterClose1 = await page.evaluate(() => document.querySelector('.overlay-password-input').value);
    console.log('Closed via Close button:', isClosed1, 'Password preserved:', passwordAfterClose1 === 'testsecret');

    // 3. Open and close via Escape
    await page.click('.overlay-message-button');
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));
    const isClosed2 = await page.evaluate(() => !document.querySelector('.countdown-instruction-card'));
    console.log('Closed via Escape key:', isClosed2);

    // 4. Open and close via outside click
    await page.click('.overlay-message-button');
    await new Promise((r) => setTimeout(r, 400));
    // Click on the backdrop (outside card)
    await page.mouse.click(50, 50);
    await new Promise((r) => setTimeout(r, 400));
    const isClosed3 = await page.evaluate(() => !document.querySelector('.countdown-instruction-card'));
    const passwordAfterClose3 = await page.evaluate(() => document.querySelector('.overlay-password-input').value);
    console.log('Closed via outside click:', isClosed3, 'Password preserved:', passwordAfterClose3 === 'testsecret');

    testReport.closeBehaviors = {
      closedViaCloseButton: isClosed1,
      closedViaEscape: isClosed2,
      closedViaOutsideClick: isClosed3,
      passwordPreserved: passwordAfterClose3 === 'testsecret',
    };

    console.log('\n========================================');
    console.log('TEST REPORT:');
    console.log(JSON.stringify(testReport, null, 2));
    console.log('========================================\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
