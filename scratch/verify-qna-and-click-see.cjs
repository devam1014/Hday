const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_qna_verification_' + Date.now());
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
      if (text.includes('Error') || text.includes('error') || text.includes('QNA')) {
        console.log('BROWSER:', text);
      }
    });

    // =========================================================================
    // 1. VERIFY CLICK & SEE VISIBILITY ACROSS SECTIONS
    // =========================================================================
    console.log('\n=== VERIFYING CLICK & SEE VISIBILITY ===');

    // Section 1: Fireworks Page -> MUST BE VISIBLE
    await page.goto('http://127.0.0.1:5173/?stage=fireworks', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const clickSeeFireworks = await page.$('.dev-click-see-btn');
    assert('Click & See is VISIBLE on Fireworks Page', clickSeeFireworks !== null);

    // Section 2: Countdown Page -> MUST BE ABSENT
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const clickSeeCountdown = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on Countdown Page', clickSeeCountdown === null);

    // Section 3: Main Birthday -> MUST BE ABSENT
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const clickSeeMain = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on Main Birthday', clickSeeMain === null);

    // Section 4: Sad Gallery -> MUST BE ABSENT
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const clickSeeSad = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on Sad Gallery', clickSeeSad === null);

    // Section 5: Happy Gallery -> MUST BE ABSENT
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    const clickSeeHappy = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on Happy Gallery', clickSeeHappy === null);

    // Section 6: Q&A Section -> MUST BE ABSENT
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    const clickSeeQna = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on Q&A Section', clickSeeQna === null);

    // =========================================================================
    // 2. VERIFY Q&A BACKGROUND IMAGE LOADING
    // =========================================================================
    console.log('\n=== VERIFYING Q&A BACKGROUND IMAGE ===');
    const qnaBgInfo = await page.evaluate(() => {
      const img = document.querySelector('.qna-background-img');
      return {
        exists: Boolean(img),
        src: img?.src,
        complete: img?.complete,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight
      };
    });
    assert('Q&A background image element exists', qnaBgInfo.exists);
    assert('Q&A background image loaded successfully (naturalWidth > 0)', qnaBgInfo.naturalWidth > 0, JSON.stringify(qnaBgInfo));

    // =========================================================================
    // 3. VERIFY Q&A MUSIC PLAYBACK & OWNERSHIP
    // =========================================================================
    console.log('\n=== VERIFYING Q&A BACKGROUND MUSIC ===');
    // Simulate user interaction to unlock audio
    await page.mouse.click(200, 200);
    await new Promise(r => setTimeout(r, 1000));

    const qnaMusicState = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const p = ctrl?.players?.qna;
      const allAudios = Array.from(window.__allActiveAudioElements || []);
      const playingAudios = allAudios.filter(a => !a.paused);
      return {
        activeSection: ctrl.currentActiveSection,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused,
        audioSrc: p.audio.src,
        currentTime: p.audio.currentTime,
        songsCount: p.songs.length,
        songTitle: p.songs[0]?.title,
        playingAudioCount: playingAudios.length
      };
    });

    assert('Q&A music is playing', qnaMusicState.isPlaying && !qnaMusicState.audioPaused, JSON.stringify(qnaMusicState));
    assert('Q&A music loaded configured song from public/QNA-music/', qnaMusicState.audioSrc.includes('bollywood_BB%20-%20Tu%20Chahiye.mp3'));
    assert('No duplicate background songs (only 1 active audio element)', qnaMusicState.playingAudioCount === 1, JSON.stringify(qnaMusicState));

    // Verify no visible music bar in Q&A
    const musicBarsInQna = await page.$$('.music-player-pill, .gmp-wrapper, .music-player-wrapper');
    assert('No visible music bar is rendered in Q&A', musicBarsInQna.length === 0);

    // =========================================================================
    // 4. VERIFY Q&A MUSIC AUTO-ADVANCEMENT & LOOPING
    // =========================================================================
    console.log('\n=== VERIFYING Q&A MUSIC AUTO-ADVANCE & LOOP ===');
    // Fast forward Q&A audio to near the end
    await page.evaluate(() => {
      const p = window.__audioController.players.qna;
      p.audio.currentTime = p.audio.duration - 0.2;
    });
    await new Promise(r => setTimeout(r, 2000));
    // Trigger ended if needed
    await page.evaluate(() => {
      const p = window.__audioController.players.qna;
      if (p.audio.currentTime >= p.audio.duration - 0.3) {
        p.audio.dispatchEvent(new Event('ended'));
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const loopState = await page.evaluate(() => {
      const p = window.__audioController.players.qna;
      return {
        currentIndex: p.currentIndex,
        isPlaying: p.isPlaying,
        audioPaused: p.audio.paused
      };
    });
    assert('Q&A music looped back and is still playing', loopState.isPlaying && !loopState.audioPaused);

    // =========================================================================
    // 5. VERIFY SEE THIS VIEW ON Q&A QUESTION SCREEN
    // =========================================================================
    console.log('\n=== VERIFYING SEE THIS VIEW ON Q&A QUESTION SCREEN ===');
    const seeThisViewBtn = await page.$('.see-this-view-btn');
    assert('See This View button exists in top-right cluster', seeThisViewBtn !== null);

    // Click See This View
    await seeThisViewBtn.click();
    await new Promise(r => setTimeout(r, 500));

    const fullscreenLayerInfo = await page.evaluate(() => {
      const layer = document.querySelector('.see-this-view-fullscreen-layer');
      const img = layer?.querySelector('.see-this-view-fullscreen-img');
      return {
        layerVisible: Boolean(layer),
        imgSrc: img?.src,
        complete: img?.complete,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight
      };
    });
    assert('Fullscreen layer opened on question screen', fullscreenLayerInfo.layerVisible);
    assert('Fullscreen image loaded correctly (naturalWidth > 0, NOT broken)', fullscreenLayerInfo.naturalWidth > 0, JSON.stringify(fullscreenLayerInfo));

    // Test Exit via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
    const layerAfterEsc = await page.$('.see-this-view-fullscreen-layer');
    assert('Escape key exited fullscreen background view', layerAfterEsc === null);

    // Test Exit via Click/Tap
    await seeThisViewBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const layer = await page.$('.see-this-view-fullscreen-layer');
    if (layer) {
      await layer.click();
    }
    await new Promise(r => setTimeout(r, 500));
    const layerAfterClick = await page.$('.see-this-view-fullscreen-layer');
    assert('Clicking background layer exited fullscreen background view', layerAfterClick === null);

    // Verify question state preserved
    const qnum = await page.$eval('.qna-qnum-badge', el => el.textContent);
    assert('Question state preserved after See This View (Question 1)', qnum.includes('Question 1'));

    // =========================================================================
    // 6. VERIFY FINAL MESSAGE FOR YOU & SEE THIS VIEW ON FINAL SCREEN
    // =========================================================================
    console.log('\n=== VERIFYING FINAL MESSAGE FOR YOU SCREEN ===');
    // Navigate to Question 10 then to final message
    for (let i = 0; i < 10; i++) {
      const nextBtn = await page.$('.qna-nav-btn.qna-nav-next');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 100));
      }
    }
    await new Promise(r => setTimeout(r, 600));

    // Click the "💌 Message for You" trigger card to open the 3 cards
    const messageForYouBtn = await page.$('.qna-message-for-you-trigger-card');
    assert('"💌 Message for You" button screen reached', messageForYouBtn !== null);
    if (messageForYouBtn) {
      await messageForYouBtn.click();
    }
    await new Promise(r => setTimeout(r, 500));

    // Verify 3 cards exist
    const cardsExist = await page.evaluate(() => {
      const msgCard = document.querySelector('.qna-final-message-card');
      const imgCard = document.querySelector('.qna-final-image-card');
      const vidCard = document.querySelector('.qna-final-video-card');
      return Boolean(msgCard && imgCard && vidCard);
    });
    assert('Final Message 3-card layout rendered', cardsExist);

    // Verify Click & See is STILL absent on final screen
    const clickSeeFinal = await page.$('.dev-click-see-btn');
    assert('Click & See is ABSENT on final Message for You screen', clickSeeFinal === null);

    // Verify Q&A music is STILL playing on final screen without restarting
    const musicOnFinal = await page.evaluate(() => {
      const p = window.__audioController.players.qna;
      return p.isPlaying && !p.audio.paused;
    });
    assert('Q&A music continues playing smoothly on final Message screen', musicOnFinal);

    // Test "See This View" on Final Screen
    const seeThisViewFinal = await page.$('.see-this-view-btn');
    assert('See This View button exists on final Message screen', seeThisViewFinal !== null);
    await seeThisViewFinal.click();
    await new Promise(r => setTimeout(r, 500));

    const finalFsInfo = await page.evaluate(() => {
      const l = document.querySelector('.see-this-view-fullscreen-layer');
      const im = l?.querySelector('.see-this-view-fullscreen-img');
      return {
        visible: Boolean(l),
        naturalWidth: im?.naturalWidth
      };
    });
    assert('See This View fullscreen opens on final Message screen', finalFsInfo.visible && finalFsInfo.naturalWidth > 0);

    // Exit fullscreen
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    const finalCardsPreserved = await page.evaluate(() => {
      return Boolean(document.querySelector('.qna-final-message-card'));
    });
    assert('Final Message 3-card layout preserved after closing See This View', finalCardsPreserved);

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n======================================');
    console.log('TEST SUMMARY:');
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log('======================================');

    if (passed === total) {
      console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
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
