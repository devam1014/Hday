const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('Navigating to Happy Gallery...');
    await page.goto('http://127.0.0.1:5173/?stage=happy-gallery', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // First interact to unlock audio
    await page.mouse.click(100, 100);

    console.log('Clicking Next to Q&A...');
    const nextBtn = await page.$('.corner-nav-next');
    if (nextBtn) {
      await nextBtn.click();
    } else {
      console.log('Could not find .corner-nav-next!');
    }
    await new Promise(r => setTimeout(r, 2000));

    const state = await page.evaluate(() => {
      const ctrl = window.__audioController;
      return {
        stage: ctrl?.currentActiveSection,
        qna: {
          isPlaying: ctrl?.players?.qna?.isPlaying,
          paused: ctrl?.players?.qna?.audio?.paused,
          src: ctrl?.players?.qna?.audio?.src,
          currentTime: ctrl?.players?.qna?.audio?.currentTime,
          songs: ctrl?.players?.qna?.songs?.length
        },
        happy: {
          isPlaying: ctrl?.players?.happy?.isPlaying,
          paused: ctrl?.players?.happy?.audio?.paused
        }
      };
    });

    console.log('State after navigation to Q&A:', JSON.stringify(state, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
