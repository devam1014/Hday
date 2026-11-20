const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_verification_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  const results = [];
  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      results.push({ name, pass: true });
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      results.push({ name, pass: false, details });
    }
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[AUDIO EVENT]') || text.includes('Error') || text.includes('error')) {
        console.log('BROWSER:', text);
      }
    });

    console.log('\n--- LOADING MAIN PAGE ---');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Attach tracking
    await page.evaluate(() => {
      window.__testEvents = [];
      const ctrl = window.__audioController;
      ['main', 'sad', 'happy', 'qna'].forEach(t => {
        const p = ctrl?.players?.[t];
        if (p?.audio) {
          ['play', 'playing', 'pause', 'ended'].forEach(ev => {
            p.audio.addEventListener(ev, () => {
              window.__testEvents.push({
                theme: t,
                event: ev,
                src: p.audio.src ? p.audio.src.split('/').pop() : '',
                index: p.currentIndex,
                paused: p.audio.paused,
                time: Date.now()
              });
            });
          });
        }
      });
    });

    // TEST A: Start Song 1 -> Pause Song 1 -> Wait >5s -> Verify Song 2 NEVER starts
    console.log('\n=== TEST A: Manual Pause Test ===');
    await page.evaluate(() => {
      window.__audioController.play('main');
    });
    await new Promise(r => setTimeout(r, 1000));

    const song1Playing = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      return p.isPlaying && !p.audio.paused && p.currentIndex === 0;
    });
    assert('Song 1 starts playing initially', song1Playing);

    // Click pause button in the UI
    const playPauseBtn = await page.$('.music-ctrl-btn.music-play-btn');
    if (playPauseBtn) {
      await playPauseBtn.click();
    } else {
      await page.evaluate(() => window.__audioController.pause('main'));
    }
    await new Promise(r => setTimeout(r, 500));

    const pausedImmediately = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      return !p.isPlaying && p.audio.paused && p.userExplicitlyPaused === true;
    });
    assert('Song 1 paused immediately upon click', pausedImmediately);

    // Wait 5 seconds to verify Song 2 does NOT start
    console.log('Waiting 5s to verify Song 2 does NOT start automatically...');
    await new Promise(r => setTimeout(r, 5000));

    const stillPaused = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const p = ctrl.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      const anyPlaying = allAudios.some(a => !a.paused);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        userExplicitlyPaused: p.userExplicitlyPaused,
        anyPlaying
      };
    });
    assert('Song 1 remains paused after waiting', stillPaused.audioPaused && !stillPaused.isPlaying);
    assert('Song 2 did NOT start automatically', stillPaused.currentIndex === 0 && !stillPaused.anyPlaying, JSON.stringify(stillPaused));

    // TEST B: Resume from paused state -> Verify ONLY Song 1 plays
    console.log('\n=== TEST B: Resume Playback ===');
    await playPauseBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const resumedState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      const playingAudios = allAudios.filter(a => !a.paused);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        playingAudioCount: playingAudios.length
      };
    });
    assert('Song 1 resumed playing', resumedState.isPlaying && !resumedState.audioPaused && resumedState.currentIndex === 0);
    assert('Exactly ONE audio element is active (Song 2 is silent)', resumedState.playingAudioCount === 1, JSON.stringify(resumedState));

    // TEST C: Natural Advancement (fast-forward to end while playing)
    console.log('\n=== TEST C: Natural Advancement ===');
    await page.evaluate(() => {
      const p = window.__audioController.players.main;
      // Seek to very near the end
      p.audio.currentTime = p.audio.duration - 0.2;
    });
    // Wait for audio to naturally play through to ended event
    await new Promise(r => setTimeout(r, 2000));

    // If headless chrome paused timer, dispatch ended if currentTime reached duration
    await page.evaluate(() => {
      const p = window.__audioController.players.main;
      if (p.currentIndex === 0 && p.audio.currentTime >= p.audio.duration - 0.3) {
        p.audio.dispatchEvent(new Event('ended'));
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const advancedState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      const playingAudios = allAudios.filter(a => !a.paused);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        playingAudioCount: playingAudios.length
      };
    });
    assert('Naturally advanced to Song 2 (index 1)', advancedState.currentIndex === 1);
    assert('Song 2 is playing after natural advancement', advancedState.isPlaying && !advancedState.audioPaused);
    assert('Exactly ONE audio element is playing (no overlap)', advancedState.playingAudioCount === 1, JSON.stringify(advancedState));

    // TEST D: Manual Track Change (Next & Prev)
    console.log('\n=== TEST D: Next & Previous Track Change ===');
    const prevBtn = await page.$('.music-ctrl-btn[title="Previous Track"]');
    const nextBtn = await page.$('.music-ctrl-btn[title="Next Track"]');

    // Click Previous -> should go back to Song 1
    await prevBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const prevTrackState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        playingAudioCount: allAudios.filter(a => !a.paused).length
      };
    });
    assert('Previous button returned to Song 1 (index 0)', prevTrackState.currentIndex === 0);
    assert('ONLY Song 1 is playing', prevTrackState.isPlaying && prevTrackState.playingAudioCount === 1);

    // Click Next -> should advance to Song 2
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const nextTrackState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        playingAudioCount: allAudios.filter(a => !a.paused).length
      };
    });
    assert('Next button advanced to Song 2 (index 1)', nextTrackState.currentIndex === 1);
    assert('ONLY Song 2 is playing', nextTrackState.isPlaying && nextTrackState.playingAudioCount === 1);

    // TEST E: Rapid Repeated Interactions
    console.log('\n=== TEST E: Rapid Repeated Interactions ===');
    for (let i = 0; i < 10; i++) {
      await playPauseBtn.click();
      await new Promise(r => setTimeout(r, 40));
    }
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await new Promise(r => setTimeout(r, 50));
    }
    await new Promise(r => setTimeout(r, 1000));

    const stressState = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const p = ctrl.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      const playingAudios = allAudios.filter(a => !a.paused);
      return {
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        playingCount: playingAudios.length,
        userExplicitlyPaused: p.userExplicitlyPaused,
        isConsistent: (p.isPlaying === !p.audio.paused)
      };
    });
    assert('State is completely consistent after rapid interactions', stressState.isConsistent);
    assert('At most ONE audio element is playing at all times', stressState.playingCount <= 1, JSON.stringify(stressState));

    // TEST F: Cross-Section Switching
    console.log('\n=== TEST F: Cross-Section Navigation ===');
    // Ensure Main is playing
    await page.evaluate(() => {
      window.__audioController.play('main');
    });
    await new Promise(r => setTimeout(r, 1000));

    // Switch to Sad Gallery
    await page.evaluate(() => {
      window.__audioController.setActiveSection('sad');
    });
    await new Promise(r => setTimeout(r, 1500));

    const sadSectionState = await page.evaluate(() => {
      const ctrl = window.__audioController;
      return {
        mainPaused: ctrl.players.main.audio.paused,
        mainPlaying: ctrl.players.main.isPlaying,
        sadPaused: ctrl.players.sad.audio.paused,
        sadPlaying: ctrl.players.sad.isPlaying,
        currentActive: ctrl.currentActiveSection
      };
    });
    assert('Main audio is PAUSED when entering Sad Gallery', sadSectionState.mainPaused && !sadSectionState.mainPlaying);
    assert('Sad Gallery is active', sadSectionState.currentActive === 'sad');

    // Return to Main
    await page.evaluate(() => {
      window.__audioController.setActiveSection('main');
    });
    await new Promise(r => setTimeout(r, 1500));

    const returnMainState = await page.evaluate(() => {
      const ctrl = window.__audioController;
      return {
        mainPaused: ctrl.players.main.audio.paused,
        mainPlaying: ctrl.players.main.isPlaying,
        sadPaused: ctrl.players.sad.audio.paused,
        currentActive: ctrl.currentActiveSection
      };
    });
    assert('Sad audio is PAUSED when returning to Main', returnMainState.sadPaused);
    assert('Main Section is active again', returnMainState.currentActive === 'main');

    // TEST G: Paused Playlist Immunity to Ended Event
    console.log('\n=== TEST G: Paused Playlist Immunity to Ended Event ===');
    // Ensure on Main and paused
    await page.evaluate(() => {
      window.__audioController.loadTrack('main', 0, false);
      window.__audioController.pause('main');
    });
    await new Promise(r => setTimeout(r, 500));

    // Dispatch ended event while paused
    await page.evaluate(() => {
      const p = window.__audioController.players.main;
      p.audio.dispatchEvent(new Event('ended'));
    });
    await new Promise(r => setTimeout(r, 2000));

    const immunityState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        userExplicitlyPaused: p.userExplicitlyPaused,
        playingCount: allAudios.filter(a => !a.paused).length
      };
    });
    assert('Ended event while paused NEVER advanced track (still at index 0)', immunityState.currentIndex === 0);
    assert('Ended event while paused NEVER started playback (still paused)', immunityState.audioPaused && !immunityState.isPlaying);
    assert('Zero audios playing anywhere in the document', immunityState.playingCount === 0, JSON.stringify(immunityState));

    // SUMMARY
    console.log('\n======================================');
    console.log('TEST SUMMARY:');
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log('======================================');

    if (passed === total) {
      console.log('ALL AUDIO TESTS PASSED PERFECTLY!');
    } else {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
