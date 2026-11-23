const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== PROFILING FIREWORKS ANIMATION PERFORMANCE OVER TIME ===');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Navigate to fireworks stage
  await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Instrument the page to track:
  // 1. FPS / frame duration over time
  // 2. JS heap memory
  // 3. Number of animation frame requests
  await page.evaluate(() => {
    window.__perfLogs = [];
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsInterval = 1000;
    let lastFpsTime = lastTime;

    function measureFrame(now) {
      const delta = now - lastTime;
      lastTime = now;
      frameCount++;

      if (now - lastFpsTime >= fpsInterval) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        const mem = window.performance && window.performance.memory ? Math.round(window.performance.memory.usedJSHeapSize / 1048576) : 0;
        window.__perfLogs.push({
          timestamp: Math.round(now),
          fps,
          frameDelta: Math.round(delta * 10) / 10,
          heapMb: mem
        });
        frameCount = 0;
        lastFpsTime = now;
      }
      requestAnimationFrame(measureFrame);
    }
    requestAnimationFrame(measureFrame);
  });

  console.log('Sampling Phase 1 (FireworksCanvas ambient crackers)...');
  for (let s = 1; s <= 5; s++) {
    await new Promise(r => setTimeout(r, 2000));
    const logs = await page.evaluate(() => window.__perfLogs.slice(-1)[0]);
    console.log(`  [${s * 2}s] FPS: ${logs?.fps}, Heap: ${logs?.heapMb} MB`);
  }

  // Trigger heart click to test Phase 2 (BirthdayFireworksCelebration "HAPPY BIRTHDAY")
  console.log('\nClicking heart button to trigger BirthdayFireworksCelebration...');
  const heartBtn = await page.$('.wall-heart-button');
  if (heartBtn) {
    await heartBtn.click();
    console.log('Heart button clicked.');
  }

  console.log('Sampling Phase 2 (BirthdayFireworksCelebration hold state)...');
  for (let s = 1; s <= 10; s++) {
    await new Promise(r => setTimeout(r, 2000));
    const logs = await page.evaluate(() => window.__perfLogs.slice(-1)[0]);
    console.log(`  [+${s * 2}s] FPS: ${logs?.fps}, Heap: ${logs?.heapMb} MB`);
  }

  await browser.close();
  console.log('=== PROFILING COMPLETED ===');
})();
