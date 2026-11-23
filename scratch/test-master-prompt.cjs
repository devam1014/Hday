const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), 'scratch', 'temp_puppeteer_master');

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
    // =========================================================================
    // PART 1: Happy Gallery UI & Music Bar Alignment
    // =========================================================================
    console.log('--- TEST 1: Happy Gallery Music Bar & Card Alignment ---');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery&dev=true', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Check on Cover view first
    const coverAlignment = await page.evaluate(() => {
      const card = document.querySelector('.happy-cover-frame-box');
      const music = document.querySelector('.gallery-music-wrapper');
      if (!card || !music) return { error: 'Card or music wrapper missing on cover' };
      const cardRect = card.getBoundingClientRect();
      const musicRect = music.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const musicCenter = musicRect.left + musicRect.width / 2;
      return {
        cardCenter: Math.round(cardCenter),
        musicCenter: Math.round(musicCenter),
        centerDelta: Math.abs(Math.round(cardCenter - musicCenter)),
        musicBelowCard: musicRect.top > cardRect.bottom,
        spacing: Math.round(musicRect.top - cardRect.bottom),
      };
    });
    console.log('Cover Alignment:', coverAlignment);

    // Advance to photo view (Screen 2)
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.happy-bottom-pill-btn.btn-next');
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    const photoAlignment = await page.evaluate(() => {
      const card = document.querySelector('.happy-individual-glass-card');
      const music = document.querySelector('.gallery-music-wrapper');
      const presentationBox = document.querySelector('.happy-photo-presentation-box');
      if (!card || !music) return { error: 'Card or music wrapper missing on photo view' };
      const cardRect = card.getBoundingClientRect();
      const musicRect = music.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const musicCenter = musicRect.left + musicRect.width / 2;

      // Check soft rounded corners
      let boxRadius = '';
      if (presentationBox) {
        boxRadius = window.getComputedStyle(presentationBox).borderRadius;
      }

      return {
        cardCenter: Math.round(cardCenter),
        musicCenter: Math.round(musicCenter),
        centerDelta: Math.abs(Math.round(cardCenter - musicCenter)),
        musicBelowCard: musicRect.top > cardRect.bottom,
        spacing: Math.round(musicRect.top - cardRect.bottom),
        boxBorderRadius: boxRadius,
      };
    });
    console.log('Photo View Alignment & Corners:', photoAlignment);
    testReport.part1_happyGalleryUI = { coverAlignment, photoAlignment };

    // =========================================================================
    // PART 2 & 3: Video Controls & Default Sound Behavior
    // =========================================================================
    console.log('--- TEST 2 & 3: Video Controls & Sound in Normal vs Enlarged Viewer ---');
    // Go to Sad Gallery item 6 (video item)
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories&dev=true', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Open album to photo 1
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.gallery-nav-arrow.arrow-right');
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Navigate to photo 6 (video item)
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const nextBtn = document.querySelector('.gallery-nav-arrow.arrow-right');
        if (nextBtn) nextBtn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    const normalSadVideo = await page.evaluate(() => {
      const video = document.querySelector('.gallery-video-element');
      const bottomCtrl = document.querySelector('.gallery-video-controls-bar');
      const centerPlay = document.querySelector('.gallery-video-center-overlay');
      return {
        hasVideoElement: !!video,
        nativeControls: video ? video.controls : null,
        isMutedByDefault: video ? video.muted : null,
        volume: video ? video.volume : null,
        hasBottomControlsBarInNormalView: !!bottomCtrl, // MUST be false
        hasCenterPlayOverlay: !!centerPlay,             // MUST be true
      };
    });
    console.log('Normal Gallery Sad Video:', normalSadVideo);

    // Open enlarged viewer by clicking the video
    await page.click('.gallery-video-container');
    await new Promise((r) => setTimeout(r, 800));

    const enlargedSadVideo = await page.evaluate(() => {
      const modal = document.querySelector('.gallery-media-modal-card');
      const modalVideo = document.querySelector('.gallery-modal-video-element');
      const modalControls = document.querySelector('.gallery-modal-video-controls-bar');
      const playBtn = modalControls ? modalControls.querySelector('.gallery-modal-ctrl-btn') : null;
      const volumeSlider = modalControls ? modalControls.querySelector('.gallery-modal-volume-slider') : null;
      return {
        isModalOpen: !!modal,
        hasModalVideo: !!modalVideo,
        modalVideoNativeControls: modalVideo ? modalVideo.controls : null,
        modalVideoMuted: modalVideo ? modalVideo.muted : null,
        modalVideoVolume: modalVideo ? modalVideo.volume : null,
        hasModalControlsBar: !!modalControls, // MUST be true
        hasPlayBtn: !!playBtn,
        hasVolumeSlider: !!volumeSlider,
      };
    });
    console.log('Enlarged Sad Video Viewer:', enlargedSadVideo);

    // Close enlarged viewer
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));

    testReport.part2_3_videoControlsAndSound = { normalSadVideo, enlargedSadVideo };

    // =========================================================================
    // PART 4: Teleport Navigation System
    // =========================================================================
    console.log('--- TEST 4: Teleport System & Midnight Reset ---');
    // Clear state
    await page.evaluate(() => localStorage.removeItem('TELEPORT_24H_NAV_state'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    // In Sad Gallery, Teleport unlocks
    const teleportSad = await page.evaluate(() => {
      const seeThis = document.querySelector('.see-this-view-btn');
      const clickSee = document.querySelector('.dev-click-see-btn');
      const teleport = document.querySelector('.teleport-nav-btn');
      return {
        hasSeeThisView: !!seeThis,
        hasStandaloneClickSee: !!clickSee, // False
        hasTeleport: !!teleport,           // True
      };
    });
    console.log('Sad Gallery Teleport Status:', teleportSad);

    // Open Teleport dropdown to verify items
    await page.click('.teleport-nav-btn');
    await new Promise((r) => setTimeout(r, 400));
    const teleportItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.teleport-dropdown-item')).map((el) => el.textContent.trim());
    });
    await page.keyboard.press('Escape');
    console.log('Teleport Dropdown Items:', teleportItems);

    // Test Midnight Reset simulation
    console.log('Simulating 12:00 AM IST midnight date change...');
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('TELEPORT_24H_NAV_state') || '{}');
      // Set to yesterday's date
      state.istDate = '2020-01-01';
      localStorage.setItem('TELEPORT_24H_NAV_state', JSON.stringify(state));
    });

    // Check automatic expiration detection
    const purged = await page.evaluate(() => {
      // Trigger tab visibility change / focus check
      window.dispatchEvent(new Event('focus'));
      const state = localStorage.getItem('TELEPORT_24H_NAV_state');
      return { storageClearedAtMidnight: state === null };
    });
    console.log('Midnight Purge Result:', purged);

    testReport.part4_teleportAndMidnight = { teleportSad, teleportItems, purged };

    // =========================================================================
    // PART 5: Test Helper: Teleport ON / OFF Switch
    // =========================================================================
    console.log('--- TEST 5: Test Helper Teleport ON / OFF Switch ---');
    // Restore fresh state in Sad Gallery
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories&dev=true', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Open Test Helper
    await page.click('.dev-panel-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));

    // Check Teleport ON/OFF button exists and is ON
    const toggleBtnBefore = await page.evaluate(() => {
      const btn = document.querySelector('.teleport-toggle-btn');
      return {
        hasToggleBtn: !!btn,
        btnText: btn ? btn.textContent.trim() : null,
      };
    });
    console.log('Toggle Button Before Click:', toggleBtnBefore);

    // Click toggle to turn OFF
    await page.click('.teleport-toggle-btn');
    await new Promise((r) => setTimeout(r, 600));

    const statusAfterOff = await page.evaluate(() => {
      const btn = document.querySelector('.teleport-toggle-btn');
      const teleportBtn = document.querySelector('.teleport-nav-btn');
      const enabledInStorage = localStorage.getItem('TELEPORT_24H_NAV_enabled');
      return {
        btnTextAfter: btn ? btn.textContent.trim() : null,
        teleportBtnHiddenWhenOff: teleportBtn === null, // MUST be true
        enabledInStorage, // 'false'
      };
    });
    console.log('Status After Turning OFF:', statusAfterOff);

    // Reload page to verify OFF state persists
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    const statusAfterReload = await page.evaluate(() => {
      const teleportBtn = document.querySelector('.teleport-nav-btn');
      const enabledInStorage = localStorage.getItem('TELEPORT_24H_NAV_enabled');
      return {
        teleportStillHiddenAfterReload: teleportBtn === null,
        enabledInStorage,
      };
    });
    console.log('Status After Reload (OFF persisted):', statusAfterReload);

    // Turn back ON
    await page.click('.dev-panel-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));
    await page.click('.teleport-toggle-btn');
    await new Promise((r) => setTimeout(r, 600));

    const statusAfterOn = await page.evaluate(() => {
      const teleportBtn = document.querySelector('.teleport-nav-btn');
      const enabledInStorage = localStorage.getItem('TELEPORT_24H_NAV_enabled');
      return {
        teleportRestoredWhenOn: !!teleportBtn,
        enabledInStorage, // 'true'
      };
    });
    console.log('Status After Turning ON:', statusAfterOn);

    testReport.part5_testHelperToggle = {
      toggleBtnBefore,
      statusAfterOff,
      statusAfterReload,
      statusAfterOn,
    };

    console.log('\n========================================');
    console.log('FINAL TEST REPORT:');
    console.log(JSON.stringify(testReport, null, 2));
    console.log('========================================\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
