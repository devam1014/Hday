/**
 * ==============================================================================
 * CINEMATIC BIRTHDAY SURPRISE — CONFIGURATION
 * ==============================================================================
 * All personal details, dates, messages, and interactive settings are configured
 * here in this single file.
 *
 * HOW TO CONFIGURE:
 * 1. Target Date: Set `targetDate` to your desired birthday date/time (ISO format).
 *    e.g., "2026-11-20T00:00:00"
 *    If set to `null` or left empty, the site gracefully displays an awaiting state.
 * 2. Recipient Name: Set `recipientName` to customize greetings and titles.
 * 3. Personal Message: Edit `mainPage.messageCard.paragraphs` with your heartfelt note.
 * 4. Scratch Photo: Set `mainPage.scratchCard.imageSrc` to any image asset or URL.
 * 5. Watch Button: Configure `mainPage.watchButton` for video/link/modal behavior.
 * ==============================================================================
 */

// Import default assets so bundler handles them smoothly
import coverImg from '../cover.png';
import bgImg from '../background.png';

export const BIRTHDAY_CONFIG = {
  // ----------------------------------------------------------------------------
  // 1. COUNTDOWN & INDEPENDENT TARGET DATES
  // ----------------------------------------------------------------------------
  // Timer 1: Cover / Blurred Countdown Page Target Date & Time (ISO format, e.g. "2026-12-25T00:00:00")
  // When this timer reaches 00:00:00:00, it automatically transitions to the Firecracker page.
  coverTargetDate: null,

  // Timer 2: Firecracker / Rooftop Fireworks Page Target Date & Time (ISO format, e.g. "2026-12-25T00:01:00")
  // When this timer reaches 00:00:00:00, it automatically starts the fireworks celebration.
  firecrackerTargetDate: null,

  // Fallback target date if referencing generic property
  targetDate: null,

  // Optional: Timezone label for display (e.g. "PST", "EST", "IST", "GMT+5:30")
  timeZoneLabel: "",

  // Recipient Name (displayed in subtitles and card greetings)
  recipientName: "Miioo",

  // Secret Password to unlock early
  secretPassword: "miioo",
  passwordHint: "The secret password is her sweet nickname... (Miioo) ♡",

  // ----------------------------------------------------------------------------
  // COUNTDOWN PAGE MODAL CARDS CONTENT (EASY TO EDIT)
  // ----------------------------------------------------------------------------
  countdownPage: {
    // 1. Personal Message (opened by "Message For You" button on countdown page)
    messageContent: {
      title: "Message For You",
      subtitle: "A heartfelt wish for your special day ♡",
      paragraphs: [
        "Happy Birthday, Miioo! ✨",
        "Even before the countdown reaches zero, I wanted to take a moment to tell you how truly special and cherished you are.",
        "May this new chapter bring endless laughter, peaceful sunsets, warmth in every quiet moment, and every beautiful dream your heart holds dear."
      ],
      closing: "With all my love,",
      signature: "Forever & Always ❤️"
    },

    // 2. Password Hint (opened by "Hint" button on countdown page)
    hintContent: {
      title: "Password Hint",
      subtitle: "Can't wait for the countdown? Here is your clue:",
      hint: "It's her sweet nickname... (Miioo) ♡",
      note: "Type her nickname into the secret box and press Enter to unlock the surprise early."
    }
  },

  // ----------------------------------------------------------------------------
  // 2. COVER PAGE CONTENT
  // ----------------------------------------------------------------------------
  cover: {
    // Atmospheric cover background image
    backgroundImage: coverImg,

    // Header badge
    pillBadge: "✨ A Moment in Time ✨",

    // Main poetic title on cover
    heading: "Written in the Stars",
    subtitle: "A silent wish traveling through the twilight sky",

    // Waiting state text (shown when targetDate is null / not yet decided)
    waitingState: {
      title: "Counting Down Soon",
      message: "The universe is preparing something truly magical for your special day...",
      hint: "Set the target birthday date in src/config.js to activate the live countdown."
    }
  },

  // ----------------------------------------------------------------------------
  // 3. MAIN BIRTHDAY PAGE CONTENT
  // ----------------------------------------------------------------------------
  mainPage: {
    // Atmospheric main page background image
    backgroundImage: bgImg,

    // Hero title banner
    hero: {
      badge: "🎉 Happy Birthday!",
      title: "Happiest Birthday, Miioo!",
      subtitle: "May your heart always be as warm, radiant, and peaceful as tonight's twilight sky."
    },

    // Personal Birthday Message Card
    messageCard: {
      tag: "A Letter For You",
      dateLabel: "Special Celebration",
      salutation: "Dearest Miioo,",
      paragraphs: [
        "[Your personal birthday message will appear here. Edit src/config.js to replace this placeholder with your own heartfelt words.]",
        "Every shared glance at the stars, every laugh that echoes through the night, and every quiet moment of kindness you bring makes the world feel brighter and infinitely softer.",
        "On your birthday, I wish you all the dreams you haven't dared to speak out loud, endless warmth on chilly evenings, and a year overflowing with boundless happiness and wonder."
      ],
      closing: "With love and fondest wishes,",
      sender: "Forever & Always ❤️"
    },

    // Scratch-to-Reveal Image Card (Upper Right)
    scratchCard: {
      title: "A Hidden Memory",
      subtitle: "A special moment preserved just for you",
      instruction: "✨ Scratch to reveal ✨",
      // Underlying image revealed when scratched. Defaults to bgImg, can be changed to any photo path.
      imageSrc: bgImg,
      alt: "Revealed birthday memory",
      // Percentage threshold (0.0 to 1.0) of scratched surface before auto-completing reveal
      revealThreshold: 0.40,
    },

    // "Watch" Button (Directly below scratch card)
    watchButton: {
      label: "WATCH OUR MEMORIES ↗",
      sublabel: "Special Tribute Video",
      // Destination type:
      // "modal" -> Opens the built-in cinematic video/message modal
      // "url"   -> Opens external URL in a new tab (e.g. YouTube, Google Drive, Vimeo)
      destinationType: "modal",

      // External link URL (used when destinationType === "url")
      externalUrl: "",

      // Video embed or video file URL (used when destinationType === "modal")
      // e.g. "https://www.youtube.com/embed/VIDEO_ID" or a local mp4 path
      videoSrc: "",

      // Modal content (used when destinationType === "modal")
      modal: {
        title: "A Special Tribute For Miioo",
        subtitle: "Created with love for your birthday",
        placeholderMessage: "This is your dedicated video space. When your special video or montage is ready, link it directly in src/config.js (under watchButton.videoSrc or externalUrl) to view it here in full cinematic quality!",
        buttonCloseLabel: "Close"
      }
    }
  },

  // ----------------------------------------------------------------------------
  // 4. TESTING & PREVIEW CONTROLS (DEV HELPER)
  // ----------------------------------------------------------------------------
  // Allows testing the countdown completion, continuous fireworks, and heart button
  // without modifying the real targetDate.
  // Set `showDevControls` to false for production.
  dev: {
    showDevControls: true, // Show discreet test helper toggle in top corner
    testCountdownDurationSeconds: 5, // Triggers a 5s countdown when tested
  }
};

// Standalone editable shortcuts for Countdown Page modals
export const messageContent = BIRTHDAY_CONFIG.countdownPage.messageContent;
export const hintContent = BIRTHDAY_CONFIG.countdownPage.hintContent;
