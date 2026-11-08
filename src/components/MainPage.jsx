import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BIRTHDAY_CONFIG } from '../config';

/**
 * Main Birthday Section
 * Minimal, dreamy, romantic layout matching the reference design:
 * - Upper-Left: Minimal elegant title ("Happiest Birthday, Miioo!")
 * - Left: Large, clean message card with dark frosted glass & champagne golden edge
 * - Floating Scroll Indicator: Tiny luminous thumb indicating scroll progress inside message
 * - Upper-Right: Smaller portrait secret image card
 * - Right Below Image: Separate minimal link box ("WATCH OUR MEMORIES ↗")
 * - Background: 100% pure original sunset terrace artwork without dimming overlays
 * - Supports automatic fullscreen detection (state and class .is-fullscreen)
 */
export default function MainPage({ onReplay, onOpenMemories }) {
  const {
    backgroundImage,
    hero,
    title: configTitle,
    messageCard,
    scratchCard,
    watchButton,
  } = BIRTHDAY_CONFIG.mainPage;

  const displayTitle = configTitle || hero?.title || "Happiest Birthday, Miioo!";
  const secretImgSrc = scratchCard?.imageSrc || backgroundImage;
  const linkLabel = (watchButton?.label && watchButton.label.toUpperCase().includes('MEMORIES'))
    ? watchButton.label
    : "WATCH OUR MEMORIES ↗";
  const linkUrl = watchButton?.externalUrl || watchButton?.url || watchButton?.videoSrc || '';
  const hasValidUrl = Boolean(linkUrl && linkUrl !== '#' && linkUrl.trim() !== '');

  // ---------------------------------------------------------------------------
  // 1. FULLSCREEN DETECTION
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

    let mql = null;
    if (window.matchMedia) {
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

  // ---------------------------------------------------------------------------
  // 2. FLOATING SCROLL INDICATOR LOGIC
  // ---------------------------------------------------------------------------
  const scrollViewRef = useRef(null);
  const trackRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);
  const [thumbTop, setThumbTop] = useState(0);
  const rafId = useRef(null);

  const updateScrollProgress = useCallback(() => {
    const el = scrollViewRef.current;
    if (!el) return;

    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const scrollMax = scrollHeight - clientHeight;

    if (scrollMax > 8) {
      setCanScroll(true);
      const track = trackRef.current;
      const trackHeight = track ? track.clientHeight : Math.max(80, clientHeight - 48);
      const thumbHeight = 24;
      const maxTravel = Math.max(0, trackHeight - thumbHeight);
      const progress = Math.min(1, Math.max(0, el.scrollTop / scrollMax));
      setThumbTop(Math.round(progress * maxTravel));
    } else {
      setCanScroll(false);
    }
  }, []);

  useEffect(() => {
    const el = scrollViewRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateScrollProgress);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    // Initial check + delayed checks to handle font/layout settling
    updateScrollProgress();
    const t1 = setTimeout(updateScrollProgress, 120);
    const t2 = setTimeout(updateScrollProgress, 500);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollProgress);
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [updateScrollProgress]);

  const handleLinkClick = (e) => {
    e.preventDefault();
    if (onOpenMemories) {
      onOpenMemories();
    } else if (hasValidUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
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

      {/* Main Content Two-Column Grid */}
      <div className="main-content-layout">
        {/* ================= LEFT COLUMN (~65%) ================= */}
        <section className="main-left-column" aria-label="Birthday Message">
          {/* Minimal Title at Top Left */}
          <h1 className="minimal-page-title">{displayTitle}</h1>

          {/* Large Minimal Message Card with Dark Frosted Glass & Champagne Gold Edge */}
          <article className="minimal-message-card" aria-label="Birthday Message Card">
            <div
              ref={scrollViewRef}
              className="minimal-message-scroll-viewport"
              tabIndex={0}
              role="region"
              aria-label="Scrollable birthday message"
            >
              {messageCard?.salutation && (
                <div className="minimal-salutation">{messageCard.salutation}</div>
              )}

              {messageCard?.paragraphs?.map((paragraph, index) => (
                <p key={index} className="minimal-paragraph">
                  {paragraph}
                </p>
              ))}

              {(messageCard?.closing || messageCard?.sender) && (
                <div className="minimal-signoff">
                  {messageCard?.closing && (
                    <div className="minimal-closing">{messageCard.closing}</div>
                  )}
                  {messageCard?.sender && (
                    <div className="minimal-sender">{messageCard.sender}</div>
                  )}
                </div>
              )}
            </div>

            {/* Tiny Floating Scroll Thumb Indicator (Visible only when message overflows) */}
            {canScroll && (
              <div
                ref={trackRef}
                className="message-scroll-indicator-track"
                aria-hidden="true"
              >
                <div
                  className="message-scroll-indicator-thumb"
                  style={{
                    transform: `translateY(${thumbTop}px)`,
                  }}
                />
              </div>
            )}
          </article>
        </section>

        {/* ================= RIGHT COLUMN (~25-30%) ================= */}
        <aside className="main-right-column" aria-label="Memory Photo and Video">
          {/* Portrait Secret Image Card */}
          <div className="minimal-image-card">
            <div className="minimal-image-frame">
              <img
                src={secretImgSrc}
                alt={scratchCard?.alt || "Special moment memory"}
                className="minimal-portrait-image"
              />
            </div>
          </div>

          {/* Separate Link Box Directly Below Image Card */}
          <div className="minimal-link-container">
            <button
              type="button"
              onClick={handleLinkClick}
              className="minimal-link-box"
              aria-label={linkLabel}
            >
              <span className="minimal-link-text">{linkLabel}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
