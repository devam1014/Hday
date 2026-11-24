import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  const openAlbum = await page.$('.happy-bottom-pill-btn.btn-next');
  if (openAlbum) {
    await openAlbum.click();
    await new Promise(r => setTimeout(r, 800));
  }

  const debug1 = await page.evaluate(async () => {
    const ac = window.__audioController;
    await ac.play('happy');
    return {
      activeSection: ac.currentActiveSection,
      happyPlaying: !ac.players.happy.audio.paused,
      happyIsPlaying: ac.players.happy.isPlaying,
      happyTime: ac.players.happy.audio.currentTime
    };
  });
  console.log('Before open:', debug1);

  const playBtn = await page.$('.gallery-video-center-play-btn');
  if (playBtn) await playBtn.click();
  await new Promise(r => setTimeout(r, 400));

  const debug2 = await page.evaluate(() => {
    const ac = window.__audioController;
    return {
      activeSection: ac.currentActiveSection,
      snapshot: ac.videoSnapshot,
      happyPaused: ac.players.happy.audio.paused
    };
  });
  console.log('After open:', debug2);

  const closeBtn = await page.$('.video-modal-close-btn');
  if (closeBtn) await closeBtn.click();
  await new Promise(r => setTimeout(r, 500));

  const debug3 = await page.evaluate(() => {
    const ac = window.__audioController;
    return {
      activeSection: ac.currentActiveSection,
      happyPaused: ac.players.happy.audio.paused,
      happyIsPlaying: ac.players.happy.isPlaying
    };
  });
  console.log('After close:', debug3);
  await browser.close();
})();
