import puppeteer from 'puppeteer-core';

async function scanHorizontalWall() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  const bounds = await page.evaluate(() => {
    // Hide the countdown temporarily to see the pure background
    const timer = document.querySelector('.wall-countdown-positioner');
    if (timer) timer.style.display = 'none';

    const img = document.querySelector('.cover-background-image');
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1280, 800);

    // Let's sample along y = 670 (the vertical midline of the wall) from x = 400 to 1250
    const scan = [];
    for (let x = 400; x <= 1250; x += 20) {
      const p = ctx.getImageData(x, 670, 1, 1).data;
      // Also check y = 640 (top of wall where hanging vines/bulbs intrude)
      const pTop = ctx.getImageData(x, 640, 1, 1).data;
      scan.push({ x, mid: [p[0], p[1], p[2]], top: [pTop[0], pTop[1], pTop[2]] });
    }
    return scan;
  });

  console.log(JSON.stringify(bounds, null, 2));
  await browser.close();
}

scanHorizontalWall().catch(console.error);
