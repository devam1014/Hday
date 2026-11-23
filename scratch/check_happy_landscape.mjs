import puppeteer from 'puppeteer-core';

async function checkHappyLandscape() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    localStorage.setItem('birthday_teleport_enabled', 'true');
    window.dispatchEvent(new CustomEvent('teleport-navigate', { detail: 'happy-memories' }));
  });
  await new Promise(r => setTimeout(r, 1200));

  for (let i = 0; i < 5; i++) {
    const nextBtn = await page.$('.happy-nav-btn.next-btn');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }
  }

  await page.screenshot({ path: 'scratch/verify_happy_landscape_card.png' });
  console.log('Saved scratch/verify_happy_landscape_card.png');
  await browser.close();
}

checkHappyLandscape().catch(console.error);
