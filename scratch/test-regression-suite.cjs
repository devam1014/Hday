const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_reg_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  const errors = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
      console.error('PAGE ERROR:', err.message);
    });

    console.log('--- 1. Testing Welcome Song Lifecycle ---');
    await page.goto('http://localhost:5173/?stage=fireworks', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const welcomeTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      ctrl.resetWelcomeSongSession();
      ctrl.playWelcomeSong();
      const hasWelcomeAudio = !!ctrl.welcomeAudio;
      const isLooping = ctrl.welcomeAudio ? ctrl.welcomeAudio.loop : false;
      return { hasWelcomeAudio, isLooping };
    });
    console.log('Welcome song status:', welcomeTest);
    assert(welcomeTest.hasWelcomeAudio, 'welcomeAudio must be created');
    assert.strictEqual(welcomeTest.isLooping, true, 'welcomeAudio must be looping');

    console.log('--- 2. Testing Second Heart Click / Welcome Song Stop ---');
    const heartClickTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      ctrl.primeOnSecondHeartClick();
      return {
        welcomeFinished: ctrl.welcomeFinishedForSession,
        welcomeAudioPlaying: ctrl.welcomeAudio ? !ctrl.welcomeAudio.paused : false,
        mainVolume: ctrl.players.main.audio.volume,
        mainIsMuted: ctrl.players.main.isMuted
      };
    });
    console.log('Heart click test result:', heartClickTest);
    assert.strictEqual(heartClickTest.welcomeFinished, true, 'Welcome song must be permanently finished for session');
    assert.strictEqual(heartClickTest.welcomeAudioPlaying, false, 'Welcome song must not be playing');
    assert(heartClickTest.mainVolume > 0, 'Main volume must be > 0');
    assert.strictEqual(heartClickTest.mainIsMuted, false, 'Main player must not be muted');

    console.log('--- 3. Testing Video Audio Priority ---');
    const videoPriorityTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      ctrl.setActiveSection('main');
      ctrl.play('main');
      const musicPlayingBefore = ctrl.players.main.isPlaying;

      // Video starts playing
      window.dispatchEvent(new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } }));
      const musicPlayingDuringVideo = ctrl.players.main.isPlaying;
      const audioPausedDuringVideo = ctrl.players.main.audio.paused;

      // Video pauses / stops
      window.dispatchEvent(new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } }));
      const musicPlayingAfterVideo = ctrl.players.main.isPlaying;

      return {
        musicPlayingBefore,
        musicPlayingDuringVideo,
        audioPausedDuringVideo,
        musicPlayingAfterVideo
      };
    });
    console.log('Video audio priority test:', videoPriorityTest);
    assert.strictEqual(videoPriorityTest.musicPlayingDuringVideo, false, 'Music must pause during video playback');
    assert.strictEqual(videoPriorityTest.audioPausedDuringVideo, true, 'Audio element must be paused during video playback');

    console.log('--- 4. Testing Volume Reset to Default on New Songs ---');
    const volResetTest = await page.evaluate(() => {
      const ctrl = window.__audioController;
      ctrl.setActiveSection('main');
      // Set volume to 0.15
      ctrl.setVolume('main', 0.15);
      const customVol = ctrl.players.main.audio.volume;

      // Advance to next song
      ctrl.next('main');
      const resetVol = ctrl.players.main.audio.volume;
      const defaultVol = ctrl.getDefaultVolume('main');

      return { customVol, resetVol, defaultVol };
    });
    console.log('Volume reset on new track:', volResetTest);
    assert.strictEqual(volResetTest.resetVol, volResetTest.defaultVol, 'New track must reset volume to configured defaultTrackVolume');

    console.log('--- 5. Checking for Console Errors ---');
    console.log('Total console errors caught:', errors.length);
    assert.strictEqual(errors.length, 0, 'No console errors should occur');

    console.log('\n✓ ALL REGRESSION TESTS PASSED CLEANLY WITH ZERO ERRORS!');
  } catch (err) {
    console.error('Regression test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
