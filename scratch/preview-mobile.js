import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testMobile() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 390px;
    height: 844px;
    overflow: hidden;
    position: relative;
    background: #0d0c15;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 28% bottom;
    display: block;
    position: absolute;
    inset: 0;
  }

  /* Overlay matching CoverPage mobile bounds */
  /* vpW = 390, vpH = 844, imgAspect = 1672/941 => renderW = 844 * 1.7768 = 1499.6, offsetX = (390 - 1499.6)*0.28 = -310.7 */
  .overlay-layer {
    position: absolute;
    top: 0;
    left: -310.7px;
    width: 1499.6px;
    height: 844px;
    pointer-events: none;
  }

  .countdown-pos {
    position: absolute;
    /* In mobile overlay coordinates: center in visible wall section */
    left: 38.4%;
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
    gap: 0.28rem;
  }

  .botanical-ornament {
    width: 12px;
    height: 24px;
    color: #FFC52E;
    filter: drop-shadow(0 0 5px rgba(255, 197, 46, 0.65));
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
    min-width: 32px;
  }

  .numeral {
    font-family: 'Cinzel', serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #FFC52E;
    line-height: 1;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    text-shadow:
      0 0 8px rgba(255, 197, 46, 0.8),
      0 0 16px rgba(245, 158, 11, 0.5),
      0 2px 4px rgba(0, 0, 0, 0.95);
  }

  .label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.44rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #FFF2CC;
    margin-top: 0.18rem;
    text-shadow:
      0 1px 3px rgba(0, 0, 0, 0.9);
  }

  .divider {
    width: 1px;
    height: 18px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 197, 46, 0.85) 25%,
      rgba(255, 197, 46, 0.85) 75%,
      transparent 100%
    );
    box-shadow: 0 0 4px rgba(255, 197, 46, 0.5);
    flex-shrink: 0;
    margin-top: -3px;
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
  await page.screenshot({ path: 'scratch/preview-mobile.png' });

  await browser.close();
  console.log('Mobile screenshot saved.');
}

testMobile().catch(console.error);
