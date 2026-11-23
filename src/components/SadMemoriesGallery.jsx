import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import sadBg from '../../sad.png';
import sadCover from '../../sad-cover.jpg';
import sadFrame from '../../sad-frame.png?v=2';
import sadImg from '../../sad-img.png';
import { getSadPhotos } from '../data/sadPhotos';
import { BIRTHDAY_CONFIG } from '../config';
import SadAtmosphere from './SadAtmosphere';
import SadLightning from './SadLightning';
import GalleryMusicPlayer from './GalleryMusicPlayer';
import GalleryVideoPlayer from './GalleryVideoPlayer';
import GalleryMediaModal from './GalleryMediaModal';
import SeeThisView from './SeeThisView';

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
export default function SadMemoriesGallery({
  onBack,
  onPreviousSection,
  onNextPage,
  initialView = 'cover',
  initialPhotoIndex = 0,
  onStateChange,
}) {
  // 'cover' (sad-cover.jpg) | 'img' (sad-img.png)
  const [view, setView] = useState(initialView);
  const [photoIndex, setPhotoIndex] = useState(initialPhotoIndex); // 0..4 (Photos 1..5)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [transitionDir, setTransitionDir] = useState('forward'); // 'forward' | 'backward'
  const [photoFading, setPhotoFading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [lightningTrigger, setLightningTrigger] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Synchronize state changes with parent
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ view, photoIndex });
    }
  }, [view, photoIndex, onStateChange]);

  // Support direct prop updates if re-opened
  useEffect(() => {
    if (initialView) setView(initialView);
    if (typeof initialPhotoIndex === 'number') setPhotoIndex(initialPhotoIndex);
  }, [initialView, initialPhotoIndex]);

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

  // Preload photos (only images)
  useEffect(() => {
    photos.forEach((p) => {
      if (p.src && p.type !== 'video') {
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
          src={BIRTHDAY_CONFIG.sadGallery?.background || sadBg}
          alt="Sad memories moonlit background"
          className="sad-gallery-background-img"
        />
        <div className="sad-gallery-subtle-overlay" />
      </div>

      {/* Cinematic Thunderstorm Lightning Navigation Effect */}
      <SadLightning strikeCount={lightningTrigger} />

      {/* Cinematic Atmospheric Animation Layers (Rain, Fog, Dust, Ghosts) */}
      <SadAtmosphere />

      {/* Upper-Left: Previous Section Button (Navigates directly back to Main Birthday Section 13) */}
      {(onPreviousSection || onBack) && (
        <header className="sad-gallery-top-bar">
          <button
            type="button"
            onClick={onPreviousSection || onBack}
            className="corner-nav-btn corner-nav-prev"
            aria-label="Previous Section: Return to Main Birthday Section 13"
            title="Return to Section 13"
          >
            <ArrowLeft size={16} className="corner-nav-icon" />
            <span className="corner-nav-text">Previous Section</span>
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
          aria-label={view === 'cover' ? 'Album Cover' : photoIndex === 0 ? 'Back to Album Cover' : `Previous Photo (${photoIndex} of ${photos.length})`}
          title={view === 'cover' ? 'Album Cover' : photoIndex === 0 ? 'Back to Album Cover' : `Previous Photo (${photoIndex} of ${photos.length})`}
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
                  src={BIRTHDAY_CONFIG.sadGallery?.albumCover || sadCover}
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
              {/* 1. Media Display Wrapper (Image or Video) */}
              <div className="sad-glass-photo-wrapper">
                {currentPhoto?.type === 'video' && currentPhoto?.src ? (
                  <GalleryVideoPlayer
                    src={currentPhoto.src}
                    alt={currentPhoto.alt || `Memory ${photoIndex + 1}`}
                    theme="sad"
                    isFading={photoFading}
                    onOpenModal={() => setIsMediaModalOpen(true)}
                  />
                ) : currentPhoto?.src && !imageErrors[currentPhoto.id] ? (
                  <img
                    src={currentPhoto.src}
                    alt={currentPhoto.alt || `Memory ${photoIndex + 1}`}
                    className={`sad-glass-photo-img ${photoFading ? 'is-fading' : ''}`}
                    onError={() => handleImageError(currentPhoto.id)}
                    onClick={() => setIsMediaModalOpen(true)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Enlarge photo ${photoIndex + 1}`}
                    title="Click to view large photo"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsMediaModalOpen(true);
                      }
                    }}
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
                  {currentPhoto?.message || ""}
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
          aria-label={view === 'cover' ? 'Open Album (Photo 1)' : `Next Photo (${photoIndex + 2} of ${photos.length})`}
          title={view === 'cover' ? 'Open Album (Photo 1)' : photoIndex === photos.length - 1 ? 'End of photos' : `Next Photo (${photoIndex + 2} of ${photos.length})`}
        >
          <ChevronRight size={28} />
        </button>
      </main>

      {/* Bottom-Right: Next Page Button (Visible ONLY on the last image of Sad Gallery, navigating to Happy Gallery) */}
      {view === 'img' && photoIndex === photos.length - 1 && onNextPage && (
        <button
          type="button"
          onClick={onNextPage}
          className="corner-nav-btn corner-nav-next"
          aria-label="Next Page: Navigate to Happy Gallery"
          title="Proceed to Happy Memories Gallery"
        >
          <span className="corner-nav-text">Next Page</span>
          <ArrowRight size={16} className="corner-nav-icon" />
        </button>
      )}

      {/* Dedicated Sad Memories Music Player (Exact Size & Footprint of Main Birthday Music Bar) */}
      <GalleryMusicPlayer theme="sad" config={BIRTHDAY_CONFIG.sadMusicPlayer} />

      {/* Large Frosted Glass Media Viewer Modal for Images & Videos */}
      <GalleryMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        media={currentPhoto}
        theme="sad"
      />
    </div>
  );
}
