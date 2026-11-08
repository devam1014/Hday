import React, { useState, useEffect, useRef } from 'react';

/**
 * Delicate Golden Botanical Laurel Sprig SVG
 * Refined curved stem, individually shaped leaves, symmetrical linework, and base tendril
 */
function BotanicalOrnament({ flip = false }) {
  return (
    <svg
      viewBox="0 0 36 64"
      className={`botanical-ornament ${flip ? 'flipped' : ''}`}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Graceful curved main stem */}
      <path
        d="M 24 6 C 14 18, 12 42, 22 58"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Delicate curled base tendril flourish */}
      <path
        d="M 22 58 C 24 60, 27 61, 29 59 C 30 57, 28 55, 26 56"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Top terminal leaf / bud */}
      <path
        d="M 24 6 C 24 3, 22 1, 20 1 C 19 3, 21 5, 24 6 Z"
        fill="currentColor"
      />
      {/* Leaf Pair 1 (Upper small) */}
      <path
        d="M 21 13 C 16 10, 13 11, 11 13 C 14 16, 18 16, 21 13 Z"
        fill="currentColor"
      />
      <path
        d="M 21 15 C 25 12, 29 13, 31 16 C 27 18, 24 17, 21 15 Z"
        fill="currentColor"
      />
      {/* Leaf Pair 2 (Upper mid) */}
      <path
        d="M 17 23 C 11 19, 7 21, 5 24 C 9 27, 14 27, 17 23 Z"
        fill="currentColor"
      />
      <path
        d="M 17 25 C 22 22, 28 23, 30 27 C 26 29, 21 28, 17 25 Z"
        fill="currentColor"
      />
      {/* Leaf Pair 3 (Center prominent) */}
      <path
        d="M 15 34 C 8 30, 4 33, 2 37 C 7 40, 12 39, 15 34 Z"
        fill="currentColor"
      />
      <path
        d="M 15 36 C 21 33, 27 35, 29 39 C 25 41, 19 40, 15 36 Z"
        fill="currentColor"
      />
      {/* Leaf Pair 4 (Lower mid) */}
      <path
        d="M 16 45 C 10 42, 6 45, 5 49 C 9 51, 14 50, 16 45 Z"
        fill="currentColor"
      />
      <path
        d="M 17 47 C 22 45, 26 47, 27 51 C 24 53, 20 51, 17 47 Z"
        fill="currentColor"
      />
      {/* Small golden berry accents near stem */}
      <circle cx="16" cy="29" r="1.3" fill="currentColor" />
      <circle cx="17" cy="40" r="1.3" fill="currentColor" />
    </svg>
  );
}

/**
 * Wall-Integrated Countdown Component
 * - Sits directly on the rooftop wall (center-right)
 * - Zero cards, zero background rectangles, zero glass panels, zero sky headings
 * - Large warm golden-yellow numerals (#FFC52E) illuminated on the wall
 * - Uppercase labels directly below numerals (#FFF2CC)
 * - Thin subtle vertical dividers between units
 * - Delicate botanical ornaments on outer sides
 */
export default function Countdown({ targetDate, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  const hasTriggeredComplete = useRef(false);

  function calculateTimeLeft(dateInput) {
    if (!dateInput) {
      return { days: 2, hours: 14, minutes: 37, seconds: 9, isReady: true, isCompleted: false };
    }

    const target = new Date(dateInput).getTime();
    if (isNaN(target)) {
      return { days: 2, hours: 14, minutes: 37, seconds: 9, isReady: true, isCompleted: false };
    }

    const now = Date.now();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isReady: true, isCompleted: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isReady: true, isCompleted: false };
  }

  useEffect(() => {
    hasTriggeredComplete.current = false;
    const initial = calculateTimeLeft(targetDate);
    setTimeLeft(initial);

    if (initial.isReady && initial.isCompleted && !hasTriggeredComplete.current) {
      hasTriggeredComplete.current = true;
      onComplete?.();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (targetDate) {
          const updated = calculateTimeLeft(targetDate);
          if (updated.isCompleted && !hasTriggeredComplete.current) {
            hasTriggeredComplete.current = true;
            clearInterval(intervalId);
            onComplete?.();
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
        return { days, hours, minutes, seconds, isReady: true, isCompleted: false };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate, onComplete]);

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  const daysValue = pad(timeLeft.days);
  const hoursValue = pad(timeLeft.hours);
  const minutesValue = pad(timeLeft.minutes);
  const secondsValue = pad(timeLeft.seconds);

  return (
    <div
      className="wall-countdown-track"
      role="timer"
      aria-label="Birthday countdown displayed on the rooftop wall"
    >
      {/* Left Delicate Botanical Leaf Ornament */}
      <BotanicalOrnament flip={false} />

      {/* DAYS */}
      <div className="wall-unit">
        <span className="wall-numeral">{daysValue}</span>
        <span className="wall-label">Days</span>
      </div>

      {/* Subtle Vertical Divider */}
      <div className="wall-divider" aria-hidden="true" />

      {/* HOURS */}
      <div className="wall-unit">
        <span className="wall-numeral">{hoursValue}</span>
        <span className="wall-label">Hours</span>
      </div>

      {/* Subtle Vertical Divider */}
      <div className="wall-divider" aria-hidden="true" />

      {/* MINUTES */}
      <div className="wall-unit">
        <span className="wall-numeral">{minutesValue}</span>
        <span className="wall-label">Minutes</span>
      </div>

      {/* Subtle Vertical Divider */}
      <div className="wall-divider" aria-hidden="true" />

      {/* SECONDS */}
      <div className="wall-unit">
        <span className="wall-numeral">{secondsValue}</span>
        <span className="wall-label">Seconds</span>
      </div>

      {/* Right Delicate Botanical Leaf Ornament (Mirrored) */}
      <BotanicalOrnament flip={true} />
    </div>
  );
}
