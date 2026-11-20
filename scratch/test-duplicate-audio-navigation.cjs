const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_dup_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('--- Step 1: Open website on Main page ---');
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    // Start Main playback by clicking the play button
    const playBtn = await page.$('.music-play-btn');
    assert(playBtn, 'Play button must exist');
    await playBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // Helper to count how many audio elements are actively playing
    const checkPlayingAudios = async (expectedTheme) => {
      return await page.evaluate((expTheme) => {
        const ctrl = window.__audioController;
        const mainAudio = ctrl.players.main.audio;
        const sadAudio = ctrl.players.sad.audio;
        const happyAudio = ctrl.players.happy.audio;
        const welcomeAudio = ctrl.welcomeAudio;

        const mainPlaying = Boolean(mainAudio && !mainAudio.paused && !mainAudio.ended);
        const sadPlaying = Boolean(sadAudio && !sadAudio.paused && !sadAudio.ended);
        const happyPlaying = Boolean(happyAudio && !happyAudio.paused && !happyAudio.ended);
        const welcomePlaying = Boolean(welcomeAudio && !welcomeAudio.paused && !welcomeAudio.ended);

        const playingList = [];
        if (mainPlaying) playingList.push('main');
        if (sadPlaying) playingList.push('sad');
        if (happyPlaying) playingList.push('happy');
        if (welcomePlaying) playingList.push('welcome');

        return {
          activeSection: ctrl.currentActiveSection,
          playingCount: playingList.length,
          playingList,
          expTheme,
          mainPlaying,
          sadPlaying,
          happyPlaying,
          welcomePlaying
        };
      }, expectedTheme);
    };

    let status = await checkPlayingAudios('main');
    console.log('Status on Main:', status);
    assert.strictEqual(status.playingCount, 1, 'Exactly one audio track should be playing on Main');
    assert.strictEqual(status.playingList[0], 'main');

    // Perform repeated navigation loop: Main -> Sad -> Happy -> Main -> Sad -> Main
    const navCycle = [
      { toStage: 'sad-memories', expectedTheme: 'sad', buttonSelector: '.memories-btn' },
      { toStage: 'happy-gallery', expectedTheme: 'happy', buttonSelector: '.happy-gallery-btn' },
      { toStage: 'main', expectedTheme: 'main', buttonSelector: '.mainpage-btn' },
      { toStage: 'sad-memories', expectedTheme: 'sad', buttonSelector: '.memories-btn' },
      { toStage: 'main', expectedTheme: 'main', buttonSelector: '.mainpage-btn' },
      { toStage: 'happy-gallery', expectedTheme: 'happy', buttonSelector: '.happy-gallery-btn' },
      { toStage: 'main', expectedTheme: 'main', buttonSelector: '.mainpage-btn' }
    ];

    console.log('\n--- Step 2: Running Repeated Section Navigation Cycles ---');
    // Open Test Helper so navigation buttons are visible
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.dev-panel-toggle-btn'));
      const helper = btns.find(b => b.textContent.includes('Test Helper'));
      if (helper) helper.click();
    });
    await new Promise(r => setTimeout(r, 400));
    for (let i = 0; i < navCycle.length; i++) {
      const step = navCycle[i];
      console.log(`[Cycle ${i + 1}] Navigating to: ${step.toStage} (expecting ${step.expectedTheme} audio)`);

      // Use Test Helper button or direct navigation
      await page.evaluate((targetStage) => {
        if (targetStage === 'sad-memories') {
          const btn = document.querySelector('.memories-btn') || document.querySelector('[title*="Sad Image Gallery"]');
          if (btn) btn.click();
        } else if (targetStage === 'happy-gallery') {
          const btn = document.querySelector('.happy-gallery-btn') || document.querySelector('[title*="Happy Gallery"]');
          if (btn) btn.click();
        } else if (targetStage === 'main') {
          const btn = document.querySelector('.mainpage-btn') || document.querySelector('[title*="Main Birthday Page"]');
          if (btn) btn.click();
        }
      }, step.toStage);

      // Or if not clicked, navigate via url or state
      const currentUrlStage = await page.evaluate(() => window.__audioController.currentActiveSection);
      if (currentUrlStage !== step.expectedTheme) {
        // Toggle Test Helper (find button containing 'Test Helper' text)
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('.dev-panel-toggle-btn'));
          const helper = btns.find(b => b.textContent.includes('Test Helper'));
          if (helper) helper.click();
        });
        await new Promise(r => setTimeout(r, 200));

        await page.evaluate((s) => {
          if (s === 'sad-memories') document.querySelector('.memories-btn')?.click();
          if (s === 'happy-gallery') document.querySelector('.happy-gallery-btn')?.click();
          if (s === 'main') document.querySelector('.mainpage-btn')?.click();
        }, step.toStage);
      }

      await new Promise(r => setTimeout(r, 800));

      status = await checkPlayingAudios(step.expectedTheme);
      console.log(`[Cycle ${i + 1} Result]: Active = ${status.activeSection}, Playing = [${status.playingList.join(', ')}]`);
      assert.strictEqual(status.playingCount, 1, `Must have exactly 1 active audio owner at every moment (got ${status.playingCount}: ${status.playingList.join(', ')})`);
      assert.strictEqual(status.playingList[0], step.expectedTheme, `Active audio owner must match current stage (${step.expectedTheme})`);
    }

    console.log('\n✓ DUPLICATE AUDIO TEST PASSED: Only 1 background track was audible at every moment across repeated navigation!');
  } catch (err) {
    console.error('Duplicate audio test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
