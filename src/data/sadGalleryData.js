/**
 * ==============================================================================
 * SAD MEMORIES DIGITAL SCRAPBOOK GALLERY — DATA CONFIGURATION
 * ==============================================================================
 * All assets and gallery entries for the Sad Memories scrapbook.
 * Uses the existing assets in the project root folder:
 * - sad.png: Full-page background
 * - sad-frame.png: Initial album frame
 * - sad-img.png: Memory photo frame
 */

import sadBg from '../../sad.png';
import sadFrame from '../../sad-frame.png';
import sadImg from '../../sad-img.png';
import couplePhoto from '../../couple?url';

export const SAD_ASSETS = {
  background: sadBg,
  initialFrame: sadFrame,
  memoryFrame: sadImg,
  defaultPhoto: couplePhoto,
};

// Album Cover Configuration
export const sadAlbumCover = {
  heading: "Sad Memories",
  coverMessage: "Some moments still hurt, but they are a part of our story... ♡",
  alt: "Sad Memories Album Cover"
};

// Individual Scrapbook Photo Pages
export const sadGalleryData = [
  {
    id: 1,
    image: couplePhoto,
    message: "Some moments stay with us forever... ♡",
    alt: "Sad memory 1"
  },
  {
    id: 2,
    image: "",
    message: "Not every beautiful moment was meant to last forever... ♡",
    alt: "Sad memory 2"
  },
  {
    id: 3,
    image: "",
    message: "We didn't say goodbye, but the silence said everything... ♡",
    alt: "Sad memory 3"
  },
  {
    id: 4,
    image: "",
    message: "I still look for you in the songs we used to love... ♡",
    alt: "Sad memory 4"
  }
];
