import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('--- 1. Testing Stage: Countdown page ---');
  await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const cdSeeThisView = await page.$('.see-this-view-btn');
  const cdTeleport = await page.$('.teleport-nav-btn');
  const cdTestHelper = await page.$('.dev-panel-toggle-btn');
  const cdClickSee = await page.$('.click-see-magic-btn');

  console.log('Countdown - See This View:', !!cdSeeThisView);
  console.log('Countdown - Teleport:', !!cdTeleport);
  console.log('Countdown - Test Helper:', !!cdTestHelper);
  console.log('Countdown - Click & See Magic:', !!cdClickSee);
  await page.screenshot({ path: 'scratch/clean_nav_stage_countdown.png' });

  console.log('\n--- 2. Testing Stage: Fireworks page ---');
  await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const fwSeeThisView = await page.$('.see-this-view-btn');
  const fwTeleport = await page.$('.teleport-nav-btn');
  const fwTestHelper = await page.$('.dev-panel-toggle-btn');
  const fwClickSee = await page.$('.click-see-magic-btn');

  console.log('Fireworks - See This View:', !!fwSeeThisView);
  console.log('Fireworks - Teleport:', !!fwTeleport);
  console.log('Fireworks - Test Helper:', !!fwTestHelper);
  console.log('Fireworks - Click & See Magic:', !!fwClickSee);
  await page.screenshot({ path: 'scratch/clean_nav_stage_fireworks.png' });

  console.log('\n--- 3. Testing Stage: Main Birthday page ---');
  await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const mainSeeThisView = await page.$('.see-this-view-btn');
  const mainTeleport = await page.$('.teleport-nav-btn');
  const mainTestHelper = await page.$('.dev-panel-toggle-btn');
  const mainClickSee = await page.$('.click-see-magic-btn');

  console.log('Main - See This View:', !!mainSeeThisView);
  console.log('Main - Teleport:', !!mainTeleport);
  console.log('Main - Test Helper:', !!mainTestHelper);
  console.log('Main - Click & See Magic:', !!mainClickSee);
  await page.screenshot({ path: 'scratch/clean_nav_stage_main.png' });

  console.log('\n--- 4. Testing Stage: Sad Memories Gallery ---');
  await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const sadSeeThisView = await page.$('.see-this-view-btn');
  const sadTeleport = await page.$('.teleport-nav-btn');
  const sadTestHelper = await page.$('.dev-panel-toggle-btn');

  console.log('Sad - See This View:', !!sadSeeThisView);
  console.log('Sad - Teleport:', !!sadTeleport);
  console.log('Sad - Test Helper:', !!sadTestHelper);
  await page.screenshot({ path: 'scratch/clean_nav_stage_sad.png' });

  console.log('\n--- 5. Testing Stage: Happy Memories Gallery ---');
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const happySeeThisView = await page.$('.see-this-view-btn');
  const happyTeleport = await page.$('.teleport-nav-btn');
  const happyTestHelper = await page.$('.dev-panel-toggle-btn');

  console.log('Happy - See This View:', !!happySeeThisView);
  console.log('Happy - Teleport:', !!happyTeleport);
  console.log('Happy - Test Helper:', !!happyTestHelper);
  await page.screenshot({ path: 'scratch/clean_nav_stage_happy.png' });

  console.log('\n--- 6. Testing Stage: Q&A Section ---');
  await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const qnaSeeThisView = await page.$('.see-this-view-btn');
  const qnaTeleport = await page.$('.teleport-nav-btn');
  const qnaTestHelper = await page.$('.dev-panel-toggle-btn');

  console.log('Q&A - See This View:', !!qnaSeeThisView);
  console.log('Q&A - Teleport:', !!qnaTeleport);
  console.log('Q&A - Test Helper:', !!qnaTestHelper);
  await page.screenshot({ path: 'scratch/clean_nav_stage_qna.png' });

  // Test See This View functionality
  console.log('\n--- 7. Testing See This View functionality ---');
  if (qnaSeeThisView) {
    await qnaSeeThisView.click();
    await new Promise(r => setTimeout(r, 500));
    const fullscreenLayer = await page.$('.see-this-view-fullscreen-layer');
    console.log('See This View fullscreen active:', !!fullscreenLayer);
    await page.screenshot({ path: 'scratch/clean_nav_see_this_view_active.png' });

    // Press Escape to close
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
    const fullscreenLayerAfter = await page.$('.see-this-view-fullscreen-layer');
    console.log('See This View closed after Esc:', !fullscreenLayerAfter);
  }

  // Test Click & See Magic on Fireworks page
  console.log('\n--- 8. Testing Click & See Magic execution ---');
  await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const clickSeeBtn = await page.$('.click-see-magic-btn');
  if (clickSeeBtn) {
    await clickSeeBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    console.log('Clicked Click & See Magic successfully.');
    await page.screenshot({ path: 'scratch/clean_nav_click_see_running.png' });
  }

  await browser.close();
  console.log('\nAll tests complete!');
})();
