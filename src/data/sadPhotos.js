/**
 * Sad Memories Photos Loader
 * Dynamically loads photographs 1, 2, 3, 4, 5 from the root /sad/ folder.
 * Supports any extension (.jpg, .jpeg, .png, .webp, or extensionless).
 */

const photoModules = import.meta.glob('../../sad/*', {
  eager: true,
  query: '?url',
  import: 'default'
});

const defaultMessages = [
  "Some moments stay with us forever... ♡",
  "Not every beautiful moment was meant to last forever... ♡",
  "We didn't say goodbye, but the silence said everything... ♡",
  "I still look for you in the songs we used to love... ♡",
  "Holding on to the memories that time could never fade... ♡"
];

export function getSadPhotos() {
  const loadedEntries = Object.entries(photoModules);

  return [1, 2, 3, 4, 5].map((num) => {
    // Find matching file in /sad/ (e.g., "1.jpg", "1.png", "1.webp", "1", "1-photo.jpg", etc.)
    const entry = loadedEntries.find(([path]) => {
      const filename = path.split('/').pop() || '';
      return (
        filename === `${num}` ||
        filename.startsWith(`${num}.`) ||
        filename.startsWith(`${num}-`) ||
        filename.startsWith(`${num}_`)
      );
    });

    return {
      id: `photo-${num}`,
      number: num,
      src: entry ? entry[1] : '',
      name: `Photo ${num}`,
      alt: `Sad Memory ${num}`,
      message: defaultMessages[num - 1] || "Some moments stay with us forever... ♡"
    };
  });
}
