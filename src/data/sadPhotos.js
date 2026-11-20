/**
 * Sad Memories Media Loader
 * 
 * Single Folder Architecture:
 * - Reads all images and videos from public/sad/ (or root /sad/).
 * - Supported image formats: .jpg, .jpeg, .png, .webp, .avif
 * - Supported video formats: .mp4, .webm, .mov
 * - Automatic media type detection by file extension.
 * - Natural numerical sorting: 1, 2, 3, 4, 5, 10, 11 (never alphabetical).
 */

import { BIRTHDAY_CONFIG } from '../config';

// Vite build-time automatic discovery for public/sad and sad
const sadMediaModules = import.meta.glob(
  [
    '../../public/sad/*.{jpg,jpeg,png,webp,avif,mp4,webm,mov,JPG,JPEG,PNG,WEBP,AVIF,MP4,WEBM,MOV}',
    '../../sad/*.{jpg,jpeg,png,webp,avif,mp4,webm,mov,JPG,JPEG,PNG,WEBP,AVIF,MP4,WEBM,MOV}'
  ],
  {
    eager: true,
    query: '?url',
    import: 'default'
  }
);

function detectMediaType(filename) {
  if (/\.(mp4|webm|mov)$/i.test(filename || '')) {
    return 'video';
  }
  return 'image';
}

export function getSadPhotos() {
  // 1. If explicitly configured with custom items in BIRTHDAY_CONFIG.sadGallery.items, use that
  const configuredItems = BIRTHDAY_CONFIG?.sadGallery?.items;
  if (Array.isArray(configuredItems) && configuredItems.length > 0) {
    return configuredItems.map((item, index) => {
      const num = item.id || (index + 1);
      const src = item.src || item.video || item.image || item.imageSrc || item.videoSrc || '';
      const isVideo = item.type === 'video' || detectMediaType(src) === 'video';

      return {
        id: `sad-media-${num}`,
        number: num,
        type: isVideo ? 'video' : 'image',
        src: src,
        filename: src ? src.split('/').pop() : `${num}.${isVideo ? 'mp4' : 'jpg'}`,
        name: isVideo ? `Video ${num}` : `Photo ${num}`,
        alt: item.alt || (isVideo ? `Sad Video ${num}` : `Sad Memory ${num}`),
        message: item.message || BIRTHDAY_CONFIG?.sadGallery?.messages?.[index] || ""
      };
    });
  }

  // 2. Discover all files automatically from public/sad
  const discoveredMap = new Map();

  for (const [filepath, resolvedUrl] of Object.entries(sadMediaModules)) {
    const filename = filepath.split('/').pop() || '';
    if (!filename) continue;

    // Use normalized lowercase filename as deduplication key (prioritizing public/sad)
    const key = filename.toLowerCase();
    if (!discoveredMap.has(key) || filepath.includes('public/sad')) {
      const match = filename.match(/^(\d+)/);
      const number = match ? parseInt(match[1], 10) : 9999;
      const type = detectMediaType(filename);

      discoveredMap.set(key, {
        filename,
        number,
        type,
        src: resolvedUrl || `/sad/${filename}`
      });
    }
  }

  const items = Array.from(discoveredMap.values());

  // Natural numerical sort: 1, 2, 3, 4, 5, 10, 11
  items.sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
  });

  // If no files found, provide clean empty-state showcase slots (no fake text)
  if (items.length === 0) {
    return [1, 2, 3, 4, 5].map((num) => ({
      id: `sad-item-${num}`,
      number: num,
      type: 'image',
      src: '',
      filename: `${num}.jpg`,
      name: `Photo ${num}`,
      alt: `Sad Memory ${num}`,
      message: BIRTHDAY_CONFIG?.sadGallery?.messages?.[num - 1] || ""
    }));
  }

  const configuredMessages = BIRTHDAY_CONFIG?.sadGallery?.messages || [];

  return items.map((item, index) => {
    const num = item.number !== 9999 ? item.number : index + 1;
    const isVideo = item.type === 'video';
    const userMsg = configuredMessages[index] || "";

    return {
      id: `sad-media-${num}-${index}`,
      number: num,
      type: item.type,
      src: item.src,
      filename: item.filename,
      name: isVideo ? `Video ${num}` : `Photo ${num}`,
      alt: isVideo ? `Sad Video ${num}` : `Sad Memory ${num}`,
      message: userMsg
    };
  });
}
