import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

/**
 * Floating Heart Button
 * - Small circular button with glowing pink/rose-gold outer halo
 * - White heart symbol in the center
 * - Floats near the RIGHT EDGE of the viewport in the open sky
 * - Continuous, slow, elegant lantern-like floating motion
 * - Two-stage interaction:
 *   Stage 1 (idle): Tap to launch the birthday celebration and reveal "HAPPY BIRTHDAY"
 *   Stage 2 (holding): Tap to gently transition to the main birthday page
 */
export default function HeartButton({ onTap, celebrationStage = 'idle' }) {
  const [isFirstTapped, setIsFirstTapped] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Reset local state if celebration resets back to idle
  useEffect(() => {
    if (celebrationStage === 'idle') {
      setIsFirstTapped(false);
      setIsExiting(false);
    }
  }, [celebrationStage]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (celebrationStage === 'idle') {
      if (isFirstTapped) return;
      setIsFirstTapped(true);
      // Brief tactile pulse before triggering celebration
      setTimeout(() => {
        onTap?.();
      }, 180);
    } else if (celebrationStage === 'holding') {
      if (isExiting) return;
      setIsExiting(true);
      // Second click: Burst ripple before triggering page transition
      setTimeout(() => {
        onTap?.();
      }, 260);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  };

  // Determine visual state class and titles
  let stateClass = '';
  let buttonTitle = 'Tap to reveal birthday surprise';
  let buttonAria = 'Open Birthday Surprise';

  if (celebrationStage === 'idle') {
    if (isFirstTapped) stateClass = 'heart-first-tap';
  } else if (celebrationStage === 'forming') {
    stateClass = 'heart-celebrating';
    buttonTitle = 'Birthday celebration in progress...';
  } else if (celebrationStage === 'holding') {
    if (isExiting) {
      stateClass = 'heart-bursting';
    } else {
      stateClass = 'heart-holding-ready';
      buttonTitle = 'Tap heart to open your surprise ❤️';
      buttonAria = 'Enter Birthday Surprise';
    }
  } else if (celebrationStage === 'exiting') {
    stateClass = 'heart-bursting';
  }

  const isClickDisabled = celebrationStage === 'forming' || isExiting;

  return (
    <div className="heart-sky-anchor" aria-live="polite">
      <button
        type="button"
        disabled={isClickDisabled}
        className={`wall-heart-button ${stateClass}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={buttonAria}
        title={buttonTitle}
      >
        {/* Glowing Outer Halo */}
        <div className="heart-outer-halo" aria-hidden="true" />

        {/* Orbiting Tiny Sparkles */}
        <span className="tiny-sparkle sp1" aria-hidden="true">✦</span>
        <span className="tiny-sparkle sp2" aria-hidden="true">✦</span>

        {/* Circular Button Core */}
        <div className="heart-circle-core">
          <Heart className="white-heart-icon" fill="#ffffff" />
        </div>
      </button>
    </div>
  );
}
