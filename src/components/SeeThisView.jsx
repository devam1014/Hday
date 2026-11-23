import React, { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { BIRTHDAY_CONFIG } from '../config';

/**
 * SeeThisView Component
 *
 * Implements the isolated "See This View" fullscreen background-only feature:
 * - Subtle glass button placed consistently in the top-right utility area.
 * - Clicking displays ONLY the active section's true background image in fullscreen.
 * - Hides all foreground cards, text, buttons, player controls, overlays, and glass elements.
 * - Preserves aspect ratio with clean cover fit and no stretching.
 * - Exits immediately upon clicking/tapping anywhere or pressing Escape.
 * - Completely isolated: never resets countdowns, never stops/restarts music, never changes scroll/navigation.
 */
export default function SeeThisView({
  backgroundImage,
  alt = 'Fullscreen background view',
}) {
  const [isActive, setIsActive] = useState(false);

  const handleOpen = useCallback((e) => {
    e.stopPropagation();
    setIsActive(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsActive(false);
  }, []);

  // Escape key listener to exit fullscreen background mode
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleClose]);

  const isDevUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('dev') === 'true' ||
    new URLSearchParams(window.location.search).get('test') === 'true' ||
    window.location.hash === '#dev' ||
    window.location.hash === '#test'
  );
  const showDevControls = (isDevUrl || Boolean(BIRTHDAY_CONFIG?.dev?.showDevControls));

  return (
    <>
      <div
        className={`see-this-view-container ${showDevControls ? 'has-dev-controls' : 'no-dev-controls'}`}
      >
        <button
          type="button"
          onClick={handleOpen}
          className="see-this-view-btn"
          aria-label="See This View: Fullscreen background view"
          title="See This View: View background in fullscreen"
        >
          <Eye size={14} className="see-this-view-icon" />
          <span>See This View</span>
        </button>
      </div>

      {isActive && backgroundImage && (
        <div
          className="see-this-view-fullscreen-layer"
          onClick={handleClose}
          role="button"
          tabIndex={0}
          aria-label="Click or press Escape to exit fullscreen background view"
          title="Click anywhere or press Esc to exit"
        >
          <img
            src={backgroundImage}
            alt={alt}
            className="see-this-view-fullscreen-img"
          />
        </div>
      )}
    </>
  );
}
