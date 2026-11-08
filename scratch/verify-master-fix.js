import puppeteer from 'puppeteer-core';

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Desktop 1280 x 800 (Waiting state '--')
  const pageDesk = await browser.newPage();
  await pageDesk.setViewport({ width: 1280, height: 800 });
  await pageDesk.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const deskMetrics = await pageDesk.evaluate(() => {
    const pos = document.querySelector('.wall-countdown-positioner');
    const numerals = document.querySelectorAll('.wall-numeral');
    const labels = document.querySelectorAll('.wall-label');
    const ornaments = document.querySelectorAll('.botanical-ornament');
    const dividers = document.querySelectorAll('.wall-divider');

    const toRect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };

    return {
      pos: toRect(pos),
      numeral0: toRect(numerals[0]),
      label0: toRect(labels[0]),
      ornamentLeft: toRect(ornaments[0]),
      ornamentRight: toRect(ornaments[1]),
      numeralColor: numerals[0] ? window.getComputedStyle(numerals[0]).color : '',
      numeralFontSize: numerals[0] ? window.getComputedStyle(numerals[0]).fontSize : ''
    };
  });

  console.log('Desktop 1280x800 metrics:', JSON.stringify(deskMetrics, null, 2));
  await pageDesk.screenshot({ path: 'scratch/verified-desktop-waiting.png' });

  // 2. Desktop 1280 x 800 with active ticking countdown (via Test Helper)
  // Click Test Helper toggle, then click 'Test 5s Countdown'
  const testHelperBtn = await pageDesk.$('.test-helper-toggle');
  if (testHelperBtn) {
    await testHelperBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const test5sBtn = await pageDesk.$('.btn-test-action:first-child');
    if (test5sBtn) {
      await test5sBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      await pageDesk.screenshot({ path: 'scratch/verified-desktop-ticking.png' });
      console.log('Ticking screenshot captured');
    }
  }

  // 3. Mobile 390 x 844
  const pageMob = await browser.newPage();
  await pageMob.setViewport({ width: 390, height: 844 });
  await pageMob.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const mobMetrics = await pageMob.evaluate(() => {
    const pos = document.querySelector('.wall-countdown-positioner');
    const r = pos ? pos.getBoundingClientRect() : null;
    return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } : null;
  });

  console.log('Mobile 390x844 metrics:', JSON.stringify(mobMetrics, null, 2));
  await pageMob.screenshot({ path: 'scratch/verified-mobile.png' });

  await browser.close();
  console.log('Verification complete.');
}

verify().catch(console.error);
