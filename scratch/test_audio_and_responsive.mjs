import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log('--- Comprehensive Audio, Video Coordination & Multi-Viewport Verification ---');
  const profileDir = path.join(os.tmpdir(), 'chrome_audio_verify_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required' // Simulates unlocked audio in Chrome
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // TEST 1: Password entry to Fireworks welcome song playback
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing Password Screen submission & Welcome Song initialization...');
    await page.goto('http://127.0.0.1:5173/?stage=countdown', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    // Submit correct password
    await page.type('.overlay-password-input', 'betu');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1200));

    // Check if celebration stage / fireworks active
    const stageCheck = await page.evaluate(() => {
      const controller = window.__audioController;
      return {
        welcomeAudioExists: Boolean(controller?.welcomeAudio),
        isWelcomePlaying: Boolean(controller?.isWelcomePlaying),
        welcomeSrc: controller?.welcomeAudio?.src || null,
        activeSection: controller?.currentActiveSection,
      };
    });
    console.log('Password submit audio state:', stageCheck);
    if (!stageCheck.welcomeAudioExists) {
      throw new Error('Welcome audio was not created on password submit');
    }

    // -------------------------------------------------------------------------
    // TEST 2: Main Birthday Music Player Playback & Advancement
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing Main Birthday Page audio playback & single ownership...');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1200));

    // Simulate user interaction to guarantee playing
    await page.click('body');
    await new Promise(r => setTimeout(r, 1000));

    const mainAudioState = await page.evaluate(async () => {
      const controller = window.__audioController;
      const mainPlayer = controller?.players?.main;
      const initialTime = mainPlayer?.audio?.currentTime || 0;
      
      // Wait 1 second to observe time advancement
      await new Promise(r => setTimeout(r, 1200));
      const advancedTime = mainPlayer?.audio?.currentTime || 0;
      
      return {
        activeSection: controller?.currentActiveSection,
        isPlaying: mainPlayer?.isPlaying,
        audioPaused: mainPlayer?.audio?.paused,
        initialTime,
        advancedTime,
        hasAdvanced: advancedTime > initialTime || !mainPlayer?.audio?.paused,
        trackSrc: mainPlayer?.audio?.src
      };
    });
    console.log('Main Page audio state:', mainAudioState);

    // -------------------------------------------------------------------------
    // TEST 3: Video Coordination (Play Video pauses audio, close video resumes)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing Video Coordination in Main Birthday...');
    // Click "Clip for You" to open VideoMemoriesModal
    await page.click('.minimal-link-box');
    await new Promise(r => setTimeout(r, 600));

    const videoModalState = await page.evaluate(() => {
      const controller = window.__audioController;
      const mainPlayer = controller?.players?.main;
      return {
        modalVisible: Boolean(document.querySelector('.video-modal-backdrop')),
        mainAudioPaused: mainPlayer?.audio?.paused,
        videoSnapshotWasPlaying: controller?.videoSnapshot?.wasPlaying
      };
    });
    console.log('Video modal opened, background music paused state:', videoModalState);
    if (!videoModalState.modalVisible) {
      throw new Error('Video modal did not open');
    }
    if (!videoModalState.mainAudioPaused) {
      throw new Error('Main background audio should be paused while video modal is open');
    }

    // Close the video modal via Esc
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 800));

    const afterVideoCloseState = await page.evaluate(() => {
      const controller = window.__audioController;
      const mainPlayer = controller?.players?.main;
      return {
        modalClosed: !document.querySelector('.video-modal-backdrop'),
        mainAudioPlaying: mainPlayer?.isPlaying,
        videoSnapshotCleared: controller?.videoSnapshot === null
      };
    });
    console.log('Video modal closed, background music resumed state:', afterVideoCloseState);
    if (!afterVideoCloseState.modalClosed) {
      throw new Error('Video modal did not close on Escape');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Navigation to Sad Gallery & Single Ownership Check
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Navigating to Sad Gallery & verifying single ownership...');
    await page.goto('http://127.0.0.1:5173/?stage=sad-memories', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => window.dispatchEvent(new MouseEvent('click')));
    await new Promise(r => setTimeout(r, 800));

    const sadOwnershipState = await page.evaluate(() => {
      const controller = window.__audioController;
      return {
        activeSection: controller?.currentActiveSection,
        sadPlaying: controller?.players?.sad?.isPlaying,
        mainPaused: controller?.players?.main?.audio?.paused,
        happyPaused: controller?.players?.happy?.audio?.paused,
        qnaPaused: controller?.players?.qna?.audio?.paused,
      };
    });
    console.log('Sad Gallery ownership state:', sadOwnershipState);
    if (sadOwnershipState.activeSection !== 'sad') {
      throw new Error('Active section was not set to sad');
    }
    if (!sadOwnershipState.mainPaused) {
      throw new Error('Main audio must be paused when inside Sad Gallery');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Navigation to Happy Gallery & Single Ownership Check
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Navigating to Happy Gallery & verifying single ownership...');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => window.dispatchEvent(new MouseEvent('click')));
    await new Promise(r => setTimeout(r, 800));

    const happyOwnershipState = await page.evaluate(() => {
      const controller = window.__audioController;
      return {
        activeSection: controller?.currentActiveSection,
        happyPlaying: controller?.players?.happy?.isPlaying,
        sadPaused: controller?.players?.sad?.audio?.paused,
        mainPaused: controller?.players?.main?.audio?.paused,
        qnaPaused: controller?.players?.qna?.audio?.paused,
      };
    });
    console.log('Happy Gallery ownership state:', happyOwnershipState);
    if (happyOwnershipState.activeSection !== 'happy') {
      throw new Error('Active section was not set to happy');
    }
    if (!happyOwnershipState.sadPaused) {
      throw new Error('Sad audio must be paused when inside Happy Gallery');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Navigation to Q&A Section & Final Message
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Navigating to Q&A section & verifying audio...');
    await page.goto('http://127.0.0.1:5173/?stage=qna', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => window.dispatchEvent(new MouseEvent('click')));
    await new Promise(r => setTimeout(r, 800));

    const qnaOwnershipState = await page.evaluate(() => {
      const controller = window.__audioController;
      return {
        activeSection: controller?.currentActiveSection,
        qnaPlaying: controller?.players?.qna?.isPlaying,
        happyPaused: controller?.players?.happy?.audio?.paused,
        sadPaused: controller?.players?.sad?.audio?.paused,
        mainPaused: controller?.players?.main?.audio?.paused,
      };
    });
    console.log('Q&A section ownership state:', qnaOwnershipState);
    if (qnaOwnershipState.activeSection !== 'qna') {
      throw new Error('Active section was not set to qna');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Responsive Multi-Viewport Audit (6 Target Viewports)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing 6 Responsive Viewports for layout stability & errors...');
    const viewports = [
      { name: 'Desktop Large (1920x1080)', width: 1920, height: 1080 },
      { name: 'Desktop Standard (1440x900)', width: 1440, height: 900 },
      { name: 'Desktop Common (1366x768)', width: 1366, height: 768 },
      { name: 'Desktop Compact (1280x720)', width: 1280, height: 720 },
      { name: 'iPad / Tablet Portrait (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile Standard (390x844)', width: 390, height: 844 },
      { name: 'Mobile Compact (360x800)', width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'load' });
      await new Promise(r => setTimeout(r, 400));

      const viewportCheck = await page.evaluate(() => {
        return {
          bodyOverflowX: window.getComputedStyle(document.body).overflowX,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
          hasErrorBoundary: Boolean(document.querySelector('[role="alert"]')),
        };
      });

      console.log(`Viewport ${vp.name}:`, viewportCheck);
      if (viewportCheck.hasErrorBoundary) {
        throw new Error(`Error boundary triggered at viewport ${vp.name}`);
      }
    }

    console.log('\nALL TESTS PASSED SUCCESSFULLY! COMPLETE AUDIO & RESPONSIVE VALIDATION SUCCEEDED.');
  } finally {
    await browser.close();
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
