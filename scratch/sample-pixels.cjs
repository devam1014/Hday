const puppeteer = require('puppeteer-core');

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

  const samples = await page.evaluate(() => {
    const img = document.querySelector('.qna-background-img');
    const c = document.createElement('canvas');
    c.width = 1440;
    c.height = 900;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 44, 1440, 811);

    const res = [];
    for (let x = 800; x <= 1400; x += 100) {
      for (let y = 450; y <= 850; y += 100) {
        const p = ctx.getImageData(x, y, 1, 1).data;
        res.push(`(${x}, ${y}) -> rgb(${p[0]}, ${p[1]}, ${p[2]})`);
      }
    }
    return res;
  });

  console.log('Sample pixels:\n' + samples.join('\n'));
  await browser.close();
})();
