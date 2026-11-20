const fs = require('fs');

// Create the perfected SVG mask
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 940" width="100%" height="100%">
  <defs>
    <mask id="sceneryMask">
      <!-- White base: Scenery gets 22% darkening -->
      <rect width="1672" height="940" fill="white"/>

      <!-- 1. Lower-Right Lamp & Table/Balcony Ambient Glow (x: 960-1672, y: 280-920) -->
      <radialGradient id="lampHole" cx="1380" cy="580" rx="420" ry="340" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="55%" stop-color="black" stop-opacity="1"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <ellipse cx="1380" cy="580" rx="420" ry="340" fill="url(#lampHole)"/>

      <!-- 2. Lower-Left Lantern & Ground Reflection (x: 0-460, y: 400-880) -->
      <radialGradient id="lanternHole" cx="170" cy="640" r="280" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="55%" stop-color="black" stop-opacity="1"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <circle cx="170" cy="640" r="280" fill="url(#lanternHole)"/>

      <!-- 3. Left Hanging Bulbs & Fairy Lights (Top Cluster) -->
      <radialGradient id="leftBulbsTop" cx="120" cy="120" r="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="55%" stop-color="black" stop-opacity="1"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <circle cx="120" cy="120" r="240" fill="url(#leftBulbsTop)"/>

      <!-- 4. Left Hanging Bulbs & Fairy Lights (Mid-Lower Cluster) -->
      <radialGradient id="leftBulbsMid" cx="120" cy="360" r="230" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="55%" stop-color="black" stop-opacity="1"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <circle cx="120" cy="360" r="230" fill="url(#leftBulbsMid)"/>

      <!-- 5. Left Hanging Garland Canopy Arch (Upper-Right Vine) -->
      <radialGradient id="leftBulbsVine" cx="300" cy="180" r="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="50%" stop-color="black" stop-opacity="1"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <circle cx="300" cy="180" r="200" fill="url(#leftBulbsVine)"/>

      <!-- 6. Balustrade Garland Fairylight Strand -->
      <radialGradient id="leftRailingStrand" cx="380" cy="370" r="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="50%" stop-color="black" stop-opacity="0.9"/>
        <stop offset="80%" stop-color="black" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
      <circle cx="380" cy="370" r="170" fill="url(#leftRailingStrand)"/>
    </mask>
  </defs>
  <!-- Render masked black rectangle which acts as the alpha channel in CSS mask -->
  <rect width="1672" height="940" fill="black" mask="url(#sceneryMask)"/>
</svg>`;

fs.writeFileSync('public/scenery-darkening-mask.svg', svg);
console.log('Saved public/scenery-darkening-mask.svg successfully!');
