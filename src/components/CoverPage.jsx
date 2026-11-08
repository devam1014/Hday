import React, { useState, useEffect, useRef, useCallback } from 'react';
import Countdown from './Countdown';
import FireworksCanvas from './FireworksCanvas';
import HeartButton from './HeartButton';
import BirthdayFireworksCelebration from './BirthdayFireworksCelebration';
import { BIRTHDAY_CONFIG } from '../config';

/**
 * CoverPage Component (Section 2: Firecracker & Rooftop Fireworks Celebration)
 * - Preserves the composition of cover.png (romantic rooftop balcony)
 * - Timer 2: Independent countdown timer displayed on the rooftop wall
 * - Ambient fireworks bursting in the distant open sky
 * - Floating Glowing Heart Button (<M>) near the right edge
 * - Grand "HAPPY BIRTHDAY" particle firecracker celebration triggered when Timer 2 reaches zero or signaled
 * - Transitions smoothly to Main Birthday Page ONLY when the heart button is clicked after celebration
 */
export default function CoverPage({
  targetDate,
  onProceedToMain,
  celebrationSignal = 0,
}) {
  const containerRef = useRef(null);
  // Crackers / fireworks active state: false while Timer 2 is counting down, true when Timer 2 hits zero or is signaled
  const [crackersActive, setCrackersActive] = useState(() => celebrationSignal > 0);
  // Celebration stage: 'idle' | 'forming' | 'holding' | 'exiting'
  const [celebrationStage, setCelebrationStage] = useState('idle');
  const [imageBounds, setImageBounds] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    isMobile: false
  });

  // Listen to celebrationSignal from App.jsx (e.g. from Firecracker Timer Test or Cover reset)
  const prevSignalRef = useRef(celebrationSignal);
  useEffect(() => {
    if (celebrationSignal > 0 && celebrationSignal !== prevSignalRef.current) {
      prevSignalRef.current = celebrationSignal;
      setCrackersActive(true);
      setCelebrationStage('idle');
    } else if (celebrationSignal === 0) {
      prevSignalRef.current = 0;
      setCrackersActive(false);
      setCelebrationStage('idle');
    }
  }, [celebrationSignal]);

  // When Timer 2 on the rooftop wall hits 0:
  // Launch colorful crackers/fireworks in open sky; do NOT form HAPPY BIRTHDAY yet!
  const handleTimer2WallComplete = useCallback(() => {
    setCrackersActive(true);
  }, []);

  // Heart button clicks:
  // - First click: starts particle-based "HAPPY BIRTHDAY" animation
  // - Second click: smoothly transitions to main birthday page
  const handleHeartClick = useCallback(() => {
    if (celebrationStage === 'idle') {
      // First click: start "HAPPY BIRTHDAY" letter animation
      setCelebrationStage('forming');
    } else if (celebrationStage === 'holding') {
      // Second click: smoothly proceed to main birthday page
      setCelebrationStage('exiting');
    }
    // Clicks during 'forming' or 'exiting' are safely ignored
  }, [celebrationStage]);

  const handleCelebrationFormed = useCallback(() => {
    // "HAPPY BIRTHDAY" has completely formed in sky -> hold state indefinitely
    setCelebrationStage('holding');
  }, []);

  const handleCelebrationComplete = useCallback(() => {
    // Transition to main birthday page after smooth fade out
    onProceedToMain?.();
  }, [onProceedToMain]);

  const updateBounds = useCallback(() => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const imgAspect = 1672 / 941;
    const vpAspect = vpW / vpH;
    const isMobile = vpW <= 768;

    let renderW, renderH, offsetX, offsetY;

    if (isMobile) {
      // Mobile: object-position: 28% bottom
      renderH = vpH;
      renderW = vpH * imgAspect;
      offsetX = (vpW - renderW) * 0.28;
      offsetY = 0;
    } else {
      if (vpAspect > imgAspect) {
        // Wider than image: width fits viewport, height scaled
        renderW = vpW;
        renderH = vpW / imgAspect;
        offsetX = 0;
        offsetY = vpH - renderH;
      } else {
        // Taller than image: height fits viewport, width scaled
        renderH = vpH;
        renderW = vpH * imgAspect;
        offsetX = (vpW - renderW) / 2;
        offsetY = 0;
      }
    }

    setImageBounds({
      width: Math.round(renderW),
      height: Math.round(renderH),
      left: Math.round(offsetX),
      top: Math.round(offsetY),
      isMobile
    });
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [updateBounds]);

  return (
    <div className="cover-page-root" ref={containerRef}>
      {/* Rooftop Background Scene (cover.png) */}
      <div className="cover-background-container" aria-hidden="true">
        <img
          src={BIRTHDAY_CONFIG.cover.backgroundImage}
          alt="Romantic rooftop balcony overlooking twilight sky"
          className="cover-background-image"
        />
      </div>

      {/* Coordinate Layer aligned to cover.png */}
      {imageBounds.width > 0 && (
        <div
          className="cover-image-overlay-layer"
          style={{
            position: 'absolute',
            left: `${imageBounds.left}px`,
            top: `${imageBounds.top}px`,
            width: `${imageBounds.width}px`,
            height: `${imageBounds.height}px`,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Timer 2: Wall-Mounted Countdown Timer */}
          <div className={`wall-countdown-positioner ${imageBounds.isMobile ? 'is-mobile' : ''}`}>
            <Countdown
              targetDate={targetDate}
              onComplete={handleTimer2WallComplete}
            />
          </div>
        </div>
      )}

      {/* Colorful Crackers / Fireworks Canvas Layer (Active when Timer 2 completes or signaled, until exit) */}
      <FireworksCanvas active={crackersActive && celebrationStage !== 'exiting'} />

      {/* Floating Glowing Heart Button Near Right Edge (<M>) - Appears & active when crackers start */}
      {crackersActive && (
        <HeartButton
          celebrationStage={celebrationStage}
          onTap={handleHeartClick}
        />
      )}

      {/* Special Celebration: "HAPPY BIRTHDAY" fireworks celebration in open sky (Triggered by 1st Heart Click) */}
      {celebrationStage !== 'idle' && (
        <BirthdayFireworksCelebration
          imageBounds={imageBounds}
          isExiting={celebrationStage === 'exiting'}
          onFormed={handleCelebrationFormed}
          onComplete={handleCelebrationComplete}
        />
      )}
    </div>
  );
}
