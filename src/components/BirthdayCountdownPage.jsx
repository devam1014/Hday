import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import countdownBg from '../../final-countdown.png?v=1';
import { BIRTHDAY_CONFIG, parseISTTarget } from '../config';
import { audioController } from '../utils/audioController';

/**
 * BirthdayCountdownPage Component
 * 
 * Clean Image-Based Implementation:
 * - Uses final-countdown.png as the complete visual background design.
 * - 100% of visual design, artwork, typography, and decorations come from final-countdown.png.
 * - Functional overlays:
 *   1. Countdown Timer: Working numbers & colons over the timer display area.
 *   2. Password Input: Clean functional input over the golden field.
 *   3. Hint Button: Opens the dark translucent Password Hint modal card.
 *   4. Message For You Button: Opens the dark translucent Message modal card.
 */
export default function BirthdayCountdownPage({
  targetDate,
  onCountdownComplete,
  onOpenMessage,
}) {
  // ----------------------------------------------------------------------------
  // 1. LIVE COUNTDOWN LOGIC
  // ----------------------------------------------------------------------------
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  const hasTriggeredComplete = useRef(false);

  function calculateTimeLeft(dateInput) {
    if (!dateInput) {
      const oc = BIRTHDAY_CONFIG?.openingCountdown;
      if (oc && (oc.targetDate || oc.targetTime)) {
        dateInput = parseISTTarget(oc.targetDate, oc.targetTime);
      } else {
        dateInput = BIRTHDAY_CONFIG?.coverTargetDate || BIRTHDAY_CONFIG?.targetDate;
      }
    }

    if (!dateInput) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isConfigured: false, isCompleted: false };
    }

    // Resolve target in Indian Standard Time (UTC+05:30)
    let target = null;
    if (typeof dateInput === 'string' && !dateInput.includes('Z') && !/[+-]\d{2}:\d{2}$/.test(dateInput)) {
      target = parseISTTarget(dateInput);
    }
    if (!target) {
      target = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    }

    if (isNaN(target)) {
      console.warn('[BirthdayCountdownPage] Invalid target date provided in src/config.js:', dateInput);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isConfigured: false, isCompleted: false };
    }

    const now = Date.now();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isConfigured: true, isCompleted: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isConfigured: true, isCompleted: false };
  }

  useEffect(() => {
    hasTriggeredComplete.current = false;
    const initial = calculateTimeLeft(targetDate);
    setTimeLeft(initial);

    // If targetDate is already completed prior to mount, do NOT auto-trigger immediate navigation.
    // Display 00:00:00:00 on the cover page so the user can view the countdown and use the secret password.
    // Transition occurs when the live countdown ticks down to zero on the active page.
    if (initial.isCompleted) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (targetDate || BIRTHDAY_CONFIG?.openingCountdown) {
          const updated = calculateTimeLeft(targetDate);
          if (updated.isCompleted && !hasTriggeredComplete.current) {
            hasTriggeredComplete.current = true;
            clearInterval(intervalId);
            onCountdownComplete?.();
          }
          return updated;
        }

        let { days, hours, minutes, seconds } = prev;
        seconds -= 1;
        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
          if (minutes < 0) {
            minutes = 59;
            hours -= 1;
            if (hours < 0) {
              hours = 23;
              days = Math.max(0, days - 1);
            }
          }
        }
        return { days, hours, minutes, seconds, isConfigured: false, isCompleted: false };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate, onCountdownComplete]);

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  // ----------------------------------------------------------------------------
  // 2. PASSWORD VALIDATION & INPUT STATE
  // ----------------------------------------------------------------------------
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPasswordError, setHasPasswordError] = useState(false);
  const errorTimerRef = useRef(null);

  // Single source of truth: strictly reads secretPassword from src/config.js
  const isPasswordEnabled = Boolean(BIRTHDAY_CONFIG.secretPassword);
  const expectedPassword = String(BIRTHDAY_CONFIG.secretPassword || '').trim().toLowerCase();

  const handlePasswordSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = passwordInput.trim().toLowerCase();
    if (!clean) return;

    // Strict single source of truth comparison — NO hardcoded alternate passwords
    if (expectedPassword && clean === expectedPassword) {
      setErrorMessage('');
      setHasPasswordError(false);
      try {
        audioController.handleUserInteraction();
      } catch (_) {}
      onCountdownComplete?.();
    } else {
      setHasPasswordError(true);
      setErrorMessage('Incorrect password. Try clicking Hint! ♡');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setHasPasswordError(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  // ----------------------------------------------------------------------------
  // 3. MODAL CARDS STATE (MESSAGE FOR YOU & HINT)
  // ----------------------------------------------------------------------------
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowMessageModal(false);
        setShowHintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="birthday-countdown-page-root" role="region" aria-label="Birthday Countdown Page">
      {/* Full-bleed ambient blurred background preventing black side bars on any aspect ratio */}
      <div
        className="birthday-ambient-bg"
        style={{ backgroundImage: `url(${countdownBg})` }}
        aria-hidden="true"
      />

      {/* Main 16:9 proportioned stage containing the pristine artwork and functional overlays */}
      <div className="birthday-image-stage">
        {/* Background Image: 100% of Visual Artwork & Typography from final-countdown.png */}
        <img
          src={countdownBg}
          alt="Birthday Countdown"
          className="birthday-stage-bg-image"
          draggable="false"
        />

        {/* ----------------------------------------------------------------------
            OVERLAY 1: WORKING COUNTDOWN TIMER NUMBERS
            Positioned precisely over the timer area in the background image
           ---------------------------------------------------------------------- */}
        <div
          className="overlay-countdown-track"
          role="timer"
          aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
        >
          <div className="countdown-col days">
            <span className="countdown-digit-num">{pad(timeLeft.days)}</span>
          </div>

          <div className="countdown-col colon-1" aria-hidden="true">
            <span className="countdown-colon">:</span>
          </div>

          <div className="countdown-col hours">
            <span className="countdown-digit-num">{pad(timeLeft.hours)}</span>
          </div>

          <div className="countdown-col colon-2" aria-hidden="true">
            <span className="countdown-colon">:</span>
          </div>

          <div className="countdown-col minutes">
            <span className="countdown-digit-num">{pad(timeLeft.minutes)}</span>
          </div>

          <div className="countdown-col colon-3" aria-hidden="true">
            <span className="countdown-colon">:</span>
          </div>

          <div className="countdown-col seconds">
            <span className="countdown-digit-num">{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------
            OVERLAY 2: PASSWORD INPUT
            Clean, functional input over the golden field area
           ---------------------------------------------------------------------- */}
        {isPasswordEnabled && (
          <form className="overlay-password-form" onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (hasPasswordError) setHasPasswordError(false);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Enter Password..."
              className="overlay-password-input"
              aria-label="Secret password to open surprise"
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        )}

        {/* Separate Notification BELOW the Password Panel (Matching Reference Image) */}
        {hasPasswordError && (
          <div className="overlay-password-error-card" role="alert">
            {/* Left glowing radiant tick lines */}
            <div className="error-card-ticks ticks-left" aria-hidden="true">
              <span className="tick-ray ray-top" />
              <span className="tick-ray ray-mid" />
              <span className="tick-ray ray-bot" />
            </div>

            {/* Glowing Pink/Red Glass Capsule */}
            <div className="error-card-capsule">
              {/* Glossy top glass glare */}
              <div className="error-capsule-glass-glare" aria-hidden="true" />

              {/* Row 1: Circular White X Icon + "Incorrect Password!" */}
              <div className="error-card-header-row">
                <span className="error-circle-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
                <span className="error-card-title">Incorrect Password!</span>
              </div>

              {/* Row 2: Supporting Text flanked by delicate horizontal lines */}
              <div className="error-card-sub-row">
                <span className="error-sub-flourish-line" aria-hidden="true" />
                <span className="error-card-subtitle">Try again or use the Hint ♡</span>
                <span className="error-sub-flourish-line" aria-hidden="true" />
              </div>
            </div>

            {/* Right glowing radiant tick lines */}
            <div className="error-card-ticks ticks-right" aria-hidden="true">
              <span className="tick-ray ray-top" />
              <span className="tick-ray ray-mid" />
              <span className="tick-ray ray-bot" />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------
            OVERLAY 3: HINT BUTTON
            Opens the dark translucent Password Hint modal card
           ---------------------------------------------------------------------- */}
        {isPasswordEnabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowHintModal(true);
            }}
            className="overlay-hint-button"
            aria-label="Show password hint"
            title="Click for Hint"
          >
            <span className="hint-btn-text">Hint</span>
          </button>
        )}

        {/* ----------------------------------------------------------------------
            OVERLAY 4: INSTRUCTION BUTTON
            Opens the dark translucent Instruction modal card
           ---------------------------------------------------------------------- */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMessageModal(true);
          }}
          className="overlay-message-button"
          aria-label="Open Instructions"
          title="Instruction"
        >
          <span className="overlay-message-btn-text">Instruction</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------------
          MODAL CARD 1: MESSAGE FOR YOU (INSTRUCTION CARD)
         ---------------------------------------------------------------------- */}
      {showMessageModal && (
        <div
          className="countdown-modal-backdrop"
          onClick={() => setShowMessageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Instructions before you begin"
        >
          <div
            className="countdown-modal-card countdown-instruction-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="countdown-modal-close"
              onClick={() => setShowMessageModal(false)}
              aria-label="Close instructions"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
            <div className="countdown-instruction-body">
              <div className="countdown-instruction-columns">
                {/* Left Column: Original 6 Instructions */}
                <div className="instruction-column instruction-col-left">
                  <h3 className="countdown-instruction-heading">
                    A Few Things Before You Begin ❤️
                  </h3>
                  <div className="countdown-instruction-divider" />
                  <ol className="countdown-instruction-list">
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">1</span>
                      <span className="instruction-item-text">Must put on buds before start.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">2</span>
                      <span className="instruction-item-text">Open site in full screen mode (Fn + F11 or F11).</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">3</span>
                      <span className="instruction-item-text">Explore each and every button cause will help you.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">4</span>
                      <span className="instruction-item-text">Don't try to skip anything.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">5</span>
                      <span className="instruction-item-text">Don't leave it without finishing fully.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">6</span>
                      <span className="instruction-item-text">Sit alone and read.</span>
                    </li>
                  </ol>
                </div>

                {/* Subtle Vertical Gold Divider */}
                <div className="instruction-columns-divider" aria-hidden="true" />

                {/* Right Column: Explore & Enjoy */}
                <div className="instruction-column instruction-col-right">
                  <h3 className="countdown-instruction-heading">
                    Explore &amp; Enjoy ✨
                  </h3>
                  <div className="countdown-instruction-divider" />
                  <ol className="countdown-instruction-list">
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">1</span>
                      <span className="instruction-item-text">Zoom in on images and videos.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">2</span>
                      <span className="instruction-item-text">Change songs.</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">3</span>
                      <span className="instruction-item-text">You can do many, many things!</span>
                    </li>
                    <li className="countdown-instruction-item">
                      <span className="instruction-num-badge">4</span>
                      <span className="instruction-item-text">As I've tried everything, I hope you won't have any problems.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL CARD 2: PASSWORD HINT
         ---------------------------------------------------------------------- */}
      {showHintModal && (
        <div
          className="countdown-modal-backdrop"
          onClick={() => setShowHintModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="countdown-modal-card countdown-modal-hint-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="countdown-modal-close"
              onClick={() => setShowHintModal(false)}
              aria-label="Close hint"
            >
              ×
            </button>
            <div className="countdown-modal-body" style={{ padding: '2rem 1.75rem', textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontFamily: 'var(--font-serif-card), serif', fontSize: '1.4rem', color: '#ffe29a', marginBottom: '0.5rem' }}>
                {BIRTHDAY_CONFIG.countdownPage?.hintContent?.title || "Password Hint"}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.75)', marginBottom: '1.25rem' }}>
                {BIRTHDAY_CONFIG.countdownPage?.hintContent?.subtitle || "Can't wait for the countdown? Here is your clue:"}
              </p>
              <div style={{ background: 'rgba(255, 220, 140, 0.12)', border: '1px solid rgba(255, 220, 140, 0.35)', borderRadius: '12px', padding: '0.85rem 1.25rem', display: 'inline-block' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffd67a', display: 'block', marginBottom: '4px' }}>Hint</span>
                <span style={{ fontSize: '1.05rem', color: '#fff9ea', fontWeight: '500' }}>
                  {BIRTHDAY_CONFIG.passwordHint || BIRTHDAY_CONFIG.countdownPage?.hintContent?.hint || ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
