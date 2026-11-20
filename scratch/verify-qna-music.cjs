const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_qna_music_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required']
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
      if (text.includes('Error') || text.includes('error') || text.includes('QNA') || text.includes('MusicPlayer')) {
        console.log('BROWSER:', text);
      }
    });

    console.log('\n=== 1. VERIFYING Q&A MANIFEST DISCOVERY ===');
    const manifestPath = path.resolve(__dirname, '../src/config/music-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert('music-manifest.json exists and has qna array', Array.isArray(manifest.qna) && manifest.qna.length >= 2, `qna length: ${manifest.qna?.length}`);
    assert('Song 1 is detected in QNA-music', manifest.qna.some(f => f.includes('Tu Chahiye')), JSON.stringify(manifest.qna));
    assert('Song 2 is detected in QNA-music', manifest.qna.some(f => f.includes('Jaane Kyun')), JSON.stringify(manifest.qna));

    console.log('\n=== 2. NAVIGATING FROM HAPPY GALLERY TO Q&A ===');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Ensure Happy Gallery audio is started or initialized
    await page.evaluate(() => {
      if (window.audioController) {
        window.audioController.play('happy');
      }
    });
    await new Promise(r => setTimeout(r, 500));

    // Open Dev Controls panel (Test Helper)
    const testHelperBtn = await page.$('.dev-panel-toggle-btn:not(.dev-click-see-btn)');
    if (testHelperBtn) {
      await testHelperBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Click the Q&A button in Test Helper which triggers handleOpenQnA
    const qnaNavBtn = await page.waitForSelector('.qna-btn', { timeout: 5000 });
    assert('Found Q&A navigation button in Test Helper', qnaNavBtn !== null);
    await qnaNavBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    // Check Audio state inside the browser
    const audioStateAfterEntry = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      if (!ctrl) return { error: 'No audioController' };
      const qnaPlayer = ctrl.players.qna;
      const happyPlayer = ctrl.players.happy;
      const mainPlayer = ctrl.players.main;
      const sadPlayer = ctrl.players.sad;

      const playingElements = [];
      if (window.__allActiveAudioElements) {
        window.__allActiveAudioElements.forEach(a => {
          if (!a.paused) playingElements.push(a.src);
        });
      }

      return {
        activeSection: ctrl.currentActiveSection,
        qnaPlaying: qnaPlayer ? (qnaPlayer.isPlaying && !qnaPlayer.audio?.paused) : false,
        qnaCurrentIndex: qnaPlayer?.currentIndex,
        qnaCurrentSrc: qnaPlayer?.audio?.src,
        qnaSongsCount: qnaPlayer?.songs?.length,
        qnaVolume: qnaPlayer?.audio?.volume,
        happyPlaying: happyPlayer ? (happyPlayer.isPlaying && !happyPlayer.audio?.paused) : false,
        mainPlaying: mainPlayer ? (mainPlayer.isPlaying && !mainPlayer.audio?.paused) : false,
        sadPlaying: sadPlayer ? (sadPlayer.isPlaying && !sadPlayer.audio?.paused) : false,
        playingElementsCount: playingElements.length,
        playingElements
      };
    });

    assert('Active section is qna', audioStateAfterEntry.activeSection === 'qna', `activeSection: ${audioStateAfterEntry.activeSection}`);
    assert('Q&A playlist has 2 songs loaded', audioStateAfterEntry.qnaSongsCount === 2, `count: ${audioStateAfterEntry.qnaSongsCount}`);
    assert('Q&A audio is actively playing', audioStateAfterEntry.qnaPlaying === true, `qnaPlaying: ${audioStateAfterEntry.qnaPlaying}`);
    assert('Q&A started with Track 0 (Tu Chahiye)', audioStateAfterEntry.qnaCurrentIndex === 0 && audioStateAfterEntry.qnaCurrentSrc.includes('Tu%20Chahiye') || audioStateAfterEntry.qnaCurrentSrc.includes('Tu Chahiye'), `src: ${audioStateAfterEntry.qnaCurrentSrc}`);
    assert('Happy Gallery audio is paused', audioStateAfterEntry.happyPlaying === false);
    assert('Main Birthday audio is paused', audioStateAfterEntry.mainPlaying === false);
    assert('Sad Gallery audio is paused', audioStateAfterEntry.sadPlaying === false);
    assert('Strictly single audio playing in DOM', audioStateAfterEntry.playingElementsCount === 1, `playing: ${audioStateAfterEntry.playingElementsCount}`);

    console.log('\n=== 3. TESTING AUTOMATIC TRACK ADVANCEMENT (ENDED EVENT) ===');
    // Fast forward Track 0 to near end and trigger ended
    const advanceResult = await page.evaluate(async () => {
      const ctrl = window.audioController || window.__audioController;
      const qnaAudio = ctrl?.players?.qna?.audio;
      if (!qnaAudio) return { error: 'No qnaAudio' };
      // Set to duration - 0.2s
      if (qnaAudio.duration > 1) {
        qnaAudio.currentTime = qnaAudio.duration - 0.2;
      }
      return { setTime: qnaAudio.currentTime, duration: qnaAudio.duration };
    });

    // Wait for ended event and next song to start
    await new Promise(r => setTimeout(r, 1200));

    const audioStateAfterTrack1 = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      const qnaPlayer = ctrl.players.qna;
      const playingElements = [];
      if (window.__allActiveAudioElements) {
        window.__allActiveAudioElements.forEach(a => {
          if (!a.paused) playingElements.push(a.src);
        });
      }
      return {
        qnaPlaying: qnaPlayer ? (qnaPlayer.isPlaying && !qnaPlayer.audio?.paused) : false,
        qnaCurrentIndex: qnaPlayer?.currentIndex,
        qnaCurrentSrc: qnaPlayer?.audio?.src,
        playingElementsCount: playingElements.length
      };
    });

    assert('Track 1 automatically advanced to Track 2 (Index 1)', audioStateAfterTrack1.qnaCurrentIndex === 1, `index: ${audioStateAfterTrack1.qnaCurrentIndex}`);
    assert('Track 2 (Jaane Kyun) is playing', audioStateAfterTrack1.qnaPlaying === true && (audioStateAfterTrack1.qnaCurrentSrc.includes('Jaane%20Kyun') || audioStateAfterTrack1.qnaCurrentSrc.includes('Jaane Kyun')), `src: ${audioStateAfterTrack1.qnaCurrentSrc}`);
    assert('Still strictly single audio playing', audioStateAfterTrack1.playingElementsCount === 1, `count: ${audioStateAfterTrack1.playingElementsCount}`);

    console.log('\n=== 4. TESTING PLAYLIST LOOPING (LAST SONG -> FIRST SONG) ===');
    // Fast forward Track 1 to near end and trigger ended
    await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      const qnaAudio = ctrl?.players?.qna?.audio;
      if (qnaAudio && qnaAudio.duration > 1) {
        qnaAudio.currentTime = qnaAudio.duration - 0.2;
      }
    });

    await new Promise(r => setTimeout(r, 1200));

    const audioStateAfterLoop = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      const qnaPlayer = ctrl.players.qna;
      const playingElements = [];
      if (window.__allActiveAudioElements) {
        window.__allActiveAudioElements.forEach(a => {
          if (!a.paused) playingElements.push(a.src);
        });
      }
      return {
        qnaPlaying: qnaPlayer ? (qnaPlayer.isPlaying && !qnaPlayer.audio?.paused) : false,
        qnaCurrentIndex: qnaPlayer?.currentIndex,
        qnaCurrentSrc: qnaPlayer?.audio?.src,
        playingElementsCount: playingElements.length
      };
    });

    assert('Looping: Track 2 advanced back to Track 1 (Index 0)', audioStateAfterLoop.qnaCurrentIndex === 0, `index: ${audioStateAfterLoop.qnaCurrentIndex}`);
    assert('Track 1 is playing after loop', audioStateAfterLoop.qnaPlaying === true);
    assert('Still strictly single audio playing after loop', audioStateAfterLoop.playingElementsCount === 1);

    console.log('\n=== 5. PRESERVING PLAYBACK ACROSS QUESTIONS AND MESSAGE FOR YOU ===');
    // Click through questions 1 to 10
    for (let q = 1; q < 10; q++) {
      const nextBtn = await page.waitForSelector('.qna-nav-next', { timeout: 3000 });
      await nextBtn.click();
      await new Promise(r => setTimeout(r, 150));
    }

    // Now at Question 10, clicking Next should open the Message for You button
    const nextToButton = await page.waitForSelector('.qna-nav-next', { timeout: 3000 });
    await nextToButton.click();
    await new Promise(r => setTimeout(r, 500));

    const msgBtn = await page.waitForSelector('.qna-final-surprise-btn', { timeout: 3000 });
    assert('Reached Message for You button screen', msgBtn !== null);

    // Verify audio is still playing uninterrupted
    const audioAtButton = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      const qnaPlayer = ctrl?.players?.qna;
      return {
        qnaPlaying: qnaPlayer ? (qnaPlayer.isPlaying && !qnaPlayer.audio?.paused) : false,
        currentTime: qnaPlayer?.audio?.currentTime
      };
    });
    assert('Audio continues playing on Message for You button screen', audioAtButton.qnaPlaying === true && audioAtButton.currentTime > 0);

    // Click Message for You button to open the final 3-card screen
    await msgBtn.click();
    await new Promise(r => setTimeout(r, 500));

    const finalCard = await page.waitForSelector('.qna-final-message-card', { timeout: 3000 });
    assert('Final surprise 3-card layout rendered', finalCard !== null);

    const audioAtFinal = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      const qnaPlayer = ctrl?.players?.qna;
      return {
        qnaPlaying: qnaPlayer ? (qnaPlayer.isPlaying && !qnaPlayer.audio?.paused) : false
      };
    });
    assert('Audio continues playing on final 3-card screen', audioAtFinal.qnaPlaying === true);

    console.log('\n=== 6. RETURN TO HAPPY GALLERY AND BACK TO Q&A ===');
    // Click top-left Previous Page back to Happy Gallery
    const backBtn = await page.waitForSelector('.corner-nav-btn.corner-nav-prev', { timeout: 3000 });
    await backBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const audioStateBackInHappy = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      return {
        activeSection: ctrl.currentActiveSection,
        qnaPlaying: ctrl.players.qna?.isPlaying && !ctrl.players.qna?.audio?.paused,
        happyPlaying: ctrl.players.happy?.isPlaying && !ctrl.players.happy?.audio?.paused
      };
    });
    assert('Back in Happy Gallery: Active section is happy', audioStateBackInHappy.activeSection === 'happy');
    assert('Back in Happy Gallery: Q&A audio is stopped/paused', audioStateBackInHappy.qnaPlaying === false);
    assert('Back in Happy Gallery: Happy audio is playing', audioStateBackInHappy.happyPlaying === true);

    // Click Q&A button again in Test Helper
    let qnaBtn = await page.$('.qna-btn');
    if (!qnaBtn) {
      const testHelperBtn2 = await page.$('.dev-panel-toggle-btn:not(.dev-click-see-btn)');
      if (testHelperBtn2) {
        await testHelperBtn2.click();
        await new Promise(r => setTimeout(r, 400));
      }
    }
    const returnToQnaBtn = await page.waitForSelector('.qna-btn', { timeout: 3000 });
    await returnToQnaBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const audioStateReturnedToQna = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      return {
        activeSection: ctrl.currentActiveSection,
        qnaPlaying: ctrl.players.qna?.isPlaying && !ctrl.players.qna?.audio?.paused,
        happyPlaying: ctrl.players.happy?.isPlaying && !ctrl.players.happy?.audio?.paused
      };
    });
    assert('Returned to Q&A: Active section is qna', audioStateReturnedToQna.activeSection === 'qna');
    assert('Returned to Q&A: Q&A audio resumed playing', audioStateReturnedToQna.qnaPlaying === true);
    assert('Returned to Q&A: Happy Gallery audio is paused', audioStateReturnedToQna.happyPlaying === false);

  } catch (err) {
    console.error('Test execution error:', err);
    assert('Test completed without fatal error', false, err.message);
  } finally {
    await browser.close();
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch (_) {}

    console.log('\n=============================================');
    console.log(`TOTAL TESTS: ${results.length}`);
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('=============================================');

    if (failed > 0) {
      process.exit(1);
    }
  }
})();
