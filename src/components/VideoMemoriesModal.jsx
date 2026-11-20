import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioController } from '../utils/audioController';
import {
  X,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical,
} from 'lucide-react';

/**
 * Format seconds to M:SS (or H:MM:SS if > 1 hour)
 */
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * VideoMemoriesModal Component
 *
 * Implements the exact portrait 9:16 video modal matching the reference design:
 * - Outer Glass Card: Thick dark translucent frosted glass with warm peach/champagne glowing border & outward bloom
 * - Close Button: Circular button at top-right of glass card with subtle warm glow
 * - Inner Player: 9:16 portrait video container with rounded corners and sharp native rendering
 * - Central Play Button: Large circular translucent glass button over video
 * - Bottom Controls: Working Play/Pause, Progress Scrubber, Time Display, Volume Slider, Fullscreen
 * - Complete dismissal: Close button, Escape key, or backdrop click stops & resets video and restores page
 */
export default function VideoMemoriesModal({
  isOpen,
  onClose,
  videoSrc = '/video-for-main-page/1.mp4',
  sectionNumber = 1,
  sectionTitle = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const scrubberTrackRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  // Reset playback and error state whenever the video source changes or modal opens
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [videoSrc, isOpen]);

  // ---------------------------------------------------------------------------
  // 1. LOCK BODY SCROLL & AUDIO SAFETY WHEN MODAL IS OPEN
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      audioController.resumeAfterVideo();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      if (videoRef.current) {
        videoRef.current.pause();
      }
      audioController.resumeAfterVideo();
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // 2. DISMISSAL HANDLERS (CLOSE, ESCAPE, BACKDROP)
  // ---------------------------------------------------------------------------
  const handleDismiss = useCallback(() => {
    // 1. Immediately pause video and stop its audio
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsClosing(true);

    // 2. Resume background music from exact paused position (only if playing before video)
    audioController.resumeAfterVideo();

    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 240);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  // ---------------------------------------------------------------------------
  // 3. FULLSCREEN CHANGE LISTENER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 4. AUTOHIDE CONTROLS WHEN PLAYING
  // ---------------------------------------------------------------------------
  const scheduleControlsHide = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying && !isScrubbing) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2600);
    }
  }, [isPlaying, isScrubbing]);

  const handlePlayerMouseMove = () => {
    scheduleControlsHide();
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    } else {
      scheduleControlsHide();
    }
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, scheduleControlsHide]);

  // ---------------------------------------------------------------------------
  // 5. PLAYBACK CONTROLS
  // ---------------------------------------------------------------------------
  const togglePlay = (e) => {
    e?.stopPropagation();
    if (hasError) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch((err) => {
        console.warn('Playback error:', err);
        setHasError(true);
      });
    } else {
      video.pause();
    }
  };

  const handleCentralPlay = (e) => {
    e.stopPropagation();
    if (hasError) return;
    const video = videoRef.current;
    if (!video) return;
    video.play().catch((err) => {
      console.warn('Playback error:', err);
      setHasError(true);
    });
  };

  // ---------------------------------------------------------------------------
  // 6. SCRUBBER / SEEKING CONTROLS
  // ---------------------------------------------------------------------------
  const seekToPosition = useCallback(
    (clientX) => {
      const track = scrubberTrackRef.current;
      const video = videoRef.current;
      if (!track || !video || !duration) return;

      const rect = track.getBoundingClientRect();
      const progressRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = progressRatio * duration;

      video.currentTime = targetTime;
      setCurrentTime(targetTime);
    },
    [duration]
  );

  const handleScrubberMouseDown = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    seekToPosition(e.clientX);

    const handleMouseMove = (moveEvent) => {
      seekToPosition(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleScrubberTouchStart = (e) => {
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      setIsScrubbing(true);
      seekToPosition(e.touches[0].clientX);

      const handleTouchMove = (moveEvent) => {
        if (moveEvent.touches && moveEvent.touches[0]) {
          seekToPosition(moveEvent.touches[0].clientX);
        }
      };

      const handleTouchEnd = () => {
        setIsScrubbing(false);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. VOLUME CONTROLS
  // ---------------------------------------------------------------------------
  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const nextVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = nextVolume;
    setVolume(nextVolume);
    if (nextVolume === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. FULLSCREEN TOGGLE
  // ---------------------------------------------------------------------------
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const target = playerContainerRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 9. VIDEO EVENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleTimeUpdate = () => {
    if (!isScrubbing && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleVideoError = (e) => {
    // If video file is missing (404) or fails to decode, display graceful feedback
    setHasError(true);
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`video-modal-backdrop ${isClosing ? 'is-closing' : 'is-open'}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Our Memories Video Player"
    >
      {/* Outer Frosted Glass Card with Concentrated Golden Border Lighting */}
      <div
        className={`video-modal-card ${isClosing ? 'is-closing' : 'is-open'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="video-modal-close-btn"
          aria-label="Close memories video"
          title="Close (Esc)"
        >
          <X className="video-close-icon" />
        </button>

        {/* Inner 9:16 Portrait Video Player Container (No playback controls covering video) */}
        <div
          ref={playerContainerRef}
          className="video-player-container"
          onClick={hasError ? undefined : togglePlay}
        >
          {/* Native HTML5 Video Element (100% Sharp, zero blur, object-fit: contain) */}
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            playsInline
            preload="metadata"
            className={`video-player-media ${hasError ? 'is-hidden' : ''}`}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleLoadedMetadata}
            onError={handleVideoError}
            onPlay={() => {
              setIsPlaying(true);
              audioController.pauseForVideo();
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
          />

          {/* Central Large Play Button (Shown only when video is valid, not playing, and not in error) */}
          {!hasError && (
            <button
              type="button"
              onClick={handleCentralPlay}
              className={`video-central-play-btn ${isPlaying ? 'is-hidden' : 'is-visible'}`}
              aria-label="Play video"
              title="Play"
            >
              <div className="video-central-play-circle">
                <Play className="video-central-play-icon" fill="#ffffff" />
              </div>
            </button>
          )}
        </div>

        {/* Separate Compact Control Row Immediately BELOW the Video (Option 5 Layout) */}
        <div
          className={`video-external-controls-bar ${hasError ? 'is-disabled' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="video-ctrl-btn play-pause-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="video-ctrl-icon" fill="#ffffff" />
            ) : (
              <Play className="video-ctrl-icon" fill="#ffffff" />
            )}
          </button>

          {/* 2. Current Time / Duration Display */}
          <div className="video-ctrl-time">
            <span className="video-time-current">{formatTime(currentTime)}</span>
            <span className="video-time-sep">/</span>
            <span className="video-time-total">{formatTime(duration)}</span>
          </div>

          {/* 3. Progress Scrubber Track */}
          <div
            ref={scrubberTrackRef}
            className="video-ctrl-scrubber-track"
            onMouseDown={handleScrubberMouseDown}
            onTouchStart={handleScrubberTouchStart}
            role="slider"
            aria-label="Video scrubber"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
          >
            <div
              className="video-ctrl-scrubber-buffered"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="video-ctrl-scrubber-progress"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="video-ctrl-scrubber-thumb" />
            </div>
          </div>

          {/* 4. Volume Button & Slider Group */}
          <div className="video-ctrl-volume-group">
            <button
              type="button"
              onClick={toggleMute}
              className="video-ctrl-btn volume-btn"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="video-ctrl-icon" />
              ) : volume < 0.5 ? (
                <Volume1 className="video-ctrl-icon" />
              ) : (
                <Volume2 className="video-ctrl-icon" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="video-ctrl-volume-slider"
              aria-label="Volume slider"
            />
          </div>

          {/* 5. Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="video-ctrl-btn fullscreen-btn"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="video-ctrl-icon" />
            ) : (
              <Maximize className="video-ctrl-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
