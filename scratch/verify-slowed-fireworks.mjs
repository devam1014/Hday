import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = chromePaths.find(p => fs.existsSync(p));

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Testing FireworksCanvas (countdown page)...');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'scratch/fireworks_ambient_slowed.png' });

    console.log('Testing BirthdayFireworksCelebration (?stage=fireworks)...');
    await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'load', timeout: 30000 });
    
    // Screenshot at 1.5s during rocket ascent and early burst
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'scratch/fireworks_stage_1_5s.png' });

    // Screenshot at 4s during formed letters and hold firecrackers
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: 'scratch/fireworks_stage_4s.png' });

    // Profile FPS for 10 seconds to verify smooth 60fps
    const stats = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let frames = 0;
        let startTime = performance.now();
        function onFrame(now) {
          frames++;
          if (now - startTime < 10000) {
            requestAnimationFrame(onFrame);
          } else {
            const totalSec = (now - startTime) / 1000;
            const avgFps = frames / totalSec;
            const jsHeap = window.performance?.memory ? {
              usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
            } : null;
            resolve({ frames, avgFps, jsHeap });
          }
        }
        requestAnimationFrame(onFrame);
      });
    });

    console.log(`\nSustained Performance Results:`);
    console.log(`  Frames: ${stats.frames} in 10s`);
    console.log(`  Avg FPS: ${stats.avgFps.toFixed(2)}`);
    if (stats.jsHeap) console.log(`  JS Heap: ${stats.jsHeap.usedJSHeapSize} MB`);

    console.log('\nVerification complete!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
