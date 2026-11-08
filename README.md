# 🎂 Cinematic Birthday Surprise Website

A bespoke, cinematic birthday experience crafted with romantic twilight visuals, warm fairy lights, real-time countdown, continuous canvas fireworks, a playful floating heart button, a scratch-to-reveal memory photo, and an integrated tribute player.

---

## 🌟 The Experience Flow

1. **Cover Page & Countdown**:
   - Immersive romantic night atmosphere using `cover.png`.
   - The countdown is positioned gracefully in the open negative sky space to preserve the original scene.
   - Shows a graceful waiting state when no birthday date is set yet, and live seconds when configured.
2. **Countdown Completion**:
   - Seamlessly triggers repeated golden, champagne, and rose-gold fireworks rendered via HTML5 Canvas.
   - A playful, glowing heart button pops into view and drifts smoothly toward the right side of the screen in a continuous loop.
   - Fireworks continue non-stop until the heart button is tapped.
3. **Main Birthday Page**:
   - Tapping the heart button smoothly stops the fireworks and unveils the main birthday section.
   - **Hero Banner**: Celebratory title and romantic greeting.
   - **Left Column**: A large, elegant birthday letter with paragraph support.
   - **Right Column**:
     - **Scratch-to-Reveal Card**: Drag or rub with mouse or touchscreen to progressively uncover a hidden photo memory. Auto-unlocks when threshold is reached.
     - **"Watch" Button**: Directly below the scratch card. Plays the surprise video in a cinematic modal or opens an external link.

---

## 🚀 How to Run the Project

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## ⚙️ Configuration Guide (`src/config.js`)

All personal details, dates, messages, and interactive settings are controlled from a single file: [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js).

### 1. Setting the Birthday Date & Timezone

Open [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js) and locate `targetDate`:

```javascript
// ISO 8601 date string: "YYYY-MM-DDTHH:mm:ss"
// Set to null to keep the graceful waiting state until decided.
targetDate: "2026-11-20T00:00:00",

// Optional label shown in the countdown card
timeZoneLabel: "PST",
```

### 2. Editing Titles & Personal Birthday Message

In [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js), modify the `mainPage` section:

```javascript
mainPage: {
  hero: {
    badge: "🎉 Happy Birthday!",
    title: "Happiest Birthday, Miioo!",
    subtitle: "May your heart always be as warm, radiant, and peaceful as tonight's sky."
  },
  messageCard: {
    tag: "A Letter For You",
    dateLabel: "Special Celebration",
    salutation: "Dearest Miioo,",
    paragraphs: [
      "Write your personal heartfelt message here...",
      "Add as many paragraphs as you wish."
    ],
    closing: "With love and fondest wishes,",
    sender: "Forever & Always ❤️"
  }
}
```

### 3. Replacing the Scratch-Card Image

In [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js), locate `scratchCard`:

```javascript
scratchCard: {
  title: "A Hidden Memory",
  instruction: "✨ Scratch to reveal ✨",
  // Path to any local image asset or URL:
  imageSrc: "/background.png", // Or import a personal photo!
  revealThreshold: 0.40, // 40% scratched auto-reveals the rest
}
```

### 4. Configuring the "Watch" Button

In [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js), locate `watchButton`:

- **Option A: Built-in Video Modal** (plays local video or YouTube/Vimeo embed):
  ```javascript
  watchButton: {
    label: "Watch",
    sublabel: "Special Tribute Video",
    destinationType: "modal",
    videoSrc: "https://www.youtube.com/embed/YOUR_VIDEO_ID", // or "/my-video.mp4"
  }
  ```

- **Option B: External Link** (e.g., Google Drive, YouTube, Vimeo):
  ```javascript
  watchButton: {
    label: "Watch",
    sublabel: "Open Video",
    destinationType: "url",
    externalUrl: "https://youtu.be/YOUR_VIDEO_LINK"
  }
  ```

---

## 🧪 How to Test Countdown & Fireworks Locally

You do not need to guess or modify the real birthday date to test the site. A discreet **Test Helper** is built into the top right corner of the website:

1. Click **`🛠️ Test Helper`** in the top right.
2. Click **`▶ Test 5s Countdown`** to watch the countdown tick from 5 seconds to 0 and trigger fireworks.
3. Or click **`✨ Trigger Fireworks & Heart`** to instantly preview the fireworks and moving heart button.
4. Or click **`❤️ Jump to Main Page`** to inspect the letter, scratch card, and watch modal.
5. Click **`🔄 Reset to Clean Config`** to return to the pristine waiting state.

> **Note**: To hide the Test Helper completely for the final reveal to the recipient, set `dev.showDevControls: false` inside [src/config.js](file:///c:/Users/devam/OneDrive/Desktop/Happpiest-Birthady-Miiooo/src/config.js).

---

## 📁 Project Structure

```
├── cover.png                 # Original cover background (Preserved intact)
├── background.png            # Original twilight balcony background (Preserved intact)
├── index.html                # Entry HTML with Google Fonts
├── package.json              # React 18, Vite 6, Lucide icons
├── vite.config.js            # Vite configuration
└── src/
    ├── config.js             # Central configuration (Dates, Messages, Media)
    ├── App.jsx               # Stage router (Cover -> Fireworks/Heart -> Main)
    ├── main.jsx              # React DOM bootstrap
    ├── index.css             # Romantic midnight/gold design system
    └── components/
        ├── CoverPage.jsx       # Scenic cover view with negative space positioning
        ├── Countdown.jsx       # Accurate 1s timer with graceful waiting state
        ├── FireworksCanvas.jsx # HTML5 Canvas continuous fireworks engine
        ├── HeartButton.jsx     # Floating, looping interactive heart button
        ├── MainPage.jsx        # Responsive two-column main celebration page
        ├── MessageCard.jsx     # Personal letter card with custom paragraphs
        ├── ScratchCard.jsx     # Canvas scratch-to-reveal photo memory
        ├── WatchModal.jsx      # Accessible tribute video player / placeholder
        └── DevControls.jsx     # Temporary testing helper toolbar
```
