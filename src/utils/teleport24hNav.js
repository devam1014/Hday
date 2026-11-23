/**
 * ============================================================================
 * TELEPORT_24H_NAV: VISITOR NAVIGATION & AUTOMATIC MIDNIGHT RESET UTILITY
 * ============================================================================
 * Feature Code: TELEPORT_24H_NAV
 * 
 * Provides:
 * 1. Isolated persistent visitor history in localStorage under 'TELEPORT_24H_NAV_state'.
 * 2. Automatic midnight reset at 12:00 AM in the Asia/Kolkata (IST) timezone.
 * 3. Does NOT reset real countdown target or config.js dates.
 * 4. Tracks visited sections, unlock status, and restore progress across reloads.
 * 5. Test Helper ON/OFF developer toggle separate from visitor state.
 * 
 * FUTURE REMOVAL INSTRUCTION:
 * If asked to "Remove TELEPORT_24H_NAV", safely remove:
 * 1. This file (src/utils/teleport24hNav.js).
 * 2. src/components/TeleportDropdown.jsx.
 * 3. All imports and hooks marked with TELEPORT_24H_NAV in src/App.jsx.
 * 4. The Teleport Navigation toggle in src/components/DevControls.jsx.
 * 5. CSS rules under the TELEPORT_24H_NAV header in src/index.css.
 * ============================================================================
 */

export const TELEPORT_24H_NAV_STORAGE_KEY = 'TELEPORT_24H_NAV_state';
export const TELEPORT_24H_NAV_ENABLED_KEY = 'TELEPORT_24H_NAV_enabled';
export const TELEPORT_24H_NAV_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current calendar date string (YYYY-MM-DD) in Asia/Kolkata (IST) timezone.
 * Used for strict 12:00 AM IST midnight calendar day change detection.
 */
export function getISTDateString(timestamp = Date.now()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TELEPORT_24H_NAV_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(timestamp));
  } catch (err) {
    // Fallback: manual calculation for UTC+05:30
    const d = new Date(timestamp + (5.5 * 60 + new Date().getTimezoneOffset()) * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Check whether TELEPORT_24H_NAV is enabled in Test Helper
 * Defaults to true for visitor experience.
 */
export function isTeleportNavEnabled() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return true;
  }
  try {
    const setting = window.localStorage.getItem(TELEPORT_24H_NAV_ENABLED_KEY);
    // Defaults to ON (true)
    return setting !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Toggle or set TELEPORT_24H_NAV enabled state for developer testing
 */
export function setTeleportNavEnabled(enabled) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(TELEPORT_24H_NAV_ENABLED_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('teleport-toggle-changed', { detail: { enabled: Boolean(enabled) } })
    );
  } catch (e) {
    console.error('TELEPORT_24H_NAV: Failed to save enabled state', e);
  }
}

/**
 * Ordered master list of navigable destinations for TELEPORT_24H_NAV
 */
export const TELEPORT_24H_NAV_SECTION_DEFS = [
  {
    id: 'fireworks-replay',
    label: 'Click & See Magic',
    isSpecial: true, // Always option #1
  },
  {
    id: 'main',
    label: 'Main Birthday',
  },
  {
    id: 'sad-memories',
    label: 'Sad Gallery',
  },
  {
    id: 'happy-gallery',
    label: 'Happy Gallery',
  },
  {
    id: 'qna',
    label: 'Q&A',
  },
  {
    id: 'qna-final',
    label: 'Message for You',
  },
];

/**
 * Load saved TELEPORT_24H_NAV state if valid and unexpired (within current IST calendar day)
 * Returns null if missing or if midnight in Asia/Kolkata has passed.
 */
export function loadTeleport24hNavState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  // If feature is disabled by dev switch, treat as inactive
  if (!isTeleportNavEnabled()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TELEPORT_24H_NAV_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || typeof data.createdAt !== 'number') {
      window.localStorage.removeItem(TELEPORT_24H_NAV_STORAGE_KEY);
      return null;
    }

    const currentISTDate = getISTDateString();

    // Check 1: Strict Midnight Reset in Asia/Kolkata (date string comparison)
    if (data.istDate && data.istDate !== currentISTDate) {
      window.localStorage.removeItem(TELEPORT_24H_NAV_STORAGE_KEY);
      return null;
    }

    // Check 2: Safety 24-hour max window fallback
    const elapsed = Date.now() - data.createdAt;
    if (elapsed > 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(TELEPORT_24H_NAV_STORAGE_KEY);
      return null;
    }

    return data;
  } catch (err) {
    console.error('TELEPORT_24H_NAV: Failed to load state', err);
    return null;
  }
}

/**
 * Save / update TELEPORT_24H_NAV state
 * Automatically associates the active IST calendar date.
 */
export function saveTeleport24hNavState(partialState = {}) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  // If feature is disabled by dev switch, do not persist visitor history
  if (!isTeleportNavEnabled()) {
    return null;
  }

  try {
    const existing = loadTeleport24hNavState();
    const currentISTDate = getISTDateString();
    const createdAt = existing?.createdAt || Date.now();

    // Merge visited sections without duplicates
    const combinedVisited = new Set([
      ...(existing?.visitedSections || []),
      ...(partialState.visitedSections || []),
    ]);

    const merged = {
      createdAt,
      istDate: currentISTDate,
      secondCountdownCompleted:
        partialState.secondCountdownCompleted !== undefined
          ? partialState.secondCountdownCompleted
          : (existing?.secondCountdownCompleted ?? false),
      fireworksUnlocked:
        partialState.fireworksUnlocked !== undefined
          ? partialState.fireworksUnlocked
          : (existing?.fireworksUnlocked ?? false),
      teleportUnlocked:
        partialState.teleportUnlocked !== undefined
          ? partialState.teleportUnlocked
          : (existing?.teleportUnlocked ?? false),
      visitedSections: Array.from(combinedVisited),
      lastActiveSection: partialState.lastActiveSection || existing?.lastActiveSection || 'main',
      navigationProgress: {
        ...(existing?.navigationProgress || {}),
        ...(partialState.navigationProgress || {}),
      },
    };

    window.localStorage.setItem(TELEPORT_24H_NAV_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('TELEPORT_24H_NAV: Failed to save state', err);
    return null;
  }
}

/**
 * Remove TELEPORT_24H_NAV state manually
 */
export function clearTeleport24hNavState() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(TELEPORT_24H_NAV_STORAGE_KEY);
  }
}

/**
 * Check if the stored IST date has passed midnight.
 * Purges history and notifies listening components if midnight occurred.
 * Returns true if a midnight purge took place.
 */
export function checkAndPurgeIfExpired() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(TELEPORT_24H_NAV_STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    const currentISTDate = getISTDateString();

    if (data && data.istDate && data.istDate !== currentISTDate) {
      window.localStorage.removeItem(TELEPORT_24H_NAV_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('teleport-midnight-reset'));
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
