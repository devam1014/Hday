import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import sadBg from '../../sad.png';
import sadCover from '../../sad-cover.jpg';
import sadFrame from '../../sad-frame.png?v=2';
import sadImg from '../../sad-img.png';
import { getSadPhotos } from '../data/sadPhotos';
import SadAtmosphere from './SadAtmosphere';
import SadLightning from './SadLightning';

/**
 * SadMemoriesGallery Component
 * 
 * Flow:
 * 1. Initial view: Displays sad-cover (sad-cover.jpg) as the album's opening cover page.
 * 2. Next click: Turns the page / smoothly opens the album to sad-img (sad-img.png) displaying Photo 1.
 * 3. Inside sad-img: User browses all 5 photographs (1 -> 2 -> 3 -> 4 -> 5).
 *    - Next button: advances Photo 1 -> 2 -> 3 -> 4 -> 5 (disabled on Photo 5).
 *    - Prev button: returns Photo 5 -> 4 -> 3 -> 2 -> 1 -> returns to album cover (sad-cover).
 *    - Each photo is fitted precisely inside the opening behind the frame.
 *    - Each photo displays its corresponding message and counter (e.g. 1 of 5).
 */
export default function SadMemoriesGallery({ onBack }) {
  // 'cover' (sad-cover.jpg) | 'img' (sad-img.png)
  const [view, setView] = useState('cover');
  const [photoIndex, setPhotoIndex] = useState(0); // 0..4 (Photos 1..5)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [transitionDir, setTransitionDir] = useState('forward'); // 'forward' | 'backward'
  const [photoFading, setPhotoFading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [lightningTrigger, setLightningTrigger] = useState(0);

  const photos = getSadPhotos();
  const currentPhoto = photos[photoIndex] || photos[0];

  const frameTimerRef = useRef(null);
  const photoTimerRef = useRef(null);

  // Trigger lightning on image changes
  const triggerLightning = useCallback(() => {
    setLightningTrigger((prev) => prev + 1);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (frameTimerRef.current) clearTimeout(frameTimerRef.current);
      if (photoTimerRef.current) clearTimeout(photoTimerRef.current);
    };
  }, []);

  // Preload photos
  useEffect(() => {
    photos.forEach((p) => {
      if (p.src) {
        const img = new Image();
        img.src = p.src;
      }
    });
  }, [photos]);

  // Smooth album page-turn transition between sad-cover and sad-img
  const switchFrameView = useCallback((targetView, targetPhotoIndex = 0, direction = 'forward') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionDir(direction);
    setTransitionPhase('out');

    frameTimerRef.current = setTimeout(() => {
      setView(targetView);
      setPhotoIndex(targetPhotoIndex);
      setTransitionPhase('in');

      frameTimerRef.current = setTimeout(() => {
        setTransitionPhase('idle');
        setIsTransitioning(false);
      }, 300);
    }, 280);
  }, [isTransitioning]);

  // Smooth photo fade transition inside sad-img (280ms)
  const switchPhoto = useCallback((newIndex) => {
    if (photoFading || isTransitioning) return;
    setPhotoFading(true);

    photoTimerRef.current = setTimeout(() => {
      setPhotoIndex(newIndex);
      photoTimerRef.current = setTimeout(() => {
        setPhotoFading(false);
      }, 140);
    }, 140);
  }, [photoFading, isTransitioning]);

  // Next Button handler
  const handleNext = () => {
    if (isTransitioning || photoFading) return;

    if (view === 'cover') {
      // Step 1 -> Step 2: Open album from cover to Photo 1 in sad-img
      triggerLightning();
      switchFrameView('img', 0, 'forward');
    } else if (view === 'img') {
      // Photo 1 -> 2 -> 3 -> 4 -> 5
      if (photoIndex < photos.length - 1) {
        triggerLightning();
        switchPhoto(photoIndex + 1);
      }
    }
  };

  // Previous Button handler
  const handlePrev = () => {
    if (isTransitioning || photoFading) return;

    if (view === 'img') {
      if (photoIndex > 0) {
        // Photo 5 -> 4 -> 3 -> 2 -> 1
        triggerLightning();
        switchPhoto(photoIndex - 1);
      } else {
        // On Photo 1: Return to album cover
        triggerLightning();
        switchFrameView('cover', 0, 'backward');
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, photoIndex, isTransitioning, photoFading, photos.length]);

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Navigation button states
  const isPrevDisabled = (view === 'cover') || isTransitioning || photoFading;
  const isNextDisabled = (view === 'img' && photoIndex === photos.length - 1) || isTransitioning || photoFading;

  return (
    <div className="sad-gallery-root" role="region" aria-label="Sad Memories Gallery">
      {/* Full-Page Moonlit Terrace Background (sad.png) */}
      <div className="sad-gallery-background-wrapper" aria-hidden="true">
        <img
          src={sadBg}
          alt="Sad memories moonlit background"
          className="sad-gallery-background-img"
        />
        <div className="sad-gallery-subtle-overlay" />
      </div>

      {/* Cinematic Thunderstorm Lightning Navigation Effect */}
      <SadLightning strikeCount={lightningTrigger} />

      {/* Cinematic Atmospheric Animation Layers (Rain, Fog, Dust, Ghosts) */}
      <SadAtmosphere />

      {/* Top Header Bar with Discrete Back Button */}
      {onBack && (
        <header className="sad-gallery-top-bar">
          <button
            type="button"
            onClick={onBack}
            className="sad-gallery-back-button"
            aria-label="Return to Birthday Page"
          >
            <ArrowLeft size={17} className="back-btn-icon" />
            <span className="back-btn-text">Back to Birthday</span>
          </button>
        </header>
      )}

      {/* Main Album Stage with Left/Right Navigation and Centered Frame */}
      <main className="sad-gallery-main-stage">
        {/* Previous Navigation Button (Left) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className={`gallery-nav-arrow arrow-left ${isPrevDisabled ? 'is-disabled' : ''}`}
          aria-label={view === 'cover' ? 'Album Cover' : photoIndex === 0 ? 'Back to Album Cover' : `Previous Photo (${photoIndex} of 5)`}
          title={view === 'cover' ? 'Album Cover' : photoIndex === 0 ? 'Back to Album Cover' : `Previous Photo (${photoIndex} of 5)`}
        >
          <ChevronLeft size={28} />
        </button>

        {/* Central Album Stage */}
        <div
          className={`sad-frame-stage is-${view}-view phase-${transitionPhase} turn-${transitionDir}`}
          aria-live="polite"
        >
          {view === 'cover' ? (
            /* STEP 1: Opening Cover Page — sad-cover inside decorative sad-frame */
            <>
              {/* Cover Image Layer: Positioned inside opening BEHIND decorative frame */}
              <div className="sad-cover-container">
                <img
                  src={sadCover}
                  alt="Sad Memories Album Cover"
                  className="sad-cover-img"
                  loading="eager"
                />
              </div>

              {/* Decorative Frame Layer: Layered ABOVE the cover image */}
              <img
                src={sadFrame}
                alt="Sad Memories Album Frame"
                className="sad-frame-art-img"
                loading="eager"
              />
            </>
          ) : (
            /* STEP 2: Large Symmetrical Glassmorphism Photo Container */
            <>
              {/* 1. Photo Display Wrapper */}
              <div className="sad-glass-photo-wrapper">
                {currentPhoto?.src && !imageErrors[currentPhoto.id] ? (
                  <img
                    src={currentPhoto.src}
                    alt={currentPhoto.alt || `Memory ${photoIndex + 1}`}
                    className={`sad-glass-photo-img ${photoFading ? 'is-fading' : ''}`}
                    onError={() => handleImageError(currentPhoto.id)}
                  />
                ) : (
                  // Graceful fallback placeholder if photo file is still loading or unplaced
                  <div className={`sad-photo-placeholder ${photoFading ? 'is-fading' : ''}`}>
                    <div className="placeholder-gradient-sky">
                      <div className="placeholder-crescent-moon" />
                      <div className="placeholder-text-container">
                        <span className="placeholder-hint-badge">
                          PHOTO {photoIndex + 1} OF {photos.length}
                        </span>
                        <p className="placeholder-poetic-quote">
                          "Place photograph {photoIndex + 1} into /sad folder..."
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Image number badge in top-right corner */}
                <span className="sad-photo-counter">
                  {photoIndex + 1} of {photos.length}
                </span>
              </div>

              {/* 2. Message Box: Wide, rounded frosted-white box directly below image */}
              <div className="sad-glass-message-box">
                <p className={`sad-glass-message-text ${photoFading ? 'is-fading' : ''}`}>
                  {currentPhoto?.message || "Some moments stay with us forever... ♡"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Next Navigation Button (Right) */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`gallery-nav-arrow arrow-right ${isNextDisabled ? 'is-disabled' : ''}`}
          aria-label={view === 'cover' ? 'Open Album (Photo 1)' : `Next Photo (${photoIndex + 2} of 5)`}
          title={view === 'cover' ? 'Open Album (Photo 1)' : photoIndex === photos.length - 1 ? 'End of photos' : `Next Photo (${photoIndex + 2} of 5)`}
        >
          <ChevronRight size={28} />
        </button>
      </main>
    </div>
  );
}
