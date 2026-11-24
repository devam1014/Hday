/**
 * ==============================================================================
 * CINEMATIC BIRTHDAY SURPRISE — CENTRALIZED CONFIGURATION SYSTEM
 * ==============================================================================
 * This is the SINGLE SOURCE OF TRUTH where all personal messages, dates, times,
 * images, videos, passwords, hints, and music settings are managed.
 *
 * ORGANIZED IN THE EXACT ORDER VISITORS EXPERIENCE THE WEBSITE:
 * 1. Opening Page / Cover Page
 * 2. First Countdown (Timer 1)
 * 3. Second Countdown (Timer 2)
 * 4. Fireworks & Reveal Message
 * 5. Main Birthday Page (13 Sections, Message Letter, Scratch Card, Clip Button)
 * 6. Sad Gallery (One folder: public/sad/ for both images & videos)
 * 7. Happy Gallery (One folder: public/happy/ for both images & videos)
 * 8. Password & Hint Settings (Single source of truth)
 * 9. Music Player & Volume Settings (Default Volume 0.60, Playlists)
 * 10. General Website & Developer Settings
 * ==============================================================================
 */

// Import default assets
import coverImg from '../cover.png';
import bgImg from '../background.png';
import sadBg from '../sad.png';
import sadCover from '../sad-cover.jpg';
import qnaBg from '../QNA-cover.png';

export const MAIN_PAGE_VIDEOS_BASE = '/video-for-main-page';

export const SECTION_VIDEO_MAP = Object.freeze({
  1: `${MAIN_PAGE_VIDEOS_BASE}/1.mp4`,
  2: `${MAIN_PAGE_VIDEOS_BASE}/2.mp4`,
  3: `${MAIN_PAGE_VIDEOS_BASE}/3.mp4`,
  4: `${MAIN_PAGE_VIDEOS_BASE}/4.mp4`,
  5: `${MAIN_PAGE_VIDEOS_BASE}/5.mp4`,
  6: `${MAIN_PAGE_VIDEOS_BASE}/6.mp4`,
  7: `${MAIN_PAGE_VIDEOS_BASE}/7.mp4`,
  8: `${MAIN_PAGE_VIDEOS_BASE}/8.mp4`,
  9: `${MAIN_PAGE_VIDEOS_BASE}/9.mp4`,
  10: `${MAIN_PAGE_VIDEOS_BASE}/10.mp4`,
  11: `${MAIN_PAGE_VIDEOS_BASE}/11.mp4`,
  12: `${MAIN_PAGE_VIDEOS_BASE}/12.mp4`,
  13: `${MAIN_PAGE_VIDEOS_BASE}/13.mp4`,
});

export function getSectionVideoSrc(sectionId) {
  const id = Number(sectionId) || 1;
  return SECTION_VIDEO_MAP[id] || `${MAIN_PAGE_VIDEOS_BASE}/${id}.mp4`;
}

/**
 * Resolves a date and optional time in Indian Standard Time (IST, UTC+05:30).
 * Handles:
 * - parseISTTarget(dateStr, timeStr) -> e.g. ("2026-11-19", "01:30:00")
 * - parseISTTarget({ targetDate, targetTime })
 * - parseISTTarget("2026-11-19 01:30:00")
 * - parseISTTarget("2026-11-19T01:30:00+05:30")
 * - parseISTTarget(timestampInMs) or parseISTTarget(dateObj)
 * Returns UTC timestamp (milliseconds) representing that exact moment in IST.
 */
export function parseISTTarget(dateInput, timeInput) {
  if (!dateInput && !timeInput) return null;

  // Handle object input: { targetDate, targetTime } or { date, time }
  if (dateInput && typeof dateInput === 'object' && !(dateInput instanceof Date)) {
    timeInput = timeInput || dateInput.targetTime || dateInput.time;
    dateInput = dateInput.targetDate || dateInput.date;
  }

  if (typeof dateInput === 'number') return dateInput;
  if (dateInput instanceof Date) return dateInput.getTime();
  if (typeof dateInput !== 'string') return null;

  let trimmedDate = dateInput.trim();
  let trimmedTime = typeof timeInput === 'string' ? timeInput.trim() : '';

  if (!trimmedDate) return null;

  // If time is provided separately, strip any existing time from date string to avoid conflicts
  if (trimmedTime) {
    const splitMatch = trimmedDate.match(/^(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    if (splitMatch) {
      trimmedDate = splitMatch[1];
    }
  }

  // If string already has a complete timezone indicator ('Z' or '+05:30' or '-05:00') and no separate time, parse directly
  if (!trimmedTime && (trimmedDate.includes('Z') || /[+-]\d{2}:\d{2}$/.test(trimmedDate) || /[+-]\d{4}$/.test(trimmedDate))) {
    const parsed = Date.parse(trimmedDate);
    return isNaN(parsed) ? null : parsed;
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const dateMatch = trimmedDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');

    let hours = '00';
    let minutes = '00';
    let seconds = '00';

    if (trimmedTime) {
      const timeMatch = trimmedTime.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (timeMatch) {
        hours = timeMatch[1].padStart(2, '0');
        minutes = timeMatch[2].padStart(2, '0');
        seconds = (timeMatch[3] || '00').padStart(2, '0');
      }
    } else {
      const embeddedTimeMatch = trimmedDate.match(/[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (embeddedTimeMatch) {
        hours = embeddedTimeMatch[1].padStart(2, '0');
        minutes = embeddedTimeMatch[2].padStart(2, '0');
        seconds = (embeddedTimeMatch[3] || '00').padStart(2, '0');
      }
    }

    const istIsoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
    const parsed = Date.parse(istIsoString);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback: append +05:30 to treat string as IST
  const fallback = trimmedDate.includes('T') ? `${trimmedDate}+05:30` : `${trimmedDate.replace(' ', 'T')}+05:30`;
  const fallbackParsed = Date.parse(fallback);
  if (!isNaN(fallbackParsed)) return fallbackParsed;

  const standardParsed = Date.parse(trimmedDate);
  return isNaN(standardParsed) ? null : standardParsed;
}

// Export aliases so any spelling/import variation (e.g. parseISSTarget) works seamlessly
export const parseISSTarget = parseISTTarget;

export const BIRTHDAY_CONFIG = {
  // ============================================================================
  // 1. OPENING PAGE & COVER CONTENT
  // ============================================================================
  cover: {
    // Atmospheric cover background image
    backgroundImage: coverImg,

    // Header badge at top of cover page
    pillBadge: "✨ A Moment in Time ✨",

    // Main poetic titles on cover
    heading: "Written in the Stars",
    subtitle: "A silent wish traveling through the twilight sky",

    // Waiting state text (shown when targetDate is null / countdown not yet active)
    waitingState: {
      title: "Counting Down Soon",
      message: "The universe is preparing something truly magical for your special day...",
      hint: "Set the target birthday date in src/config.js to activate the live countdown."
    }
  },

  // Recipient Name (used in titles, greetings, and cards)
  recipientName: "Miioo",

  // ============================================================================
  // 2. FIRST COUNTDOWN (TIMER 1 — OPENING / COVER PAGE)
  // ============================================================================
  // When this timer reaches 00:00:00:00, it automatically transitions to the Firecracker page.
  // Set in ISO format (e.g. "2026-11-20T00:00:00") or enter targetDate & targetTime below.
  // If left null, the countdown displays awaiting state without inventing fake dates.
  coverTargetDate: null,

  openingCountdown: {
    targetDate: "2026-11-24", // e.g. "2026-11-20"
    targetTime: "19:47:00", // in IST (UTC+05:30)
  },

  // Fallback target date if referencing generic property
  targetDate: null,

  // Optional: Timezone label for display (e.g. "IST", "GMT+5:30")
  timeZoneLabel: "",

  // ============================================================================
  // 3. SECOND COUNTDOWN (TIMER 2 — FIRECRACKER / ROOFTOP PAGE)
  // ============================================================================
  // When this timer reaches 00:00:00:00, it launches colorful fireworks into the sky.
  // Set in ISO format (e.g. "2026-11-20T00:01:00") or enter targetDate & targetTime below.
  // If left null, the countdown displays awaiting state without inventing fake dates.
  firecrackerTargetDate: null,

  secondCountdown: {
    targetDate: "2026-11-24", // e.g. "2026-11-20"
    targetTime: "19:48:20", // in IST (UTC+05:30)
  },

  // ============================================================================
  // 4. FIREWORKS & REVEAL MESSAGE
  // ============================================================================
  // The sparkling message formed in the sky when the floating heart button is clicked.
  // Set as an object { line1, line2 } or a string (e.g. "HAPPY BIRTHDAY").
  fireworksMessage: {
    line1: "HAPPY BIRTHDAY",
    line2: "Moonira",
  },

  // Welcome song during fireworks celebration
  fireworksAudio: "/audio/welcome.mp3",

  // ============================================================================
  // 5. MAIN BIRTHDAY PAGE – 13 SECTIONS & CONTENT
  // ============================================================================
  mainPage: {
    // Atmospheric main page background image
    backgroundImage: bgImg,

    // Hero title banner
    hero: {
      badge: "🎉 Happy Birthday!",
      title: "Happiest Birthday, Miioo!",
      subtitle: "May your heart always be as warm, radiant, and peaceful as tonight's twilight sky."
    },

    // Personal Birthday Message Card (Top Letter)
    messageCard: {
      tag: "A Letter For You",
      dateLabel: "Special Celebration",
      salutation: "Dearest Miioo,",
      paragraphs: [
        "[Your personal birthday message will appear here. Edit src/config.js to replace this placeholder with your own heartfelt words.]"
      ],
      closing: "With love and fondest wishes,",
      sender: "Forever & Always ❤️"
    },

    // Scratch-to-Reveal Image Card (Upper Right)
    scratchCard: {
      title: "A Hidden Memory",
      subtitle: "A special moment preserved just for you",
      instruction: "✨ Scratch to reveal ✨",
      imageSrc: bgImg,
      alt: "Revealed birthday memory",
      revealThreshold: 0.40,
    },

    // "Watch" Button (Directly below scratch card)
    watchButton: {
      label: "Clip for You ↗",
      sublabel: "Special Tribute Video",
      destinationType: "modal", // "modal" or "url"
      externalUrl: "",
      videoSrc: "/video1.mp4",
      modal: {
        title: "A Special Tribute For Miioo",
        subtitle: "Created with love for your birthday",
        placeholderMessage: "This is your dedicated video space. Link your video in src/config.js (under watchButton.videoSrc) to view it here in full cinematic quality!",
        buttonCloseLabel: "Close"
      }
    },

    // --------------------------------------------------------------------------
    // ALL 13 INDEPENDENTLY CONFIGURABLE SECTIONS
    // --------------------------------------------------------------------------
    // For each section, configure:
    // - title: Section heading
    // - salutation: Opening greeting (optional)
    // - paragraphs: Array of message lines (or [] for clean empty state)
    // - closing: Closing signoff (optional)
    // - sender: Sender name / signoff (optional)
    // - imageSrc: Photo path (defaults to /images-for-main-page/[id].jpg)
    // - videoSrc: Video path (defaults to /video-for-main-page/[id].mp4)
    // --------------------------------------------------------------------------
    sections: [
      {
        id: 1,
        title: "Happiest Birthday, Miioo!",
        salutation: "Dearest Miioo,",
        paragraphs: [
          "[Your personal birthday message for Section 1 will appear here. Edit src/config.js to replace with your words.Your personal birthday message for Section 1 will appear here. Edit src/config.js to replace with your words.Your personal birthday message for Section 1 will appear here. Edit src/config.js to replace with your words.Your personal birthday message for Section 1 will appear here. Edit src/config.js to replace with your words.]"
        ],
        closing: "With love and fondest wishes,",
        sender: "Forever & Always ❤️",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(1),
        imageSrc: "/images-for-main-page/1.jpg",
      },
      {
        id: 2,
        title: "Section 2",
        salutation: "Dearest Miioo,",
        paragraphs: ["bjgy"],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(2),
        imageSrc: "/images-for-main-page/2.jpg",
      },
      {
        id: 3,
        title: "Section 3",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(3),
        imageSrc: "/images-for-main-page/3.jpg",
      },
      {
        id: 4,
        title: "Section 4",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(4),
        imageSrc: "/images-for-main-page/4.jpg",
      },
      {
        id: 5,
        title: "Section 5",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(5),
        imageSrc: "/images-for-main-page/5.jpg",
      },
      {
        id: 6,
        title: "Section 6",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(6),
        imageSrc: "/images-for-main-page/6.jpg",
      },
      {
        id: 7,
        title: "Section 7",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(7),
        imageSrc: "/images-for-main-page/7.jpg",
      },
      {
        id: 8,
        title: "Section 8",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(8),
        imageSrc: "/images-for-main-page/8.jpg",
      },
      {
        id: 9,
        title: "Section 9",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(9),
        imageSrc: "/images-for-main-page/9.jpg",
      },
      {
        id: 10,
        title: "Section 10",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(10),
        imageSrc: "/images-for-main-page/10.jpg",
      },
      {
        id: 11,
        title: "Section 11",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(11),
        imageSrc: "/images-for-main-page/11.jpg",
      },
      {
        id: 12,
        title: "Section 12",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(12),
        imageSrc: "/images-for-main-page/12.jpg",
      },
      {
        id: 13,
        title: "Section 13",
        salutation: "Dearest Miioo,",
        paragraphs: [],
        closing: "",
        sender: "",
        linkLabel: "Clip for You ↗",
        linkAction: "video",
        videoSrc: getSectionVideoSrc(13),
        imageSrc: "/images-for-main-page/13.jpg",
      }
    ]
  },

  // ============================================================================
  // 6. SAD GALLERY (ATMOSPHERIC MOONLIT TERRACE, ONE FOLDER FOR IMAGES & VIDEOS)
  // ============================================================================
  // Put all Sad Gallery photos and videos directly into:
  //   public/sad/
  // Name them numerically (e.g. 1.jpg, 2.mp4, 3.png, 4.mp4, 5.jpg, 10.jpg).
  // Supported images: .jpg, .jpeg, .png, .webp, .avif
  // Supported videos: .mp4, .webm, .mov
  // Files are automatically discovered and sorted naturally (1, 2, 3... 10).
  // Configure personal messages below (messages[0] for item 1, messages[1] for item 2, etc.):
  sadGallery: {
    albumCover: sadCover,
    background: sadBg,
    messages: [
      "hyyyy",
      "hueiry",
      "Not every beautiful moment was meant to last forever... ♡",
      "We didn't say goodbye, but the silence said everything... ♡",
      "I still look for you in the songs we used to love... ♡",
      "Holding on to the memories that time could never fade... ♡",
      "A quiet echo of words that we never got to say... ♡",
      "Stars still shine even in the darkest parts of the night... ♡",
      "Every memory has its own bittersweet melody... ♡",
      "Carrying the warmth of yesterday into tomorrow... ♡",
      "Time moves on, but some chapters remain forever written in gold... ♡",
      "In the quiet twilight, every remembered smile is a gentle comfort... ♡",
      "Treasuring every fragile second we ever shared together... ♡"
    ],
    // Optional: override items explicitly if desired
    items: []
  },

  // ============================================================================
  // 7. HAPPY GALLERY (WARM SUNSET GARDEN, ONE FOLDER FOR IMAGES & VIDEOS)
  // ============================================================================
  // Put all Happy Gallery photos and videos directly into:
  //   public/happy/
  // Name them numerically (e.g. 1.jpg, 2.png, 3.mp4, 4.jpg, 5.mp4, 10.jpg).
  // Supported images: .jpg, .jpeg, .png, .webp, .avif
  // Supported videos: .mp4, .webm, .mov
  // Files are automatically discovered and sorted naturally (1, 2, 3... 10).
  // Configure album cover details & personal messages below:
  happyGallery: {
    albumCover: null,
    background: null,
    coverTitle: "Happy Memories",
    edition: "Special Birthday Edition",
    subtitle: "A collection of our happiest moments... ♡",
    coverMessage: "A timeless collection of our happiest smiles & unforgettable moments ♡",
    messages: [
      "Every smile shared with you becomes a treasured memory... ♡",
      "Pure joy captured in the golden light of sunset... ♡",
      "Your laughter is my favorite sound in the whole universe... ♡",
      "Adventures and quiet moments, every second with you is magic... ♡",
      "Here's to a lifetime of smiles, warmth, and sunny days together... ♡"
    ],
    // Optional: override items explicitly if desired
    items: []
  },

  // ============================================================================
  // 8. Q&A SECTION (INTERACTIVE MEMORIES & THOUGHTS QUIZ)
  // ============================================================================
  // Appears immediately after Happy Gallery.
  // Visual Asset: QNA-cover.png (daytime nature picnic background).
  // Music: Automatically plays from public/QNA-music/ without any music bar.
  //
  // USER CUSTOMIZATION GUIDE:
  // - You can edit categories (titles, emojis) below.
  // - Each category contains exactly 10 questions.
  // - Each question has 4 options (arranged in a 2x2 grid).
  // - Each option has an emoji, option text, and a personal message card that pops up:
  //     * Option 1 (top-left) & Option 3 (bottom-left) pop up on the LEFT.
  //     * Option 2 (top-right) & Option 4 (bottom-right) pop up on the RIGHT.
  // - Edit completion title and message below.
  // ============================================================================
  // 8. Q&A SECTION (INTERACTIVE MEMORIES & FINAL MESSAGE FOR YOU)
  // ============================================================================
  // Location: Appears immediately after Happy Gallery.
  // Visual Asset: QNA-cover.png (daytime nature picnic background).
  // Music: Automatically plays from public/QNA-music/ without any music bar.
  //
  // USER CUSTOMIZATION GUIDE:
  // 1. EXACTLY 10 QUESTIONS:
  //    - Edit questions, options, emojis, and personal messages below.
  //    - Option 1 (top-left) & Option 3 (bottom-left) pop up on the LEFT.
  //    - Option 2 (top-right) & Option 4 (bottom-right) pop up on the RIGHT.
  // 2. FINAL MESSAGE FOR YOU:
  //    - Appears when user completes Question 10 and clicks Next.
  //    - Shows a single glass button ("💌 Message for You").
  //    - Clicking opens the 3-card surprise: Message Card, Image Card, and Video Card!
  //    - Place your image in: public/last-msg/
  //    - Place your video in: public/last-msg/
  // ============================================================================
  qna: {
    background: qnaBg,
    image: qnaBg,
    coverReference: "/QNA-cover.png",
    heading: "Moments & Memories Q&A",
    subtitle: "A sweet little journey through our favorite questions and thoughts",

    music: {
      folder: "/QNA-music",
      defaultTrackVolume: 0.60,
      playlistOrder: [],
      includeUnlistedFiles: true
    },

    // Exactly 10 questions, each with 4 answer options:
    questions: [
      {
            "id": 1,
            "question": "What was the very first thought when our paths crossed?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🌅",
                        "text": "Something special is about to begin",
                        "message": "That gentle intuition turned out to be the truest thing ever. Every day since has proven it right. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "☀️",
                        "text": "Her smile is brighter than everything else",
                        "message": "That bright, effortless smile of yours has a way of turning ordinary moments into pure warmth. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🌆",
                        "text": "I wonder what she's really like",
                        "message": "Getting to know the depth, kindness, and beauty of who you are has been the greatest joy. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🌙",
                        "text": "A feeling of quiet peace right away",
                        "message": "Even from the very start, being around you felt comfortable and familiar, just like home. ♡"
                  }
            ]
      },
      {
            "id": 2,
            "question": "Which little memory from the start do you look back on most fondly?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🌙",
                        "text": "Late night conversations that never ended",
                        "message": "Losing track of time talking with you felt like the easiest, sweetest thing in the world. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🎶",
                        "text": "The songs we shared back then",
                        "message": "Every melody from those days still brings back the exact feeling of butterflies and excitement. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "☕",
                        "text": "Uncontrollable laughing over silly things",
                        "message": "Your laugh is truly magnetic. Hearing you giggle remains my favorite sound in the whole world. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "✨",
                        "text": "The very first heartfelt confession",
                        "message": "Opening up and feeling so genuinely understood is something I will cherish for a lifetime. ♡"
                  }
            ]
      },
      {
            "id": 3,
            "question": "What is your idea of the ultimate cozy date together?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🍿",
                        "text": "Snuggled under blankets watching cozy movies",
                        "message": "Warm blankets, favorite snacks, and your shoulder to lean on—pure perfection! ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🧺",
                        "text": "A sunny outdoor picnic by the river & grass",
                        "message": "Just like our beautiful picnic cover: open skies, gentle breezes, and endless talks. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🌃",
                        "text": "A peaceful rooftop under the stars and city lights",
                        "message": "Looking at the glowing horizon while holding hands in the quiet night breeze. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🍲",
                        "text": "Cooking a delicious meal together while making a mess",
                        "message": "Tasting sauces, laughing at clumsy mistakes, and eating together with love. ♡"
                  }
            ]
      },
      {
            "id": 4,
            "question": "When we laugh the hardest, what is usually the reason?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🤪",
                        "text": "An inside joke that nobody else on earth understands",
                        "message": "Those one-word glances that trigger uncontrollable giggles are the best! ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🙈",
                        "text": "One of us doing something hilariously clumsy",
                        "message": "Embarrassing moments turned into the purest shared memories forever. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🎭",
                        "text": "Exaggerated impressions and silly voices",
                        "message": "Goofing around and acting ridiculous together is the sweetest therapy. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "😂",
                        "text": "Laughing just because the other person is laughing",
                        "message": "Contagious joy! Your laugh always sparks mine without fail. ♡"
                  }
            ]
      },
      {
            "id": 5,
            "question": "What's an adorable habit you have that always brings a smile?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🙈",
                        "text": "Getting shy and hiding your face when complimented",
                        "message": "That gentle bashful reaction is one of the cutest sights in the world! ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "☕",
                        "text": "Holding a warm mug with both hands like a cozy bear",
                        "message": "It's the coziest picture ever—pure comfort and sweetness! ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🤏",
                        "text": "Making little excited expressions when good food arrives",
                        "message": "The happy food dance or that little eager sparkle is unbeatable! ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🧸",
                        "text": "Hugging a pillow tightly while listening intently",
                        "message": "Your soft, gentle nature shines through in the sweetest ways. ♡"
                  }
            ]
      },
      {
            "id": 6,
            "question": "What is your secret superpower in daily life?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🪄",
                        "text": "Making everyone around you feel warm and valued",
                        "message": "You have an innate gift of spreading kindness wherever you step. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "💡",
                        "text": "Always finding the silver lining in tough times",
                        "message": "Your optimistic spirit is a beacon of light when things feel dark. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🎨",
                        "text": "Spotting beauty in little things others overlook",
                        "message": "You appreciate the sky, the flowers, and the quiet wonders of life. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🌸",
                        "text": "Bringing peace into chaotic situations",
                        "message": "Your calm, grounded presence brings reassurance to everyone. ♡"
                  }
            ]
      },
      {
            "id": 7,
            "question": "What is the biggest wish for your special birthday year ahead?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🕊️",
                        "text": "Deep inner peace, good health, and calm minds",
                        "message": "May your heart always be light, your body healthy, and your spirit calm. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🚀",
                        "text": "Exciting new achievements and fulfilling goals",
                        "message": "I believe in you completely! You have the talent and drive to touch the sky. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "✈️",
                        "text": "Traveling to dreamy destinations and scenic wonders",
                        "message": "May this year take you to breathtaking sights that take your breath away! ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "💖",
                        "text": "Endless laughter, love, and sweet company",
                        "message": "Surrounded by genuine warmth and people who cherish you always. ♡"
                  }
            ]
      },
      {
            "id": 8,
            "question": "Where is one dream place we must visit together one day?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🏔️",
                        "text": "Serene snow-capped mountains and cozy cabins",
                        "message": "Sitting by a crackling fireplace watching snow fall softly outside. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🌊",
                        "text": "A tropical crystal beach with golden sunset skies",
                        "message": "Listening to gentle waves and walking barefoot in the warm sand. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🌸",
                        "text": "Cherry blossom gardens and fairytale pathways",
                        "message": "Underneath pastel pink petals, just like a scene from a romantic movie. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🏙️",
                        "text": "A vibrant cultural city with lights and music",
                        "message": "Strolling through ancient streets and enjoying midnight city lights. ♡"
                  }
            ]
      },
      {
            "id": 9,
            "question": "What promise should we make to each other for the future?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🤝",
                        "text": "To always talk things through with kindness and patience",
                        "message": "Patience and soft words can weather any storm that comes our way. ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🎈",
                        "text": "To never lose our playful spirit and silly laughs",
                        "message": "No matter how old we grow, we'll keep the joy of our young hearts alive. ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "🛡️",
                        "text": "To stand by each other through both sunshine and rain",
                        "message": "In every victory and every challenge, you will never have to walk alone. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "🌟",
                        "text": "To keep encouraging each other's wildest dreams",
                        "message": "Your cheerleader forever—always lifting you up toward your dreams! ♡"
                  }
            ]
      },
      {
            "id": 10,
            "question": "And finally: what is today all about for you?",
            "options": [
                  {
                        "id": "option-1",
                        "emoji": "🎉",
                        "text": "Celebrating the amazing human being you are!",
                        "message": "Today is YOUR day, and the world is infinitely better because you exist in it! ♡"
                  },
                  {
                        "id": "option-2",
                        "emoji": "🎂",
                        "text": "Eating delicious cake, unwrapping wishes, and smiling!",
                        "message": "May every single bite and wish bring you pure joy and happiness! ♡"
                  },
                  {
                        "id": "option-3",
                        "emoji": "❤️",
                        "text": "Feeling how deeply and truly cherished you are",
                        "message": "You are treasured beyond words, today, tomorrow, and every day after. ♡"
                  },
                  {
                        "id": "option-4",
                        "emoji": "✨",
                        "text": "Starting the best, most magical year of your life!",
                        "message": "Happy Birthday Miioo! Here is to the happiest, brightest year yet! 🎉💖✨"
                  }
            ]
      }
],

    // Final Message for You screen (after Question 10):
    finalMessage: {
      buttonText: "Message for You",
      heading: "A Very Special Message Just for You ♡",
      paragraphs: [
        "Dearest Miioo, every question and memory we walked through today is just a small glimpse of the warmth, laughter, and joy you bring into my world.",
        "You are more precious than words could ever convey. Thank you for being your wonderful, radiant, kindhearted self every single day.",
        "May this new chapter overflow with health, unending happiness, peace in your heart, and the fulfillment of every single dream you hold dear. Happy Birthday from the deepest place in my heart! ✨💖"
      ],
      closing: "With all my love and devotion,",
      signature: "Forever & Always ❤️",

      // ========================================================================
      // FINAL MESSAGE MEDIA CONFIGURATION (STORED IN public/last-msg/)
      // ========================================================================
      // 1. Final Message Image Card Media: Looping, control-free video (or image)
      //    Default: "/last-msg/1.mp4" (automatically loops, muted autoplay, no controls)
      imageCardMedia: "/last-msg/1.mp4",

      // 2. Final Message Video Card Media: Normal controllable video
      //    Default: "/last-msg/2.mp4" (Play/Pause, Volume controls, audio priority)
      videoCardMedia: "/last-msg/2.mp4",

      // Backward compatibility aliases
      image: "/last-msg/1.mp4",
      video: "/last-msg/2.mp4"
    }
  },

  // ============================================================================
  // 8. PASSWORD & HINT SETTINGS (SINGLE SOURCE OF TRUTH)
  // ============================================================================
  // Edit this string to change the password.
  // ONLY this exact password is accepted. No old, default, or alternate passwords work.
  secretPassword: "betu",
  passwordHint: "The secret password is her sweet nickname... (Miioo) ♡",

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

  // ============================================================================
  // 9. MAIN MUSIC PLAYER
  // ============================================================================
  musicPlayer: {
    folder: "/music",
    defaultTrackVolume: 0.60,
    autoplay: true,
    loop: true,
    // =========================================================================
    // PLAYLIST ORDER (SINGLE SOURCE OF TRUTH)
    // How to change song order:
    // 1. Put the exact audio filename from public/music/ in this array.
    // 2. Move an entry up or down to change its playback and dropdown position.
    // 3. Save the file.
    // 4. Restart the development server if required (npm run dev).
    // 5. Rebuild the production site after changes (npm run build).
    // Songs will play and appear in the dropdown in this exact order.
    // =========================================================================
    playlistOrder: [
      "Dilruba Dilnasheen(Official Audio) I Dilfek EP I Rito Riba.mp3",
      "Aakhri Saans – Iqlipse Nova & Aditya A (Official Video).mp3",
      "Preet Re Dhadak 2 Siddhant Chaturvedi, Triptii Dimri Darshan R, Jonita G, Rochak K, Gurpreet S.mp3"
    ],
    // If true, any audio files found in public/music/ that are NOT listed in playlistOrder
    // will be appended at the end. Set to false to ONLY play songs listed in playlistOrder.
    includeUnlistedFiles: true,
    playlist: [] // Custom override objects { title, src } if desired
  },

  // ============================================================================
  // 10. SAD GALLERY MUSIC PLAYER
  // ============================================================================
  sadMusicPlayer: {
    folder: "/sad-songs",
    defaultTrackVolume: 0.60,
    autoplay: true,
    loop: true,
    playlistOrder: [
      "PHIR KABHI (Reprise) Full Song  M.S. DHONI  Arijit Singh  Sushant Singh, Disha Patani.mp3"
    ],
    includeUnlistedFiles: true,
    playlist: []
  },

  // ============================================================================
  // 11. HAPPY GALLERY MUSIC PLAYER
  // ============================================================================
  happyMusicPlayer: {
    folder: "/happy-songs",
    defaultTrackVolume: 0.30,
    autoplay: true,
    loop: true,
    playlistOrder: [
      "happy-song1.m4a"
    ],
    includeUnlistedFiles: true,
    playlist: []
  },

  // ============================================================================
  // 12. GENERAL WEBSITE SETTINGS
  // ============================================================================
  dev: {}
};

// Standalone editable shortcuts for Countdown Page modals
export const messageContent = BIRTHDAY_CONFIG.countdownPage.messageContent;
export const hintContent = BIRTHDAY_CONFIG.countdownPage.hintContent;

export default BIRTHDAY_CONFIG;
