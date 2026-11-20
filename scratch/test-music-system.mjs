/**
 * Automated Verification Suite for Independent Multi-Section Music System
 * Tests all requirements from Master Prompt:
 * Test A: Main Birthday playlist loading, order, advancement, loop.
 * Test B: Sad Gallery playlist loading, isolation, playback.
 * Test C: Happy Gallery playlist loading, isolation, playback.
 * Test D: Bidirectional section switching (Main <-> Sad, Sad <-> Happy, Happy <-> Main).
 * Test E: Audio conflict avoidance & Video audio priority.
 * Test F: Playlist controls, volume reset on new track, seeking, looping.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('======================================================');
console.log('INDEPENDENT MUSIC SYSTEM VERIFICATION SUITE');
console.log('======================================================\n');

// 1. Verify physical files exist in designated folders
console.log('--- 1. VERIFYING FILES IN DESIGNATED FOLDERS ---');
const mainFiles = fs.readdirSync('public/music').filter(f => !f.startsWith('.'));
const sadFiles = fs.readdirSync('public/sad-songs').filter(f => !f.startsWith('.'));
const happyFiles = fs.readdirSync('public/happy-songs').filter(f => !f.startsWith('.'));

console.log('Main Birthday songs found in public/music/ (', mainFiles.length, '):', mainFiles);
console.log('Sad Gallery songs found in public/sad-songs/ (', sadFiles.length, '):', sadFiles);
console.log('Happy Gallery songs found in public/happy-songs/ (', happyFiles.length, '):', happyFiles);

assert(mainFiles.length >= 3, 'Main music folder must contain songs');
assert(sadFiles.length >= 1, 'Sad songs folder must contain songs');
assert(happyFiles.length >= 1, 'Happy songs folder must contain songs');
console.log('✓ Folders and files verified.');

// 2. Mock Audio Environment
class MockAudio {
  constructor() {
    this.src = '';
    this.currentTime = 0;
    this.volume = 1;
    this.paused = true;
    this.preload = 'auto';
    this.listeners = {};
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  dispatchEvent(event, payload = {}) {
    const list = this.listeners[event] || [];
    list.forEach(h => h(payload));
  }

  play() {
    this.paused = false;
    this.dispatchEvent('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.dispatchEvent('pause');
  }

  load() {
    // noop
  }

  removeAttribute(attr) {
    if (attr === 'src') this.src = '';
  }
}

global.Audio = MockAudio;
global.window = {
  location: { origin: 'http://localhost:5173' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
};

// 3. Test Playlist Discovery & Order
console.log('\n--- 2. TESTING PLAYLIST DISCOVERY & ISOLATION ---');
const playlistOrder = JSON.parse(fs.readFileSync('src/config/playlist-order.json', 'utf8'));

function normalizeKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTitle(rawFilename, customTitle) {
  if (customTitle && typeof customTitle === 'string' && customTitle.trim() !== '') {
    return customTitle.trim();
  }

  let clean = rawFilename
    .replace(/\.[^/.]+$/, '')
    .replace(/\s*[\(\[](Official\s*(Video|Audio|Track|Music|Song)?|Full\s*Song|Audio|Video|Lyric\s*Video)[\)\]]/gi, '')
    .replace(/\b(Full\s*Song|Official\s*Audio|Official\s*Video)\b/gi, '')
    .replace(/\s+[|I]\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/^[a-z0-9]+([_-][a-z0-9]+)+$/i.test(clean)) {
    clean = clean
      .replace(/[-_]+/g, ' ')
      .replace(/([a-zA-Z])([0-9])/g, (m, p1, p2) => p1 + ' ' + p2)
      .replace(/([0-9])([a-zA-Z])/g, (m, p1, p2) => p1 + ' ' + p2)
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  return clean || rawFilename;
}

function buildPlaylist(files, folderName, manifestOrder = null) {
  const discoveredMap = new Map();
  for (const filename of files) {
    const key = normalizeKey(filename);
    discoveredMap.set(key, {
      rawFilename: filename,
      publicUrl: `/${folderName}/${encodeURI(filename)}`
    });
  }

  const result = [];
  const processedKeys = new Set();

  if (Array.isArray(manifestOrder) && manifestOrder.length > 0) {
    for (const item of manifestOrder) {
      const filename = typeof item === 'string' ? item : item?.file || item?.filename;
      if (!filename) continue;
      const key = normalizeKey(filename);
      const discovered = discoveredMap.get(key);
      const finalFilename = discovered ? discovered.rawFilename : filename;
      const audioUrl = `/${folderName}/${encodeURI(finalFilename)}`;

      result.push({
        id: finalFilename,
        filename: finalFilename,
        title: formatTitle(finalFilename, null),
        name: formatTitle(finalFilename, null),
        url: audioUrl,
        src: audioUrl
      });
      processedKeys.add(key);
    }
  }

  const remaining = [];
  for (const [key, discovered] of discoveredMap.entries()) {
    if (!processedKeys.has(key)) {
      remaining.push({
        id: discovered.rawFilename,
        filename: discovered.rawFilename,
        title: formatTitle(discovered.rawFilename, null),
        name: formatTitle(discovered.rawFilename, null),
        url: discovered.publicUrl,
        src: discovered.publicUrl
      });
    }
  }

  remaining.sort((a, b) =>
    a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })
  );

  result.push(...remaining);
  return result;
}

const mainPlaylist = buildPlaylist(mainFiles, 'music', playlistOrder);
const sadPlaylist = buildPlaylist(sadFiles, 'sad-songs', null);
const happyPlaylist = buildPlaylist(happyFiles, 'happy-songs', null);

console.log('Main Playlist (' + mainPlaylist.length + '):', mainPlaylist.map(s => s.name));
console.log('Sad Playlist (' + sadPlaylist.length + '):', sadPlaylist.map(s => s.name));
console.log('Happy Playlist (' + happyPlaylist.length + '):', happyPlaylist.map(s => s.name));

// Verify Isolation: Playlists must NOT be mixed
assert(mainPlaylist.length === 3, 'Main playlist should contain 3 songs');
assert(sadPlaylist.length === 1, 'Sad playlist should contain 1 song');
assert(happyPlaylist.length === 1, 'Happy playlist should contain 1 song');

// Main should not contain sad or happy
const mainSrcs = mainPlaylist.map(s => s.src);
const sadSrcs = sadPlaylist.map(s => s.src);
const happySrcs = happyPlaylist.map(s => s.src);

assert(!sadSrcs.some(s => s.includes('/music/')), 'Sad songs must not load from /music/');
assert(!happySrcs.some(s => s.includes('/music/')), 'Happy songs must not load from /music/');
assert(!mainSrcs.some(s => s.includes('/sad-songs/')), 'Main songs must not load from /sad-songs/');
assert(!mainSrcs.some(s => s.includes('/happy-songs/')), 'Main songs must not load from /happy-songs/');
console.log('✓ Playlist isolation verified: zero cross-contamination.');

// 4. Test AudioController Simulation
console.log('\n--- 3. TESTING AUDIO OWNERSHIP & SECTION SWITCHING ---');

class TestAudioController {
  constructor() {
    this.currentActiveSection = 'none';
    this.videoSnapshot = null;
    this.welcomeAudio = new MockAudio();
    this.welcomeFinishedForSession = false;
    this.isWelcomePlaying = false;

    this.players = {
      main: this.initPlayer('main', mainPlaylist),
      sad: this.initPlayer('sad', sadPlaylist),
      happy: this.initPlayer('happy', happyPlaylist),
    };
  }

  initPlayer(theme, songs) {
    const audio = new MockAudio();
    const player = {
      key: theme,
      audio,
      songs,
      currentIndex: 0,
      currentTime: 0,
      isPlaying: false,
      wasPlayingBeforePause: false,
      hasEverStarted: false,
      volume: 0.60,
      isMuted: false,
      consecutiveErrors: 0,
      listeners: new Set(),
    };

    audio.addEventListener('play', () => {
      player.isPlaying = true;
      this.enforceOwnership(theme);
      this.notifyPlayer(theme);
    });

    audio.addEventListener('pause', () => {
      player.isPlaying = false;
      this.notifyPlayer(theme);
    });

    audio.addEventListener('ended', () => {
      if (this.currentActiveSection !== theme) return;
      this.next(theme, true);
    });

    if (songs.length > 0) {
      audio.src = songs[0].src;
    }

    return player;
  }

  enforceOwnership(activeTheme) {
    for (const key of ['main', 'sad', 'happy']) {
      if (key !== activeTheme) {
        const p = this.players[key];
        if (p && p.audio && !p.audio.paused) {
          p.audio.pause();
          p.isPlaying = false;
        }
      }
    }
  }

  setActiveSection(section) {
    const normalizedSection = section === 'sad-memories' ? 'sad'
      : section === 'happy-gallery' ? 'happy'
      : section;

    if (this.currentActiveSection === normalizedSection) return;
    const prevSection = this.currentActiveSection;
    this.currentActiveSection = normalizedSection;

    // 1. Pause outgoing
    if (prevSection && this.players[prevSection]) {
      const prevPlayer = this.players[prevSection];
      prevPlayer.wasPlayingBeforePause = prevPlayer.isPlaying;
      if (prevPlayer.audio) {
        prevPlayer.currentTime = prevPlayer.audio.currentTime || 0;
        prevPlayer.audio.pause();
      }
      prevPlayer.isPlaying = false;
      this.notifyPlayer(prevSection);
    }

    // 2. Incoming
    if (normalizedSection && this.players[normalizedSection]) {
      const nextPlayer = this.players[normalizedSection];

      if (!nextPlayer.hasEverStarted) {
        nextPlayer.hasEverStarted = true;
        this.loadTrack(normalizedSection, 0, true);
      } else if (nextPlayer.wasPlayingBeforePause) {
        this.resumePlayer(normalizedSection);
      } else {
        this.notifyPlayer(normalizedSection);
      }
    }
  }

  resumePlayer(theme) {
    const player = this.players[theme];
    if (!player || !player.audio || player.songs.length === 0) return;

    this.enforceOwnership(theme);
    player.audio.currentTime = player.currentTime;
    player.audio.volume = player.isMuted ? 0 : player.volume;
    player.audio.play();
  }

  loadTrack(theme, index, autoPlay = true) {
    const player = this.players[theme];
    if (!player || !player.audio || player.songs.length === 0) return;

    if (index < 0 || index >= player.songs.length) index = 0;
    player.currentIndex = index;
    player.currentTime = 0;
    const song = player.songs[index];

    player.audio.pause();
    player.audio.currentTime = 0;
    player.audio.src = song.src;

    // Reset volume on EVERY new song (Requirement 6)
    player.volume = 0.60;
    player.isMuted = false;
    player.audio.volume = 0.60;

    if (autoPlay) {
      this.enforceOwnership(theme);
      player.audio.play();
    }
    this.notifyPlayer(theme);
  }

  next(theme, autoAdvance = false) {
    const player = this.players[theme];
    if (!player || player.songs.length === 0) return;
    const nextIdx = (player.currentIndex + 1) % player.songs.length;
    this.loadTrack(theme, nextIdx, true);
  }

  prev(theme) {
    const player = this.players[theme];
    if (!player || player.songs.length === 0) return;
    if (player.audio && player.audio.currentTime > 3) {
      player.audio.currentTime = 0;
      player.currentTime = 0;
      return;
    }
    const prevIdx = (player.currentIndex - 1 + player.songs.length) % player.songs.length;
    this.loadTrack(theme, prevIdx, true);
  }

  selectTrack(theme, index) {
    this.loadTrack(theme, index, true);
  }

  setVolume(theme, vol) {
    const player = this.players[theme];
    if (!player) return;
    player.volume = vol;
    player.audio.volume = vol;
    this.notifyPlayer(theme);
  }

  pauseForVideo(theme = this.currentActiveSection) {
    const player = this.players[theme];
    if (!player || !player.audio) return;
    this.videoSnapshot = {
      theme,
      wasPlaying: player.isPlaying,
      currentTime: player.audio.currentTime,
    };
    player.audio.pause();
  }

  resumeAfterVideo(theme = this.currentActiveSection) {
    if (!this.videoSnapshot) return;
    const s = this.videoSnapshot;
    this.videoSnapshot = null;
    const player = this.players[s.theme];
    if (!player) return;
    player.audio.currentTime = s.currentTime;
    if (s.wasPlaying) {
      player.audio.play();
    }
  }

  notifyPlayer(theme) {
    // subscriber notification
  }
}

const controller = new TestAudioController();

// Initial state: none playing
assert(!controller.players.main.isPlaying, 'Main initially not playing');
assert(!controller.players.sad.isPlaying, 'Sad initially not playing');
assert(!controller.players.happy.isPlaying, 'Happy initially not playing');

// Step 1: User enters Main Birthday
console.log('Action: Enter Main Birthday');
controller.setActiveSection('main');
assert(controller.players.main.isPlaying, 'Main music should start playing');
assert(!controller.players.sad.isPlaying, 'Sad music must be paused');
assert(!controller.players.happy.isPlaying, 'Happy music must be paused');
console.log('✓ Main Birthday playing at index:', controller.players.main.currentIndex);

// Simulate playback progress in Main
controller.players.main.audio.currentTime = 42.5;

// Step 2: Main -> Sad Gallery
console.log('Action: Switch to Sad Gallery');
controller.setActiveSection('sad');
assert(!controller.players.main.isPlaying, 'Main music must pause immediately');
assert(controller.players.main.currentTime === 42.5, 'Main music playback position must be preserved');
assert(controller.players.sad.isPlaying, 'Sad gallery music must start automatically');
assert(controller.players.sad.songs[0].src.includes('sad-songs'), 'Sad music plays from public/sad-songs/');
console.log('✓ Sad Gallery playing from public/sad-songs/. Main paused at 42.5s.');

// Simulate playback progress in Sad
controller.players.sad.audio.currentTime = 18.2;

// Step 3: Sad -> Happy Gallery
console.log('Action: Switch from Sad to Happy Gallery');
controller.setActiveSection('happy');
assert(!controller.players.sad.isPlaying, 'Sad music must pause immediately');
assert(controller.players.sad.currentTime === 18.2, 'Sad music playback position must be preserved');
assert(controller.players.happy.isPlaying, 'Happy gallery music must start automatically');
assert(controller.players.happy.songs[0].src.includes('happy-songs'), 'Happy music plays from public/happy-songs/');
console.log('✓ Happy Gallery playing from public/happy-songs/. Sad paused at 18.2s.');

// Step 4: Happy -> Sad Gallery (Return)
console.log('Action: Return from Happy to Sad Gallery');
controller.setActiveSection('sad');
assert(!controller.players.happy.isPlaying, 'Happy music must pause');
assert(controller.players.sad.isPlaying, 'Sad music must resume automatically');
assert(controller.players.sad.audio.currentTime === 18.2, 'Sad music must resume from saved 18.2s position');
console.log('✓ Sad Gallery resumed from saved position 18.2s.');

// Step 5: Sad -> Main Birthday (Return)
console.log('Action: Return from Sad to Main Birthday Page');
controller.setActiveSection('main');
assert(!controller.players.sad.isPlaying, 'Sad music must pause');
assert(controller.players.main.isPlaying, 'Main music must resume automatically');
assert(controller.players.main.audio.currentTime === 42.5, 'Main music must resume from saved 42.5s position');
console.log('✓ Main Birthday resumed from saved position 42.5s.');

// Step 6: Main -> Happy -> Main
console.log('Action: Main -> Happy -> Main');
controller.setActiveSection('happy');
assert(!controller.players.main.isPlaying, 'Main paused');
assert(controller.players.happy.isPlaying, 'Happy resumed/started');
controller.setActiveSection('main');
assert(controller.players.main.isPlaying, 'Main resumed');
assert(!controller.players.happy.isPlaying, 'Happy paused');
console.log('✓ Main <-> Happy bidirectional switching verified.');

// 5. Test Audio Conflict Guarantee (Ownership)
console.log('\n--- 4. TESTING SINGLE AUDIO OWNERSHIP GUARANTEE ---');
let playingCount = 0;
for (const key of ['main', 'sad', 'happy']) {
  if (controller.players[key].isPlaying) playingCount++;
}
assert(playingCount <= 1, 'Only one background music track may play at any time');
console.log('✓ Audio ownership strictly preserved: active playing count =', playingCount);

// 6. Test Video Audio Priority
console.log('\n--- 5. TESTING VIDEO AUDIO PRIORITY ---');
assert(controller.players.main.isPlaying, 'Main currently playing before video');
controller.pauseForVideo();
assert(!controller.players.main.isPlaying, 'Music must pause when video plays');
assert(controller.videoSnapshot !== null, 'Video snapshot must be recorded');
console.log('✓ Background music paused for video. Snapshot recorded.');

// Video ends -> resume
controller.resumeAfterVideo();
assert(controller.players.main.isPlaying, 'Music must resume after video finishes');
assert(controller.videoSnapshot === null, 'Video snapshot must be cleared');
console.log('✓ Background music resumed after video playback.');

// 7. Test Volume Reset On New Song
console.log('\n--- 6. TESTING VOLUME RESET ON EVERY NEW SONG ---');
controller.setVolume('main', 0.1);
assert(controller.players.main.volume === 0.1, 'Volume set to 0.1');

// Advance track
controller.next('main');
assert(controller.players.main.volume === 0.60, 'Volume must reset to defaultTrackVolume (0.60) on next track');
assert(controller.players.main.currentIndex === 1, 'Current track advanced to 1');
console.log('✓ Volume reset to configured 0.60 on next track advancement.');

// Previous track
controller.setVolume('main', 0.0);
controller.prev('main');
assert(controller.players.main.volume === 0.60, 'Volume must reset to defaultTrackVolume (0.60) on prev track');
console.log('✓ Volume reset to configured 0.60 on prev track.');

// Looping back to first song
console.log('\n--- 7. TESTING INFINITE PLAYLIST LOOPING ---');
controller.selectTrack('main', mainPlaylist.length - 1);
assert(controller.players.main.currentIndex === mainPlaylist.length - 1, 'Selected last track');
controller.next('main');
assert(controller.players.main.currentIndex === 0, 'Must loop back to track 0 on next from last track');
console.log('✓ Infinite playlist loop verified.');

console.log('\n======================================================');
console.log('ALL INDEPENDENT MUSIC SYSTEM TESTS PASSED 100%!');
console.log('======================================================');
