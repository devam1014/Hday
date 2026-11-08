const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
const marker = '/* ==========================================================================\r\n   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE';
const altMarker = '/* ==========================================================================\n   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE';
let idx = css.indexOf(marker);
if (idx === -1) idx = css.indexOf(altMarker);
if (idx === -1) {
  console.log('Marker not found!');
  process.exit(1);
}
console.log('Replacing from index', idx);
const before = css.substring(0, idx);

const newStyles = `/* ==========================================================================
   IMAGE-BASED BIRTHDAY COUNTDOWN PAGE & FUNCTIONAL OVERLAYS (CLEAN BG)
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

/* Fullscreen Laptop Stage Container (No black side spaces, full viewport) */
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
   Gift icon + "A Little Surprise Awaits... ♥"
   -------------------------------------------------------------------------- */
.overlay-top-heading {
  position: absolute;
  left: 25%;
  top: 5.5%;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.top-gift-icon {
  width: 2.8cqmin;
  height: 2.8cqmin;
  color: #ffd88a;
  filter: drop-shadow(0 0 8px rgba(255, 216, 138, 0.85));
  margin-bottom: 0.3cqmin;
}

.top-heading-text-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2cqmin;
}

.heading-accent-line {
  display: inline-block;
  width: 3.5cqmin;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ffd88a, transparent);
}

.heading-title-text {
  font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.3cqmin;
  font-weight: 500;
  color: #ffe8b5;
  letter-spacing: 0.04em;
  text-shadow:
    0 0 10px rgba(255, 220, 140, 0.75),
    0 0 20px rgba(255, 180, 90, 0.45);
}

/* --------------------------------------------------------------------------
   B. UPPER FRAME: COUNTDOWN
   "THE SURPRISE UNLOCKS IN" + Days : Hours : Minutes : Seconds + Labels
   -------------------------------------------------------------------------- */
.overlay-frame-subtitle {
  position: absolute;
  left: 27%;
  top: 21.0%;
  width: 46%;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25cqmin;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 235, 215, 0.88);
  text-shadow: 0 0 8px rgba(255, 200, 150, 0.5);
  pointer-events: none;
  z-index: 10;
}

.overlay-countdown-track {
  position: absolute;
  left: 32.0%;
  top: 24.8%;
  width: 36.0%;
  height: 12.0%;
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
  font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
  font-size: 5.2cqmin;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 10px rgba(255, 240, 215, 0.95),
    0 0 24px rgba(255, 195, 135, 0.7),
    0 0 38px rgba(255, 160, 80, 0.4);
  letter-spacing: 0.04em;
}

.countdown-digit-lbl {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.05cqmin;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 225, 205, 0.75);
  margin-top: 0.4cqmin;
}

.countdown-colon-sep {
  font-family: 'Cinzel', serif;
  font-size: 4.2cqmin;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  text-shadow:
    0 0 10px rgba(255, 240, 215, 0.9),
    0 0 20px rgba(255, 195, 135, 0.6);
  transform: translateY(-0.8cqmin);
}

/* --------------------------------------------------------------------------
   C. LOWER FRAME: HEADINGS & SUBTITLE
   -------------------------------------------------------------------------- */
.overlay-cant-wait-title {
  position: absolute;
  left: 30%;
  top: 52.8%;
  width: 40%;
  text-align: center;
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 3.2cqmin;
  font-weight: 600;
  color: #ffffff;
  text-shadow:
    0 0 12px rgba(255, 230, 200, 0.9),
    0 0 26px rgba(255, 180, 120, 0.55);
  z-index: 10;
  pointer-events: none;
}

.overlay-cant-wait-subtitle {
  position: absolute;
  left: 25%;
  top: 58.2%;
  width: 50%;
  text-align: center;
  font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 1.9cqmin;
  font-weight: 500;
  color: rgba(255, 230, 215, 0.85);
  text-shadow: 0 0 8px rgba(255, 190, 140, 0.4);
  z-index: 10;
  pointer-events: none;
}

/* --------------------------------------------------------------------------
   D. PASSWORD INPUT OVERLAY
   Fits EXACTLY inside the long golden outlined rectangle (23.92% / 65.25% / 37.44% / 8.18%)
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

.overlay-password-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  padding-left: 14.5%;
  padding-right: 5%;
  color: #fff9f0;
  font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 2.1cqmin;
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  cursor: text;
  transition: box-shadow 0.25s ease;
}

.overlay-password-input::placeholder {
  color: rgba(255, 225, 215, 0.52);
  font-style: italic;
  font-size: 2.0cqmin;
}

.overlay-password-input:focus {
  box-shadow: inset 0 0 12px rgba(255, 215, 130, 0.25);
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
  top: 74.0%;
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
   Fits EXACTLY inside the pink outlined rectangle (62.74% / 64.82% / 12.02% / 8.71%)
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
  gap: 0.7cqmin;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
}

.overlay-hint-button:hover {
  background: rgba(255, 130, 180, 0.12);
  box-shadow: 0 0 16px rgba(255, 130, 190, 0.55);
}

.overlay-hint-button:active {
  transform: scale(0.97);
}

.hint-btn-lightbulb-icon {
  width: 2.0cqmin;
  height: 2.0cqmin;
  color: #ffd680;
  filter: drop-shadow(0 0 6px rgba(255, 210, 100, 0.8));
}

.hint-btn-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.8cqmin;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 150, 200, 0.7);
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
   Fits inside the cream button artwork (35.59% / 82.47% / 30.50% / 10.10%)
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
  gap: 1.0cqmin;
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
}

.overlay-message-button:hover {
  background: rgba(255, 255, 255, 0.14);
  box-shadow:
    0 0 25px rgba(255, 220, 160, 0.8),
    inset 0 0 15px rgba(255, 255, 255, 0.3);
}

.overlay-message-button:active {
  transform: scale(0.98);
}

.message-btn-envelope-icon {
  width: 2.3cqmin;
  height: 2.3cqmin;
  color: #4a2216;
}

.message-btn-text {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.3cqmin;
  font-weight: 600;
  color: #4a2216;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3);
}
`;

fs.writeFileSync('src/index.css', before + newStyles, 'utf8');
console.log('Successfully updated src/index.css!');
