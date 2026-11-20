import React from 'react';

/**
 * SectionIndicator
 * Minimal vertical section indicator on the extreme right edge of the screen:
 * - A single thin vertical golden line.
 * - Exactly 13 small circular dots along the line representing the 13 sections.
 * - The active section's dot has a subtle warm golden glow.
 * - Completed sections are slightly brighter, upcoming sections are soft.
 * - Clean, minimal, non-intrusive.
 * - No numbers, no text labels, no floating hearts, no card backgrounds.
 */
export default function SectionIndicator({ currentSection = 0, totalSections = 13, onSelectSection }) {
  const dots = Array.from({ length: totalSections }, (_, i) => i);

  return (
    <div
      className="section-indicator-container"
      role="navigation"
      aria-label="Section navigation indicator"
      style={{ pointerEvents: onSelectSection ? 'auto' : undefined }}
    >
      <div className="section-indicator-line" />
      <div className="section-indicator-dots-group">
        {dots.map((index) => {
          const isActive = index === currentSection;
          const isCompleted = index < currentSection;
          const stateClass = isActive
            ? 'is-active'
            : isCompleted
            ? 'is-completed'
            : 'is-upcoming';

          return (
            <span
              key={index}
              onClick={() => onSelectSection?.(index)}
              className={`section-indicator-dot ${stateClass}`}
              role={onSelectSection ? 'button' : undefined}
              tabIndex={onSelectSection ? 0 : undefined}
              style={{ cursor: onSelectSection ? 'pointer' : 'default', pointerEvents: onSelectSection ? 'auto' : undefined }}
              aria-label={`Go to section ${index + 1}`}
              onKeyDown={(e) => {
                if (onSelectSection && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectSection(index);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
