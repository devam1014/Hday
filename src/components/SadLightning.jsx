import React, { useState, useEffect, useRef } from 'react';

/**
 * SadLightning Component
 * 
 * Cinematic Thunderstorm Lightning Effect:
 * - Triggers on navigation image changes.
 * - Cool-white background flash with subtle violet edges.
 * - Realistic branching jagged lightning bolt in the distant sky.
 * - Subtle secondary ambient glow on clouds and mountains.
 * - Randomized bolt branching, positions, and intensity.
 * - Smooth fade out over ~500ms.
 */

// 4 distinct realistic branching lightning bolt definitions
const BOLT_VARIANTS = [
  {
    id: 'left-flank',
    viewBox: '0 0 400 450',
    originX: '18%',
    originY: '2%',
    scale: 0.95,
    glowColor: 'rgba(165, 195, 255, 0.42)',
    // Jagged primary stem
    mainStem: 'M 220 0 L 210 45 L 235 90 L 218 135 L 245 180 L 232 230 L 260 280 L 248 340 L 275 400',
    // Realistic branching forks
    branches: [
      'M 210 45 L 185 85 L 195 125 L 175 160',
      'M 235 90 L 265 130 L 255 170 L 280 205',
      'M 245 180 L 215 220 L 225 260 L 205 295',
      'M 260 280 L 290 320 L 282 355',
    ],
  },
  {
    id: 'mid-left-sky',
    viewBox: '0 0 450 480',
    originX: '32%',
    originY: '1%',
    scale: 1.05,
    glowColor: 'rgba(180, 205, 255, 0.45)',
    mainStem: 'M 300 0 L 315 50 L 290 100 L 325 155 L 305 210 L 340 270 L 320 330 L 350 390 L 335 450',
    branches: [
      'M 315 50 L 345 90 L 335 130 L 360 165',
      'M 290 100 L 260 145 L 272 185 L 245 225',
      'M 325 155 L 365 200 L 355 240 L 385 280',
      'M 305 210 L 275 255 L 285 295 L 265 335',
    ],
  },
  {
    id: 'mid-right-sky',
    viewBox: '0 0 400 460',
    originX: '68%',
    originY: '2%',
    scale: 0.92,
    glowColor: 'rgba(175, 190, 255, 0.4)',
    mainStem: 'M 180 0 L 165 45 L 190 95 L 172 145 L 202 200 L 184 255 L 215 315 L 198 375 L 225 430',
    branches: [
      'M 165 45 L 135 85 L 148 125 L 122 165',
      'M 190 95 L 220 135 L 210 175 L 238 215',
      'M 172 145 L 145 190 L 158 230 L 138 270',
      'M 202 200 L 235 245 L 225 285 L 252 325',
    ],
  },
  {
    id: 'right-flank',
    viewBox: '0 0 420 460',
    originX: '82%',
    originY: '1%',
    scale: 0.88,
    glowColor: 'rgba(190, 180, 255, 0.44)',
    mainStem: 'M 250 0 L 270 40 L 245 85 L 285 135 L 260 185 L 295 240 L 275 295 L 310 355 L 290 415',
    branches: [
      'M 270 40 L 300 75 L 290 115 L 320 150',
      'M 245 85 L 215 125 L 225 165 L 198 205',
      'M 285 135 L 325 180 L 315 220 L 345 260',
      'M 260 185 L 230 230 L 240 270 L 218 310',
    ],
  },
];

export default function SadLightning({ strikeCount = 0 }) {
  const [activeStrike, setActiveStrike] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Only strike when trigger counter increments (> 0)
    if (strikeCount <= 0) return;

    // Pick random bolt variant
    const variantIndex = Math.floor(Math.random() * BOLT_VARIANTS.length);
    const variant = BOLT_VARIANTS[variantIndex];

    // Slight random position variance (+/- 4%) and scale (+/- 0.08)
    const offsetX = (Math.random() - 0.5) * 6;
    const intensity = 0.82 + Math.random() * 0.18;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setActiveStrike({
      variant,
      offsetX,
      intensity,
      key: strikeCount,
    });

    // Auto-dismiss after animation completes (520ms)
    timerRef.current = setTimeout(() => {
      setActiveStrike(null);
    }, 530);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [strikeCount]);

  if (!activeStrike) return null;

  const { variant, offsetX, intensity, key } = activeStrike;

  return (
    <div
      key={key}
      className="sad-lightning-container is-striking"
      aria-hidden="true"
      style={{
        '--lightning-intensity': intensity,
        '--lightning-glow': variant.glowColor,
      }}
    >
      {/* 1. Cool-white & Violet Atmospheric Sky Flash */}
      <div
        className="sad-lightning-sky-flash"
        style={{
          background: `radial-gradient(ellipse 65% 50% at ${variant.originX} ${variant.originY}, rgba(230, 242, 255, ${0.46 * intensity}) 0%, rgba(175, 160, 240, ${0.28 * intensity}) 40%, rgba(45, 35, 75, ${0.12 * intensity}) 70%, transparent 100%)`,
        }}
      />

      {/* 2. Global Ambient Environmental Flash */}
      <div className="sad-lightning-ambient-flash" />

      {/* 3. Realistic Branching Jagged Lightning Bolt */}
      <div
        className="sad-lightning-bolt-wrapper"
        style={{
          left: `calc(${variant.originX} + ${offsetX}%)`,
          top: variant.originY,
          transform: `scale(${variant.scale})`,
        }}
      >
        <svg
          viewBox={variant.viewBox}
          className="sad-lightning-bolt-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="lightningGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="glow1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="glow2" />
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="glow2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Diffuse Violet/Blue Outer Aura */}
          <g filter="url(#lightningGlow)" opacity="0.85">
            <path
              d={variant.mainStem}
              stroke="rgba(150, 180, 255, 0.7)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="miter"
            />
            {variant.branches.map((b, i) => (
              <path
                key={i}
                d={b}
                stroke="rgba(150, 180, 255, 0.6)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
            ))}
          </g>

          {/* Vibrant Electric Mid-glow */}
          <path
            d={variant.mainStem}
            stroke="#b8d8ff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
          {variant.branches.map((b, i) => (
            <path
              key={`mid-${i}`}
              d={b}
              stroke="#b8d8ff"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="miter"
            />
          ))}

          {/* Blazing Core Beam */}
          <path
            d={variant.mainStem}
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
          {variant.branches.map((b, i) => (
            <path
              key={`core-${i}`}
              d={b}
              stroke="#ffffff"
              strokeWidth="1.0"
              strokeLinecap="round"
              strokeLinejoin="miter"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
