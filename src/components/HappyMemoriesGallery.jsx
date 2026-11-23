import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { HAPPY_ASSETS, happyAlbumCover } from '../data/happyGalleryData';
import { getHappyPhotos } from '../data/happyPhotos';
import { BIRTHDAY_CONFIG } from '../config';
import GalleryMusicPlayer from './GalleryMusicPlayer';
import GalleryVideoPlayer from './GalleryVideoPlayer';
import GalleryMediaModal from './GalleryMediaModal';
import SeeThisView from './SeeThisView';

/**
 * HappyMemoriesGallery Component
 * 
 * Accurately implements the reference design:
 * SCREEN 1 (LEFT SIDE):
 * - Top Center: "Happy Gallery" with delicate horizontal lines and heart accents
 * - Center: Album Cover displayed prominently using `happy-frame` ONLY on this screen
 * - Subtitle: "A collection of our happiest moments... ♡" directly below the album
 * - Bottom: Back and Next navigation buttons
 * 
 * SCREEN 2 (RIGHT SIDE):
 * - Top Center: "Happy Gallery" heading with lines and heart accents
 * - Center: Large, centered transparent frosted-glass card with champagne-gold border and glow
 *   - Photo Counter: "X / Y" in the top-right corner of the glass card
 *   - Photograph: Displayed cleanly directly inside the glass card (NO happy-frame!)
 *   - Message: Paired message centered directly beneath the photograph
 * - Navigation:
 *   - Circular side arrow buttons (Previous on left, Next on right)
 *   - Back and Next buttons below the glass card
 * 
 * NAVIGATION LOGIC & PAGE-FLIP:
 * - Cover Next -> Photo 1 (3D page-flip animation)
 * - Photo Next -> advances Photo 1 -> 2 -> 3 -> 4 -> 5... (smooth crossfade)
 * - Photo Prev / Back -> returns to previous photo; on Photo 1, returns to Cover (reverse 3D page-flip)
 * - Cover Back -> returns to Birthday Main Page
 * - Strictly NO sad effects (no thunder, lightning, storm, rain, fog, ghosts)
 */
export default function HappyMemoriesGallery({ onBack, onPreviousPage, onNextPage }) {
  // 'cover' | 'img'
  const [view, setView] = useState('cover');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState('idle'); // 'idle' | 'out' | 'in'
  const [transitionDir, setTransitionDir] = useState('forward'); // 'forward' | 'backward'
  const [photoFading, setPhotoFading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // FULLSCREEN DETECTION (Supports browser F11 and Fullscreen API)
  // ---------------------------------------------------------------------------
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === 'undefined') return false;
    const isDocFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    const isDisplayModeFs = Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(display-mode: fullscreen)').matches
    );
    return isDocFs || isDisplayModeFs;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      const isDisplayModeFs = Boolean(
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(display-mode: fullscreen)').matches
      );
      setIsFullscreen(isDocFs || isDisplayModeFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleFullscreenChange);

    let mql;
    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(display-mode: fullscreen)');
      if (mql.addEventListener) {
        mql.addEventListener('change', handleFullscreenChange);
      } else if (mql.addListener) {
        mql.addListener(handleFullscreenChange);
      }
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleFullscreenChange);
      if (mql) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handleFullscreenChange);
        } else if (mql.removeListener) {
          mql.removeListener(handleFullscreenChange);
        }
      }
    };
  }, []);

  const photos = getHappyPhotos();
  const currentPhoto = photos[photoIndex] || photos[0];

  const frameTimerRef = useRef(null);
  const photoTimerRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (frameTimerRef.current) clearTimeout(frameTimerRef.current);
      if (photoTimerRef.current) clearTimeout(photoTimerRef.current);
    };
  }, []);

  // Preload photo assets
  useEffect(() => {
    photos.forEach((p) => {
      if (p.src && p.type !== 'video') {
        const img = new Image();
        img.src = p.src;
      }
    });
  }, [photos]);

  // Smooth album page-turn transition between album cover and photos
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

  // Smooth photo fade transition between individual photos (280ms total)
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

  // Next navigation handler
  const handleNext = () => {
    if (isTransitioning || photoFading) return;

    if (view === 'cover') {
      // Step 1: Open album from cover to Photo 1 with 3D page flip
      switchFrameView('img', 0, 'forward');
    } else if (view === 'img') {
      // Photo 1 -> 2 -> 3 -> 4 -> 5...
      if (photoIndex < photos.length - 1) {
        switchPhoto(photoIndex + 1);
      }
    }
  };

  // Previous / Back navigation handler
  const handlePrev = () => {
    if (isTransitioning || photoFading) return;

    if (view === 'cover') {
      // On cover, Back returns to Main Birthday Page
      onBack?.();
    } else if (view === 'img') {
      if (photoIndex > 0) {
        // Photo 5 -> 4 -> 3 -> 2 -> 1
        switchPhoto(photoIndex - 1);
      } else {
        // On Photo 1: Return to album cover with reverse 3D page flip
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

  const isNextDisabled = (view === 'img' && photoIndex === photos.length - 1) || isTransitioning || photoFading;
  const isPrevDisabled = isTransitioning || photoFading;

  return (
    <div className={`happy-gallery-root ${isFullscreen ? 'is-fullscreen' : ''}`} role="region" aria-label="Happy Gallery">
      {/* Full-Page Sunset/Twilight Background (happy-gallery) */}
      <div className="happy-gallery-background-wrapper" aria-hidden="true">
        <img
          src={BIRTHDAY_CONFIG.happyGallery?.background || HAPPY_ASSETS.background}
          alt="Happy gallery sunset background"
          className="happy-gallery-background-img"
        />
        <div className="happy-gallery-warm-glow" />
      </div>

      {/* Upper-Left: Previous Page Button (Returns to Sad Gallery with preserved state) */}
      {(onPreviousPage || onBack) && (
        <button
          type="button"
          onClick={onPreviousPage || onBack}
          className="corner-nav-btn corner-nav-prev"
          aria-label="Previous Page: Return to Sad Gallery"
          title="Return to Sad Gallery"
        >
          <ArrowLeft size={16} className="corner-nav-icon" />
          <span className="corner-nav-text">Previous Page</span>
        </button>
      )}

      {/* Synchronized Content Wrapper: Shifts entire gallery layout (heading, card, photo, counter, message, buttons) as one cohesive unit */}
      <div className="happy-gallery-content-wrapper">
        {/* Top Header Flourish: "Happy Gallery" with delicate lines & heart accents */}
        <header className="happy-gallery-top-header">
          <div className="happy-header-flourish">
            <span className="flourish-line flourish-line-left" />
            <span className="flourish-heart">♡</span>
            <h1 className="happy-gallery-heading">Happy Gallery</h1>
            <span className="flourish-heart">♡</span>
            <span className="flourish-line flourish-line-right" />
          </div>
        </header>

        {/* Main Interactive Stage with 3D Page-Flip Architecture */}
        <main className="happy-gallery-main-stage">
        <div
          className={`happy-stage-perspective-wrapper is-${view}-view phase-${transitionPhase} turn-${transitionDir}`}
          aria-live="polite"
        >
          {view === 'cover' ? (
            /* ==============================================================
               SCREEN 1: ALBUM COVER (LEFT SIDE OF REFERENCE)
               ============================================================== */
            <div className="happy-cover-layout">
              {/* Central Physical Album Cover using happy-frame ONLY */}
              <div className="happy-cover-frame-box">
                {/* Decorative Cover Content Layer placed inside opening behind frame */}
                <div className="happy-cover-card-content">
                  <div className="happy-cover-sparkle-pill">
                    <Sparkles size={12} className="text-amber-300" />
                    <span>MEMORIES OF JOY</span>
                    <Sparkles size={12} className="text-amber-300" />
                  </div>
                  <h2 className="happy-cover-card-title">{BIRTHDAY_CONFIG.happyGallery?.coverTitle || happyAlbumCover.coverTitle}</h2>
                  <p className="happy-cover-card-edition">{BIRTHDAY_CONFIG.happyGallery?.edition || happyAlbumCover.edition}</p>
                  <div className="happy-cover-card-divider" />
                  <p className="happy-cover-card-msg">{BIRTHDAY_CONFIG.happyGallery?.coverMessage || happyAlbumCover.coverMessage}</p>
                </div>

                {/* Decorative Album Frame (happy-frame) Layered ABOVE cover */}
                <img
                  src={BIRTHDAY_CONFIG.happyGallery?.frame || HAPPY_ASSETS.frame}
                  alt={happyAlbumCover.alt}
                  className="happy-cover-art-frame"
                  loading="eager"
                />

                {/* Subtle parchment label text at bottom of frame */}
                <div className="happy-cover-art-label">
                  <span>Our Treasured Story ♡</span>
                </div>
              </div>

              {/* Subtitle directly below the album cover */}
              <p className="happy-cover-subtitle-text">
                {BIRTHDAY_CONFIG.happyGallery?.subtitle || happyAlbumCover.subtitle}
              </p>

              {/* Bottom Navigation Buttons (Back & Next) */}
              <div className="happy-cover-bottom-nav">
                <button
                  type="button"
                  onClick={onPreviousPage || onBack}
                  className="happy-bottom-pill-btn btn-back"
                  aria-label="Previous Page: Return to Sad Gallery"
                >
                  <ArrowLeft size={16} />
                  <span>Previous Page</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="happy-bottom-pill-btn btn-next"
                  aria-label="Open Happy Memories Album"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ==============================================================
               SCREEN 2: INDIVIDUAL PHOTO VIEW (RIGHT SIDE OF REFERENCE)
               ============================================================== */
            <div className="happy-photo-view-layout">
              {/* Large Transparent Frosted-Glass Card (NO happy-frame & NO side buttons!) */}
              <div className="happy-individual-glass-card">
                {/* Photo Counter in Top-Right Corner (e.g. 1 / 5) */}
                <div className="happy-card-photo-counter">
                  {photoIndex + 1} / {photos.length}
                </div>

                {/* Clean Photograph / Video Display Container (Adapts to any ratio, never crops) */}
                <div className="happy-photo-presentation-box">
                  {currentPhoto?.type === 'video' && currentPhoto?.src ? (
                    <GalleryVideoPlayer
                      src={currentPhoto.src}
                      alt={currentPhoto.alt || `Memory ${photoIndex + 1}`}
                      theme="happy"
                      isFading={photoFading}
                      onOpenModal={() => setIsMediaModalOpen(true)}
                      showControls={false}
                    />
                  ) : currentPhoto?.src && !imageErrors[currentPhoto.id] ? (
                    <img
                      src={currentPhoto.src}
                      alt={currentPhoto.alt || `Memory ${photoIndex + 1}`}
                      className={`happy-photo-element ${photoFading ? 'is-fading' : ''}`}
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
                    // Cheerful fallback placeholder when photo is not yet in /happy/
                    <div className={`happy-photo-placeholder-box ${photoFading ? 'is-fading' : ''}`}>
                      <div className="placeholder-sun-symbol" />
                      <span className="placeholder-slot-tag">
                        PHOTO {photoIndex + 1} OF {photos.length}
                      </span>
                      <p className="placeholder-instruction">
                        "Place photograph {photoIndex + 1} into /happy folder..."
                      </p>
                    </div>
                  )}
                </div>

                {/* Centered Message directly beneath the photograph */}
                <div className="happy-card-caption-section">
                  <p className={`happy-card-caption-text ${photoFading ? 'is-fading' : ''}`}>
                    {currentPhoto?.message || ""}
                  </p>
                </div>
              </div>

              {/* Bottom Navigation Buttons (Back & Next) */}
              <div className="happy-photo-bottom-nav">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isPrevDisabled}
                  className={`happy-bottom-pill-btn btn-back ${isPrevDisabled ? 'is-disabled' : ''}`}
                  aria-label={photoIndex === 0 ? "Back to Album Cover" : "Previous Photo"}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className={`happy-bottom-pill-btn btn-next ${isNextDisabled ? 'is-disabled' : ''}`}
                  aria-label={photoIndex === photos.length - 1 ? "End of Photos" : "Next Photo"}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dedicated Happy Memories Music Player: Positioned directly below the media card and horizontally centered relative to that card */}
      <GalleryMusicPlayer theme="happy" config={BIRTHDAY_CONFIG.happyMusicPlayer} />
    </div>

    {/* Bottom-Right: Next Page Button (Visible ONLY on the last image of Happy Gallery, navigating to Q&A Section) */}
    {view === 'img' && photoIndex === photos.length - 1 && onNextPage && (
      <button
        type="button"
        onClick={onNextPage}
        className="corner-nav-btn corner-nav-next"
        aria-label="Next Page: Navigate to Q&A Section"
        title="Proceed to Q&A Section"
      >
        <span className="corner-nav-text">Next Page</span>
        <ArrowRight size={16} className="corner-nav-icon" />
      </button>
    )}

    {/* Large Frosted Glass Media Viewer Modal for Images & Videos */}
    <GalleryMediaModal
      isOpen={isMediaModalOpen}
      onClose={() => setIsMediaModalOpen(false)}
      media={currentPhoto}
      theme="happy"
    />
  </div>
);
}
