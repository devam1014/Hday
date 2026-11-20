import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

/**
 * ImageMemoriesModal Component
 *
 * Click-to-open square transparent frosted-glass image viewer for the birthday memory image.
 * Uses the exact same glass material, transparency, champagne-gold border, and glow as the video viewer:
 * - Square / Near-Square outer frosted glass card
 * - Adapts cleanly to ANY aspect ratio (Portrait 9:16, Landscape 16:9, Square 1:1, etc.)
 * - `object-fit: contain` with zero cropping, distortion, or artificial enlargement
 * - Interactive zoom in, zoom out, reset, and click-and-drag panning
 * - Smooth fade-in / scale animation
 * - Subtle background darkening and light blur behind modal
 * - Circular champagne-gold close button at top-right
 */
export default function ImageMemoriesModal({
  isOpen,
  onClose,
  imageSrc,
  alt = 'Special moment memory',
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  // Reset zoom & pan whenever the modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
      setIsClosing(false);
      setHasError(false);
    }
  }, [isOpen, imageSrc]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle dismissal with animation
  const handleDismiss = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 240);
  }, [onClose]);

  // Keyboard shortcut listener (Esc to close, +/- to zoom, 0 to reset)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === '+' || e.key === '=') {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  // Zoom controls
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

  // Double click to toggle zoom between 1x and 2x
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  // Mouse pan handlers
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

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      // Max allowable pan based on zoom scale
      const maxPan = 280 * (zoom - 1);
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch pan handlers
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

    const handleTouchMove = (moveEvent) => {
      if (!moveEvent.touches || moveEvent.touches.length !== 1) return;
      const moveTouch = moveEvent.touches[0];
      const deltaX = moveTouch.clientX - dragStartRef.current.startX;
      const deltaY = moveTouch.clientY - dragStartRef.current.startY;

      const maxPan = 280 * (zoom - 1);
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY)),
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`image-modal-backdrop ${isClosing ? 'is-closing' : 'is-open'}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged Memory Photo Viewer"
    >
      {/* Square / Near-Square Transparent Frosted Glass Card */}
      <div
        className={`image-modal-card ${isClosing ? 'is-closing' : 'is-open'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="image-modal-close-btn"
          aria-label="Close photo viewer"
          title="Close (Esc)"
        >
          <X className="image-close-icon" />
        </button>

        {/* Inner Stage (Image Area - Clipped to card boundaries) */}
        <div
          ref={containerRef}
          className={`image-viewer-stage ${zoom > 1 ? (isDragging ? 'is-grabbing' : 'is-grabbable') : 'is-zoomable'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClick}
        >
          {!hasError && imageSrc ? (
            <img
              ref={imageRef}
              src={imageSrc}
              alt=""
              draggable={false}
              className="image-viewer-img"
              onError={() => setHasError(true)}
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
      </div>
    </div>
  );
}
