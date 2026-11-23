const puppeteer = require('puppeteer-core');
const path = require('path');

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

  // Let's inspect where the characters are in QNA-cover.png by analyzing the canvas
  const charCoords = await page.evaluate(async () => {
    const img = document.querySelector('.qna-background-img');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Let's sample colors on the right side of the image
    // Background image is 1670 x 941
    // The river and characters sitting beside it:
    // Let's find where they are in normalized coordinates (0 to 1)
    return {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: img.clientWidth,
      renderedHeight: img.clientHeight,
      renderedRect: img.getBoundingClientRect()
    };
  });

  console.log('Background Image Info:', charCoords);
  await browser.close();
})();
