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
 * Unified cinematic enlarged video viewer for Q&A, Sad Gallery, and Happy Gallery:
 * - Dynamic aspect ratio detection: supports portrait (9:16), landscape (16:9), and square videos
 * - Preserves original aspect ratio without cropping, squeezing, or stretching (object-fit: contain)
 * - Large centered translucent frosted-glass card with subtle border and soft glow
 * - Dark, softly blurred background overlay
 * - Prominent close button in upper-right corner
 * - Clean CSS-based centered Play button (Blue for Sad, Orange for Happy, Champagne for Q&A)
 * - Custom control row placed in a separate area BELOW the video, never covering video content
 * - Controls remain VISIBLE AT ALL TIMES (never hidden by a timeout)
 * - Full controls: Play/Pause, Time display, Progress Scrubber (with seeking), Volume button + slider, Fullscreen
 * - Complete dismissal via Close button, Escape key, or clicking outside
 * - Pauses video on dismiss and restores background music only if it was playing previously
 */
export default function VideoMemoriesModal({
  isOpen,
  onClose,
  videoSrc = '/video-for-main-page/1.mp4',
  sectionNumber = 1,
  sectionTitle = '',
  theme = 'qna',
  alt = 'Video Player',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [aspectRatioType, setAspectRatioType] = useState('landscape'); // 'portrait' | 'landscape' | 'square'

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const scrubberTrackRef = useRef(null);

  // Reset playback and error state whenever the video source changes or modal opens
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.volume = 0.8;
      videoRef.current.muted = false;
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
    window.dispatchEvent(
      new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
    );
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
  // 4. PLAYBACK CONTROLS
  // ---------------------------------------------------------------------------
  const togglePlay = (e) => {
    e?.stopPropagation();
    if (hasError) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.muted = isMuted;
      video.volume = volume;
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          window.dispatchEvent(
            new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
          );
          audioController.pauseForVideo();
        })
        .catch((err) => {
          console.warn('Playback error:', err);
          setHasError(true);
        });
    } else {
      video.pause();
      setIsPlaying(false);
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
      audioController.resumeAfterVideo();
    }
  };

  const handleCentralPlay = (e) => {
    e.stopPropagation();
    if (hasError) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
    video
      .play()
      .then(() => {
        setIsPlaying(true);
        window.dispatchEvent(
          new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
        );
        audioController.pauseForVideo();
      })
      .catch((err) => {
        console.warn('Playback error:', err);
        setHasError(true);
      });
  };

  // ---------------------------------------------------------------------------
  // 5. SCRUBBER / SEEKING CONTROLS
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
  // 6. VOLUME CONTROLS
  // ---------------------------------------------------------------------------
  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.8;
      setVolume(0.8);
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
  // 7. FULLSCREEN TOGGLE
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
  // 8. VIDEO EVENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleTimeUpdate = () => {
    if (!isScrubbing && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vid = videoRef.current;
      setDuration(vid.duration || 0);
      setVolume(vid.volume);
      setIsMuted(vid.muted);

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
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    window.dispatchEvent(
      new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
    );
    audioController.resumeAfterVideo();
  };

  const handleVideoError = () => {
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
      aria-label={alt || 'Video Player'}
    >
      {/* Outer Frosted Glass Card with Dynamic Responsive Sizing */}
      <div
        className={`video-modal-card ${isClosing ? 'is-closing' : 'is-open'} is-${aspectRatioType} ${theme}-video-modal-theme`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="video-modal-close-btn"
          aria-label="Close video viewer"
          title="Close (Esc)"
        >
          <X className="video-close-icon" />
        </button>

        {/* Video Player Container (Centered, object-fit: contain, never cropped or stretched) */}
        <div
          ref={playerContainerRef}
          className="video-player-container"
          onClick={hasError ? undefined : togglePlay}
        >
          {/* Native HTML5 Video Element */}
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
              window.dispatchEvent(
                new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
              );
              audioController.pauseForVideo();
            }}
            onPause={() => {
              setIsPlaying(false);
              window.dispatchEvent(
                new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
              );
              audioController.resumeAfterVideo();
            }}
            onEnded={handleVideoEnded}
          />

          {/* Central Large Play Button (Themed for Sad Blue, Happy Orange, or Q&A Gold) */}
          {!hasError && (
            <button
              type="button"
              onClick={handleCentralPlay}
              className={`video-central-play-btn ${isPlaying ? 'is-hidden' : 'is-visible'}`}
              aria-label="Play video"
              title="Play"
            >
              <div className="video-central-play-circle">
                <Play className="video-central-play-icon" fill="#ffffff" stroke="#ffffff" />
              </div>
            </button>
          )}
        </div>

        {/* Separate Compact Control Row Immediately BELOW the Video (Always Visible) */}
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
              <Pause className="video-ctrl-icon" fill="#ffffff" stroke="#ffffff" />
            ) : (
              <Play className="video-ctrl-icon" fill="#ffffff" stroke="#ffffff" />
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
