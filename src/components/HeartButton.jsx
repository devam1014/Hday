import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';

/**
 * Redesigned Floating Heart Button (Glass Orb with Golden Orbit Ring & Ripple Rings)
 * Matches the reference design:
 * - Concentric translucent pink expanding rings behind the button
 * - Glossy rose-red glass orb with champagne-gold luminous rim
 * - Crisp, clean, bright ivory-white heart in the center
 * - Curved glossy glass highlight on upper hemisphere
 * - Tilted thin glowing golden orbit ring with radiant star sparkle glint
 * - Micro warm golden & pink particles around the orbit
 * - Interactive click ripple and bursting heart particle bloom
 */
export default function HeartButton({ onTap, celebrationStage = 'idle' }) {
  const [isFirstTapped, setIsFirstTapped] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [burstParticles, setBurstParticles] = useState([]);
  const clickLockRef = useRef(false);

  useEffect(() => {
    if (celebrationStage === 'idle') {
      setIsFirstTapped(false);
      setIsExiting(false);
      setIsClicking(false);
      setBurstParticles([]);
      clickLockRef.current = false;
    }
  }, [celebrationStage]);

  const triggerClickAnimation = () => {
    setIsClicking(true);

    // Generate 8 outward-floating micro heart/sparkle particles
    const particleAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const newParticles = particleAngles.map((angle, idx) => ({
      id: Date.now() + idx,
      angle,
      dist: 32 + (idx % 3) * 9,
      size: idx % 2 === 0 ? 12 : 9,
      color: idx % 2 === 0 ? '#fbbf24' : '#ff4b72',
    }));
    setBurstParticles(newParticles);

    setTimeout(() => {
      setIsClicking(false);
    }, 600);

    setTimeout(() => {
      setBurstParticles([]);
    }, 800);
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (clickLockRef.current) return;

    if (celebrationStage === 'idle') {
      if (isFirstTapped) return;
      clickLockRef.current = true;
      setIsFirstTapped(true);
      triggerClickAnimation();

      setTimeout(() => {
        onTap?.();
        clickLockRef.current = false;
      }, 200);
    } else if (celebrationStage === 'holding') {
      if (isExiting) return;
      clickLockRef.current = true;
      setIsExiting(true);
      triggerClickAnimation();

      setTimeout(() => {
        onTap?.();
      }, 280);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  };

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
        className={`wall-heart-button ${stateClass} ${isClicking ? 'is-clicked' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={buttonAria}
        title={buttonTitle}
      >
        {/* Expanding Translucent Rings Behind Button (Concentric Ripples) */}
        <div className="heart-expanding-rings" aria-hidden="true">
          <span className="ring-pulse ring-1" />
          <span className="ring-pulse ring-2" />
          <span className="ring-pulse ring-3" />
        </div>

        {/* Soft Pink-Red Ambient Glow */}
        <div className="heart-outer-glow" aria-hidden="true" />

        {/* Glowing Golden Orbit Ring */}
        <div className="heart-orbit-wrapper" aria-hidden="true">
          <svg className="heart-orbit-svg" viewBox="0 0 140 70">
            <defs>
              <linearGradient id="goldOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <ellipse
              cx="70"
              cy="35"
              rx="60"
              ry="20"
              transform="rotate(-18 70 35)"
              fill="none"
              stroke="url(#goldOrbitGrad)"
              strokeWidth="2.5"
            />
          </svg>

          {/* Star Sparkle Glint at Orbit Intersection */}
          <span className="orbit-glint-star" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 0C12 7.5 14.5 10 22 12C14.5 14 12 16.5 12 24C12 16.5 9.5 14 2 12C9.5 10 12 7.5 12 0Z" />
            </svg>
          </span>

          {/* Tiny Warm Floating Particles along Orbit */}
          <span className="orbit-micro-particle mp1" aria-hidden="true" />
          <span className="orbit-micro-particle mp2" aria-hidden="true" />
          <span className="orbit-micro-particle mp3" aria-hidden="true" />
        </div>

        {/* Glossy Pink & Rose-Red Glass Orb */}
        <div className="heart-orb-core">
          {/* Curved Glass Crescent Glare (Upper Edge) */}
          <div className="heart-orb-glass-glare" aria-hidden="true" />

          {/* Large, Clean, Bright Ivory-White Heart */}
          <Heart className="white-heart-icon" fill="#ffffff" />
        </div>

        {/* Click Expanding Ripple */}
        {isClicking && <div className="heart-click-ripple" aria-hidden="true" />}

        {/* Click Burst Particles (Pink & Golden Hearts) */}
        {burstParticles.map((p) => (
          <span
            key={p.id}
            className="heart-burst-particle"
            style={{
              '--angle': `${p.angle}deg`,
              '--dist': `${p.dist}px`,
              '--color': p.color,
              '--size': `${p.size}px`,
            }}
            aria-hidden="true"
          >
            ♥
          </span>
        ))}
      </button>
    </div>
  );
}
