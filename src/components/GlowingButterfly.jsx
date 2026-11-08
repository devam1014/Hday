import React from 'react';

/**
 * GlowingButterfly Component
 * A delicate, warm golden butterfly with 3D fluttering wings,
 * a soft stardust particle trail, and a graceful looped flight path
 * across the upper sky.
 */
export default function GlowingButterfly() {
  return (
    <div className="butterfly-flight-container" aria-hidden="true">
      <div className="butterfly-actor">
        {/* Particle Trail */}
        <div className="butterfly-stardust-trail">
          <span className="stardust-particle p1" />
          <span className="stardust-particle p2" />
          <span className="stardust-particle p3" />
          <span className="stardust-particle p4" />
        </div>

        {/* 3D Fluttering Wings */}
        <div className="butterfly-body-wrapper">
          <svg
            className="butterfly-svg"
            viewBox="0 0 100 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
                <stop offset="40%" stopColor="#f7d58b" stopOpacity="0.9" />
                <stop offset="80%" stopColor="#dfa74e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#b8832a" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="wingVeinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f3ca74" stopOpacity="0.4" />
              </linearGradient>
              <filter id="goldenGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Left Wing Group */}
            <g className="wing-left" filter="url(#goldenGlow)">
              {/* Forewing */}
              <path
                d="M 50 42 C 45 28, 25 10, 10 15 C 2 18, 6 36, 26 44 C 38 48, 47 45, 50 42 Z"
                fill="url(#goldWingGrad)"
                stroke="#ffeec2"
                strokeWidth="0.8"
              />
              {/* Hindwing */}
              <path
                d="M 50 44 C 42 46, 22 48, 16 58 C 12 65, 24 72, 36 64 C 44 58, 48 50, 50 44 Z"
                fill="url(#goldWingGrad)"
                stroke="#ffeec2"
                strokeWidth="0.8"
              />
              {/* Veins */}
              <path
                d="M 50 42 Q 32 30 14 18 M 50 42 Q 30 40 18 34 M 50 44 Q 34 54 22 62"
                stroke="url(#wingVeinGrad)"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>

            {/* Right Wing Group */}
            <g className="wing-right" filter="url(#goldenGlow)">
              {/* Forewing */}
              <path
                d="M 50 42 C 55 28, 75 10, 90 15 C 98 18, 94 36, 74 44 C 62 48, 53 45, 50 42 Z"
                fill="url(#goldWingGrad)"
                stroke="#ffeec2"
                strokeWidth="0.8"
              />
              {/* Hindwing */}
              <path
                d="M 50 44 C 58 46, 78 48, 84 58 C 88 65, 76 72, 64 64 C 56 58, 52 50, 50 44 Z"
                fill="url(#goldWingGrad)"
                stroke="#ffeec2"
                strokeWidth="0.8"
              />
              {/* Veins */}
              <path
                d="M 50 42 Q 68 30 86 18 M 50 42 Q 70 40 82 34 M 50 44 Q 66 54 78 62"
                stroke="url(#wingVeinGrad)"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>

            {/* Delicate Body & Antennae */}
            <g className="butterfly-torso">
              {/* Antennae */}
              <path
                d="M 50 34 Q 45 22 41 18 M 50 34 Q 55 22 59 18"
                stroke="#ffeec2"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              <circle cx="40.5" cy="17.5" r="1.2" fill="#fff5d6" />
              <circle cx="59.5" cy="17.5" r="1.2" fill="#fff5d6" />

              {/* Head & Abdomen */}
              <ellipse cx="50" cy="35" rx="2" ry="2.5" fill="#f7e4b5" />
              <ellipse cx="50" cy="46" rx="2" ry="8" fill="#d99f3d" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
