import {
  getMusicPlaylist,
  getSadMusicPlaylist,
  getHappyMusicPlaylist,
  getPlaylistForTheme
} from '../data/musicPlaylist.js';
import { BIRTHDAY_CONFIG } from '../config.js';

/**
 * Coordinated Multi-Section Audio Controller
 * Manages independent playlists and strict audio ownership across:
 * 1. Main Birthday Page ('main') -> public/music/
 * 2. Sad Gallery ('sad') -> public/sad-songs/
 * 3. Happy Gallery ('happy') -> public/happy-songs/
 * 4. Fireworks Celebration -> public/audio/welcome.mp3
 * 
 * Key guarantees:
 * - Three strictly independent playlists and Audio instances.
 * - Single Audio Ownership: Never allows two background tracks to play simultaneously.
 * - Automatic music switching when changing sections (pauses outgoing, resumes/starts incoming).
 * - Preserves track index, playback position, and playing state across navigation.
 * - Automatic playback upon first entry to any gallery (safely catching browser autoplay restrictions).
 * - Audio element events (play, playing, pause, ended, error, loadedmetadata) serve as source of truth.
 * - Resets volume to configured defaultTrackVolume on EVERY new track (auto, next, prev, pick, loop).
 * - Video audio priority: pauses active music when video plays, resumes when video pauses/stops.
 */

export class AudioController {
  constructor() {
    this.currentActiveSection = 'none';
    this.videoSnapshot = null;
    this.isDestroyed = false;

    // Playback generation tokens to protect against async race conditions
    this.playbackTokens = {
      main: 0,
      sad: 0,
      happy: 0,
      qna: 0,
      fireworks: 0,
    };

    // Welcome song (welcome.mp3) for fireworks celebration
    this.welcomeAudio = null;
    this.welcomeFinishedForSession = false;
    this.isWelcomePlaying = false;

    // Web Audio AudioContext & user gesture retry management
    this.audioCtx = null;
    this.pendingAutoplayTheme = null;
    this.pendingWelcomeSong = false;
    this.hasSetupRetryListener = false;

    // Initialize the independent section players
    this.players = {
      main: this.initPlayer('main'),
      sad: this.initPlayer('sad'),
      happy: this.initPlayer('happy'),
      qna: this.initPlayer('qna'),
    };

    // Listen to video state changes from gallery video players
    if (typeof window !== 'undefined') {
      this.setupUserGestureRetryListener();

      window.__allActiveAudioElements = window.__allActiveAudioElements || new Set();

      window.addEventListener('gallery-video-state-change', (e) => {
        const isPlaying = Boolean(e.detail && e.detail.isPlaying);
        if (isPlaying) {
          this.pauseForVideo();
        } else {
          this.resumeAfterVideo();
        }
      });

      // Backward-compatible exclusive play broadcast listener
      window.addEventListener('gallery-music-exclusive-play', (e) => {
        const activeTheme = e.detail?.activeTheme;
        if (activeTheme && this.players[activeTheme]) {
          this.enforceOwnership(activeTheme);
        }
      });

      window.__audioController = this;
      window.__globalAudioController = this;
    }
  }

  // ---------------------------------------------------------------------------
  // Player Initialization
  // ---------------------------------------------------------------------------
  initPlayer(theme) {
    const defaultVol = this.getDefaultVolume(theme);
    const songs = getPlaylistForTheme(theme);
    const audio = typeof Audio !== 'undefined' ? new Audio() : null;

    const player = {
      key: theme,
      audio,
      songs,
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isPlayPending: false,
      wasPlayingBeforePause: false,
      hasEverStarted: false,
      userExplicitlyPaused: false,
      volume: defaultVol,
      isMuted: false,
      consecutiveErrors: 0,
      autoAdvanceTimeout: null,
      errorTimeout: null,
      isDestroyed: false,
      listeners: new Set(),
    };

    if (audio) {
      if (typeof window !== 'undefined') {
        window.__allActiveAudioElements = window.__allActiveAudioElements || new Set();
        window.__allActiveAudioElements.add(audio);
      }

      audio.preload = 'auto';
      audio.volume = defaultVol;

      audio.addEventListener('play', () => {
        if (this.isDestroyed || player.isDestroyed) {
          try { audio.pause(); } catch (_) {}
          return;
        }
        if (player.userExplicitlyPaused) {
          try { audio.pause(); } catch (_) {}
          player.isPlaying = false;
          this.notifyPlayer(theme);
          return;
        }
        player.isPlaying = true;
        this.enforceOwnership(theme);
        this.notifyPlayer(theme);
      });

      audio.addEventListener('playing', () => {
        if (this.isDestroyed || player.isDestroyed) {
          try { audio.pause(); } catch (_) {}
          return;
        }
        if (player.userExplicitlyPaused) {
          try { audio.pause(); } catch (_) {}
          player.isPlaying = false;
          this.notifyPlayer(theme);
          return;
        }
        player.isPlaying = true;
        this.enforceOwnership(theme);
        this.notifyPlayer(theme);
      });

      audio.addEventListener('pause', () => {
        player.isPlaying = false;
        this.notifyPlayer(theme);
      });

      audio.addEventListener('waiting', () => {
        this.notifyPlayer(theme);
      });

      audio.addEventListener('loadedmetadata', () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          player.duration = audio.duration;
        }
        this.notifyPlayer(theme);
      });

      audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.currentTime)) {
          player.currentTime = audio.currentTime;
        }
        if (!isNaN(audio.duration) && audio.duration > 0) {
          player.duration = audio.duration;
        }
      });

      // Single ended event listener: loop infinitely & advance track in manifest order
      audio.addEventListener('ended', () => {
        player.isPlaying = false;
        this.notifyPlayer(theme);

        if (this.isDestroyed || player.isDestroyed) {
          return;
        }

        // Prevent advancing hidden playlist if section lost ownership
        if (this.currentActiveSection !== theme) {
          return;
        }

        // Strict Single-Audio Rule: Paused playlist must NEVER advance to next track!
        if (player.userExplicitlyPaused) {
          return;
        }

        player.consecutiveErrors = 0;
        this.next(theme, true);
      });

      audio.addEventListener('error', (e) => {
        if (this.isDestroyed || player.isDestroyed) return;
        if (player.userExplicitlyPaused) {
          player.isPlaying = false;
          this.notifyPlayer(theme);
          return;
        }
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
          return;
        }
        console.warn(`Audio error in ${theme} on track ${player.currentIndex}:`, e);
        player.isPlaying = false;
        this.notifyPlayer(theme);
        if (player.hasEverStarted && this.currentActiveSection === theme) {
          this.handleTrackError(theme);
        }
      });

      // Load initial track source without autoplaying yet
      if (songs.length > 0) {
        audio.src = songs[0].src || songs[0].url;
      }
    }

    return player;
  }

  getAudio(theme = 'main') {
    return this.players[theme]?.audio || null;
  }

  getSectionConfig(theme) {
    if (theme === 'sad') return BIRTHDAY_CONFIG?.sadMusicPlayer;
    if (theme === 'happy') return BIRTHDAY_CONFIG?.happyMusicPlayer;
    if (theme === 'qna') return BIRTHDAY_CONFIG?.qna?.music;
    return BIRTHDAY_CONFIG?.musicPlayer;
  }

  getDefaultVolume(theme) {
    const cfg = this.getSectionConfig(theme);
    return cfg?.defaultTrackVolume ?? BIRTHDAY_CONFIG?.musicPlayer?.defaultTrackVolume ?? 0.60;
  }

  refreshSongs(theme) {
    const player = this.players[theme];
    if (!player) return;
    player.songs = getPlaylistForTheme(theme);
    if (player.audio && !player.audio.src && player.songs.length > 0) {
      const current = player.songs[player.currentIndex] || player.songs[0];
      player.audio.src = current.src || current.url;
    }
    this.notifyPlayer(theme);
  }

  // ---------------------------------------------------------------------------
  // Audio Ownership & Section Switching
  // ---------------------------------------------------------------------------
  enforceOwnership(activeTheme) {
    // Unconditionally pause all other background audio players to prevent duplicate audio
    for (const key of ['main', 'sad', 'happy', 'qna']) {
      if (key !== activeTheme) {
        const p = this.players[key];
        if (p && p.audio) {
          p.isPlayPending = false;
          ++this.playbackTokens[key];
          clearTimeout(p.autoAdvanceTimeout);
          clearTimeout(p.errorTimeout);
          try {
            p.audio.pause();
          } catch (_) {}
          p.isPlaying = false;
          this.notifyPlayer(key);
        }
      }
    }

    // Also unconditionally pause fireworks celebration welcome song if active theme is not fireworks/welcome
    if (activeTheme !== 'fireworks' && activeTheme !== 'welcome' && this.welcomeAudio) {
      try {
        this.welcomeAudio.pause();
      } catch (_) {}
      this.isWelcomePlaying = false;
    }

    // Global registry check: pause any other registered audio elements in the window
    if (typeof window !== 'undefined' && window.__allActiveAudioElements) {
      const activeAudio = (activeTheme && this.players[activeTheme]) ? this.players[activeTheme].audio : null;
      window.__allActiveAudioElements.forEach((aud) => {
        if (aud !== activeAudio && aud !== this.welcomeAudio && !aud.paused) {
          try {
            aud.pause();
          } catch (_) {}
        }
      });
    }
  }

  /**
   * Switch the active section and automatically transition music.
   * - Pauses outgoing player and saves its exact track, currentTime, and playing state.
   * - Resumes or starts incoming player if active.
   */
  setActiveSection(section) {
    const normalizedSection = section === 'sad-memories' ? 'sad'
      : section === 'happy-gallery' ? 'happy'
      : section;

    if (this.currentActiveSection === normalizedSection) return;
    const prevSection = this.currentActiveSection;
    this.currentActiveSection = normalizedSection;

    // 1. Pause outgoing player and record its state
    if (prevSection && this.players[prevSection]) {
      const prevPlayer = this.players[prevSection];
      prevPlayer.isPlayPending = false;
      prevPlayer.wasPlayingBeforePause = prevPlayer.isPlaying;
      if (prevPlayer.audio) {
        prevPlayer.currentTime = prevPlayer.audio.currentTime || 0;
        try {
          prevPlayer.audio.pause();
        } catch (_) {}
      }
      prevPlayer.isPlaying = false;
      this.notifyPlayer(prevSection);
    } else if (prevSection === 'fireworks' || prevSection === 'welcome') {
      if (this.welcomeAudio) {
        try {
          this.welcomeAudio.pause();
        } catch (_) {}
        this.isWelcomePlaying = false;
      }
    }

    // 2. Incoming section
    if (normalizedSection && this.players[normalizedSection]) {
      const nextPlayer = this.players[normalizedSection];
      // Refresh playlist to guarantee latest detected songs
      this.refreshSongs(normalizedSection);

      if (!nextPlayer.hasEverStarted) {
        // Entering this section for the FIRST time:
        nextPlayer.hasEverStarted = true;
        if (nextPlayer.songs.length > 0) {
          this.loadTrack(normalizedSection, 0, true);
        }
      } else if (nextPlayer.wasPlayingBeforePause || !nextPlayer.userExplicitlyPaused) {
        // Returning to a section where music was playing before (or not explicitly paused):
        this.resumePlayer(normalizedSection);
      } else {
        // Was explicitly paused by user before leaving: remain paused at saved track & position
        this.notifyPlayer(normalizedSection);
      }
    }
  }

  resumePlayer(theme) {
    const player = this.players[theme];
    if (!player || !player.audio || player.songs.length === 0 || this.isDestroyed || player.isDestroyed) return;

    if (player.userExplicitlyPaused) {
      return;
    }

    if (player.isPlaying && !player.audio.paused) {
      return;
    }

    if (player.isPlayPending) {
      return;
    }

    this.enforceOwnership(theme);
    const token = ++this.playbackTokens[theme];

    const song = player.songs[player.currentIndex];
    if (song && (!player.audio.src || player.audio.src === '')) {
      player.audio.src = song.src || song.url;
    }

    if (player.currentTime > 0 && Math.abs((player.audio.currentTime || 0) - player.currentTime) > 0.5) {
      try {
        player.audio.currentTime = player.currentTime;
      } catch (_) {}
    }

    player.audio.volume = player.isMuted ? 0 : player.volume;

    player.isPlayPending = true;
    const playPromise = player.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          player.isPlayPending = false;
          if (token !== this.playbackTokens[theme] || player.userExplicitlyPaused || this.isDestroyed || player.isDestroyed) {
            try { player.audio.pause(); } catch (_) {}
            player.isPlaying = false;
            this.notifyPlayer(theme);
            return;
          }
          player.isPlaying = true;
          player.consecutiveErrors = 0;
          this.notifyPlayer(theme);
        })
        .catch((err) => {
          player.isPlayPending = false;
          if (err.name === 'AbortError') return;
          if (token !== this.playbackTokens[theme]) return;
          if (err.name === 'NotAllowedError') {
            this.pendingAutoplayTheme = theme;
          }
          console.warn(`Autoplay blocked on resume in ${theme}:`, err);
          player.isPlaying = false;
          this.notifyPlayer(theme);
        });
    } else {
      player.isPlayPending = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Track Loading & Volume Reset
  // ---------------------------------------------------------------------------
  loadTrack(theme, index, autoPlay = true) {
    const player = this.players[theme];
    if (!player || !player.audio || player.songs.length === 0 || this.isDestroyed || player.isDestroyed) return;

    clearTimeout(player.autoAdvanceTimeout);
    clearTimeout(player.errorTimeout);

    const token = ++this.playbackTokens[theme];

    if (index < 0 || index >= player.songs.length) index = 0;
    player.currentIndex = index;
    player.currentTime = 0;
    const song = player.songs[index];

    try {
      player.audio.pause();
    } catch (_) {}
    try {
      player.audio.currentTime = 0;
    } catch (_) {}

    player.audio.src = song.src || song.url;

    // Reset volume to configured default on EVERY new song (Requirement 6)
    const defaultVol = this.getDefaultVolume(theme);
    player.volume = defaultVol;
    player.isMuted = false;
    player.audio.volume = defaultVol;

    if (autoPlay) {
      player.userExplicitlyPaused = false;
      this.enforceOwnership(theme);
      player.isPlayPending = true;
      const playPromise = player.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            player.isPlayPending = false;
            if (token !== this.playbackTokens[theme] || player.userExplicitlyPaused || this.isDestroyed || player.isDestroyed) {
              try { player.audio.pause(); } catch (_) {}
              player.isPlaying = false;
              this.notifyPlayer(theme);
              return;
            }
            player.isPlaying = true;
            player.hasEverStarted = true;
            player.consecutiveErrors = 0;
            this.notifyPlayer(theme);
          })
          .catch((err) => {
            player.isPlayPending = false;
            if (err.name === 'AbortError') return;
            if (token !== this.playbackTokens[theme]) return;
            if (err.name === 'NotAllowedError') {
              this.pendingAutoplayTheme = theme;
            }
            console.warn(`Playback error in ${theme}:`, err);
            player.isPlaying = false;
            this.notifyPlayer(theme);
          });
      } else {
        player.isPlayPending = false;
      }
    } else {
      player.isPlayPending = false;
      player.isPlaying = false;
      this.notifyPlayer(theme);
    }
  }

  handleTrackError(theme) {
    const player = this.players[theme];
    if (!player || this.isDestroyed || player.isDestroyed || player.userExplicitlyPaused) return;

    clearTimeout(player.errorTimeout);
    player.consecutiveErrors = (player.consecutiveErrors || 0) + 1;
    if (player.songs.length > 0 && player.consecutiveErrors < player.songs.length) {
      console.warn(`Track ${player.currentIndex} in ${theme} encountered an error. Skipping to next.`);
      const token = this.playbackTokens[theme];
      player.errorTimeout = setTimeout(() => {
        if (this.isDestroyed || player.isDestroyed || player.userExplicitlyPaused) return;
        if (token !== this.playbackTokens[theme]) return;
        this.next(theme, true);
      }, 150);
    } else {
      console.error(`All tracks in ${theme} failed to load.`);
      player.isPlaying = false;
      this.notifyPlayer(theme);
    }
  }

  // ---------------------------------------------------------------------------
  // Video Audio Priority
  // ---------------------------------------------------------------------------
  pauseForVideo(theme = this.currentActiveSection) {
    const targetTheme = (theme && this.players[theme]) ? theme : this.currentActiveSection;
    const player = this.players[targetTheme];
    if (!player || !player.audio) return;

    if (!this.videoSnapshot) {
      const wasPlaying = (player.isPlaying || !player.audio.paused) && !player.userExplicitlyPaused;
      const currentTime = player.audio.currentTime || player.currentTime || 0;
      this.videoSnapshot = {
        theme: targetTheme,
        wasPlaying,
        index: player.currentIndex,
        currentTime,
      };
    }

    try {
      player.audio.pause();
    } catch (_) {}
    player.isPlaying = false;
    this.notifyPlayer(targetTheme);
  }

  resumeAfterVideo(theme = this.currentActiveSection) {
    if (!this.videoSnapshot) return;
    const snapshot = this.videoSnapshot;
    this.videoSnapshot = null;

    const targetTheme = snapshot.theme || theme;
    const player = this.players[targetTheme];
    if (!player || !player.audio || player.songs.length === 0) return;

    // Only resume if still on the same section
    if (this.currentActiveSection !== targetTheme) return;

    if (player.currentIndex !== snapshot.index) {
      this.loadTrack(targetTheme, snapshot.index, false);
    }

    try {
      player.audio.currentTime = snapshot.currentTime;
    } catch (_) {}

    if (snapshot.wasPlaying) {
      this.resumePlayer(targetTheme);
    } else {
      player.isPlaying = false;
      this.notifyPlayer(targetTheme);
    }
  }

  // ---------------------------------------------------------------------------
  // Player Controls (Theme-Aware)
  // ---------------------------------------------------------------------------
  play(theme = 'main') {
    const player = this.players[theme];
    if (!player || !player.audio || player.songs.length === 0 || this.isDestroyed || player.isDestroyed) return;

    // Idempotent: If already actively playing, avoid duplicate play requests
    if (player.isPlaying && !player.audio.paused) {
      return;
    }

    if (player.isPlayPending) {
      return;
    }

    clearTimeout(player.autoAdvanceTimeout);
    clearTimeout(player.errorTimeout);

    const token = ++this.playbackTokens[theme];
    this.enforceOwnership(theme);
    player.userExplicitlyPaused = false;
    player.audio.volume = player.isMuted ? 0 : player.volume;

    const song = player.songs[player.currentIndex];
    if (song && (!player.audio.src || player.audio.src === '' || player.audio.src === window?.location?.href)) {
      player.audio.src = song.src || song.url;
    }

    player.isPlayPending = true;
    const playPromise = player.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          player.isPlayPending = false;
          if (token !== this.playbackTokens[theme] || player.userExplicitlyPaused || this.isDestroyed || player.isDestroyed) {
            try { player.audio.pause(); } catch (_) {}
            player.isPlaying = false;
            this.notifyPlayer(theme);
            return;
          }
          player.isPlaying = true;
          player.hasEverStarted = true;
          player.consecutiveErrors = 0;
          this.notifyPlayer(theme);
        })
        .catch((err) => {
          player.isPlayPending = false;
          if (err.name === 'AbortError') return;
          if (token !== this.playbackTokens[theme]) return;
          if (err.name === 'NotAllowedError') {
            this.pendingAutoplayTheme = theme;
          }
          console.warn(`Playback play() blocked in ${theme}:`, err);
          player.isPlaying = false;
          this.notifyPlayer(theme);
        });
    } else {
      player.isPlayPending = false;
    }
  }

  pause(theme = 'main') {
    const player = this.players[theme];
    if (!player || !player.audio) return;

    player.isPlayPending = false;
    const token = ++this.playbackTokens[theme];
    player.userExplicitlyPaused = true;
    player.isPlaying = false;
    player.wasPlayingBeforePause = false;

    clearTimeout(player.autoAdvanceTimeout);
    clearTimeout(player.errorTimeout);

    try {
      player.currentTime = player.audio.currentTime || 0;
      player.audio.pause();
    } catch (_) {}

    this.notifyPlayer(theme);
  }

  togglePlay(theme = 'main') {
    const player = this.players[theme];
    if (!player) return;
    if (player.audio && !player.audio.paused && !player.audio.ended) {
      this.pause(theme);
    } else {
      this.play(theme);
    }
  }

  next(theme = 'main', autoAdvance = false) {
    const player = this.players[theme];
    if (!player || player.songs.length === 0) return;

    // Strict Single-Audio Rule: Paused playlist must NEVER advance automatically!
    if (autoAdvance && player.userExplicitlyPaused) {
      return;
    }

    const shouldPlay = autoAdvance
      ? !player.userExplicitlyPaused
      : (!player.userExplicitlyPaused && (player.isPlaying || !player.audio?.paused));

    const nextIdx = (player.currentIndex + 1) % player.songs.length;
    this.loadTrack(theme, nextIdx, shouldPlay);
  }

  prev(theme = 'main') {
    const player = this.players[theme];
    if (!player || player.songs.length === 0) return;
    if (player.audio && player.audio.currentTime > 3) {
      player.audio.currentTime = 0;
      player.currentTime = 0;
      return;
    }

    const shouldPlay = !player.userExplicitlyPaused && (player.isPlaying || !player.audio?.paused);
    const prevIdx = (player.currentIndex - 1 + player.songs.length) % player.songs.length;
    this.loadTrack(theme, prevIdx, shouldPlay);
  }

  selectTrack(theme = 'main', index) {
    const player = this.players[theme];
    if (!player || index < 0 || index >= player.songs.length) return;
    player.userExplicitlyPaused = false;
    player.consecutiveErrors = 0;
    this.loadTrack(theme, index, true);
  }

  setVolume(arg1, arg2) {
    let theme = 'main';
    let newVolume = 0.6;
    if (typeof arg1 === 'number') {
      newVolume = arg1;
      theme = typeof arg2 === 'string' ? arg2 : 'main';
    } else {
      theme = arg1 || 'main';
      newVolume = typeof arg2 === 'number' ? arg2 : 0.6;
    }

    const player = this.players[theme];
    if (!player) return;

    player.volume = Math.max(0, Math.min(1, newVolume));
    if (player.audio) {
      player.audio.volume = player.isMuted ? 0 : player.volume;
    }
    if (player.volume > 0 && player.isMuted) {
      player.isMuted = false;
    }
    this.notifyPlayer(theme);
  }

  toggleMute(theme = 'main') {
    const player = this.players[theme];
    if (!player) return;

    player.isMuted = !player.isMuted;
    if (player.audio) {
      player.audio.volume = player.isMuted ? 0 : player.volume;
    }
    this.notifyPlayer(theme);
  }

  getPlayerState(theme = 'main') {
    const player = this.players[theme] || this.players.main;
    const isActuallyPlaying = Boolean(player.audio && !player.audio.paused && !player.audio.ended);
    player.isPlaying = isActuallyPlaying;

    return {
      theme: player.key,
      songs: player.songs,
      currentIndex: player.currentIndex,
      currentSong: player.songs[player.currentIndex] || null,
      currentTrack: player.songs[player.currentIndex] || null,
      isPlaying: isActuallyPlaying,
      currentTime: player.audio ? (player.audio.currentTime || 0) : player.currentTime,
      duration: player.audio ? (player.audio.duration || 0) : player.duration,
      volume: player.volume,
      isMuted: player.isMuted,
      hasStarted: player.hasEverStarted,
    };
  }

  subscribePlayer(theme = 'main', listener) {
    const player = this.players[theme] || this.players.main;
    player.listeners.add(listener);
    listener(this.getPlayerState(theme));
    return () => {
      player.listeners.delete(listener);
    };
  }

  notifyPlayer(theme) {
    const player = this.players[theme];
    if (!player) return;
    const state = this.getPlayerState(theme);
    player.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Fireworks Welcome Song Lifecycle
  // ---------------------------------------------------------------------------
  playWelcomeSong() {
    if (this.welcomeFinishedForSession || this.isDestroyed) {
      return Promise.resolve(false);
    }
    if (this.isWelcomePlaying && this.welcomeAudio && !this.welcomeAudio.paused) {
      return Promise.resolve(true);
    }

    this.enforceOwnership('fireworks');

    const audioSrc = BIRTHDAY_CONFIG?.fireworksAudio || '/audio/welcome.mp3';

    if (!this.welcomeAudio && typeof Audio !== 'undefined') {
      this.welcomeAudio = new Audio();
      this.welcomeAudio.preload = 'auto';
      this.welcomeAudio.loop = true;

      if (typeof window !== 'undefined') {
        window.__allActiveAudioElements = window.__allActiveAudioElements || new Set();
        window.__allActiveAudioElements.add(this.welcomeAudio);
      }

      this.welcomeAudio.addEventListener('play', () => {
        this.isWelcomePlaying = true;
      });
      this.welcomeAudio.addEventListener('pause', () => {
        this.isWelcomePlaying = false;
      });
      this.welcomeAudio.addEventListener('ended', () => {
        if (this.currentActiveSection === 'fireworks' && !this.welcomeFinishedForSession && this.welcomeAudio && !this.isDestroyed) {
          this.welcomeAudio.currentTime = 0;
          this.welcomeAudio.play().catch(() => {});
        } else {
          this.isWelcomePlaying = false;
        }
      });
      this.welcomeAudio.addEventListener('error', (err) => {
        if (this.isDestroyed) return;
        console.warn('Welcome audio error:', err);
        this.isWelcomePlaying = false;
      });
    }

    if (!this.welcomeAudio) return Promise.resolve(false);

    this.welcomeAudio.loop = true;

    if (
      !this.welcomeAudio.src ||
      (!this.welcomeAudio.src.endsWith(audioSrc) && this.welcomeAudio.src !== window.location.origin + audioSrc)
    ) {
      this.welcomeAudio.src = audioSrc;
    }

    const defaultVol = BIRTHDAY_CONFIG?.musicPlayer?.defaultTrackVolume ?? 0.60;
    this.welcomeAudio.volume = defaultVol;

    const playPromise = this.welcomeAudio.play();
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          if (this.welcomeFinishedForSession || this.isDestroyed) {
            try { this.welcomeAudio.pause(); } catch (_) {}
            this.isWelcomePlaying = false;
            return false;
          }
          this.isWelcomePlaying = true;
          return true;
        })
        .catch((err) => {
          this.isWelcomePlaying = false;
          if (err.name === 'NotAllowedError') {
            this.pendingWelcomeSong = true;
          }
          console.warn('Welcome song autoplay blocked by browser policy:', err);
          return false;
        });
    }

    this.isWelcomePlaying = true;
    return Promise.resolve(true);
  }

  stopWelcomeSongPermanently() {
    this.welcomeFinishedForSession = true;
    this.isWelcomePlaying = false;

    if (this.welcomeAudio) {
      try {
        this.welcomeAudio.pause();
      } catch (_) {}
      try {
        this.welcomeAudio.currentTime = 0;
      } catch (_) {}
      if (typeof window !== 'undefined' && window.__allActiveAudioElements) {
        window.__allActiveAudioElements.delete(this.welcomeAudio);
      }
      try {
        this.welcomeAudio.removeAttribute('src');
        this.welcomeAudio.load();
      } catch (_) {}
      this.welcomeAudio = null;
    }
  }

  resetWelcomeSongSession() {
    this.welcomeFinishedForSession = false;
    this.isWelcomePlaying = false;
    if (this.welcomeAudio) {
      try {
        this.welcomeAudio.pause();
        this.welcomeAudio.currentTime = 0;
      } catch (_) {}
      if (typeof window !== 'undefined' && window.__allActiveAudioElements) {
        window.__allActiveAudioElements.delete(this.welcomeAudio);
      }
      try {
        this.welcomeAudio.removeAttribute('src');
        this.welcomeAudio.load();
      } catch (_) {}
      this.welcomeAudio = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Web Audio Context & User Interaction Gesture Unlocking
  // ---------------------------------------------------------------------------
  unlockAudioContext() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    } catch (_) {}
  }

  handleUserInteraction() {
    this.unlockAudioContext();

    if (this.pendingWelcomeSong && !this.welcomeFinishedForSession) {
      this.pendingWelcomeSong = false;
      this.playWelcomeSong().catch(() => {});
    }

    if (this.pendingAutoplayTheme) {
      const theme = this.pendingAutoplayTheme;
      this.pendingAutoplayTheme = null;
      if (this.currentActiveSection === theme) {
        this.play(theme);
      }
    }
  }

  setupUserGestureRetryListener() {
    if (typeof window === 'undefined' || this.hasSetupRetryListener) return;
    this.hasSetupRetryListener = true;

    const onGesture = () => {
      this.handleUserInteraction();
    };

    ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((evt) => {
      window.addEventListener(evt, onGesture, { passive: true });
    });
  }

  primeWelcomeAudioInGesture() {
    this.unlockAudioContext();
    if (this.welcomeFinishedForSession || this.isDestroyed) return;

    const audioSrc = BIRTHDAY_CONFIG?.fireworksAudio || '/audio/welcome.mp3';

    if (!this.welcomeAudio && typeof Audio !== 'undefined') {
      this.welcomeAudio = new Audio();
      this.welcomeAudio.preload = 'auto';
      this.welcomeAudio.loop = true;

      if (typeof window !== 'undefined') {
        window.__allActiveAudioElements = window.__allActiveAudioElements || new Set();
        window.__allActiveAudioElements.add(this.welcomeAudio);
      }

      this.welcomeAudio.addEventListener('play', () => {
        this.isWelcomePlaying = true;
      });
      this.welcomeAudio.addEventListener('pause', () => {
        this.isWelcomePlaying = false;
      });
      this.welcomeAudio.addEventListener('ended', () => {
        if (this.currentActiveSection === 'fireworks' && !this.welcomeFinishedForSession && this.welcomeAudio && !this.isDestroyed) {
          this.welcomeAudio.currentTime = 0;
          this.welcomeAudio.play().catch(() => {});
        } else {
          this.isWelcomePlaying = false;
        }
      });
      this.welcomeAudio.addEventListener('error', (err) => {
        if (this.isDestroyed) return;
        console.warn('Welcome audio error:', err);
        this.isWelcomePlaying = false;
      });
    }

    if (!this.welcomeAudio) return;

    if (
      !this.welcomeAudio.src ||
      (!this.welcomeAudio.src.endsWith(audioSrc) && this.welcomeAudio.src !== window.location.origin + audioSrc)
    ) {
      this.welcomeAudio.src = audioSrc;
    }

    const defaultVol = BIRTHDAY_CONFIG?.musicPlayer?.defaultTrackVolume ?? 0.60;
    this.welcomeAudio.volume = defaultVol;

    const playPromise = this.welcomeAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isWelcomePlaying = true;
          this.pendingWelcomeSong = false;
        })
        .catch((err) => {
          this.isWelcomePlaying = false;
          if (err.name === 'NotAllowedError') {
            this.pendingWelcomeSong = true;
          }
        });
    }
  }

  primeOnSecondHeartClick() {
    this.stopWelcomeSongPermanently();
    const player = this.players.main;
    if (!player || !player.audio || player.songs.length === 0 || this.isDestroyed) return;

    const defaultVol = this.getDefaultVolume('main');
    player.volume = defaultVol;
    player.isMuted = false;
    player.hasEverStarted = true;
    player.wasPlayingBeforePause = true;
    player.userExplicitlyPaused = false;

    const song = player.songs[0];
    player.currentIndex = 0;
    if (!player.audio.src || player.audio.src === '') {
      player.audio.src = song.src || song.url;
    }
    player.audio.volume = defaultVol;

    this.enforceOwnership('main');
    const token = ++this.playbackTokens.main;
    const playPromise = player.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (token !== this.playbackTokens.main || player.userExplicitlyPaused || this.isDestroyed) {
            try { player.audio.pause(); } catch (_) {}
            player.isPlaying = false;
            this.notifyPlayer('main');
            return;
          }
          player.isPlaying = true;
          this.notifyPlayer('main');
        })
        .catch((err) => {
          console.warn('Priming audio playback:', err);
        });
    }
  }

  startMainPlayback() {
    this.stopWelcomeSongPermanently();
    this.currentActiveSection = 'main';
    const player = this.players.main;
    const defaultVol = this.getDefaultVolume('main');
    if (player) {
      player.volume = defaultVol;
      player.isMuted = false;
      if (player.audio) {
        player.audio.volume = defaultVol;
      }
    }

    // Strict Single-Audio Rule: If user explicitly paused main, respect pause and stay paused!
    if (player && player.userExplicitlyPaused) {
      this.enforceOwnership('main');
      this.notifyPlayer('main');
      return;
    }

    // Idempotent: If main player is already actively playing, ensure ownership and do not duplicate
    if (player && player.isPlaying && player.audio && !player.audio.paused) {
      this.enforceOwnership('main');
      return;
    }

    this.setActiveSection('main');
    if (player && player.audio && player.audio.paused && player.songs.length > 0) {
      this.play('main');
    }
  }

  startQnaPlayback() {
    this.currentActiveSection = 'qna';
    const player = this.players.qna;
    if (!player) return;

    const defaultVol = this.getDefaultVolume('qna');
    player.volume = defaultVol;
    player.isMuted = false;
    if (player.audio) {
      player.audio.volume = defaultVol;
    }

    this.refreshSongs('qna');
    player.userExplicitlyPaused = false;

    // Idempotent: If Q&A music is already actively playing, ensure ownership and do not interrupt
    if (player.isPlaying && player.audio && !player.audio.paused) {
      this.enforceOwnership('qna');
      return;
    }

    // If play is already in flight, ensure ownership and let the in-flight promise finish
    if (player.isPlayPending) {
      this.enforceOwnership('qna');
      return;
    }

    this.enforceOwnership('qna');

    if (player.songs.length === 0) return;

    const song = player.songs[player.currentIndex || 0] || player.songs[0];
    if (player.audio && (!player.audio.src || player.audio.src === '' || player.audio.src === window?.location?.href)) {
      player.audio.src = song.src || song.url;
    }

    if (!player.hasEverStarted) {
      player.hasEverStarted = true;
      this.loadTrack('qna', player.currentIndex || 0, true);
    } else {
      this.play('qna');
    }
  }

  destroy() {
    this.isDestroyed = true;
    for (const key of ['main', 'sad', 'happy', 'qna']) {
      const p = this.players[key];
      if (p) {
        p.isDestroyed = true;
        clearTimeout(p.autoAdvanceTimeout);
        clearTimeout(p.errorTimeout);
        if (p.audio) {
          try { p.audio.pause(); } catch (_) {}
          if (typeof window !== 'undefined' && window.__allActiveAudioElements) {
            window.__allActiveAudioElements.delete(p.audio);
          }
          try {
            p.audio.removeAttribute('src');
            p.audio.load();
          } catch (_) {}
          p.isPlaying = false;
        }
      }
    }
    if (this.welcomeAudio) {
      try { this.welcomeAudio.pause(); } catch (_) {}
      if (typeof window !== 'undefined' && window.__allActiveAudioElements) {
        window.__allActiveAudioElements.delete(this.welcomeAudio);
      }
      try {
        this.welcomeAudio.removeAttribute('src');
        this.welcomeAudio.load();
      } catch (_) {}
      this.welcomeAudio = null;
      this.isWelcomePlaying = false;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Backward-Compatible Main Player Delegates
  // ---------------------------------------------------------------------------
  get audio() {
    return this.players.main.audio;
  }
  get songs() {
    return this.players.main.songs;
  }
  get currentIndex() {
    return this.players.main.currentIndex;
  }
  get isPlaying() {
    return this.players.main.isPlaying;
  }
  get volume() {
    return this.players.main.volume;
  }
  get isMuted() {
    return this.players.main.isMuted;
  }
  get hasStarted() {
    return this.players.main.hasEverStarted;
  }

  getState() {
    return this.getPlayerState('main');
  }

  subscribe(listener) {
    return this.subscribePlayer('main', listener);
  }

  notify() {
    this.notifyPlayer('main');
  }
}

if (typeof window !== 'undefined') {
  if (window.__globalAudioController) {
    try {
      window.__globalAudioController.destroy();
    } catch (_) {}
  }
  if (window.__audioController && window.__audioController !== window.__globalAudioController) {
    try {
      window.__audioController.destroy();
    } catch (_) {}
  }
}

export const audioController = new AudioController();

if (typeof window !== 'undefined') {
  window.audioController = audioController;
  window.__audioController = audioController;
  window.__globalAudioController = audioController;
}

if (import.meta && import.meta.hot) {
  import.meta.hot.dispose(() => {
    audioController.destroy();
  });
}

export default audioController;
