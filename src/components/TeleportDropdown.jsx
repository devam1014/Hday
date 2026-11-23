/**
 * ============================================================================
 * TELEPORT_24H_NAV: TELEPORT DROPDOWN COMPONENT
 * ============================================================================
 * Feature Code: TELEPORT_24H_NAV
 * 
 * Provides:
 * - A compact, luxurious frosted-glass 'Teleport' dropdown button.
 * - Always includes 'Click & See Magic' as option #1.
 * - Dynamically includes only genuinely visited sections in correct chronological order.
 * - Closes on option selection, clicking outside, or pressing Escape.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { TELEPORT_24H_NAV_SECTION_DEFS } from '../utils/teleport24hNav';

export default function TeleportDropdown({
  visitedSections = [],
  currentSection = 'main',
  onSelectSection,
  onReplayFireworks,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback(
    (item) => {
      setIsOpen(false);
      if (item.id === 'fireworks-replay') {
        onReplayFireworks?.();
      } else {
        onSelectSection?.(item.id);
      }
    },
    [onReplayFireworks, onSelectSection]
  );

  // Build the list of available items
  // Option 1: Always "Click & See Magic"
  // Options 2..N: Sections that have genuinely been visited
  const availableItems = TELEPORT_24H_NAV_SECTION_DEFS.filter((item) => {
    if (item.id === 'fireworks-replay') return true;
    return visitedSections.includes(item.id);
  });

  return (
    <div className="teleport-nav-container" ref={containerRef}>
      <button
        type="button"
        className={`teleport-nav-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Teleport: Jump to previously visited sections"
        title="Teleport to any visited section"
      >
        <span>Teleport</span>
        <ChevronDown size={14} className={`teleport-chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="teleport-dropdown-panel" role="menu" aria-label="Teleport destinations">
          {availableItems.map((item) => {
            const isCurrent = currentSection === item.id;
            const isMagic = item.id === 'fireworks-replay';

            return (
              <button
                key={item.id}
                type="button"
                className={`teleport-dropdown-item ${isMagic ? 'item-magic' : ''} ${isCurrent ? 'is-current' : ''}`}
                onClick={() => handleItemClick(item)}
                role="menuitem"
                aria-label={item.label}
              >
                <span className="teleport-item-label flex items-center gap-1.5">
                  {isMagic && <Sparkles size={13} className="text-amber-300 flex-shrink-0" />}
                  <span>{item.label}</span>
                </span>
                {isCurrent && <span className="teleport-current-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
