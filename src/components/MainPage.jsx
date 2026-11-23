import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BIRTHDAY_CONFIG, getSectionVideoSrc } from '../config';
import VideoMemoriesModal from './VideoMemoriesModal';
import ImageMemoriesModal from './ImageMemoriesModal';
import SectionIndicator from './SectionIndicator';
import MusicPlayer from './MusicPlayer';
import SeeThisView from './SeeThisView';
import { audioController } from '../utils/audioController';
import { ArrowRight } from 'lucide-react';

/**
 * Main Birthday Section — 12 Sections with Message Card Scroll Lock
 * 
 * Features:
 * 1. Exactly 12 independently configurable sections loaded from BIRTHDAY_CONFIG.mainPage.sections.
 * 2. Section 1 preserves the original design, heading, message, image, and buttons.
 * 3. Message Card Scroll Lock:
 *    - Message text scrolls first.
 *    - User cannot move to next section until reaching the bottom of the current message (with ~10px tolerance).
 *    - Once at bottom, continuing downward wheel / touch swipe advances to the next section.
 *    - At top, scrolling upward returns to the previous section.
 *    - Works seamlessly across mouse wheel, trackpad, touch swipe, and arrow keys.
 *    - No decorative bottom arrow in the message card.
 * 4. Minimal Right-Side Section Indicator (1 thin golden line with 12 dots).
 * 5. Horizontal Frosted-Glass Music Player ("Dedicated to You").
 * 6. Smooth vertical transitions between sections.
 */
export default function MainPage({
  onReplay,
  onOpenMemories,
  onOpenHappyGallery,
  initialSectionIndex = 0,
  onSectionChange,
}) {
  const mainBirthdayConfig = BIRTHDAY_CONFIG.mainBirthday || BIRTHDAY_CONFIG.mainPage || {};
  const {
    backgroundImage,
    hero,
    title: configTitle,
    messageCard: defaultMessageCard,
    scratchCard: defaultScratchCard,
    watchButton: defaultWatchButton,
    sections: configuredSections,
  } = mainBirthdayConfig;

  // Ensure exactly 13 sections are present with their dedicated image and video sources
  const sections = (configuredSections && configuredSections.length >= 13)
    ? configuredSections.slice(0, 13).map((s, i) => {
        const secId = s.id || (i + 1);
        return {
          ...s,
          id: secId,
          title: s.title || `Section ${secId}`,
          subtitle: s.subtitle || '',
          salutation: s.salutation || '',
          paragraphs: s.paragraphs || s.message || [],
          closing: s.closing || '',
          sender: s.sender || '',
          imageSrc: s.imageSrc || s.image || `/images-for-main-page/${secId}.jpg`,
          videoSrc: s.videoSrc || s.video || getSectionVideoSrc(secId),
          linkLabel: s.buttonLabel || s.linkLabel || s.buttonText || defaultWatchButton?.label || "Clip for You",
          linkAction: s.buttonAction || s.linkAction || "video",
        };
      })
    : (configuredSections && configuredSections.length > 0)
    ? [
        ...configuredSections.map((s, i) => {
          const secId = s.id || (i + 1);
          return {
            ...s,
            id: secId,
            title: s.title || `Section ${secId}`,
            subtitle: s.subtitle || '',
            salutation: s.salutation || '',
            paragraphs: s.paragraphs || s.message || [],
            closing: s.closing || '',
            sender: s.sender || '',
            imageSrc: s.imageSrc || s.image || `/images-for-main-page/${secId}.jpg`,
            videoSrc: s.videoSrc || s.video || getSectionVideoSrc(secId),
            linkLabel: s.buttonLabel || s.linkLabel || s.buttonText || defaultWatchButton?.label || "Clip for You",
            linkAction: s.buttonAction || s.linkAction || "video",
          };
        }),
        ...Array.from({ length: 13 - configuredSections.length }, (_, i) => {
          const secId = configuredSections.length + i + 1;
          return {
            id: secId,
            title: `Section ${secId}`,
            subtitle: '',
            salutation: '',
            paragraphs: [],
            closing: '',
            sender: '',
            imageSrc: `/images-for-main-page/${secId}.jpg`,
            videoSrc: getSectionVideoSrc(secId),
            linkLabel: "Clip for You",
            linkAction: "video",
          };
        })
      ]
    : Array.from({ length: 13 }, (_, i) => ({
        id: i + 1,
        title: i === 0 ? (configTitle || hero?.title || "") : `Chapter ${i + 1}`,
        salutation: defaultMessageCard?.salutation || "",
        paragraphs: defaultMessageCard?.paragraphs || [],
        closing: defaultMessageCard?.closing || "",
        sender: defaultMessageCard?.sender || "",
        imageSrc: `/images-for-main-page/${i + 1}.jpg`,
        videoSrc: getSectionVideoSrc(i + 1),
        linkLabel: defaultWatchButton?.label || "Clip for You",
        linkAction: "video",
      }));

  const initialIdx = typeof initialSectionIndex === 'number' && initialSectionIndex >= 0 && initialSectionIndex < sections.length
    ? initialSectionIndex
    : 0;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialIdx);
  const [displayedSectionIndex, setDisplayedSectionIndex] = useState(initialIdx);
  const [transitionDirection, setTransitionDirection] = useState('down');
  const [transitionPhase, setTransitionPhase] = useState('idle'); // 'idle' | 'exiting' | 'entering'
  const [isAtSectionBottom, setIsAtSectionBottom] = useState(false);

  const currentSection = sections[displayedSectionIndex] || sections[0];
  const displayTitle = currentSection.title || configTitle || hero?.title || "";
  const secretImgSrc = currentSection.imageSrc || defaultScratchCard?.imageSrc || backgroundImage;
  const rawLinkLabel = currentSection.linkLabel || defaultWatchButton?.label || "Clip for You";
  const cleanButtonText = rawLinkLabel.replace(/[\s↗»>]+$/, '') || "Clip for You";

  // End-of-page navigation: Next Page button appears ONLY on Section 13 (final section) when message card is scrolled to bottom
  const isLastSection = displayedSectionIndex === sections.length - 1;
  const showNextPageBtn = isLastSection && isAtSectionBottom && transitionPhase === 'idle';

  // Modals state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});

  // Fullscreen detection
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

  // Automatically start music playback when entering Main Birthday Section
  useEffect(() => {
    audioController.startMainPlayback();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      const isDisplayModeFs = Boolean(
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

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleFullscreenChange);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // SCROLL PROGRESS & SCROLL LOCK LOGIC
  // ---------------------------------------------------------------------------
  const scrollViewRef = useRef(null);
  const trackRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);
  const [thumbTop, setThumbTop] = useState(0);
  const rafId = useRef(null);

  // Transition cooldown and wheel accumulator refs
  const isTransitioningRef = useRef(false);
  const lastTransitionTimeRef = useRef(0);
  const wheelAccumulatorRef = useRef(0);
  const wheelResetTimeoutRef = useRef(null);

  // Check if message is scrolled to bottom/top with tolerance
  const getScrollLockState = useCallback(() => {
    const el = scrollViewRef.current;
    if (!el) return { isAtBottom: true, isAtTop: true, canScroll: false };

    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const scrollMax = scrollHeight - clientHeight;

    if (scrollMax <= 6) {
      // Content does not overflow, so user is simultaneously at top and bottom
      return { isAtBottom: true, isAtTop: true, canScroll: false };
    }

    // Tolerance of 8px for rounding on high-DPI/fractional scaling
    const isAtBottom = (el.scrollTop + clientHeight) >= (scrollHeight - 8);
    const isAtTop = el.scrollTop <= 8;
    return { isAtBottom, isAtTop, canScroll: true };
  }, []);

  const updateScrollProgress = useCallback(() => {
    const el = scrollViewRef.current;
    if (!el) return;

    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const scrollMax = scrollHeight - clientHeight;

    if (scrollMax > 6) {
      setCanScroll(true);
      const track = trackRef.current;
      const trackHeight = track && track.clientHeight > 0 ? track.clientHeight : clientHeight;
      const thumbHeight = 24;
      const maxTravel = Math.max(0, trackHeight - thumbHeight);
      const progress = Math.min(1, Math.max(0, el.scrollTop / scrollMax));
      setThumbTop(Math.round(progress * maxTravel));
    } else {
      setCanScroll(false);
      setThumbTop(0);
    }

    const { isAtBottom } = getScrollLockState();
    setIsAtSectionBottom(isAtBottom);
  }, [getScrollLockState]);

  // Section navigation trigger with 650–850ms cinematic smooth transition
  const goToSection = useCallback((targetIndex, direction = 'down') => {
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    if (targetIndex === currentSectionIndex) return;
    if (isTransitioningRef.current) return;

    const now = Date.now();
    if (now - lastTransitionTimeRef.current < 850) return;

    lastTransitionTimeRef.current = now;
    isTransitioningRef.current = true;
    wheelAccumulatorRef.current = 0;
    setIsAtSectionBottom(false);

    setTransitionDirection(direction);
    setTransitionPhase('exiting');

    // Phase 1: Outgoing section dissolves and glides away smoothly (220ms)
    setTimeout(() => {
      // Phase 2: Switch to incoming section and glide in (550ms)
      setCurrentSectionIndex(targetIndex);
      setDisplayedSectionIndex(targetIndex);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTop = 0;
      }
      setTransitionPhase('entering');

      // Settling at 770ms total duration
      setTimeout(() => {
        setTransitionPhase('idle');
        updateScrollProgress();
      }, 550);

      // Lock cooldown buffer (850ms total) to prevent skipping multiple sections
      setTimeout(() => {
        isTransitioningRef.current = false;
        wheelAccumulatorRef.current = 0;
      }, 630);
    }, 220);
  }, [currentSectionIndex, sections.length, updateScrollProgress]);

  // Restore section position (e.g. when returning to Section 13 from Sad Gallery)
  useEffect(() => {
    if (typeof initialSectionIndex === 'number' && initialSectionIndex >= 0 && initialSectionIndex < sections.length) {
      setCurrentSectionIndex(initialSectionIndex);
      setDisplayedSectionIndex(initialSectionIndex);
      if (initialSectionIndex === sections.length - 1) {
        const timer = setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
            updateScrollProgress();
          }
        }, 90);
        return () => clearTimeout(timer);
      }
    }
  }, [initialSectionIndex, sections.length, updateScrollProgress]);

  // TELEPORT_24H_NAV: Notify parent of current displayed section index for persistence
  useEffect(() => {
    onSectionChange?.(displayedSectionIndex);
  }, [displayedSectionIndex, onSectionChange]);

  // Handle Wheel / Trackpad Scroll with Scroll Lock
  const handleWheel = useCallback((e) => {
    // If modal is open, ignore main page scrolling
    if (isVideoModalOpen || isImageModalOpen) return;
    if (isTransitioningRef.current) {
      e.preventDefault();
      return;
    }

    const el = scrollViewRef.current;
    if (!el) return;

    const { isAtBottom, isAtTop, canScroll: messageCanScroll } = getScrollLockState();
    const delta = e.deltaY;
    const isOverMessage = el.contains(e.target);

    if (delta > 0) {
      // User is scrolling DOWN
      if (messageCanScroll && !isAtBottom) {
        if (!isOverMessage) {
          el.scrollTop += delta;
          updateScrollProgress();
        }
        return;
      }

      // Reached bottom of message card: allow advancing to next section if not already on Section 12
      if (isAtBottom && currentSectionIndex < sections.length - 1) {
        e.preventDefault();
        wheelAccumulatorRef.current += delta;

        if (wheelResetTimeoutRef.current) clearTimeout(wheelResetTimeoutRef.current);
        wheelResetTimeoutRef.current = setTimeout(() => {
          wheelAccumulatorRef.current = 0;
        }, 320);

        if (wheelAccumulatorRef.current > 50) {
          wheelAccumulatorRef.current = 0;
          goToSection(currentSectionIndex + 1, 'down');
        }
      }
    } else if (delta < 0) {
      // User is scrolling UP
      if (messageCanScroll && !isAtTop) {
        if (!isOverMessage) {
          el.scrollTop += delta;
          updateScrollProgress();
        }
        return;
      }

      // Reached top of message card: allow returning to previous section if not on Section 1
      if (isAtTop && currentSectionIndex > 0) {
        e.preventDefault();
        wheelAccumulatorRef.current += delta;

        if (wheelResetTimeoutRef.current) clearTimeout(wheelResetTimeoutRef.current);
        wheelResetTimeoutRef.current = setTimeout(() => {
          wheelAccumulatorRef.current = 0;
        }, 320);

        if (wheelAccumulatorRef.current < -50) {
          wheelAccumulatorRef.current = 0;
          goToSection(currentSectionIndex - 1, 'up');
        }
      }
    }
  }, [
    isVideoModalOpen,
    isImageModalOpen,
    getScrollLockState,
    currentSectionIndex,
    sections.length,
    goToSection,
    updateScrollProgress
  ]);

  // Touch Swipe Gesture Support
  const touchStartYRef = useRef(0);
  const touchLastYRef = useRef(0);
  const touchDiffYRef = useRef(0);
  const touchStartedAtBottomRef = useRef(false);
  const touchStartedAtTopRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (isVideoModalOpen || isImageModalOpen) return;
    const clientY = e.touches[0].clientY;
    touchStartYRef.current = clientY;
    touchLastYRef.current = clientY;
    touchDiffYRef.current = 0;

    const { isAtBottom, isAtTop } = getScrollLockState();
    touchStartedAtBottomRef.current = isAtBottom;
    touchStartedAtTopRef.current = isAtTop;
  }, [isVideoModalOpen, isImageModalOpen, getScrollLockState]);

  const handleTouchMove = useCallback((e) => {
    if (isVideoModalOpen || isImageModalOpen || isTransitioningRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchLastYRef.current - currentY;
    touchLastYRef.current = currentY;
    touchDiffYRef.current = touchStartYRef.current - currentY;

    const el = scrollViewRef.current;
    if (!el) return;

    if (!el.contains(e.target)) {
      const { isAtBottom, isAtTop } = getScrollLockState();
      if ((deltaY > 0 && !isAtBottom) || (deltaY < 0 && !isAtTop)) {
        el.scrollTop += deltaY;
        updateScrollProgress();
      }
    }
  }, [isVideoModalOpen, isImageModalOpen, getScrollLockState, updateScrollProgress]);

  const handleTouchEnd = useCallback(() => {
    if (isVideoModalOpen || isImageModalOpen || isTransitioningRef.current) return;
    const totalDiff = touchDiffYRef.current;
    const { isAtBottom, isAtTop } = getScrollLockState();

    if (totalDiff > 55 && isAtBottom && touchStartedAtBottomRef.current && currentSectionIndex < sections.length - 1) {
      goToSection(currentSectionIndex + 1, 'down');
    } else if (totalDiff < -55 && isAtTop && touchStartedAtTopRef.current && currentSectionIndex > 0) {
      goToSection(currentSectionIndex - 1, 'up');
    }
    touchDiffYRef.current = 0;
  }, [isVideoModalOpen, isImageModalOpen, getScrollLockState, currentSectionIndex, sections.length, goToSection]);

  // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isVideoModalOpen || isImageModalOpen || isTransitioningRef.current) return;
      const { isAtBottom, isAtTop } = getScrollLockState();

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (isAtBottom && currentSectionIndex < sections.length - 1) {
          e.preventDefault();
          goToSection(currentSectionIndex + 1, 'down');
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (isAtTop && currentSectionIndex > 0) {
          e.preventDefault();
          goToSection(currentSectionIndex - 1, 'up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVideoModalOpen, isImageModalOpen, getScrollLockState, currentSectionIndex, sections.length, goToSection]);

  // Bind wheel and touch listeners
  useEffect(() => {
    const root = document.querySelector('.main-page-root');
    if (!root) return;

    root.addEventListener('wheel', handleWheel, { passive: false });
    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: true });
    root.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      root.removeEventListener('wheel', handleWheel);
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Message scroll update listener
  useEffect(() => {
    updateScrollProgress();
    const t1 = setTimeout(updateScrollProgress, 100);
    const t2 = setTimeout(updateScrollProgress, 350);
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateScrollProgress);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [displayedSectionIndex, updateScrollProgress]);

  // Handle Right Column Link Box Action — Opens video viewer with this section's video
  const handleLinkClick = (e) => {
    e.preventDefault();
    setIsVideoModalOpen(true);
  };

  return (
    <div className={`main-page-root ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Full-Page Sunset Terrace Background: 100% original vibrant artwork without darkening overlays */}
      <div className="main-background-container" aria-hidden="true">
        <img
          src={backgroundImage}
          alt="Sunset terrace background"
          className="main-background-image"
        />
      </div>

      {/* Main Content Layout with Smooth Two-Phase Vertical Transition */}
      <div
        key={displayedSectionIndex}
        className={`main-content-layout transition-${transitionPhase} direction-${transitionDirection}`}
      >
        {/* ================= LEFT COLUMN (~65%) ================= */}
        <section className="main-left-column" aria-label="Birthday Message">
          {/* Section Heading at Top Left */}
          <h1 className="minimal-page-title">{displayTitle}</h1>

          {/* Large Message Card with Dark Frosted Glass & Champagne Gold Edge */}
          <article className="minimal-message-card" aria-label="Birthday Message Card">
            <div
              ref={scrollViewRef}
              className="minimal-message-scroll-viewport"
              tabIndex={0}
              role="region"
              aria-label="Scrollable birthday message"
              onScroll={updateScrollProgress}
            >
              {currentSection.salutation && (
                <div className="minimal-salutation">{currentSection.salutation}</div>
              )}

              {currentSection.paragraphs?.map((paragraph, index) => (
                <p key={index} className="minimal-paragraph">
                  {paragraph}
                </p>
              ))}

              {(currentSection.closing || currentSection.sender) && (
                <div className="minimal-signoff">
                  {currentSection.closing && (
                    <div className="minimal-closing">{currentSection.closing}</div>
                  )}
                  {currentSection.sender && (
                    <div className="minimal-sender">{currentSection.sender}</div>
                  )}
                </div>
              )}
            </div>

            {/* Tiny Floating Scroll Thumb Indicator (Visible only when message overflows) */}
            <div
              ref={trackRef}
              className="message-scroll-indicator-track"
              style={{
                opacity: canScroll ? 0.75 : 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s ease',
              }}
              aria-hidden="true"
            >
              <div
                className="message-scroll-indicator-thumb"
                style={{
                  transform: `translateY(${thumbTop}px)`,
                }}
              />
            </div>
          </article>
        </section>

        {/* ================= RIGHT COLUMN (~25-30%) ================= */}
        <aside className="main-right-column" aria-label="Memory Photo and Video">
          {/* Portrait Secret Image Card (Click to open enlarged transparent glass viewer) */}
          <div
            className="minimal-image-card"
            onClick={() => setIsImageModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Click to enlarge memory photo"
            title="Click to view full image"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsImageModalOpen(true);
              }
            }}
          >
            <div className="minimal-image-frame">
              {!imageErrorMap[displayedSectionIndex] && secretImgSrc ? (
                <img
                  src={secretImgSrc}
                  alt=""
                  className="minimal-portrait-image"
                  onError={() => setImageErrorMap((prev) => ({ ...prev, [displayedSectionIndex]: true }))}
                />
              ) : (
                <div className="minimal-image-empty-card" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Separate Link Box Directly Below Image Card — Minimal Neon "Clip for You" Button */}
          <div className="minimal-link-container">
            <button
              type="button"
              onClick={handleLinkClick}
              className="minimal-link-box"
              aria-label={cleanButtonText}
            >
              <span className="minimal-link-play-icon" aria-hidden="true">
                <span className="minimal-link-play-triangle" />
              </span>
              <span className="minimal-link-divider" aria-hidden="true" />
              <span className="minimal-link-text">{cleanButtonText}</span>
              <span className="minimal-link-chevron" aria-hidden="true">&raquo;</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Right-Side Section Indicator (13 Dots on a Single Thin Vertical Golden Line) */}
      <SectionIndicator
        currentSection={currentSectionIndex}
        totalSections={sections.length}
        onSelectSection={(idx) => goToSection(idx, idx > currentSectionIndex ? 'down' : 'up')}
      />

      {/* Music Player — "Dedicated to You" Frosted-Glass Pill */}
      <MusicPlayer />

      {/* Transparent Frosted-Glass Video Modal with Dedicated Section Video */}
      <VideoMemoriesModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoSrc={currentSection.videoSrc || getSectionVideoSrc(currentSection.id || displayedSectionIndex + 1)}
        sectionNumber={currentSection.id || (displayedSectionIndex + 1)}
        sectionTitle={currentSection.title}
      />

      {/* Click-to-Open Transparent Frosted-Glass Image Viewer Modal */}
      <ImageMemoriesModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageSrc={secretImgSrc}
        alt={currentSection.alt || defaultScratchCard?.alt || "Special moment memory"}
      />

      {/* Bottom Right: Next Page Button (Visible ONLY on Section 13 when message card is fully scrolled to bottom) */}
      {showNextPageBtn && (
        <button
          type="button"
          onClick={onOpenMemories}
          className="corner-nav-btn corner-nav-next"
          aria-label="Next Page: Navigate to Sad Gallery"
          title="Proceed to Sad Gallery"
        >
          <span className="corner-nav-text">Next Page</span>
          <ArrowRight size={16} className="corner-nav-icon" />
        </button>
      )}
    </div>
  );
}
