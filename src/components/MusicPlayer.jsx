import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioController } from '../utils/audioController';

/**
 * MusicPlayer — "Dedicated to You"
 * 
 * Layout:
 * [ Dedicated to You | Animated Equalizer | Previous | Play/Pause | Next | Volume | Playlist Dropdown ]
 * 
 * Features:
 * - Transparent frosted-glass background allowing sunset colours to show through.
 * - Thin, subtle, elegant border with smooth rounded corners.
 * - Only displays the static text "Dedicated to You" (never song/artist/filename).
 * - Multi-colour gradient equalizer (24 bars) across turquoise, cyan, blue, violet & gold.
 * - Previous, Play/Pause, Next controls.
 * - Volume slider with mute toggle.
 * - Playlist dropdown showing all songs in exact manifest order from src/config/playlist-order.json.
 */
export default function MusicPlayer() {
  const [audioState, setAudioState] = useState(() => audioController.getState());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  const playerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Subscribe to audio controller state
  useEffect(() => {
    const unsubscribe = audioController.subscribe((newState) => {
      setAudioState(newState);
    });
    return () => unsubscribe();
  }, []);

  const { songs, currentIndex, isPlaying, volume, isMuted, hasStarted } = audioState;
  const hasSongs = songs && songs.length > 0;

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        playerRef.current &&
        !playerRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleTogglePlay = useCallback((e) => {
    e?.stopPropagation();
    audioController.togglePlay('main');
  }, []);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    audioController.prev('main');
  }, []);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    audioController.next('main');
  }, []);

  const handleSelectTrack = useCallback((index, e) => {
    e?.stopPropagation();
    audioController.selectTrack('main', index);
    setIsDropdownOpen(false);
  }, []);

  const handleToggleMute = useCallback((e) => {
    e?.stopPropagation();
    audioController.toggleMute('main');
  }, []);

  const handleVolumeChange = useCallback((e) => {
    e?.stopPropagation();
    const val = parseFloat(e.target.value);
    audioController.setVolume('main', val);
  }, []);

  // Equalizer playback state class
  const equalizerStateClass = isPlaying
    ? 'is-playing'
    : (hasStarted ? 'is-paused' : 'is-inactive');

  return (
    <div className="music-player-wrapper" ref={playerRef}>
      {/* Horizontal Frosted-Glass Music Bar */}
      <div
        className={`music-player-pill ${isPlaying ? 'is-playing' : 'is-paused'}`}
        role="region"
        aria-label="Music Player: Dedicated to You"
      >
        {/* 1. Static Label: ONLY "DEDICATED TO YOU" */}
        <div
          className="music-player-label-section"
          onClick={() => hasSongs && setIsDropdownOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          title="Click to view playlist tracks"
          aria-expanded={isDropdownOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (hasSongs) setIsDropdownOpen((prev) => !prev);
            }
          }}
        >
          <span className="music-player-label-text">DEDICATED TO YOU</span>
        </div>

        {/* 2. Animated Equalizer — 36 Narrow Vertical Bars with Multicolor Gradient */}
        <div
          className={`music-spectrum-equalizer ${equalizerStateClass}`}
          aria-hidden="true"
          onClick={() => hasSongs && setIsDropdownOpen((prev) => !prev)}
          title="Playlist equalizer"
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} className={`spectrum-bar bar-${i + 1}`} />
          ))}
        </div>

        {/* 3. Controls: Previous, Play/Pause, Next */}
        <div className="music-player-controls">
          <button
            type="button"
            className="music-ctrl-btn"
            onClick={handlePrev}
            disabled={!hasSongs}
            aria-label="Previous Track"
            title="Previous Track"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            className="music-ctrl-btn music-play-btn"
            onClick={handleTogglePlay}
            disabled={!hasSongs}
            aria-label={isPlaying ? "Pause Music" : "Play Music"}
            title={isPlaying ? "Pause Music" : "Play Music"}
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

          <button
            type="button"
            className="music-ctrl-btn"
            onClick={handleNext}
            disabled={!hasSongs}
            aria-label="Next Track"
            title="Next Track"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Thin Vertical Divider */}
        <div className="music-vertical-divider" aria-hidden="true" />

        {/* 4. Actions: Volume & Playlist Dropdown Trigger */}
        <div className="music-player-actions">
          {/* Volume Control */}
          <div
            className="music-volume-container"
            onMouseEnter={() => setShowVolumePopup(true)}
            onMouseLeave={() => setShowVolumePopup(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="music-ctrl-btn music-vol-btn"
              onClick={handleToggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute" : "Volume"}
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
              className={`music-volume-popup ${showVolumePopup ? 'is-visible' : ''}`}
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
                className="music-volume-slider"
                aria-label="Volume slider"
              />
            </div>
          </div>

          {/* Playlist Dropdown Button */}
          <button
            type="button"
            className={`music-ctrl-btn music-playlist-btn ${isDropdownOpen ? 'is-active' : ''}`}
            onClick={() => hasSongs && setIsDropdownOpen((prev) => !prev)}
            disabled={!hasSongs}
            aria-label="View Playlist"
            title="View Playlist"
            aria-expanded={isDropdownOpen}
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

      {/* Playlist Dropdown Menu (Scrollable, highlighted current track in exact manifest order) */}
      {isDropdownOpen && hasSongs && (
        <div
          ref={dropdownRef}
          className="music-playlist-dropdown"
          role="dialog"
          aria-label="Playlist Tracks"
        >
          <div className="music-playlist-header">
            <span className="playlist-header-title">Dedicated to You</span>
            <span className="playlist-header-count">{songs.length} {songs.length === 1 ? 'track' : 'tracks'}</span>
          </div>

          <ul className="music-playlist-list" role="listbox">
            {songs.map((song, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <li
                  key={song.id || idx}
                  className={`music-playlist-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectTrack(idx)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTrack(idx);
                    }
                  }}
                >
                  <span className="music-item-index">
                    {isSelected && isPlaying ? (
                      <span className="eq-dot-indicator" />
                    ) : (
                      `${idx + 1}`
                    )}
                  </span>
                  <span className="music-item-title" title={song.title}>
                    {song.title}
                  </span>
                  {isSelected && (
                    <span className="music-item-badge">Playing</span>
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
