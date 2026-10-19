// Génère les icônes de l'app (PWA, Apple, favicon) à partir du logo vectoriel.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const LOGO = `<path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="#f3b71b"/><path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="#08090b"/><path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="#f3b71b"/>`;

function icon({ size, scale, rounded }) {
  const s = size;
  const logo = s * scale;
  const off = (s - logo) / 2;
  const r = rounded ? s * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="70%">
      <stop offset="0" stop-color="#2a2412"/><stop offset="0.55" stop-color="#121418"/><stop offset="1" stop-color="#08090b"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#g)"/>
  <g transform="translate(${off} ${off + s * 0.01}) scale(${logo / 40})">${LOGO}</g>
</svg>`;
}

const out = 'public/icons';
const jobs = [
  ['icon-192.png', { size: 192, scale: 0.66, rounded: true }],
  ['icon-512.png', { size: 512, scale: 0.66, rounded: true }],
  ['maskable-512.png', { size: 512, scale: 0.5, rounded: false }],
  ['../../src/app/apple-icon.png', { size: 180, scale: 0.62, rounded: false }],
];
for (const [name, opts] of jobs) {
  await sharp(Buffer.from(icon(opts))).png().toFile(`${out}/${name}`);
}
writeFileSync('src/app/icon.svg', icon({ size: 64, scale: 0.78, rounded: true }));
console.log('icônes générées');
