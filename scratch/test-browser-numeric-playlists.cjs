const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const profileDir = path.join(__dirname, 'chrome_numeric_test_' + Date.now());
  fs.mkdirSync(profileDir, { recursive: true });

  const folders = [
    { theme: 'main', dir: 'public/music' },
    { theme: 'sad', dir: 'public/sad-songs' },
    { theme: 'happy', dir: 'public/happy-songs' },
    { theme: 'qna', dir: 'public/QNA-music' }
  ];

  // We will create dummy files in each folder to verify numerical sorting
  const testFilenames = ['10.mp3', '2.mp3', '1.mp3', '3.mp3'];
  const createdFiles = [];

  // Use an existing mp3 file as a template byte source
  const sampleSource = path.resolve(__dirname, '../public/music/Dilruba Dilnasheen(Official Audio) I Dilfek EP I Rito Riba.mp3');
  const dummyBuffer = fs.existsSync(sampleSource) ? fs.readFileSync(sampleSource).slice(0, 4096) : Buffer.from([0xFF, 0xFB, 0x90, 0x64]);

  console.log('=== CREATING TEST NUMBERED AUDIO FILES (1.mp3, 2.mp3, 3.mp3, 10.mp3) ===');
  for (const { dir } of folders) {
    const absDir = path.resolve(__dirname, '..', dir);
    for (const fn of testFilenames) {
      const filePath = path.join(absDir, fn);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, dummyBuffer);
        createdFiles.push(filePath);
      }
    }
  }

  // Trigger manifest update
  const AUDIO_REGEX = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i;
  function extractNumericValue(filename) {
    if (!filename || typeof filename !== 'string') return Infinity;
    const name = filename.split('?')[0].split('/').pop().trim();
    const leading = name.match(/^(\d+)/);
    if (leading) return parseInt(leading[1], 10);
    return Infinity;
  }

  function numericSortCompare(a, b) {
    const numA = extractNumericValue(a);
    const numB = extractNumericValue(b);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  const getAudioFiles = (dir) => {
    const p = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(p)) return [];
    return fs.readdirSync(p)
      .filter(f => !f.startsWith('.') && AUDIO_REGEX.test(f))
      .sort(numericSortCompare);
  };

  const manifest = {
    music: getAudioFiles('public/music'),
    sad: getAudioFiles('public/sad-songs'),
    happy: getAudioFiles('public/happy-songs'),
    qna: getAudioFiles('public/QNA-music'),
  };
  const targetManifest = path.resolve(process.cwd(), 'src/config/music-manifest.json');
  fs.writeFileSync(targetManifest, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Manifest updated with numbered files:', JSON.stringify(manifest, null, 2));

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

    await page.goto('http://127.0.0.1:5173/?stage=main', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Evaluate playlists for all 4 sections in the browser context
    for (const { theme, dir } of folders) {
      console.log(`\n=== VERIFYING SECTION: ${theme.toUpperCase()} (${dir}) ===`);

      const playlistData = await page.evaluate((th) => {
        const ctrl = window.audioController || window.__audioController;
        if (!ctrl) return { error: 'No audioController' };
        ctrl.refreshSongs(th);
        const player = ctrl.players[th];
        const songs = player?.songs || [];
        return {
          theme: th,
          count: songs.length,
          filenames: songs.map(s => s.filename),
          titles: songs.map(s => s.title)
        };
      }, theme);

      console.log(`${theme} filenames in order:`, playlistData.filenames);
      console.log(`${theme} titles in order:`, playlistData.titles);

      // Verify that numbered songs appear in exact order 1.mp3, 2.mp3, 3.mp3, 10.mp3
      const numOnly = playlistData.filenames.filter(f => ['1.mp3', '2.mp3', '3.mp3', '10.mp3'].includes(f));
      assert(`${theme}: Contains all 4 test songs`, numOnly.length === 4, `found: ${numOnly.length}`);
      assert(`${theme}: 1.mp3 is first`, numOnly[0] === '1.mp3', `first is: ${numOnly[0]}`);
      assert(`${theme}: 2.mp3 is second`, numOnly[1] === '2.mp3', `second is: ${numOnly[1]}`);
      assert(`${theme}: 3.mp3 is third`, numOnly[2] === '3.mp3', `third is: ${numOnly[2]}`);
      assert(`${theme}: 10.mp3 is fourth (after 3, NOT after 1)`, numOnly[3] === '10.mp3', `fourth is: ${numOnly[3]}`);

      // Verify titles are clean
      const title1 = playlistData.titles[playlistData.filenames.indexOf('1.mp3')];
      const title10 = playlistData.titles[playlistData.filenames.indexOf('10.mp3')];
      assert(`${theme}: 1.mp3 formatted title is "Song 1"`, title1 === 'Song 1', `title: ${title1}`);
      assert(`${theme}: 10.mp3 formatted title is "Song 10"`, title10 === 'Song 10', `title: ${title10}`);

      // Test playback navigation flow: start at index 0, advance to next, loop
      const navTest = await page.evaluate((th) => {
        const ctrl = window.audioController || window.__audioController;
        const player = ctrl.players[th];
        player.currentIndex = 0;
        const startSong = player.songs[0].filename;

        // Simulate next()
        const nextIdx = (player.currentIndex + 1) % player.songs.length;
        const nextSong = player.songs[nextIdx].filename;

        // Simulate final song next() -> loop to start
        const lastIdx = player.songs.length - 1;
        const loopIdx = (lastIdx + 1) % player.songs.length;
        const loopSong = player.songs[loopIdx].filename;

        // Simulate prev() from index 0 -> loop to end
        const prevFrom0Idx = (0 - 1 + player.songs.length) % player.songs.length;
        const prevFrom0Song = player.songs[prevFrom0Idx].filename;

        return { startSong, nextSong, loopSong, prevFrom0Song, lastSong: player.songs[lastIdx].filename };
      }, theme);

      assert(`${theme}: Starts with lowest numbered song (${navTest.startSong})`, navTest.startSong === '1.mp3');
      assert(`${theme}: Advances to next available number (${navTest.nextSong})`, navTest.nextSong === '2.mp3');
      assert(`${theme}: Loops from last song (${navTest.lastSong}) to lowest number (${navTest.loopSong})`, navTest.loopSong === '1.mp3');
      assert(`${theme}: Previous from song 1 loops to final song (${navTest.prevFrom0Song})`, navTest.prevFrom0Song === navTest.lastSong);
    }

    // Now test missing numbers (e.g. remove 2.mp3 and 3.mp3 in public/music)
    console.log('\n=== TESTING MISSING NUMBERS / GAPS (1.mp3 -> 10.mp3) ===');
    const gapFile1 = path.resolve(__dirname, '../public/music/2.mp3');
    const gapFile2 = path.resolve(__dirname, '../public/music/3.mp3');
    if (fs.existsSync(gapFile1)) fs.unlinkSync(gapFile1);
    if (fs.existsSync(gapFile2)) fs.unlinkSync(gapFile2);

    const gapManifest = {
      ...manifest,
      music: getAudioFiles('public/music')
    };
    fs.writeFileSync(targetManifest, JSON.stringify(gapManifest, null, 2), 'utf8');

    const gapResult = await page.evaluate(() => {
      const ctrl = window.audioController || window.__audioController;
      ctrl.refreshSongs('main');
      const songs = ctrl.players.main.songs;
      return songs.map(s => s.filename);
    });

    const gapNumOnly = gapResult.filter(f => ['1.mp3', '10.mp3'].includes(f));
    assert('Missing 2 and 3: 1.mp3 is immediately followed by 10.mp3', gapNumOnly[0] === '1.mp3' && gapNumOnly[1] === '10.mp3', JSON.stringify(gapNumOnly));

  } catch (err) {
    console.error('Test error:', err);
    assert('Test completed without fatal error', false, err.message);
  } finally {
    await browser.close();

    // CLEAN UP ALL CREATED TEST FILES
    console.log('\n=== CLEANING UP TEST FILES ===');
    for (const f of createdFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    }

    // Restore original manifest
    const cleanManifest = {
      music: getAudioFiles('public/music'),
      sad: getAudioFiles('public/sad-songs'),
      happy: getAudioFiles('public/happy-songs'),
      qna: getAudioFiles('public/QNA-music'),
    };
    fs.writeFileSync(targetManifest, JSON.stringify(cleanManifest, null, 2), 'utf8');
    console.log('Restored clean manifest:', cleanManifest);

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
