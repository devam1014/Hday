import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize } from 'lucide-react';
import { audioController } from '../utils/audioController';

/**
 * Format seconds to M:SS
 */
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * GalleryVideoPlayer
 *
 * Dedicated video player for Sad and Happy galleries:
 * - Dynamic aspect ratio detection (portrait, landscape, square) via onLoadedMetadata
 * - Preserves original aspect ratio without distortion, stretching, or cropping (object-fit: contain)
 * - Separate, neatly arranged custom control bar placed BELOW the video viewport, inside the glass card
 * - Controls NEVER cover, crop, or cut into any part of the video
 * - Working Play/Pause, Time display, Volume toggle + slider, and dedicated Enlarge control
 * - Perfectly centered, CSS-styled circular Play button:
 *   * Sad Gallery: Deep navy-blue translucent with bright-blue outline and glow
 *   * Happy Gallery: Deep warm-orange translucent with amber/orange outline and glow
 *   * Both have identical dimensions (58px), identical shape, identical 22px white triangle
 * - Sound enabled by default (volume 0.8, not muted)
 * - Clicking the video area or enlarge button opens the large centered viewer
 * - Seamless audioController and background music coordination
 */
export default function GalleryVideoPlayer({
  src,
  alt,
  theme = 'sad',
  isFading = false,
  onOpenModal,
  showControls = theme !== 'happy',
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatioType, setAspectRatioType] = useState('landscape'); // 'portrait' | 'landscape' | 'square'

  // Sound enabled by default (not muted, volume 0.8)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.8;
      videoRef.current.muted = false;
    }
  }, [src]);

  // Audio coordination: pause background music when video plays, resume when stopped
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
      );
      audioController.pauseForVideo();
    } else {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
      audioController.resumeAfterVideo();
    }
  }, [isPlaying]);

  // Cleanup on unmount or src change
  useEffect(() => {
    setIsPlaying(false);
    return () => {
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
      audioController.resumeAfterVideo();
    };
  }, [src]);

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration || 0);
    vid.volume = volume;
    vid.muted = isMuted;

    if (vid.videoWidth && vid.videoHeight) {
      const ratio = vid.videoWidth / vid.videoHeight;
      if (ratio >= 1.2) {
        setAspectRatioType('landscape');
      } else if (ratio <= 0.85) {
        setAspectRatioType('portrait');
      } else {
        setAspectRatioType('square');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused || vid.ended) {
      vid.muted = isMuted;
      vid.volume = volume;
      vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = (e) => {
    e?.stopPropagation();
    if (onOpenModal) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
      onOpenModal();
    } else {
      togglePlay(e);
    }
  };

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

  const toggleMute = (e) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    vid.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      vid.volume = 0.8;
    }
  };

  return (
    <div
      className={`gallery-video-wrapper ${theme}-video-theme ${isFading ? 'is-fading' : ''} is-${aspectRatioType}`}
      role="region"
      aria-label={alt || 'Gallery Video'}
    >
      {/* 1. Video Viewport: Proportionate, centered, never covered by controls */}
      <div
        className="gallery-video-viewport"
        onClick={handleVideoClick}
        tabIndex={0}
        role="button"
        title={onOpenModal ? 'Click to open in large viewer' : 'Click to play'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVideoClick(e);
          }
        }}
      >
        <video
          ref={videoRef}
          src={src}
          className="gallery-video-element"
          playsInline
          controls={false}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (videoRef.current) videoRef.current.currentTime = 0;
          }}
        />

        {/* 2. Centered Play Button (Visible when paused; Blue for Sad, Orange for Happy) */}
        {!isPlaying && (
          <div className="gallery-video-center-overlay" aria-hidden="true">
            <button
              type="button"
              onClick={handleVideoClick}
              className="gallery-video-center-play-btn"
              aria-label={onOpenModal ? 'Open in large viewer' : 'Play Video'}
              title={onOpenModal ? 'Open in large viewer' : 'Play Video'}
            >
              <Play className="gallery-video-play-icon" fill="#ffffff" stroke="#ffffff" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Custom Control Bar Placed in Separate Area BELOW the Video Viewport (Inside the Card) */}
      {showControls && (
        <div
          className="gallery-video-controls-bar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="gallery-video-ctrl-btn play-pause-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={15} fill="#ffffff" stroke="#ffffff" />
            ) : (
              <Play size={15} fill="#ffffff" stroke="#ffffff" className="play-icon-shifted" />
            )}
          </button>

          {/* Time Display */}
          <span className="gallery-video-time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <span className="gallery-video-ctrl-divider" />

          {/* Volume Button & Slider */}
          <div className="gallery-video-volume-group">
            <button
              type="button"
              onClick={toggleMute}
              className="gallery-video-ctrl-btn volume-btn"
              aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={15} />
              ) : volume < 0.5 ? (
                <Volume1 size={15} />
              ) : (
                <Volume2 size={15} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="gallery-video-volume-slider"
              aria-label="Volume slider"
            />
          </div>

          {/* Dedicated Enlarge / Full-screen Control Button */}
          {onOpenModal && (
            <>
              <span className="gallery-video-ctrl-divider" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) videoRef.current.pause();
                  setIsPlaying(false);
                  onOpenModal();
                }}
                className="gallery-video-ctrl-btn enlarge-btn"
                aria-label="Open enlarged viewer"
                title="Open in large viewer"
              >
                <Maximize size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
