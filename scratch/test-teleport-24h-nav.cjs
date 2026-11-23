const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_teleport');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const testReport = {};

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Countdown stage (before second timer ends)
    // Expect: Only "See This View", no "Click & See", no "Teleport"
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Countdown Stage ---');
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));
    // Clear any previous test storage so it's fresh
    await page.evaluate(() => localStorage.removeItem('TELEPORT_24H_NAV_state'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    const t1 = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      return {
        hasSeeThisView: !!seeThis,
        hasClickAndSee: !!clickSee,
        hasTeleport: !!teleport,
      };
    });
    testReport.test1_countdownStage = t1;
    console.log('Test 1 (Countdown Stage):', t1);

    // -------------------------------------------------------------------------
    // TEST 2: Fireworks stage
    // Expect: "See This View" + "Click & See Magic" (Teleport not unlocked yet)
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Fireworks Stage ---');
    await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    const t2 = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      return {
        hasSeeThisView: !!seeThis,
        hasClickAndSee: !!clickSee,
        hasTeleport: !!teleport,
      };
    });
    testReport.test2_fireworksStage = t2;
    console.log('Test 2 (Fireworks Stage):', t2);

    // -------------------------------------------------------------------------
    // TEST 3: Main Birthday Stage (Initial visit before Sad Gallery)
    // Expect: "See This View" + "Click & See Magic" (Teleport NOT yet unlocked)
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Main Birthday Stage (Initial) ---');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    const t3 = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      return {
        hasSeeThisView: !!seeThis,
        hasClickAndSee: !!clickSee,
        hasTeleport: !!teleport,
        teleportUnlockedInStorage: !!state.teleportUnlocked,
        visitedSections: state.visitedSections || [],
      };
    });
    testReport.test3_mainInitial = t3;
    console.log('Test 3 (Main Initial):', t3);

    // -------------------------------------------------------------------------
    // TEST 4 & 5: Sad Gallery Stage (Visiting Sad Gallery unlocks Teleport)
    // Expect: "See This View" + "Teleport". Standalone "Click & See" is HIDDEN.
    // Teleport dropdown contains: 1. Click & See Magic, 2. Main Birthday, 3. Sad Gallery
    // -------------------------------------------------------------------------
    console.log('--- TEST 4 & 5: Sad Gallery Stage ---');
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Check buttons
    const t4Buttons = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      return {
        hasSeeThisView: !!seeThis,
        hasClickAndSeeStandalone: !!clickSee, // MUST be false
        hasTeleport: !!teleport,              // MUST be true
        teleportUnlockedInStorage: state.teleportUnlocked, // MUST be true
        visitedSections: state.visitedSections || [],
      };
    });

    // Open Teleport dropdown to verify items
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 400));

    const t4DropdownItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.teleport-dropdown-item')).map((el) => el.textContent.trim());
      return items;
    });
    testReport.test4_sadGallery = {
      ...t4Buttons,
      dropdownItems: t4DropdownItems,
    };
    console.log('Test 4 & 5 (Sad Gallery Teleport Unlocked):', testReport.test4_sadGallery);

    // Close dropdown
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------------------
    // TEST 6: Return to Main Birthday after Teleport is unlocked
    // Expect: Teleport REMAIN AVAILABLE on Main Birthday! Standalone Click & See remains hidden.
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Return to Main Birthday ---');
    // Teleport to Main Birthday via Teleport dropdown
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const mainItem = Array.from(document.querySelectorAll('.teleport-dropdown-item')).find((el) => el.textContent.includes('Main Birthday'));
      if (mainItem) mainItem.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const t6 = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      const mainRoot = document.querySelector('.main-page-root');
      return {
        isOnMainPage: !!mainRoot,
        hasSeeThisView: !!seeThis,
        hasClickAndSeeStandalone: !!clickSee, // MUST be false
        hasTeleport: !!teleport,              // MUST be true
      };
    });
    testReport.test6_returnToMain = t6;
    console.log('Test 6 (Return to Main Birthday):', t6);

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Navigate through Happy Gallery, Q&A, and Message for You
    // Expect: Dropdown dynamically expands as each section is visited
    // -------------------------------------------------------------------------
    console.log('--- TEST 7 & 8: Happy Gallery, Q&A, Message for You ---');

    // Go to Happy Gallery
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 300));
    const happyDropdown = await page.evaluate(() => Array.from(document.querySelectorAll('.teleport-dropdown-item')).map((el) => el.textContent.trim()));
    await page.keyboard.press('Escape');

    // Go to Q&A
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 300));
    const qnaDropdown = await page.evaluate(() => Array.from(document.querySelectorAll('.teleport-dropdown-item')).map((el) => el.textContent.trim()));
    await page.keyboard.press('Escape');

    // Simulate reaching Message for You (step = final-message)
    await page.evaluate(() => {
      // Simulate advancing in QnA
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      state.visitedSections = Array.from(new Set([...(state.visitedSections || []), 'qna-final']));
      state.navigationProgress = { ...(state.navigationProgress || {}), qnaStep: 'final-message' };
      localStorage.setItem('TELEPORT_24H_NAV_state', JSON.stringify(state));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 300));
    const finalDropdown = await page.evaluate(() => Array.from(document.querySelectorAll('.teleport-dropdown-item')).map((el) => el.textContent.trim()));
    await page.keyboard.press('Escape');

    testReport.test7_8_dynamicSections = {
      happyDropdown,
      qnaDropdown,
      finalDropdown,
    };
    console.log('Test 7 & 8 (Dynamic sections in dropdown):', testReport.test7_8_dynamicSections);

    // -------------------------------------------------------------------------
    // TEST 9, 10, 11: Click & See Magic from Teleport Replay Behavior
    // Expect: Navigates to fireworks, replaying fireworks & song.
    // Completing fireworks leads to Main Birthday. Teleport remains unlocked!
    // -------------------------------------------------------------------------
    console.log('--- TEST 9, 10, 11: Click & See Magic Replay ---');
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const magicItem = Array.from(document.querySelectorAll('.teleport-dropdown-item')).find((el) => el.textContent.includes('Click & See Magic'));
      if (magicItem) magicItem.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const onFireworks = await page.evaluate(() => !!document.querySelector('.cover-page-root'));
    console.log('Is on Fireworks page:', onFireworks);

    // Wait for the 10-second countdown on the fireworks page to complete
    console.log('Waiting ~10.5s for 10-second fireworks countdown to reach zero...');
    await new Promise((r) => setTimeout(r, 10500));

    // Floating heart button appears when crackers are active
    await page.waitForSelector('.wall-heart-button', { timeout: 6000 });
    console.log('Floating heart button appeared! Clicking first time (forming text)...');
    await page.click('.wall-heart-button');

    // Wait ~3.2 seconds for "HAPPY BIRTHDAY" letters to form and enter holding state
    await new Promise((r) => setTimeout(r, 3200));
    console.log('Clicking floating heart button second time (proceed to Main Birthday)...');
    await page.click('.wall-heart-button');

    // Wait ~1.5s for transition to Main Birthday
    await new Promise((r) => setTimeout(r, 1500));

    // Verify on Main Birthday & Teleport is still unlocked
    const t11 = await page.evaluate(() => {
      const mainRoot = document.querySelector('.main-page-root');
      const teleport = document.querySelector('.teleport-nav-btn');
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      return {
        isOnMainPage: !!mainRoot,
        hasTeleportOnMain: !!teleport,
        teleportUnlockedInStorage: state.teleportUnlocked,
        visitedCount: state.visitedSections ? state.visitedSections.length : 0,
      };
    });
    testReport.test9_10_11_replay = {
      navigatedToFireworks: onFireworks,
      ...t11,
    };
    console.log('Test 9, 10, 11 (Replay & Return to Main):', testReport.test9_10_11_replay);

    // -------------------------------------------------------------------------
    // TEST 12: Reload within 24 hours restores saved progress
    // -------------------------------------------------------------------------
    console.log('--- TEST 12: Reload Within 24 Hours ---');
    // Reload while on Main
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    const t12 = await page.evaluate(() => {
      const mainRoot = document.querySelector('.main-page-root');
      const teleport = document.querySelector('.teleport-nav-btn');
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      return {
        restoredToMain: !!mainRoot,
        teleportAvailable: !!teleport,
        visitedSections: state.visitedSections || [],
      };
    });
    testReport.test12_reload24h = t12;
    console.log('Test 12 (Reload Within 24h):', t12);

    // -------------------------------------------------------------------------
    // TEST 13: 24-Hour Expiration
    // Expect: History older than 24 hours is automatically cleared
    // -------------------------------------------------------------------------
    console.log('--- TEST 13: 24-Hour Expiration ---');
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      // Set createdAt to 25 hours ago
      state.createdAt = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem('TELEPORT_24H_NAV_state', JSON.stringify(state));
    });

    // Reload page
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1500));

    const t13 = await page.evaluate(() => {
      const state = localStorage.getItem('TELEPORT_24H_NAV_state');
      return {
        storageClearedAfter24h: state === null,
      };
    });
    testReport.test13_expiration = t13;
    console.log('Test 13 (24h Expiration):', t13);

    console.log('\n========================================');
    console.log('COMPLETE TELEPORT_24H_NAV TEST REPORT:');
    console.log(JSON.stringify(testReport, null, 2));
    console.log('========================================\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
