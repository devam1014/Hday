import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = chromePaths.find(p => fs.existsSync(p));
console.log('Using browser executable:', executablePath);

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

    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    page.on('pageerror', err => consoleLogs.push(`ERROR: ${err.message}`));

    console.log('Navigating to ?stage=fireworks...');
    await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'load', timeout: 30000 });
    console.log('Page loaded.');

    await new Promise(r => setTimeout(r, 1500));

    const profileFireworks = async (durationSec, label) => {
      console.log(`\nProfiling ${label} for ${durationSec} seconds...`);
      const stats = await page.evaluate(async (sec) => {
        return new Promise((resolve) => {
          let frames = 0;
          let startTime = performance.now();

          function onFrame(now) {
            frames++;
            if (now - startTime < sec * 1000) {
              requestAnimationFrame(onFrame);
            } else {
              const totalSec = (now - startTime) / 1000;
              const avgFps = frames / totalSec;
              const jsHeap = window.performance?.memory ? {
                usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100
              } : null;
              resolve({ frames, avgFps, jsHeap });
            }
          }
          requestAnimationFrame(onFrame);
        });
      }, durationSec);

      console.log(`Results for ${label}:`);
      console.log(`  Frames: ${stats.frames}`);
      console.log(`  Avg FPS: ${stats.avgFps.toFixed(2)}`);
      if (stats.jsHeap) {
        console.log(`  JS Heap Used: ${stats.jsHeap.usedJSHeapSize} MB / Total: ${stats.jsHeap.totalJSHeapSize} MB`);
      }
      return stats;
    };

    // Profile initial convergence & letter ignition phase (0 - 5s)
    await profileFireworks(5, 'Ignition & Letter Convergence (0-5s)');

    // Profile sustained HOLD state (firecrackers, glints, aura) (5 - 20s)
    await profileFireworks(15, 'Sustained Hold & Firecrackers (5-20s)');

    console.log('\nSUCCESS: BirthdayFireworksCelebration profiled successfully.');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
