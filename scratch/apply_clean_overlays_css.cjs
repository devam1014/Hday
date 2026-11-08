const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
const marker = '/* ==========================================================================\n   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE';
const crlfMarker = '/* ==========================================================================\r\n   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE';
let idx = css.indexOf(marker);
if (idx === -1) idx = css.indexOf(crlfMarker);
if (idx === -1) {
  console.log('Marker not found!');
  process.exit(1);
}
console.log('Found marker at index:', idx);
const before = css.substring(0, idx);

const newStyles = `/* ==========================================================================
   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE — 3 PURE FUNCTIONAL OVERLAYS ONLY
   ========================================================================== */

.birthday-countdown-page-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100svh;
  margin: 0;
  padding: 0;
  background-color: #0b0712;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}

/* Positioned Stage Matching Background Image Aspect Ratio */
.birthday-image-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Visual Background: 100% of Visual Artwork & Typography */
.birthday-stage-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

/* --------------------------------------------------------------------------
   OVERLAY 1: COUNTDOWN TIMER NUMBERS & COLONS ONLY
   Positioned precisely in the existing countdown area
   -------------------------------------------------------------------------- */
.overlay-countdown-track {
  position: absolute;
  left: 31.0%;
  top: 22.8%;
  width: 38.6%;
  height: 12.0%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
}

.countdown-num-box {
  width: 18%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-digit-num {
  font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(42px, 3.4vw, 54px);
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 12px rgba(255, 240, 215, 0.95),
    0 0 24px rgba(255, 195, 135, 0.65);
  letter-spacing: 0.02em;
}

.countdown-colon {
  font-family: 'Cinzel', serif;
  font-size: clamp(36px, 2.8vw, 44px);
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 10px rgba(255, 240, 215, 0.9),
    0 0 20px rgba(255, 195, 135, 0.6);
  transform: translateY(-2px);
}

/* --------------------------------------------------------------------------
   OVERLAY 2: PASSWORD INPUT
   Clean, transparent input over the golden field area
   -------------------------------------------------------------------------- */
.overlay-password-form {
  position: absolute;
  left: 24.63%;
  top: 62.02%;
  width: 36.67%;
  height: 13.24%;
  z-index: 20;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.overlay-password-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
  /* Starts cleanly after key icon present in the image */
  padding-left: clamp(55px, 4.5vw, 75px);
  padding-right: 20px;
  color: #fff9f0;
  caret-color: #ffd47a;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.4vw, 22px);
  font-weight: 500;
  cursor: text;
}

.overlay-password-input::placeholder {
  color: rgba(255, 230, 215, 0.65);
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.4vw, 22px);
  font-weight: 400;
}

.overlay-password-input:focus {
  outline: none;
}

/* Simple error notice without disturbing the design */
.overlay-password-feedback {
  position: absolute;
  left: 24.63%;
  top: 76.2%;
  width: 36.67%;
  text-align: center;
  color: #fca5a5;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 16px;
  pointer-events: none;
  z-index: 25;
}

/* --------------------------------------------------------------------------
   OVERLAY 3: HINT BUTTON
   Transparent button displaying only "Hint" over the pink-bordered area
   -------------------------------------------------------------------------- */
.overlay-hint-button {
  position: absolute;
  left: 62.94%;
  top: 61.90%;
  width: 12.04%;
  height: 13.36%;
  z-index: 20;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(20px, 1.5vw, 24px);
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 180, 210, 0.6);
  pointer-events: auto;
}

.overlay-hint-button:focus {
  outline: none;
}

/* Simple Unobtrusive Hint Tooltip */
.overlay-hint-popover {
  position: absolute;
  left: 62.94%;
  top: 76.5%;
  min-width: 200px;
  max-width: 280px;
  transform: translateX(-15%);
  background: rgba(30, 16, 32, 0.95);
  border: 1px solid rgba(255, 180, 210, 0.35);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff8f0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 16px;
  line-height: 1.4;
  text-align: center;
  z-index: 35;
  pointer-events: auto;
}
`;

fs.writeFileSync('src/index.css', before + newStyles, 'utf8');
console.log('Successfully updated src/index.css with pure 3-overlay styles!');
