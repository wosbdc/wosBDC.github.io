const fs = require('fs');

const faviconPath = 'public/favicon.svg';
let faviconContent = fs.readFileSync(faviconPath, 'utf8');

// Strip xml header if present
faviconContent = faviconContent.replace(/<\?xml.*?\?>/i, '').trim();

// Wrap into a 512x512 rounded app icon container with cyan/purple gradient glow, border, and 'wosBDC' app title
const generatePwaIcon = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pwaBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="pwaBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <radialGradient id="pwaGlow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background Card -->
  <rect width="512" height="512" rx="110" fill="url(#pwaBgGrad)"/>
  
  <!-- Outer Glowing Border -->
  <rect x="16" y="16" width="480" height="480" rx="94" fill="none" stroke="url(#pwaBorderGrad)" stroke-width="10" opacity="0.8"/>
  
  <!-- Radial Glow Behind Logo -->
  <circle cx="256" cy="230" r="190" fill="url(#pwaGlow)"/>

  <!-- Centered Site Snowflake Logo -->
  <g transform="translate(116, 75) scale(5.8)">
    ${faviconContent}
  </g>

  <!-- wosBDC Branding Text -->
  <text x="256" y="445" font-size="44" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fill="#ffffff" letter-spacing="3">wosBDC</text>
</svg>`;

fs.writeFileSync('public/icon-512.svg', generatePwaIcon(512));
fs.writeFileSync('public/icon-192.svg', generatePwaIcon(192));
console.log("PWA icons generated with official blueish/purpleish site logo!");
