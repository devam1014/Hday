import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioController } from '../utils/audioController';

const EQUALIZER_BARS = 36;

export default function GalleryMusicPlayer({ theme = 'sad' }) {
  const isSad = theme === 'sad';
  const label = isSad ? 'SAD MEMORIES' : 'HAPPY MEMORIES';

  const [playerState, setPlayerState] = useState(() => audioController.getPlayerState(theme));
  const [isPlaying, setIsPlaying] = useState(() => {
    const audio = audioController.getAudio(theme);
    return Boolean(audio && !audio.paused && !audio.ended);
  });
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const playlistDropdownRef = useRef(null);
  const playerWrapperRef = useRef(null);

  // Synchronize with audio element events and controller state
  useEffect(() => {
    const audio = audioController.getAudio(theme);

    const updateState = () => {
      const state = audioController.getPlayerState(theme);
      setPlayerState(state);
      if (audio) {
        setIsPlaying(!audio.paused && !audio.ended);
      } else {
        setIsPlaying(state.isPlaying);
      }
    };

    // 1. Subscribe to controller broadcast
    const unsubscribe = audioController.subscribePlayer(theme, (newState) => {
      setPlayerState(newState);
      if (audio) {
        setIsPlaying(!audio.paused && !audio.ended);
      } else {
        setIsPlaying(newState.isPlaying);
      }
    });

    // 2. Attach real-time DOM events directly to HTMLAudioElement
    if (audio) {
      audio.addEventListener('play', updateState);
      audio.addEventListener('playing', updateState);
      audio.addEventListener('pause', updateState);
      audio.addEventListener('ended', updateState);
      audio.addEventListener('error', updateState);
      audio.addEventListener('loadedmetadata', updateState);
      audio.addEventListener('timeupdate', updateState);
      updateState();
    }

    return () => {
      unsubscribe();
      if (audio) {
        audio.removeEventListener('play', updateState);
        audio.removeEventListener('playing', updateState);
        audio.removeEventListener('pause', updateState);
        audio.removeEventListener('ended', updateState);
        audio.removeEventListener('error', updateState);
        audio.removeEventListener('loadedmetadata', updateState);
        audio.removeEventListener('timeupdate', updateState);
      }
    };
  }, [theme]);

  const {
    songs = [],
    currentIndex = 0,
    volume = 0.60,
    isMuted = false
  } = playerState;

  const currentTrack = songs[currentIndex] || null;
  const hasSongs = songs.length > 0;

  // Toggle play / pause
  const togglePlay = useCallback((e) => {
    e?.stopPropagation();
    if (!hasSongs) return;
    audioController.togglePlay(theme);
  }, [theme, hasSongs]);

  // Previous Track
  const handlePreviousTrack = useCallback((e) => {
    e?.stopPropagation();
    if (!hasSongs) return;
    audioController.prev(theme);
  }, [theme, hasSongs]);

  // Next Track
  const handleNextTrack = useCallback((e) => {
    e?.stopPropagation();
    if (!hasSongs) return;
    audioController.next(theme);
  }, [theme, hasSongs]);

  // Volume control
  const handleVolumeChange = (e) => {
    e?.stopPropagation();
    const newVol = parseFloat(e.target.value);
    audioController.setVolume(theme, newVol);
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    audioController.toggleMute(theme);
  };

  const selectSong = (index) => {
    audioController.selectTrack(theme, index);
    setShowPlaylist(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        playlistDropdownRef.current &&
        !playlistDropdownRef.current.contains(e.target) &&
        !e.target.closest('.gmp-btn-playlist')
      ) {
        setShowPlaylist(false);
      }
      if (!e.target.closest('.gmp-volume-container')) {
        setShowVolumePopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const songTitle = currentTrack ? (currentTrack.title || currentTrack.name) : 'No song detected';

  return (
    <div className="music-player-wrapper gallery-music-wrapper" ref={playerWrapperRef}>
      {/* Pill with EXACT border-radius: 30px */}
      <div
        className={`music-player-pill gallery-music-capsule ${isSad ? 'sad-theme' : 'happy-theme'} ${isPlaying ? 'is-playing' : 'is-paused'}`}
        role="region"
        aria-label={`${label} Music Player`}
      >
        {/* Pink Floral Accents for Happy Gallery (Subtle in outer corners) */}
        {!isSad && (
          <>
            <span className="gmp-floral-accent floral-tl" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="8" r="4" fill="#fca5a5" opacity="0.85" />
                <circle cx="14" cy="8" r="3.5" fill="#f472b6" opacity="0.75" />
                <circle cx="10" cy="13" r="3.5" fill="#fbcfe8" opacity="0.85" />
                <circle cx="9" cy="9" r="1.5" fill="#fef08a" />
              </svg>
            </span>
            <span className="gmp-floral-accent floral-br" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="16" cy="16" r="4" fill="#fca5a5" opacity="0.85" />
                <circle cx="10" cy="16" r="3.5" fill="#f472b6" opacity="0.75" />
                <circle cx="14" cy="11" r="3.5" fill="#fbcfe8" opacity="0.85" />
                <circle cx="15" cy="15" r="1.5" fill="#fef08a" />
              </svg>
            </span>
          </>
        )}

        {/* 1. Label with Infinity Symbol (Exact display: SAD MEMORIES ∞ / HAPPY MEMORIES ∞) */}
        <div
          className="music-player-label-section gmp-title-block"
          onClick={() => hasSongs && setShowPlaylist((prev) => !prev)}
          role="button"
          tabIndex={0}
          title={currentTrack ? `Playlist: ${songs.length} songs (Click to view)` : "Click to view playlist"}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (hasSongs) setShowPlaylist((prev) => !prev);
            }
          }}
        >
          <div className="gmp-title-header">
            <span className="music-player-label-text gmp-title-text">{label}</span>
            <span className="gmp-infinity-symbol" aria-label="Forever">
              ∞
            </span>
          </div>
        </div>

        {/* 2. Multi-color Equalizer (~36 Bars) */}
        <div
          className={`music-spectrum-equalizer gmp-equalizer ${isPlaying ? 'is-playing' : 'is-paused'}`}
          aria-hidden="true"
          onClick={() => hasSongs && setShowPlaylist((prev) => !prev)}
          title="Equalizer"
        >
          {Array.from({ length: EQUALIZER_BARS }).map((_, i) => (
            <span key={i} className={`spectrum-bar bar-${i + 1}`} />
          ))}
        </div>

        {/* 3. Controls: Previous, Play/Pause, Next */}
        <div className="music-player-controls gmp-controls-group">
          {/* Previous Track */}
          <button
            type="button"
            className="music-ctrl-btn gmp-btn gmp-btn-prev"
            onClick={handlePreviousTrack}
            disabled={!hasSongs}
            aria-label="Previous Track"
            title="Previous Track"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Circular Play/Pause Button (32px with glowing ring) */}
          <button
            type="button"
            className={`music-ctrl-btn music-play-btn gmp-btn gmp-btn-play ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlay}
            disabled={!hasSongs}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '1.5px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next Track */}
          <button
            type="button"
            className="music-ctrl-btn gmp-btn gmp-btn-next"
            onClick={handleNextTrack}
            disabled={!hasSongs}
            aria-label="Next Track"
            title="Next Track"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* 4. Hairline Divider */}
        <div className="music-vertical-divider gmp-vertical-divider" aria-hidden="true" />

        {/* 5. Actions: Volume & Playlist */}
        <div className="music-player-actions gmp-actions-group">
          {/* Volume Control */}
          <div
            className="music-volume-container gmp-volume-container"
            onMouseEnter={() => setShowVolumePopup(true)}
            onMouseLeave={() => setShowVolumePopup(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="music-ctrl-btn music-vol-btn gmp-btn gmp-btn-vol"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Volume'}
            >
              {isMuted || volume === 0 ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* Vertical Volume Slider Popup */}
            <div
              className={`music-volume-popup gmp-volume-popup ${showVolumePopup ? 'is-visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onInput={handleVolumeChange}
                onChange={handleVolumeChange}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="music-volume-slider gmp-volume-slider"
                aria-label="Volume slider"
              />
            </div>
          </div>

          {/* Playlist Dropdown Button */}
          <button
            type="button"
            className={`music-ctrl-btn music-playlist-btn gmp-btn gmp-btn-playlist ${showPlaylist ? 'is-active' : ''}`}
            onClick={() => hasSongs && setShowPlaylist((prev) => !prev)}
            aria-label="View Playlist"
            title="View Playlist"
            aria-expanded={showPlaylist}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Playlist Dropdown Menu */}
      {showPlaylist && hasSongs && (
        <div ref={playlistDropdownRef} className="music-playlist-dropdown gmp-playlist-dropdown">
          <div className="music-playlist-header gmp-playlist-header">
            <span className="music-playlist-title gmp-playlist-title">{label} Playlist</span>
            <span className="music-playlist-count gmp-playlist-count">{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
          <ul className="music-playlist-list gmp-playlist-list">
            {songs.map((song, i) => {
              const isCurrent = i === currentIndex;
              return (
                <li
                  key={song.id || i}
                  className={`music-playlist-item gmp-playlist-item ${isCurrent ? 'is-selected is-current' : ''}`}
                  onClick={() => selectSong(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectSong(i);
                    }
                  }}
                >
                  <span className="music-item-index gmp-item-index">
                    {isCurrent && isPlaying ? (
                      <span className="eq-dot-indicator" />
                    ) : (
                      `${i + 1}`
                    )}
                  </span>
                  <span className="music-item-title gmp-item-title" title={song.title || song.name}>
                    {song.title || song.name}
                  </span>
                  {isCurrent && (
                    <span className="music-item-badge gmp-item-badge">Playing</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
