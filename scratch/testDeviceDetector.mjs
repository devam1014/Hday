import { isMobileOrTabletDevice } from '../src/utils/deviceDetector.js';

// Test harness simulating browser environments
function testDevice(name, mockEnv, expected) {
  // Setup globals
  global.window = {
    location: { search: mockEnv.search || '' },
    navigator: {
      userAgent: mockEnv.ua || '',
      vendor: mockEnv.vendor || '',
      platform: mockEnv.platform || '',
      maxTouchPoints: mockEnv.maxTouchPoints || 0,
      userAgentData: mockEnv.userAgentData || undefined
    },
    innerWidth: mockEnv.innerWidth || 1440,
    innerHeight: mockEnv.innerHeight || 900,
    screen: {
      width: mockEnv.screenWidth || mockEnv.innerWidth || 1440,
      height: mockEnv.screenHeight || mockEnv.innerHeight || 900
    },
    matchMedia: (query) => {
      if (query.includes('pointer: coarse')) return { matches: Boolean(mockEnv.pointerCoarse) };
      if (query.includes('pointer: fine')) return { matches: Boolean(mockEnv.pointerFine) };
      if (query.includes('hover: none')) return { matches: Boolean(mockEnv.hoverNone) };
      if (query.includes('hover: hover')) return { matches: Boolean(mockEnv.hoverHover) };
      return { matches: false };
    }
  };

  global.document = {
    documentElement: {
      clientWidth: mockEnv.innerWidth || 1440,
      clientHeight: mockEnv.innerHeight || 900
    }
  };

  if (mockEnv.hasTouchStart) {
    global.window.ontouchstart = () => {};
  } else {
    delete global.window.ontouchstart;
  }

  const result = isMobileOrTabletDevice();
  const pass = result === expected;
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'}: ${name} -> got ${result}, expected ${expected}`);
  return pass;
}

const tests = [
  // 1. Mobile phones
  {
    name: 'iPhone 13 (Chrome emulation)',
    mockEnv: {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/96.0.4664.53 Mobile/15E148 Safari/604.1',
      maxTouchPoints: 5,
      innerWidth: 390,
      innerHeight: 844,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  },
  {
    name: 'Samsung Galaxy S20 (Android UA & client hints)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
      userAgentData: { mobile: true },
      maxTouchPoints: 5,
      innerWidth: 360,
      innerHeight: 800,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  },

  // 2. Tablets
  {
    name: 'iPad Pro (iOS 13+ Macintosh UA + touch)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
      innerWidth: 1024,
      innerHeight: 1366,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  },
  {
    name: 'iPad Air (820px width)',
    mockEnv: {
      ua: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      maxTouchPoints: 5,
      innerWidth: 820,
      innerHeight: 1180,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  },
  {
    name: 'Android Tablet (Galaxy Tab SM-T870)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Safari/537.36',
      maxTouchPoints: 5,
      innerWidth: 800,
      innerHeight: 1280,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  },
  {
    name: 'Chrome DevTools Responsive Mode at 768px with touch emulation',
    mockEnv: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      maxTouchPoints: 1,
      hasTouchStart: true,
      innerWidth: 768,
      innerHeight: 1024,
      pointerCoarse: true
    },
    expected: true
  },

  // 3. Desktop / Laptop (Must NOT be blocked)
  {
    name: 'Standard Windows 11 Desktop (1920x1080)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      maxTouchPoints: 0,
      innerWidth: 1920,
      innerHeight: 1080,
      pointerFine: true,
      hoverHover: true
    },
    expected: false
  },
  {
    name: 'Windows 11 Desktop browser resized to 750px (no touch)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      maxTouchPoints: 0,
      innerWidth: 750,
      innerHeight: 900,
      pointerFine: true,
      hoverHover: true
    },
    expected: false
  },
  {
    name: 'MacBook Pro (1440x900, pointer fine, hover hover)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
      innerWidth: 1440,
      innerHeight: 900,
      pointerFine: true,
      hoverHover: true
    },
    expected: false
  },
  {
    name: 'Touchscreen Laptop (Windows Surface Laptop with trackpad/mouse, 1366x768, pointer fine, hover hover)',
    mockEnv: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      maxTouchPoints: 10,
      innerWidth: 1366,
      innerHeight: 768,
      pointerFine: true,
      hoverHover: true
    },
    expected: false
  },

  // 4. Overrides
  {
    name: 'Desktop testing with ?preview=mobile',
    mockEnv: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      search: '?preview=mobile',
      maxTouchPoints: 0,
      innerWidth: 1920,
      innerHeight: 1080,
      pointerFine: true,
      hoverHover: true
    },
    expected: true
  },
  {
    name: 'Mobile device attempting ?desktop=true (NEVER bypasses)',
    mockEnv: {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      search: '?desktop=true',
      maxTouchPoints: 5,
      innerWidth: 390,
      innerHeight: 844,
      pointerCoarse: true,
      hoverNone: true
    },
    expected: true
  }
];

let allPassed = true;
for (const t of tests) {
  if (!testDevice(t.name, t.mockEnv, t.expected)) {
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\nALL 12 DEVICE TESTS PASSED PERFECTLY!');
} else {
  process.exit(1);
}
