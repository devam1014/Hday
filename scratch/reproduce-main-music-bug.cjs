const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_test_main_audio_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [`--user-data-dir=${profileDir}`, '--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    console.log('--- Step 1: Navigate to Main Page ---');
    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Inspect initial audio controller state and audio elements
    const initialState = await page.evaluate(() => {
      const ctrl = window.__audioController;
      const mainAudio = ctrl?.players?.main?.audio;
      return {
        currentIndex: ctrl?.players?.main?.currentIndex,
        isPlaying: ctrl?.players?.main?.isPlaying,
        audioSrc: mainAudio?.src,
        audioPaused: mainAudio?.paused,
        audioCurrentTime: mainAudio?.currentTime,
        audioDuration: mainAudio?.duration,
        allPlayers: Object.keys(ctrl?.players || {}).map(k => ({
          theme: k,
          isPlaying: ctrl.players[k].isPlaying,
          paused: ctrl.players[k].audio?.paused,
          src: ctrl.players[k].audio?.src
        }))
      };
    });

    console.log('Initial State on Main Page:', JSON.stringify(initialState, null, 2));

    // Add interceptors / logging to main audio events in the browser
    await page.evaluate(() => {
      const ctrl = window.__audioController;
      window.__audioEvents = [];
      ['main', 'sad', 'happy', 'qna'].forEach(theme => {
        const p = ctrl.players[theme];
        if (p && p.audio) {
          ['play', 'playing', 'pause', 'ended', 'error', 'waiting', 'timeupdate'].forEach(evt => {
            if (evt === 'timeupdate') return; // avoid flood
            p.audio.addEventListener(evt, (e) => {
              const info = {
                theme,
                event: evt,
                src: p.audio.src ? p.audio.src.split('/').pop() : '',
                currentTime: p.audio.currentTime,
                paused: p.audio.paused,
                timestamp: Date.now()
              };
              window.__audioEvents.push(info);
              console.log(`[AUDIO EVENT] ${theme} -> ${evt} | src: ${info.src} | paused: ${info.paused}`);
            });
          });
        }
      });
    });

    // Make sure Song 1 is playing
    await page.evaluate(() => {
      window.__audioController.play('main');
    });
    await new Promise(r => setTimeout(r, 1000));

    const playingState = await page.evaluate(() => {
      const p = window.__audioController.players.main;
      return {
        currentIndex: p.currentIndex,
        src: p.audio?.src,
        paused: p.audio?.paused,
        isPlaying: p.isPlaying
      };
    });
    console.log('Playing State before Pause:', playingState);

    // Now click the Play/Pause button on the music player
    console.log('\n--- Step 2: Clicking Play/Pause button to pause Song 1 ---');
    const playPauseBtn = await page.$('.music-ctrl-btn.music-play-btn');
    if (playPauseBtn) {
      await playPauseBtn.click();
    } else {
      console.log('Could not find .music-ctrl-btn.music-play-btn!');
    }

    console.log('Waiting 3 seconds after pause...');
    await new Promise(r => setTimeout(r, 3000));

    const stateAfterPause = await page.evaluate(() => {
      const ctrl = window.__audioController;
      return {
        main: {
          currentIndex: ctrl.players.main.currentIndex,
          src: ctrl.players.main.audio?.src,
          paused: ctrl.players.main.audio?.paused,
          isPlaying: ctrl.players.main.isPlaying
        },
        allEvents: window.__audioEvents
      };
    });
    console.log('State after Pause:', JSON.stringify(stateAfterPause, null, 2));

  } catch (err) {
    console.error('Error during reproduction:', err);
  } finally {
    await browser.close();
  }
})();
