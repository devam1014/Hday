const puppeteer = require('puppeteer-core');
const assert = require('assert');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('=== TEST 1: Happy Gallery Top-Right Buttons & Interactions ===');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Verify "See This View" opens fullscreen background layer
    const seeThisViewBtn = await page.$('.see-this-view-btn');
    assert(seeThisViewBtn, 'See This View button must exist');
    await seeThisViewBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const fsLayer = await page.$('.see-this-view-fullscreen-layer');
    assert(fsLayer, 'Fullscreen background layer must be visible when See This View is clicked');
    console.log('  [PASS] See This View opened fullscreen layer');

    // Click fullscreen layer to close
    await fsLayer.click();
    await new Promise(r => setTimeout(r, 300));
    const fsLayerClosed = await page.$('.see-this-view-fullscreen-layer');
    assert(!fsLayerClosed, 'Fullscreen layer must close on click');
    console.log('  [PASS] See This View closed on click');

    // 2. Verify "Test Helper" button toggles open dropdown
    const testHelperBtn = await page.$('.dev-panel-toggle-btn:not(.dev-click-see-btn)');
    assert(testHelperBtn, 'Test Helper button must exist');
    await testHelperBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const devContent = await page.$('.dev-panel-content');
    assert(devContent, 'Dev panel dropdown content must be open');
    console.log('  [PASS] Test Helper opened panel');

    // Close panel
    await testHelperBtn.click();
    await new Promise(r => setTimeout(r, 300));

    // 3. Navigate to last photo in Happy Gallery and click "Next Page"
    console.log('\n=== TEST 2: Happy Gallery Next Page Button Navigation to Q&A ===');
    await page.click('.happy-cover-bottom-nav .btn-next');
    await new Promise(r => setTimeout(r, 600));

    // Step through to last photo
    let steps = 0;
    while (steps < 20) {
      const btn = await page.$('.happy-photo-bottom-nav .btn-next:not(:disabled):not(.is-disabled)');
      if (!btn) break;
      const isDisabled = await page.evaluate(el => el.disabled || el.classList.contains('is-disabled'), btn);
      if (isDisabled) break;
      await btn.click();
      await new Promise(r => setTimeout(r, 350));
      steps++;
    }
    await new Promise(r => setTimeout(r, 500));

    const nextNavBtn = await page.$('.happy-gallery-root .corner-nav-next');
    assert(nextNavBtn, 'Next Page button must exist on the last photo of Happy Gallery');
    console.log('  [PASS] Next Page button is visible on last photo');

    await nextNavBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // Verify navigation to Q&A section
    const qnaSection = await page.$('.qna-root');
    assert(qnaSection, 'Clicking Next Page must successfully navigate to Q&A Section');
    console.log('  [PASS] Navigated to Q&A Section successfully');

    // 4. Verify Q&A section top-right cluster
    const qnaTopButtons = await page.evaluate(() => {
      const cluster = document.querySelector('.top-right-controls-cluster');
      const seeView = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const testHelper = document.querySelector('.dev-panel-toggle-btn:not(.dev-click-see-btn)');
      return {
        hasCluster: Boolean(cluster),
        hasSeeView: Boolean(seeView),
        hasClickSee: Boolean(clickSee),
        hasTestHelper: Boolean(testHelper),
      };
    });
    console.log('\n=== TEST 3: Q&A Section Top-Right Controls ===', qnaTopButtons);
    assert(qnaTopButtons.hasCluster && qnaTopButtons.hasSeeView && qnaTopButtons.hasClickSee && qnaTopButtons.hasTestHelper, 'All top controls present in Q&A');

    // 5. Test Sad Gallery top-right cluster and Previous Page
    console.log('\n=== TEST 4: Sad Gallery Top-Right Controls & Navigation ===');
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const sadTopButtons = await page.evaluate(() => {
      const cluster = document.querySelector('.top-right-controls-cluster');
      const seeView = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const testHelper = document.querySelector('.dev-panel-toggle-btn:not(.dev-click-see-btn)');
      return {
        hasCluster: Boolean(cluster),
        hasSeeView: Boolean(seeView),
        hasClickSee: Boolean(clickSee),
        hasTestHelper: Boolean(testHelper),
      };
    });
    console.log('Sad Gallery Top-Right Controls:', sadTopButtons);
    assert(sadTopButtons.hasCluster && sadTopButtons.hasSeeView && sadTopButtons.hasClickSee && sadTopButtons.hasTestHelper, 'All top controls present in Sad Gallery');

    console.log('\nALL INTERACTIVE VERIFICATIONS PASSED PERFECTLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
