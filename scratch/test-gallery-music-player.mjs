/**
 * Direct Unit & Integration Tests for GalleryMusicPlayer & Audio Sync
 */
import assert from 'node:assert';
import fs from 'node:fs';

console.log('======================================================');
console.log('GALLERY MUSIC PLAYER & AUDIO SYNC TEST');
console.log('======================================================\n');

// 1. Check music-manifest.json
const manifest = JSON.parse(fs.readFileSync('src/config/music-manifest.json', 'utf8'));
console.log('Detected files in manifest:');
console.log('- Music:', manifest.music);
console.log('- Sad:', manifest.sad);
console.log('- Happy:', manifest.happy);

assert(Array.isArray(manifest.sad) && manifest.sad.length > 0, 'Sad songs must be in manifest');
assert(Array.isArray(manifest.happy) && manifest.happy.length > 0, 'Happy songs must be in manifest');
assert(manifest.sad[0].includes('PHIR KABHI'), 'Sad song must match Phir Kabhi');
assert(manifest.happy[0].includes('happy-song1'), 'Happy song must match happy-song1');
console.log('✓ Manifest files verified.\n');

// 2. Mock Audio Environment
class MockAudioElement {
  constructor() {
    this.src = '';
    this.currentTime = 0;
    this.duration = 180;
    this.paused = true;
    this.ended = false;
    this.readyState = 4;
    this.listeners = {};
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(l => l !== fn);
  }

  emit(type) {
    (this.listeners[type] || []).forEach(fn => fn({ type }));
  }

  play() {
    this.paused = false;
    this.ended = false;
    this.emit('play');
    this.emit('playing');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit('pause');
  }

  load() {
    this.emit('loadedmetadata');
  }
}

global.Audio = MockAudioElement;
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: { origin: 'http://localhost:5173' }
};

// 3. Test AudioController synchronization
const { AudioController } = await import('../src/utils/audioController.js');
const controller = new AudioController();

const sadAudio = controller.getAudio('sad');
const happyAudio = controller.getAudio('happy');

assert(sadAudio !== null, 'Sad Audio instance must exist');
assert(happyAudio !== null, 'Happy Audio instance must exist');

// Verify initial state
let sadState = controller.getPlayerState('sad');
assert.strictEqual(sadState.songs.length, 1, 'Sad gallery must have 1 song detected (never 0)');
assert.strictEqual(sadState.currentTrack.name, 'PHIR KABHI (Reprise) M.S. DHONI Arijit Singh Sushant Singh, Disha Patani', 'Current track name must match');
assert.strictEqual(sadState.isPlaying, false, 'Initially paused');
console.log('✓ Sad gallery initial state verified (1 song detected, correct title, initially paused).');

let happyState = controller.getPlayerState('happy');
assert.strictEqual(happyState.songs.length, 1, 'Happy gallery must have 1 song detected (never 0)');
assert.strictEqual(happyState.currentTrack.name, 'Happy Song 1', 'Happy track name must match');
assert.strictEqual(happyState.isPlaying, false, 'Initially paused');
console.log('✓ Happy gallery initial state verified (1 song detected, correct title, initially paused).\n');

// 4. Test Play/Pause event synchronization
console.log('--- Testing Play / Pause event synchronization ---');
sadAudio.play();
sadState = controller.getPlayerState('sad');
assert.strictEqual(sadState.isPlaying, true, 'isPlaying must be true when audio is playing');
console.log('✓ On audio.play() / playing event: isPlaying is TRUE');

sadAudio.pause();
sadState = controller.getPlayerState('sad');
assert.strictEqual(sadState.isPlaying, false, 'isPlaying must be false when audio is paused');
console.log('✓ On audio.pause() event: isPlaying is FALSE');

// 5. Test Section switching
console.log('\n--- Testing Section Switching synchronization ---');
// Switch to Sad
controller.setActiveSection('sad');
assert.strictEqual(controller.getPlayerState('sad').isPlaying, true, 'Sad must start playing');
assert.strictEqual(controller.getPlayerState('happy').isPlaying, false, 'Happy must be paused');

// Switch to Happy
controller.setActiveSection('happy');
assert.strictEqual(controller.getPlayerState('sad').isPlaying, false, 'Sad must pause when leaving');
assert.strictEqual(controller.getPlayerState('happy').isPlaying, true, 'Happy must start playing');

// Return to Sad
controller.setActiveSection('sad');
assert.strictEqual(controller.getPlayerState('sad').isPlaying, true, 'Sad must resume');
assert.strictEqual(controller.getPlayerState('happy').isPlaying, false, 'Happy must pause');
console.log('✓ Bidirectional switching perfectly synchronized.');

console.log('\n======================================================');
console.log('ALL GALLERY MUSIC PLAYER TESTS PASSED 100%!');
console.log('======================================================');
