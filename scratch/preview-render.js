import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function previewRender() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px;
    height: 800px;
    overflow: hidden;
    position: relative;
    background: #0d0c15;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
    display: block;
    position: absolute;
    inset: 0;
  }

  /* Overlay matching CoverPage */
  .overlay-layer {
    position: absolute;
    top: 0;
    left: -70.73px;
    width: 1421.46px;
    height: 800px;
    pointer-events: none;
  }

  .countdown-pos {
    position: absolute;
    /* Testing exact horizontal & vertical positioning */
    left: 65.2%;
    top: 83.2%;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-track {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
  }

  /* Botanical sprig ornament */
  .botanical-ornament {
    width: 24px;
    height: 48px;
    color: #FFC52E;
    filter: drop-shadow(0 0 8px rgba(255, 197, 46, 0.65));
    opacity: 0.95;
    flex-shrink: 0;
  }
  .botanical-ornament.right {
    transform: scaleX(-1);
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 60px;
  }

  .numeral {
    font-family: 'Cinzel', serif;
    font-size: 2.7rem;
    font-weight: 700;
    color: #FFC52E;
    line-height: 1;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    text-shadow:
      0 0 12px rgba(255, 197, 46, 0.8),
      0 0 24px rgba(245, 158, 11, 0.5),
      0 2px 6px rgba(0, 0, 0, 0.95);
  }

  .label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #FFF2CC;
    margin-top: 0.35rem;
    text-shadow:
      0 1px 4px rgba(0, 0, 0, 0.9),
      0 0 8px rgba(255, 197, 46, 0.4);
  }

  .divider {
    width: 1.5px;
    height: 36px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 197, 46, 0.85) 25%,
      rgba(255, 197, 46, 0.85) 75%,
      transparent 100%
    );
    box-shadow: 0 0 6px rgba(255, 197, 46, 0.5);
    flex-shrink: 0;
    margin-top: -6px;
  }
</style>
</head>
<body>
  <img src="http://localhost:5173/cover.png" class="bg" />
  <div class="overlay-layer">
    <div class="countdown-pos">
      <div class="countdown-track">
        <!-- Left botanical ornament -->
        ${fs.readFileSync('scratch/ornament-test.svg', 'utf8')}

        <div class="unit">
          <span class="numeral">05</span>
          <span class="label">Days</span>
        </div>

        <div class="divider"></div>

        <div class="unit">
          <span class="numeral">14</span>
          <span class="label">Hours</span>
        </div>

        <div class="divider"></div>

        <div class="unit">
          <span class="numeral">32</span>
          <span class="label">Minutes</span>
        </div>

        <div class="divider"></div>

        <div class="unit">
          <span class="numeral">18</span>
          <span class="label">Seconds</span>
        </div>

        <!-- Right botanical ornament (flipped) -->
        <div class="botanical-ornament right">
          ${fs.readFileSync('scratch/ornament-test.svg', 'utf8')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'scratch/preview-with-numbers.png' });

  // Also measure rects
  const rects = await page.evaluate(() => {
    const pos = document.querySelector('.countdown-pos');
    const r = pos.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
  });

  console.log('Countdown rect:', rects);
  await browser.close();
}

previewRender().catch(console.error);
