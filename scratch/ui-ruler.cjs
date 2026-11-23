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

  // Let's inspect where the characters are in the image:
  // The boy and girl sitting beside the river on the right side.
  // Let's check canvas pixel data:
  const charDetails = await page.evaluate(() => {
    const img = document.querySelector('.qna-background-img');
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1440, 900);

    // Let's crop several boxes from x=800 to 1400, y=400 to 900,
    // to find where skin tones or dark hair / clothing of the boy and girl are.
    // Or let's create a visual thumbnail collage of 100x100 patches from x=800..1440, y=400..900
    return {
      w: 1440,
      h: 900
    };
  });

  // Let's also take a screenshot with BOTH the UI and the ruler so we can see where the cards are relative to the ruler!
  await page.evaluate(() => {
    const ruler = document.createElement('div');
    ruler.style.position = 'fixed';
    ruler.style.inset = '0';
    ruler.style.pointerEvents = 'none';
    ruler.style.zIndex = '99999';
    for (let x = 0; x <= 1440; x += 100) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = x + 'px';
      line.style.top = '0';
      line.style.bottom = '0';
      line.style.width = '1px';
      line.style.background = 'rgba(255, 0, 0, 0.6)';
      const label = document.createElement('span');
      label.textContent = x + 'px';
      label.style.position = 'absolute';
      label.style.left = '2px';
      label.style.top = '10px';
      label.style.color = '#ffff00';
      label.style.fontSize = '12px';
      label.style.fontWeight = 'bold';
      label.style.background = 'rgba(0,0,0,0.8)';
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
      line.style.background = 'rgba(0, 255, 0, 0.6)';
      const label = document.createElement('span');
      label.textContent = y + 'px';
      label.style.position = 'absolute';
      label.style.top = '2px';
      label.style.left = '10px';
      label.style.color = '#ffff00';
      label.style.fontSize = '12px';
      label.style.fontWeight = 'bold';
      label.style.background = 'rgba(0,0,0,0.8)';
      line.appendChild(label);
      ruler.appendChild(line);
    }
    document.body.appendChild(ruler);
  });

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'ui_with_ruler_1440.png') });
  console.log('Saved scratch/ui_with_ruler_1440.png');
  await browser.close();
})();
