const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_all_audios_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Inject instrumentation BEFORE any script runs
    await page.evaluateOnNewDocument(() => {
      window.__allAudios = [];
      const OrigAudio = window.Audio;
      let count = 0;

      window.Audio = class MonitoredAudio extends OrigAudio {
        constructor(...args) {
          super(...args);
          this.__audioId = ++count;
          const creationStack = new Error().stack;
          const rec = {
            id: this.__audioId,
            element: this,
            srcLog: [],
            playLog: [],
            pauseLog: [],
            creationStack
          };
          window.__allAudios.push(rec);

          const origPlay = this.play.bind(this);
          const origPause = this.pause.bind(this);

          this.play = function() {
            const stack = new Error().stack;
            rec.playLog.push({ time: Date.now(), src: this.src, stack });
            console.log(`[AUDIO #${rec.id} PLAY] src=${this.src.split('/').pop()}`);
            return origPlay();
          };

          this.pause = function() {
            const stack = new Error().stack;
            rec.pauseLog.push({ time: Date.now(), src: this.src, stack });
            console.log(`[AUDIO #${rec.id} PAUSE] src=${this.src.split('/').pop()}`);
            return origPause();
          };

          this.addEventListener('play', () => console.log(`[EVENT audio #${rec.id} 'play']`));
          this.addEventListener('playing', () => console.log(`[EVENT audio #${rec.id} 'playing']`));
          this.addEventListener('pause', () => console.log(`[EVENT audio #${rec.id} 'pause']`));
          this.addEventListener('ended', () => console.log(`[EVENT audio #${rec.id} 'ended'] src=${this.src.split('/').pop()}`));
          this.addEventListener('error', (e) => console.log(`[EVENT audio #${rec.id} 'error'] src=${this.src.split('/').pop()}`));

          console.log(`[NEW AUDIO CREATED] #${rec.id}`);
        }
      };
    });

    page.on('console', msg => console.log('PAGE:', msg.text()));

    console.log('--- Step 1: Navigate to Main Page ---');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Inspect created audio elements
    const audioInfo = await page.evaluate(() => {
      return window.__allAudios.map(a => ({
        id: a.id,
        src: a.element.src,
        paused: a.element.paused,
        currentTime: a.element.currentTime,
        creationStack: a.creationStack.split('\n').slice(1, 4).join(' | ')
      }));
    });
    console.log('Audios created so far:', JSON.stringify(audioInfo, null, 2));

    // Start playing Song 1
    console.log('\n--- Step 2: Explicitly starting Song 1 via Play button ---');
    const playBtn = await page.$('.music-play-btn');
    if (playBtn) {
      await playBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }

    // Now pause Song 1 via Play/Pause button
    console.log('\n--- Step 3: Clicking Pause button on music bar ---');
    if (playBtn) {
      await playBtn.click();
      await new Promise(r => setTimeout(r, 2500));
    }

    // Check which audios are playing
    const audiosAfterPause = await page.evaluate(() => {
      return window.__allAudios.map(a => ({
        id: a.id,
        src: a.element.src,
        paused: a.element.paused,
        currentTime: a.element.currentTime,
        playCount: a.playLog.length,
        pauseCount: a.pauseLog.length
      }));
    });
    console.log('Audios after pause:', JSON.stringify(audiosAfterPause, null, 2));

    // Click Play again (Step 4 of user's scenario)
    console.log('\n--- Step 4: Clicking Play button again ---');
    if (playBtn) {
      await playBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }

    const finalAudios = await page.evaluate(() => {
      return window.__allAudios.map(a => ({
        id: a.id,
        src: a.element.src,
        paused: a.element.paused,
        currentTime: a.element.currentTime,
        playCount: a.playLog.length,
        pauseCount: a.pauseLog.length,
        latestPlay: a.playLog[a.playLog.length - 1],
        latestPause: a.pauseLog[a.pauseLog.length - 1]
      }));
    });
    console.log('Final Audios State:', JSON.stringify(finalAudios, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
