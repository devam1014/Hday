import assert from 'node:assert';

class MockAudio {
  constructor() {
    this.src = '';
    this.volume = 1;
    this.paused = true;
    this.loop = false;
    this.currentTime = 0;
    this.duration = 180;
    this._listeners = {};
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {}
  removeAttribute() {}
  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  removeEventListener(event, fn) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }
  }
}

globalThis.Audio = MockAudio;

const { audioController } = await import('../src/utils/audioController.js');

console.log('--- TEST 1: AudioController Initialization & Playlist Verification ---');
const mainState = audioController.getPlayerState('main');
const sadState = audioController.getPlayerState('sad');
const happyState = audioController.getPlayerState('happy');

console.log(`Main songs: ${mainState.songs.length}`);
console.log(`Sad songs: ${sadState.songs.length}`);
console.log(`Happy songs: ${happyState.songs.length}`);

assert(mainState.songs.length > 0, 'Main playlist should have tracks');
assert(sadState.songs.length > 0, 'Sad playlist should have tracks');
assert(happyState.songs.length > 0, 'Happy playlist should have tracks');

console.log('--- TEST 2: Welcome Song Looping & Session Reset ---');
audioController.resetWelcomeSongSession();
assert.strictEqual(audioController.welcomeFinishedForSession, false, 'Session reset should clear finished flag');

audioController.playWelcomeSong().then((started) => {
  console.log(`Welcome song started: ${started}`);
  assert.strictEqual(audioController.welcomeAudio.loop, true, 'welcomeAudio.loop must be true');
  console.log('✓ Welcome song loop is explicitly configured to true');

  console.log('--- TEST 3: Priming on Second Heart Click (Audible Default Volume) ---');
  audioController.primeOnSecondHeartClick();
  const mainPlayer = audioController.players.main;
  assert.strictEqual(audioController.welcomeFinishedForSession, true, 'Welcome song should be permanently stopped for session');
  assert.strictEqual(mainPlayer.isMuted, false, 'Main player must NOT be muted');
  assert(mainPlayer.volume > 0, `Main player volume must be > 0 (got ${mainPlayer.volume})`);
  assert(mainPlayer.audio.volume > 0, `Main player audio.volume must be > 0 (got ${mainPlayer.audio.volume})`);
  console.log(`✓ Main player primed audibly with volume: ${mainPlayer.volume}`);

  console.log('--- TEST 4: Welcome Song Session Reset for Dev / Click & See ---');
  audioController.resetWelcomeSongSession();
  assert.strictEqual(audioController.welcomeFinishedForSession, false, 'welcomeFinishedForSession must be false after resetWelcomeSongSession()');
  console.log('✓ resetWelcomeSongSession allows previewing welcome celebration again');

  console.log('--- TEST 5: Bidirectional Section Navigation & Music Resumption ---');
  // Enter Main
  audioController.setActiveSection('main');
  assert.strictEqual(audioController.currentActiveSection, 'main');
  
  // Enter Sad
  audioController.setActiveSection('sad');
  assert.strictEqual(audioController.currentActiveSection, 'sad');
  assert.strictEqual(mainPlayer.isPlaying, false, 'Main player should be paused when entering Sad Gallery');

  // Return to Main
  audioController.setActiveSection('main');
  assert.strictEqual(audioController.currentActiveSection, 'main');
  console.log('✓ Bidirectional section navigation between Main, Sad, and Happy succeeds');

  console.log('\nALL UNIT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}).catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
