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

  // Hide the UI to see the characters
  await page.evaluate(() => {
    document.querySelector('.qna-screen-container').style.display = 'none';
  });

  // Let's create an overlay on the page to mark various horizontal zones (e.g. 50% to 100% width)
  // and take a screenshot with a grid ruler!
  await page.evaluate(() => {
    const ruler = document.createElement('div');
    ruler.style.position = 'fixed';
    ruler.style.inset = '0';
    ruler.style.pointerEvents = 'none';
    ruler.style.zIndex = '99999';
    ruler.style.display = 'flex';
    for (let x = 0; x <= 1440; x += 100) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = x + 'px';
      line.style.top = '0';
      line.style.bottom = '0';
      line.style.width = '1px';
      line.style.background = 'rgba(255, 0, 0, 0.4)';
      const label = document.createElement('span');
      label.textContent = x + 'px';
      label.style.position = 'absolute';
      label.style.left = '2px';
      label.style.top = '10px';
      label.style.color = '#fff';
      label.style.fontSize = '12px';
      label.style.background = 'rgba(0,0,0,0.6)';
      line.appendChild(label);
      ruler.appendChild(line);
    }
    for (let y = 0; y <= 900; y += 100) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = y + 'px';
      line.style.left = '0';
      line.style.right = '0';
      line.style.height = '1px';
      line.style.background = 'rgba(0, 255, 0, 0.4)';
      const label = document.createElement('span');
      label.textContent = y + 'px';
      label.style.position = 'absolute';
      label.style.top = '2px';
      label.style.left = '10px';
      label.style.color = '#fff';
      label.style.fontSize = '12px';
      label.style.background = 'rgba(0,0,0,0.6)';
      line.appendChild(label);
      ruler.appendChild(line);
    }
    document.body.appendChild(ruler);
  });

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'bg_with_ruler_1440.png') });
  console.log('Saved scratch/bg_with_ruler_1440.png');
  await browser.close();
})();
