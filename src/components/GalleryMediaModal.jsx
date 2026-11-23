import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { audioController } from '../utils/audioController';
import VideoMemoriesModal from './VideoMemoriesModal';

/**
 * Helper to determine if a media item is a video by type or file extension
 * Supports: mp4, webm, mov, and explicit type='video'
 */
export function isVideoMedia(src = '', type = '') {
  if (type === 'video') return true;
  if (type === 'image' || type === 'img') return false;
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src || '');
}

// Module-level session volume memory so visitor preference persists across items
let sessionVideoVolume = 0.8;
let sessionVideoMuted = false;

/**
 * GalleryMediaModal Component
 *
 * Large centered frosted-glass viewer modal for EVERY image and video in Sad Gallery and Happy Gallery.
 * Exact visual specification:
 * - Large transparent glass card (symmetrical near-square desktop footprint: min(94vw, 90vh, 790px))
 * - Thin champagne-gold border and soft golden outer glow
 * - Rounded corners (border-radius: 42px)
 * - Subtle backdrop blur and background dimming (gallery background visible behind)
 * - Circular close button in top-right corner
 * - Media centered inside card with object-fit: contain (aspect ratio strictly preserved, never cropped/stretched)
 * - FOR IMAGES: Zoom controls at bottom (Zoom In, Zoom Out, Reset, drag/pan when zoomed in, double-click zoom)
 * - FOR VIDEOS:
 *   * Controls ALWAYS visible whether playing or paused (never auto-hidden)
 *   * Play/Pause button
 *   * Volume button + Volume range slider
 *   * Sound enabled by default (not muted, volume 0.8)
 *   * Centered Play/Pause overlay where appropriate
 *   * ZERO native browser controls
 * - Dismissal: Close button, Escape key, or clicking outside closes viewer.
 * - Video cleanup: Pauses video on close, restores audioController and gallery audio without overlapping sounds.
 */
export default function GalleryMediaModal({
  isOpen,
  onClose,
  media,
  src,
  mediaType,
  alt = 'Gallery memory',
  theme = 'sad',
}) {
  // Extract source and media type
  const effectiveSrc = media?.src || src || '';
  const effectiveType = media?.type || mediaType || '';
  const isVideo = isVideoMedia(effectiveSrc, effectiveType);
  const effectiveAlt = media?.alt || alt || 'Gallery memory';

  // Modal animation state
  const [isClosing, setIsClosing] = useState(false);

  // Image zoom & pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  // Video playback & volume state (enabled by default)
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => sessionVideoVolume);
  const [isMuted, setIsMuted] = useState(() => sessionVideoMuted);

  // Reset all states when modal opens or source changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
      setIsClosing(false);
      setImageError(false);
      setIsPlaying(false);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        // Sound enabled by default (never muted)
        videoRef.current.volume = sessionVideoVolume;
        videoRef.current.muted = sessionVideoMuted;
      }
    }
  }, [isOpen, effectiveSrc]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle dismissal with animation and full audio cleanup
  const handleDismiss = useCallback(() => {
    // 1. Immediately pause video and clean up sound
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);

    // 2. Resume gallery background music
    window.dispatchEvent(
      new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
    );
    audioController.resumeAfterVideo();

    // 3. Trigger exit transition then invoke onClose
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 240);
  }, [onClose]);

  // Ensure background audio resumes if component unmounts while modal was open
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
      audioController.resumeAfterVideo();
    };
  }, []);

  // Keyboard shortcut listener (Esc to close, Space for video, +/-/0 for image zoom)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (!isVideo) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(2))));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoom((prev) => {
            const next = Math.max(1, Number((prev - 0.5).toFixed(2)));
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
          });
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      } else if (isVideo) {
        if (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
          e.preventDefault();
          toggleVideoPlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isVideo, handleDismiss]);

  // ---------------------------------------------------------------------------
  // VIDEO CONTROLS & AUDIO COORDINATION
  // ---------------------------------------------------------------------------
  const toggleVideoPlay = (e) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.volume = volume;
      vid.muted = isMuted;
      vid
        .play()
        .then(() => {
          setIsPlaying(true);
          window.dispatchEvent(
            new CustomEvent('gallery-video-state-change', { detail: { isPlaying: true } })
          );
          audioController.pauseForVideo();
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      vid.pause();
      setIsPlaying(false);
      window.dispatchEvent(
        new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
      );
      audioController.resumeAfterVideo();
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    sessionVideoVolume = val;
    const vid = videoRef.current;
    if (vid) {
      vid.volume = val;
      if (val === 0) {
        setIsMuted(true);
        sessionVideoMuted = true;
        vid.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        sessionVideoMuted = false;
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
    sessionVideoMuted = nextMuted;
    vid.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      sessionVideoVolume = 0.8;
      vid.volume = 0.8;
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    window.dispatchEvent(
      new CustomEvent('gallery-video-state-change', { detail: { isPlaying: false } })
    );
    audioController.resumeAfterVideo();
  };

  // ---------------------------------------------------------------------------
  // IMAGE ZOOM & PAN CONTROLS
  // ---------------------------------------------------------------------------
  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(2))));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const maxPan = 280 * (zoom - 1);
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY)),
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e) => {
    if (zoom <= 1 || !e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    const onTouchMove = (moveEvent) => {
      if (!moveEvent.touches || moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const deltaX = t.clientX - dragStartRef.current.startX;
      const deltaY = t.clientY - dragStartRef.current.startY;
      const maxPan = 280 * (zoom - 1);
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY)),
      });
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
  };

  if (!isOpen) return null;

  // Unified Q&A Enlarged Video Viewer Architecture for videos
  if (isVideo) {
    return (
      <VideoMemoriesModal
        isOpen={isOpen}
        onClose={handleDismiss}
        videoSrc={effectiveSrc}
        theme={theme}
        alt={effectiveAlt}
      />
    );
  }

  const modalContent = (
    <div
      className={`image-modal-backdrop ${isClosing ? 'is-closing' : 'is-open'}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={isVideo ? 'Enlarged Video Viewer' : 'Enlarged Photo Viewer'}
    >
      {/* Large Symmetrical Frosted Glass Card Container */}
      <div
        className={`image-modal-card ${isClosing ? 'is-closing' : 'is-open'} gallery-media-modal-card ${theme}-gallery-theme`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="image-modal-close-btn"
          aria-label="Close viewer"
          title="Close (Esc)"
        >
          <X className="image-close-icon" />
        </button>

        {/* ==============================================================
            A. ENLARGED VIDEO VIEWER:
               - Controls ALWAYS visible (paused and playing)
               - Play/Pause button + Volume button & slider
               - Sound enabled by default
               - Centered Play/Pause overlay
               - ZERO native browser controls
            ============================================================== */}
        {isVideo ? (
          <div
            className="gallery-modal-video-stage"
            onClick={toggleVideoPlay}
            role="region"
            aria-label={effectiveAlt}
          >
            <video
              ref={videoRef}
              src={effectiveSrc}
              className="gallery-modal-video-element"
              playsInline
              controls={false}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnded}
            />

            {/* Centered Play/Pause Button Overlay in Enlarged Video Viewer */}
            <div
              className={`gallery-modal-center-play-overlay ${isPlaying ? 'is-playing' : 'is-paused'}`}
            >
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="gallery-modal-center-play-btn"
                aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
                title={isPlaying ? 'Pause Video (Space)' : 'Play Video (Space)'}
              >
                {isPlaying ? (
                  <Pause size={34} className="gallery-video-center-icon" />
                ) : (
                  <Play size={34} className="gallery-video-center-icon play-icon-shifted" />
                )}
              </button>
            </div>

            {/* Enlarged Video Viewer Custom Controls Bar (ALWAYS VISIBLE) */}
            <div
              className="gallery-modal-video-controls-bar"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="gallery-modal-ctrl-btn"
                aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
                title={isPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="play-icon-shifted" />}
              </button>

              <span className="gallery-modal-ctrl-divider" />

              <div className="gallery-modal-volume-group">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="gallery-modal-ctrl-btn"
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
                  className="gallery-modal-volume-slider"
                  aria-label="Video Volume Slider"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ==============================================================
             B. IMAGE VIEWER: Aspect Ratio Preserved, Zoom & Pan Controls
             ============================================================== */
          <>
            <div
              ref={containerRef}
              className={`image-viewer-stage ${zoom > 1 ? (isDragging ? 'is-grabbing' : 'is-grabbable') : 'is-zoomable'}`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onDoubleClick={handleDoubleClick}
            >
              {!imageError && effectiveSrc ? (
                <img
                  ref={imageRef}
                  src={effectiveSrc}
                  alt={effectiveAlt}
                  draggable={false}
                  className="image-viewer-img"
                  onError={() => setImageError(true)}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.22s ease-out',
                  }}
                />
              ) : (
                <div className="image-viewer-empty-placeholder" aria-hidden="true" />
              )}
            </div>

            {/* Small Elegant Zoom Controls (Floating at bottom inside glass card) */}
            <div className="image-viewer-zoom-bar" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className={`image-zoom-btn ${zoom <= 1 ? 'is-disabled' : ''}`}
                aria-label="Zoom out"
                title="Zoom Out (-)"
              >
                <ZoomOut size={18} />
              </button>

              <span className="image-zoom-level-badge">{Math.round(zoom * 100)}%</span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3.5}
                className={`image-zoom-btn ${zoom >= 3.5 ? 'is-disabled' : ''}`}
                aria-label="Zoom in"
                title="Zoom In (+)"
              >
                <ZoomIn size={18} />
              </button>

              {(zoom > 1 || pan.x !== 0 || pan.y !== 0) && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="image-zoom-btn btn-reset"
                  aria-label="Reset zoom"
                  title="Reset Zoom (0)"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
