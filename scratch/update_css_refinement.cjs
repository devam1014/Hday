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
   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE & FUNCTIONAL OVERLAYS (MATCHING REF 2)
   ========================================================================== */

.birthday-countdown-page-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
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
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
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
   Gift icon with radiating rays + "— • A Little Surprise Awaits... ♥ • —"
   -------------------------------------------------------------------------- */
.overlay-top-heading {
  position: absolute;
  left: 20%;
  top: 5.2%;
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.top-gift-icon-svg {
  width: 3.4cqmin;
  height: 3.4cqmin;
  color: #ffd584;
  filter: drop-shadow(0 0 7px rgba(255, 215, 120, 0.85));
  margin-bottom: 0.4cqmin;
}

.top-heading-text-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6cqmin;
}

.heading-accent-line {
  display: inline-block;
  width: 4.8cqmin;
  height: 1px;
  background: rgba(255, 220, 160, 0.65);
}

.heading-dot {
  color: #ffd584;
  font-size: 1.4cqmin;
  line-height: 1;
  margin: 0 0.4cqmin;
  filter: drop-shadow(0 0 4px rgba(255, 215, 120, 0.7));
}

.heading-title-text {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 2.8cqmin;
  font-weight: 600;
  color: #fff3db;
  letter-spacing: 0.03em;
  text-shadow:
    0 0 12px rgba(255, 225, 160, 0.8),
    0 0 24px rgba(255, 185, 100, 0.45);
}

/* --------------------------------------------------------------------------
   B. UPPER FRAME: COUNTDOWN
   "THE SURPRISE UNLOCKS IN" + Large Cormorant Garamond numerals + Cinzel labels
   -------------------------------------------------------------------------- */
.overlay-frame-subtitle {
  position: absolute;
  left: 26%;
  top: 21.2%;
  width: 48%;
  text-align: center;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.25cqmin;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #ffe6c7;
  text-shadow: 0 0 8px rgba(255, 210, 150, 0.6);
  pointer-events: none;
  z-index: 10;
}

.overlay-countdown-track {
  position: absolute;
  left: 30.5%;
  top: 25.0%;
  width: 39.0%;
  height: 13.0%;
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
  font-size: 6.8cqmin;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 12px rgba(255, 245, 225, 0.95),
    0 0 26px rgba(255, 205, 140, 0.7),
    0 0 45px rgba(255, 170, 80, 0.45);
  letter-spacing: 0.05em;
}

.countdown-digit-lbl {
  font-family: 'Cinzel', serif;
  font-size: 1.15cqmin;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255, 230, 215, 0.82);
  margin-top: 0.5cqmin;
  text-shadow: 0 0 6px rgba(255, 190, 130, 0.4);
}

.countdown-colon-sep {
  font-family: 'Cormorant Garamond', 'Cinzel', serif;
  font-size: 5.6cqmin;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 10px rgba(255, 240, 215, 0.9),
    0 0 22px rgba(255, 195, 135, 0.65);
  transform: translateY(-0.9cqmin);
}

/* Tiny glowing heart below countdown */
.overlay-countdown-bottom-heart {
  position: absolute;
  left: 50%;
  top: 40.8%;
  transform: translateX(-50%);
  font-size: 1.4cqmin;
  color: #ffd899;
  text-shadow: 0 0 8px rgba(255, 215, 140, 0.8);
  pointer-events: none;
  z-index: 10;
}

/* --------------------------------------------------------------------------
   C. LOWER FRAME: HEADINGS WITH BURST FLOURISHES
   "Can't Wait?" + "Enter the secret password to open it now!"
   -------------------------------------------------------------------------- */
.overlay-cant-wait-row {
  position: absolute;
  left: 26%;
  top: 52.4%;
  width: 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.4cqmin;
  z-index: 10;
  pointer-events: none;
}

.cant-wait-flourish {
  width: 2.8cqmin;
  height: 1.8cqmin;
  color: #ffd685;
  filter: drop-shadow(0 0 6px rgba(255, 210, 110, 0.8));
}

.overlay-cant-wait-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 4.4cqmin;
  font-weight: 600;
  color: #ffffff;
  text-shadow:
    0 0 14px rgba(255, 235, 210, 0.95),
    0 0 28px rgba(255, 185, 120, 0.6);
  line-height: 1;
}

.overlay-cant-wait-subtitle {
  position: absolute;
  left: 20%;
  top: 58.6%;
  width: 60%;
  text-align: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.2cqmin;
  font-weight: 500;
  color: #ffe8d6;
  text-shadow: 0 0 8px rgba(255, 200, 150, 0.5);
  z-index: 10;
  pointer-events: none;
}

/* --------------------------------------------------------------------------
   D. PASSWORD INPUT OVERLAY
   Fits inside golden outline (23.92% / 65.25% / 37.44% / 8.18%) with key icon
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
  left: 3.2%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.password-key-svg {
  width: 2.8cqmin;
  height: 2.8cqmin;
  color: #ffd47a;
  filter: drop-shadow(0 0 6px rgba(255, 210, 100, 0.85));
}

.overlay-password-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  padding-left: 13.5%;
  padding-right: 5%;
  color: #fff9f0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.4cqmin;
  font-weight: 500;
  letter-spacing: 0.03em;
  border-radius: 9999px;
  cursor: text;
  transition: box-shadow 0.25s ease;
}

.overlay-password-input::placeholder {
  color: rgba(255, 230, 210, 0.62);
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.4cqmin;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.overlay-password-input:focus {
  box-shadow: inset 0 0 10px rgba(255, 215, 120, 0.2);
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
  font-size: 1.3cqmin;
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
   Outline lightbulb with filament & rays + "Hint" + circled (?)
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
  gap: 0.8cqmin;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
}

.overlay-hint-button:hover {
  background: rgba(255, 130, 180, 0.12);
  box-shadow: 0 0 16px rgba(255, 130, 190, 0.55);
}

.overlay-hint-button:active {
  transform: scale(0.97);
}

.hint-bulb-svg {
  width: 2.6cqmin;
  height: 2.6cqmin;
  color: #ffd67c;
  filter: drop-shadow(0 0 6px rgba(255, 210, 100, 0.85));
}

.hint-btn-label {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.2cqmin;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 180, 210, 0.7);
  letter-spacing: 0.02em;
}

.hint-question-svg {
  width: 1.8cqmin;
  height: 1.8cqmin;
  color: #ffd67c;
  filter: drop-shadow(0 0 5px rgba(255, 210, 100, 0.7));
}

.overlay-hint-popover {
  position: absolute;
  left: 62.74%;
  top: 75.0%;
  min-width: 22cqmin;
  max-width: 28cqmin;
  transform: translateX(-20%);
  background: rgba(36, 18, 38, 0.96);
  border: 1px solid rgba(255, 180, 210, 0.45);
  border-radius: 12px;
  padding: 1.0cqmin 1.6cqmin;
  color: #fff8f0;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.35cqmin;
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
   Cream/golden button with envelope icon and Cormorant Garamond typography
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
  gap: 1.2cqmin;
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
}

.overlay-message-button:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 0 25px rgba(255, 220, 160, 0.8),
    inset 0 0 15px rgba(255, 255, 255, 0.3);
}

.overlay-message-button:active {
  transform: scale(0.98);
}

.message-envelope-svg {
  width: 2.7cqmin;
  height: 2.7cqmin;
  color: #3b180d;
}

.message-btn-text {
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-size: 2.8cqmin;
  font-weight: 700;
  color: #3b180d;
  letter-spacing: 0.02em;
}
`;

fs.writeFileSync('src/index.css', before + newStyles, 'utf8');
console.log('Successfully updated src/index.css!');
