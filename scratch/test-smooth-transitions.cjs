const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const os = require('os');
  const profileDir = path.join(os.tmpdir(), 'chrome_p_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      userDataDir: profileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const testReport = await page.evaluate(async () => {
      const results = {};

      // 1. Initial State
      const titleEl = document.querySelector('.minimal-page-title');
      const activeDot = document.querySelector('.section-indicator-dot.is-active');
      const dots = Array.from(document.querySelectorAll('.section-indicator-dot'));
      const activeIndex = dots.indexOf(activeDot);

      results.initialSection = {
        title: titleEl ? titleEl.textContent.trim() : null,
        activeDotIndex: activeIndex
      };

      // 2. Scroll message to bottom
      const viewport = document.querySelector('.minimal-message-scroll-viewport');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
      await new Promise(r => setTimeout(r, 100));

      const isBottom = viewport ? (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 14) : false;
      results.scrolledToBottom = isBottom;

      // 3. Trigger downward transition and observe two-phase classes
      const root = document.querySelector('.main-page-root');
      const layoutBefore = document.querySelector('.main-content-layout');
      
      // Dispatch wheel scroll down
      const tStart = performance.now();
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
      
      // Sample at 100ms (exiting phase)
      await new Promise(r => setTimeout(r, 100));
      const elAt100 = document.querySelector('.main-content-layout');
      const classAt100 = elAt100 ? elAt100.className : '';

      // Sample at 350ms (entering phase)
      await new Promise(r => setTimeout(r, 250));
      const elAt350 = document.querySelector('.main-content-layout');
      const classAt350 = elAt350 ? elAt350.className : '';
      const dotAt350 = dots.indexOf(document.querySelector('.section-indicator-dot.is-active'));

      // Sample at 800ms (settled phase)
      await new Promise(r => setTimeout(r, 450));
      const elAt800 = document.querySelector('.main-content-layout');
      const classAt800 = elAt800 ? elAt800.className : '';
      const titleAt800 = document.querySelector('.minimal-page-title')?.textContent.trim();
      const dotAt800 = dots.indexOf(document.querySelector('.section-indicator-dot.is-active'));

      results.transitionPhases = {
        classAt100ms: classAt100,
        classAt350ms: classAt350,
        dotAt350ms: dotAt350,
        classAt800ms: classAt800,
        titleAt800ms: titleAt800,
        dotAt800ms: dotAt800
      };

      // 4. Test Lock against accidental rapid skips
      // Fire 5 rapid wheel events immediately
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true }));
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 50));
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 50));
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 900));

      const dotAfterRapid = dots.indexOf(document.querySelector('.section-indicator-dot.is-active'));
      const titleAfterRapid = document.querySelector('.minimal-page-title')?.textContent.trim();

      results.rapidScrollProtection = {
        finalDotIndex: dotAfterRapid,
        finalTitle: titleAfterRapid,
        singleSectionAdvanceOnly: (dotAfterRapid === dotAt800 + 1) || (dotAfterRapid === dotAt800)
      };

      // 5. Test Backward Smooth Transition
      if (viewport) {
        viewport.scrollTop = 0;
      }
      await new Promise(r => setTimeout(r, 100));
      root.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 350));
      const classBackward350 = document.querySelector('.main-content-layout')?.className;
      await new Promise(r => setTimeout(r, 500));
      const dotBackwardFinal = dots.indexOf(document.querySelector('.section-indicator-dot.is-active'));

      results.backwardTransition = {
        classAt350ms: classBackward350,
        finalDotIndex: dotBackwardFinal
      };

      // 6. Audio status check
      const ac = window.__audioController;
      results.audioControllerIntact = !!ac;
      results.audioCurrentTrack = ac ? ac.songs[ac.currentIndex]?.title : null;

      return results;
    });

    console.log('Smooth Transitions Test Report:');
    console.log(JSON.stringify(testReport, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
