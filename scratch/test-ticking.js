import puppeteer from 'puppeteer-core';

async function testTickingAndFireworks() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Open dev controls
  await page.click('.dev-panel-toggle-btn');
  await new Promise(r => setTimeout(r, 400));

  // Click 5s countdown
  await page.click('.countdown-btn');
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot during live ticking countdown
  await page.screenshot({ path: 'scratch/verified-ticking.png' });
  console.log('Saved ticking screenshot');

  // Wait for countdown to finish (5 seconds) and fireworks to start
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: 'scratch/verified-fireworks.png' });
  console.log('Saved fireworks screenshot');

  await browser.close();
}

testTickingAndFireworks().catch(console.error);
