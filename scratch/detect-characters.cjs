const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/?stage=qna&step=final-message', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    document.querySelector('.qna-screen-container').style.display = 'none';
  });

  // Let's analyze pixel colors on the canvas of the actual image
  const analysis = await page.evaluate(() => {
    const img = document.querySelector('.qna-background-img');
    const c = document.createElement('canvas');
    c.width = 1440;
    c.height = 900;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 44, 1440, 811); // centered contain

    // In anime/illustrated backgrounds like this:
    // Mountains and sky are in upper half (y < 450)
    // River flows through center/foreground
    // Where are the boy and girl?
    // Let's sample pixels in steps of 20px from x=800 to 1440, y=300 to 800
    // Let's find pixels with skin tone / clothes:
    // Skin tones typically: R > 200, G in 150-200, B in 130-180, R > G > B
    const skinPixels = [];
    const idata = ctx.getImageData(0, 0, 1440, 900);
    const d = idata.data;
    for (let y = 300; y < 850; y += 5) {
      for (let x = 800; x < 1440; x += 5) {
        const idx = (y * 1440 + x) * 4;
        const r = d[idx], g = d[idx+1], b = d[idx+2];
        // Check for skin or clothing tones distinct from green grass (G > R) and blue water/sky (B > R)
        if (r > 180 && g > 130 && b > 100 && r > g && g > b && (r - b) > 30) {
          skinPixels.push({ x, y, r, g, b });
        }
      }
    }

    if (skinPixels.length === 0) return { count: 0 };

    let minX = 1440, maxX = 0, minY = 900, maxY = 0;
    for (const p of skinPixels) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      count: skinPixels.length,
      box: { minX, maxX, minY, maxY },
      sample: skinPixels.slice(0, 10)
    };
  });

  console.log('Character skin tone analysis:', analysis);
  await browser.close();
})();
