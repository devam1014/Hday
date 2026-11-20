/**
 * Device Detector Utility
 * 
 * Accurately and reliably classifies devices into:
 * - 'desktop': Laptops, desktop PCs, Chromebooks, touchscreen laptops
 * - 'mobile': Smartphones (iPhone, Android phones, Windows phones)
 * - 'tablet': Tablets (iPad, iPad Pro, Android tablets, Kindle Fire)
 * 
 * Rules:
 * 1. Mobile phones and tablets MUST ALWAYS see the Mobile Information Screen.
 * 2. Laptops and desktop PCs MUST ALWAYS see the actual Happy Birthday website.
 * 3. Never classify a device as mobile merely because its browser window is narrow or resized.
 * 4. Never classify a laptop as mobile just because it has a touchscreen (e.g. Surface, Lenovo Yoga, Dell XPS).
 * 5. iPads on iPadOS (reporting MacIntel user agent with multi-touch) are accurately classified as 'tablet'.
 * 6. Preserves developer & preview query parameters:
 *    - `?preview=mobile` or `?mobile=true` -> forces Mobile Information Screen
 *    - `?preview=tablet` or `?tablet=true` -> forces Mobile Information Screen
 *    - `?desktop=true` or `?nomobile=true` -> forces desktop website bypass
 */

/**
 * Classifies the active device into 'desktop', 'mobile', or 'tablet'.
 * 
 * @param {string} [customUA] Optional user-agent string override
 * @param {object} [customNav] Optional navigator object override
 * @returns {'desktop' | 'mobile' | 'tablet'}
 */
export function getDeviceType(customUA, customNav) {
  // 1. URL Query Parameter Overrides (for testing & developer preview)
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const search = window.location.search.toLowerCase();
    const params = new URLSearchParams(search);

    // Force desktop override (e.g. ?desktop=true or ?nomobile=true)
    if (
      params.get('desktop') === 'true' ||
      params.get('nomobile') === 'true' ||
      search.includes('desktop=true') ||
      search.includes('nomobile=true')
    ) {
      return 'desktop';
    }

    // Force mobile preview (e.g. ?preview=mobile or ?mobile=true)
    if (
      params.get('preview') === 'mobile' ||
      params.get('mobile') === 'true' ||
      search.includes('preview=mobile') ||
      search.includes('mobile=true')
    ) {
      return 'mobile';
    }

    // Force tablet preview (e.g. ?preview=tablet or ?tablet=true)
    if (
      params.get('preview') === 'tablet' ||
      params.get('tablet') === 'true' ||
      search.includes('preview=tablet') ||
      search.includes('tablet=true')
    ) {
      return 'tablet';
    }
  }

  const nav = customNav || (typeof navigator !== 'undefined' ? navigator : {});
  const ua = (customUA || nav.userAgent || nav.vendor || (typeof window !== 'undefined' ? window.opera : '') || '').trim();
  const platform = (nav.platform || '').trim();
  const maxTouchPoints = Number(nav.maxTouchPoints || nav.msMaxTouchPoints || 0);

  // 2. Modern Client Hints (Chromium: Chrome / Edge / Opera)
  // userAgentData.mobile provides the browser's native hardware determination
  if (nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
    if (nav.userAgentData.mobile) {
      const isTabletUA =
        /iPad|Tablet|tablet|Silk|Kindle|PlayBook|SM-T|SM-P|GT-P|Tab/i.test(ua) ||
        (/Android/i.test(ua) && !/Mobile/i.test(ua));
      return isTabletUA ? 'tablet' : 'mobile';
    }
  }

  // 3. iPad Detection (including iPadOS 13+ which presents as desktop Macintosh UA)
  // Real Macs NEVER have touchscreens (maxTouchPoints is always 0 on macOS).
  // iPadOS explicitly reports platform === 'MacIntel' or UA containing 'Macintosh' with maxTouchPoints > 1.
  const isExplicitIPad = /iPad/i.test(ua);
  const isIPadOS = (/Macintosh|MacIntel/i.test(platform) || /Macintosh/i.test(ua)) && maxTouchPoints > 1;
  if (isExplicitIPad || isIPadOS) {
    return 'tablet';
  }

  // 4. Android Devices: Differentiate Android Phone vs Android Tablet
  if (/Android/i.test(ua)) {
    // Android tablets omit "Mobile" or include specific tablet identifiers
    const isAndroidTablet =
      !/Mobile/i.test(ua) ||
      /Tablet|tablet|SM-T|SM-P|GT-P|Tab|Nexus 7|Nexus 9|Nexus 10/i.test(ua);
    return isAndroidTablet ? 'tablet' : 'mobile';
  }

  // 5. iOS Mobile Phones (iPhone, iPod)
  if (/iPhone|iPod/i.test(ua)) {
    return 'mobile';
  }

  // 6. Other Known Tablets
  const tabletRegex = /Tablet|tablet|Silk|Kindle|PlayBook|RIM Tablet|HP-TouchPad/i.test(ua);
  if (tabletRegex) {
    return 'tablet';
  }

  // 7. Other Known Mobile Phones
  const phoneRegex = /webOS|BlackBerry|BB10|IEMobile|Windows Phone|WPDesktop|Opera Mini/i.test(ua);
  if (phoneRegex) {
    return 'mobile';
  }

  // 8. Desktop Operating Systems (Windows, macOS, Linux, ChromeOS)
  // Laptops and desktops running Windows, macOS, or Linux are ALWAYS classified as 'desktop'.
  // Having a touchscreen or resizing the window NEVER reclassifies a laptop as a mobile device.
  return 'desktop';
}

/**
 * Returns true ONLY if the device is classified as 'mobile' or 'tablet'.
 * Laptops and desktop PCs will ALWAYS return false.
 * 
 * @param {string} [customUA] Optional user-agent string override
 * @param {object} [customNav] Optional navigator object override
 * @returns {boolean}
 */
export function isMobileOrTabletDevice(customUA, customNav) {
  const type = getDeviceType(customUA, customNav);
  return type === 'mobile' || type === 'tablet';
}

/**
 * Returns true ONLY for mobile phones (smartphones).
 */
export function isMobileDevice(customUA, customNav) {
  return getDeviceType(customUA, customNav) === 'mobile';
}

/**
 * Returns true ONLY for tablets.
 */
export function isTabletDevice(customUA, customNav) {
  return getDeviceType(customUA, customNav) === 'tablet';
}

/**
 * Returns true ONLY for laptops and desktop computers.
 */
export function isDesktopDevice(customUA, customNav) {
  return getDeviceType(customUA, customNav) === 'desktop';
}

export default {
  getDeviceType,
  isMobileOrTabletDevice,
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
};
