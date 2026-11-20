const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_p_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        `--user-data-dir=${profileDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/?stage=main', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const testReport = await page.evaluate(async () => {
      const ac = window.__audioController;
      if (!ac) return { error: 'audioController not found' };

      const steps = [];

      // 1. Start music playing
      ac.play();
      ac.audio.currentTime = 5.25;
      await new Promise(r => setTimeout(r, 100));

      steps.push({
        step: '1_music_playing',
        musicIsPlaying: ac.isPlaying,
        musicCurrentTime: ac.audio.currentTime,
        musicTrack: ac.songs[ac.currentIndex].title
      });

      // 2. Open video modal
      const watchBtn = document.querySelector('.minimal-link-box');
      if (watchBtn) watchBtn.click();
      await new Promise(r => setTimeout(r, 400));

      const video = document.querySelector('.video-player-media');
      steps.push({
        step: '2_video_modal_opened',
        hasVideoElement: !!video
      });

      // 3. Play video
      if (video) {
        try {
          await video.play();
        } catch (_) {
          // If media file load simulated
          video.dispatchEvent(new Event('play'));
        }
      }
      await new Promise(r => setTimeout(r, 200));

      steps.push({
        step: '3_video_playing_music_paused',
        videoIsPlaying: video ? !video.paused : null,
        musicIsPlaying: ac.isPlaying,
        musicAudioPaused: ac.audio.paused,
        snapshotSaved: !!ac.videoSnapshot,
        snapshotData: ac.videoSnapshot
      });

      // 4. Close video modal
      const closeBtn = document.querySelector('.video-modal-close-btn');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 400));

      steps.push({
        step: '4_video_closed_music_resumed',
        videoIsPlaying: video ? !video.paused : null,
        musicIsPlaying: ac.isPlaying,
        musicAudioPaused: ac.audio.paused,
        musicCurrentTime: ac.audio.currentTime,
        musicTrack: ac.songs[ac.currentIndex].title
      });

      // 5. Edge Case: Music already paused before video plays
      ac.pause();
      await new Promise(r => setTimeout(r, 100));
      steps.push({
        step: '5_edge_case_music_paused_manually',
        musicAudioPaused: ac.audio.paused
      });

      // Re-open video
      if (watchBtn) watchBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const video2 = document.querySelector('.video-player-media');
      if (video2) {
        try {
          await video2.play();
        } catch (_) {
          video2.dispatchEvent(new Event('play'));
        }
      }
      await new Promise(r => setTimeout(r, 200));

      steps.push({
        step: '6_video_playing_when_music_was_paused',
        snapshotSaved: !!ac.videoSnapshot,
        snapshotWasPlaying: ac.videoSnapshot ? ac.videoSnapshot.wasPlaying : null
      });

      // Close video
      const closeBtn2 = document.querySelector('.video-modal-close-btn');
      if (closeBtn2) closeBtn2.click();
      await new Promise(r => setTimeout(r, 400));

      steps.push({
        step: '7_video_closed_music_should_remain_paused',
        musicIsPlaying: ac.isPlaying,
        musicAudioPaused: ac.audio.paused
      });

      return {
        success: true,
        steps
      };
    });

    console.log('Video Audio Priority Test Results:');
    console.log(JSON.stringify(testReport, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
