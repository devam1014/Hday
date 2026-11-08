import React, { useState, useEffect, useRef } from 'react';
import countdownBg from '../../final-countdown.png?v=1';
import { BIRTHDAY_CONFIG } from '../config';

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
      return { days: 2, hours: 14, minutes: 37, seconds: 9, isConfigured: false, isCompleted: false };
    }

    const target = new Date(dateInput).getTime();
    if (isNaN(target)) {
      return { days: 2, hours: 14, minutes: 37, seconds: 9, isConfigured: false, isCompleted: false };
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

    if (initial.isConfigured && initial.isCompleted && !hasTriggeredComplete.current) {
      hasTriggeredComplete.current = true;
      onCountdownComplete?.();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (targetDate) {
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
  const errorTimerRef = useRef(null);

  const expectedPassword = (BIRTHDAY_CONFIG.secretPassword || BIRTHDAY_CONFIG.recipientName || 'miioo').toLowerCase().trim();
  const alternateAccepted = ['birthday', 'happy birthday', 'miioo', 'miio', 'mimi'];

  const handlePasswordSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = passwordInput.trim().toLowerCase();
    if (!clean) return;

    if (clean === expectedPassword || alternateAccepted.includes(clean)) {
      setErrorMessage('');
      onCountdownComplete?.();
    } else {
      setErrorMessage('Incorrect password. Try clicking Hint! ♡');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setErrorMessage('');
      }, 3500);
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
        <form className="overlay-password-form" onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Enter Password..."
            className="overlay-password-input"
            aria-label="Secret password to open surprise"
            autoComplete="off"
            spellCheck="false"
          />
        </form>

        {/* Error notification if incorrect password entered */}
        {errorMessage && (
          <div className="overlay-password-feedback" role="alert">
            {errorMessage}
          </div>
        )}

        {/* ----------------------------------------------------------------------
            OVERLAY 3: HINT BUTTON
            Opens the dark translucent Password Hint modal card
           ---------------------------------------------------------------------- */}
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

        {/* ----------------------------------------------------------------------
            OVERLAY 4: MESSAGE FOR YOU BUTTON
            Opens the dark translucent Message modal card
           ---------------------------------------------------------------------- */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMessageModal(true);
          }}
          className="overlay-message-button"
          aria-label="Open Birthday Message"
          title="Message For You"
        />
      </div>

      {/* ----------------------------------------------------------------------
          MODAL CARD 1: MESSAGE FOR YOU
          Dark translucent modal with interior kept empty
         ---------------------------------------------------------------------- */}
      {showMessageModal && (
        <div
          className="countdown-modal-backdrop"
          onClick={() => setShowMessageModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="countdown-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="countdown-modal-close"
              onClick={() => setShowMessageModal(false)}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          MODAL CARD 2: PASSWORD HINT
          Dark translucent modal with interior kept empty
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
          </div>
        </div>
      )}
    </div>
  );
}
