import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

/**
 * GalleryVideoPlayer
 *
 * Dedicated video player for Sad and Happy galleries:
 * - ZERO native browser controls
 * - Displays with original aspect ratio (object-fit: contain)
 * - ONLY 2 custom controls:
 *   1. Play/Pause
 *   2. Volume / Mute
 * - Automatically pauses gallery background music when playing
 * - Automatically resumes gallery background music when paused, ended, or navigated away
 */
export default function GalleryVideoPlayer({ src, alt, theme = 'sad', isFading = false }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);

  // Notify gallery audio to pause when video plays, and resume when paused/unmounted
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
    }
  }, [isPlaying]);

  // Cleanup on unmount or src change: ensure video is paused and background music resumes
  useEffect(() => {
    setIsPlaying(false);
    return () => {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
    };
  }, [src]);

  // Toggle play/pause
  const togglePlay = (e) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  // Toggle mute
  const toggleMute = (e) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    vid.muted = newMuted;
  };

  // Adjust volume
  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    const vid = videoRef.current;
    if (vid) {
      vid.volume = val;
      if (val === 0) {
        setIsMuted(true);
        vid.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        vid.muted = false;
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  return (
    <div
      className={`gallery-video-container ${theme}-video-theme ${isFading ? 'is-fading' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      role="region"
      aria-label={alt || 'Gallery Video'}
    >
      <video
        ref={videoRef}
        src={src}
        className="gallery-video-element"
        playsInline
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Big Play Overlay (Centered, visible when paused) */}
      {!isPlaying && (
        <div className="gallery-video-center-overlay" aria-hidden="true">
          <button
            type="button"
            onClick={togglePlay}
            className="gallery-video-center-play-btn"
            aria-label="Play Video"
          >
            <Play size={32} className="gallery-video-play-icon" />
          </button>
        </div>
      )}

      {/* Floating Custom Controls Bar (ONLY 2 controls: Play/Pause and Volume) */}
      <div
        className={`gallery-video-controls-bar ${showControls || !isPlaying ? 'is-visible' : 'is-hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control 1: Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="gallery-video-ctrl-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <span className="gallery-video-ctrl-divider" />

        {/* Control 2: Volume / Mute Slider */}
        <div className="gallery-video-volume-group">
          <button
            type="button"
            onClick={toggleMute}
            className="gallery-video-ctrl-btn"
            aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
            title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="gallery-video-volume-slider"
            aria-label="Video Volume"
          />
        </div>
      </div>
    </div>
  );
}
