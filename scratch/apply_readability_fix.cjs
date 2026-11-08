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
   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE & FUNCTIONAL OVERLAYS (READABILITY FIX)
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

/* Fullscreen Laptop Stage Container (No black side spaces, full 16:9 viewport) */
.birthday-image-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 100% Visual Artwork Foundation (Clean Image) */
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
   A. HEADING ABOVE COUNTDOWN FRAME
   Prominent Gift icon (42–50px) + "— • A Little Surprise Awaits... ♥ • —" (24–28px)
   -------------------------------------------------------------------------- */
.overlay-top-heading {
  position: absolute;
  left: 15%;
  top: 4.8%;
  width: 70%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.top-gift-icon-svg {
  width: clamp(42px, 3.2vw, 50px);
  height: clamp(42px, 3.2vw, 50px);
  color: #ffd584;
  margin-bottom: 8px;
  animation: gift-glow-pulse 3.5s ease-in-out infinite;
}

@keyframes gift-glow-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(255, 215, 120, 0.85)) drop-shadow(0 0 18px rgba(255, 180, 80, 0.5));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(255, 225, 140, 1)) drop-shadow(0 0 30px rgba(255, 195, 95, 0.7));
    transform: scale(1.04);
  }
}

.top-heading-text-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.heading-accent-line {
  display: inline-block;
  width: clamp(40px, 4.2vw, 65px);
  height: 1.5px;
  background: rgba(255, 220, 160, 0.65);
}

.heading-dot {
  color: #ffd584;
  font-size: 14px;
  line-height: 1;
  margin: 0 4px;
  filter: drop-shadow(0 0 4px rgba(255, 215, 120, 0.7));
}

.heading-title-text {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: clamp(24px, 1.8vw, 28px);
  font-weight: 600;
  color: #fff3db;
  letter-spacing: 0.03em;
  text-shadow:
    0 0 12px rgba(255, 225, 160, 0.8),
    0 0 24px rgba(255, 185, 100, 0.45);
}

/* --------------------------------------------------------------------------
   B. UPPER FRAME: COUNTDOWN
   "THE SURPRISE UNLOCKS IN" (13–15px) + Numbers (48–58px) + Labels (12–14px)
   -------------------------------------------------------------------------- */
.overlay-frame-subtitle {
  position: absolute;
  left: 24%;
  top: 21.0%;
  width: 52%;
  text-align: center;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(13px, 0.9vw, 15px);
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #ffe6c7;
  text-shadow: 0 0 8px rgba(255, 210, 150, 0.6);
  pointer-events: none;
  z-index: 10;
}

.overlay-countdown-track {
  position: absolute;
  left: 29.5%;
  top: 24.2%;
  width: 41.0%;
  height: 14.5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
}

.countdown-digit-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 22%;
}

.countdown-digit-val {
  font-family: 'Cormorant Garamond', 'Cinzel', Georgia, serif;
  font-size: clamp(48px, 3.6vw, 58px);
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 14px rgba(255, 245, 225, 0.95),
    0 0 28px rgba(255, 205, 140, 0.75),
    0 0 48px rgba(255, 170, 80, 0.5);
  letter-spacing: 0.04em;
}

.countdown-digit-lbl {
  font-family: 'Cinzel', serif;
  font-size: clamp(12px, 0.9vw, 14px);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 230, 215, 0.85);
  margin-top: 6px;
  text-shadow: 0 0 8px rgba(255, 190, 130, 0.45);
}

.countdown-colon-sep {
  font-family: 'Cormorant Garamond', 'Cinzel', serif;
  font-size: clamp(42px, 3.2vw, 50px);
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 12px rgba(255, 240, 215, 0.9),
    0 0 24px rgba(255, 195, 135, 0.7);
  transform: translateY(-8px);
}

/* Tiny glowing heart below countdown */
.overlay-countdown-bottom-heart {
  position: absolute;
  left: 50%;
  top: 40.8%;
  transform: translateX(-50%);
  font-size: 16px;
  color: #ffd899;
  text-shadow: 0 0 8px rgba(255, 215, 140, 0.8);
  pointer-events: none;
  z-index: 10;
}

/* --------------------------------------------------------------------------
   C. LOWER FRAME: HEADINGS WITH BURST FLOURISHES
   "Can't Wait?" (36–42px) + Subtitle (18–20px)
   -------------------------------------------------------------------------- */
.overlay-cant-wait-row {
  position: absolute;
  left: 24%;
  top: 52.2%;
  width: 52%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
  pointer-events: none;
}

.cant-wait-flourish {
  width: 32px;
  height: 20px;
  color: #ffd685;
  filter: drop-shadow(0 0 6px rgba(255, 210, 110, 0.8));
}

.overlay-cant-wait-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: clamp(36px, 2.8vw, 42px);
  font-weight: 600;
  color: #ffffff;
  text-shadow:
    0 0 14px rgba(255, 235, 210, 0.95),
    0 0 28px rgba(255, 185, 120, 0.6);
  line-height: 1;
}

.overlay-cant-wait-subtitle {
  position: absolute;
  left: 18%;
  top: 58.4%;
  width: 64%;
  text-align: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.3vw, 20px);
  font-weight: 500;
  color: #ffe8d6;
  text-shadow: 0 0 8px rgba(255, 200, 150, 0.5);
  z-index: 10;
  pointer-events: none;
}

/* --------------------------------------------------------------------------
   D. PASSWORD INPUT OVERLAY
   Fits inside golden outline with antique key icon & 18–20px readable text
   -------------------------------------------------------------------------- */
.overlay-password-form {
  position: absolute;
  left: 23.92%;
  top: 65.25%;
  width: 37.44%;
  height: 8.18%;
  z-index: 20;
  display: flex;
  align-items: center;
  border-radius: 9999px;
  transition: transform 0.2s ease, box-shadow 0.25s ease;
}

.password-key-wrapper {
  position: absolute;
  left: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.password-key-svg {
  width: clamp(26px, 2.0vw, 32px);
  height: clamp(26px, 2.0vw, 32px);
  color: #ffd47a;
  filter: drop-shadow(0 0 8px rgba(255, 210, 100, 0.85));
}

.overlay-password-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
  padding-left: clamp(54px, 4.2vw, 64px);
  padding-right: 20px;
  color: #fff9f0;
  caret-color: #ffd47a;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.3vw, 20px);
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  cursor: text;
  display: flex;
  align-items: center;
  transition: box-shadow 0.25s ease;
}

.overlay-password-input::placeholder {
  color: rgba(255, 230, 210, 0.68);
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.3vw, 20px);
  font-weight: 400;
  letter-spacing: 0.03em;
}

.overlay-password-input:focus {
  outline: none;
  box-shadow: inset 0 0 12px rgba(255, 215, 120, 0.25), 0 0 14px rgba(255, 215, 120, 0.35);
}

@keyframes input-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.overlay-password-form.is-error {
  animation: input-shake 0.4s ease-in-out;
}

.overlay-password-feedback {
  position: absolute;
  left: 23.92%;
  top: 74.2%;
  width: 37.44%;
  text-align: center;
  color: #fca5a5;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  animation: feedback-fade 0.25s ease-out;
  z-index: 25;
}

@keyframes feedback-fade {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --------------------------------------------------------------------------
   E. HINT BUTTON OVERLAY
   Outline bulb (24–28px) + "Hint" (18–20px) + circled (?)
   -------------------------------------------------------------------------- */
.overlay-hint-button {
  position: absolute;
  left: 62.74%;
  top: 64.82%;
  width: 12.02%;
  height: 8.71%;
  z-index: 20;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 0.6vw, 10px);
  padding: 0 clamp(8px, 0.8vw, 16px);
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
}

.overlay-hint-button:hover {
  background: rgba(255, 130, 180, 0.15);
  box-shadow: 0 0 18px rgba(255, 130, 190, 0.6);
}

.overlay-hint-button:active {
  transform: scale(0.97);
}

.hint-bulb-svg {
  width: clamp(24px, 1.8vw, 28px);
  height: clamp(24px, 1.8vw, 28px);
  color: #ffd67c;
  filter: drop-shadow(0 0 8px rgba(255, 210, 100, 0.9));
  flex-shrink: 0;
}

.hint-btn-label {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 1.3vw, 20px);
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 180, 210, 0.7);
  letter-spacing: 0.02em;
}

.hint-question-svg {
  width: clamp(16px, 1.2vw, 18px);
  height: clamp(16px, 1.2vw, 18px);
  color: #ffd67c;
  filter: drop-shadow(0 0 5px rgba(255, 210, 100, 0.75));
  flex-shrink: 0;
}

.overlay-hint-popover {
  position: absolute;
  left: 62.74%;
  top: 75.0%;
  min-width: 240px;
  max-width: 320px;
  transform: translateX(-20%);
  background: rgba(36, 18, 38, 0.96);
  border: 1px solid rgba(255, 180, 210, 0.45);
  border-radius: 12px;
  padding: 12px 18px;
  color: #fff8f0;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.7),
    0 0 16px rgba(255, 140, 180, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 35;
  animation: feedback-fade 0.2s ease-out;
  pointer-events: auto;
}

/* --------------------------------------------------------------------------
   F. MESSAGE FOR YOU BUTTON OVERLAY
   Cream/golden button with envelope icon and 20–24px Cormorant Garamond typography
   -------------------------------------------------------------------------- */
.overlay-message-button {
  position: absolute;
  left: 35.59%;
  top: 82.47%;
  width: 30.50%;
  height: 10.10%;
  z-index: 20;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 1vw, 14px);
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
}

.overlay-message-button:hover {
  background: rgba(255, 255, 255, 0.16);
  box-shadow:
    0 0 25px rgba(255, 220, 160, 0.85),
    inset 0 0 15px rgba(255, 255, 255, 0.35);
}

.overlay-message-button:active {
  transform: scale(0.98);
}

.message-envelope-svg {
  width: clamp(24px, 1.8vw, 28px);
  height: clamp(24px, 1.8vw, 28px);
  color: #3b180d;
}

.message-btn-text {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-size: clamp(20px, 1.5vw, 24px);
  font-weight: 700;
  color: #3b180d;
  letter-spacing: 0.02em;
}
`;

fs.writeFileSync('src/index.css', before + newStyles, 'utf8');
console.log('Successfully updated src/index.css with readability fixes!');
