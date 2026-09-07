/**
 * SARIRO — the artwork the auth emails sit on
 * ============================================================================
 * Generates public/images/email/*.png. Run:  npm run email:art
 * (npm run email:build runs this first.)
 *
 * ── Why images at all, when the rest of the email refuses them ──────────────
 * Everything else in these templates is built from table cells precisely so it
 * cannot fail. But a table cell cannot blur, cannot overlap, cannot glow, and
 * cannot float — and a flat band of colour, however correct, looks like a bank
 * statement. Depth needs light, and light needs pixels.
 *
 * So the decoration — and ONLY the decoration — is a picture. Every word stays
 * live HTML on top of it.
 *
 * ── The rule that makes this safe ───────────────────────────────────────────
 * Outlook desktop cannot paint a background image without VML, Gmail blocks
 * remote images until the reader clicks "show images", and some people never
 * click. So every one of these sits behind a bgcolor that is the flat version
 * of the same design. Images off, you get the warm-black band with a coloured
 * kicker — which is a finished design, not a broken one. Images on, it lights
 * up. Nothing is ever LOST by the image failing, only added by it arriving.
 *
 * That is also why no word is ever baked into a PNG: a heading inside an image
 * is a heading that half the recipients cannot read.
 *
 * ── Why SVG → PNG rather than PNG directly ─────────────────────────────────
 * Because the artwork is written, not drawn — gradients, blurs and orbit rings
 * as a few dozen lines that can be re-tuned by changing a number. sharp
 * rasterises it. PNG rather than SVG because SVG does not render in Gmail at
 * all, and WebP is dead in Outlook.
 *
 * ── Retina ─────────────────────────────────────────────────────────────────
 * Drawn at 2x and declared at 1x in the template, because a 600px-wide banner
 * on a phone is a 1200px banner, and a soft gradient that bands looks worse
 * than no gradient.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'email');

const DEEP = '#1A1611';

/* The five moods. One per template, keyed to that email's accent, so the
   picture and the kicker agree without anybody having to remember to keep
   them in step. */
const MOODS = {
  blue:   { a: '#2563EB', b: '#7C3AED', c: '#06B6D4' },
  amber:  { a: '#F59E0B', b: '#EA580C', c: '#7C3AED' },
  violet: { a: '#7C3AED', b: '#2563EB', c: '#EC4899' },
  green:  { a: '#16A34A', b: '#06B6D4', c: '#84CC16' },
  cyan:   { a: '#06B6D4', b: '#2563EB', c: '#14B8A6' },
};

const W = 1200;
/* 1200x520 is not arbitrary: at the card's 600px width that is 260px tall,
   which is exactly the height the banner cell is given in the template. The
   cell is `background-size: cover`, so any other ratio crops — and the first
   thing cropped off a taller image is the bottom, which is where the wave is.
   Change one of these two numbers and you must change the other. */
const H = 520;

/** Deterministic noise, so a rebuild does not reshuffle the artwork. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The banner behind each headline.
 *
 * Three blurred colour fields for the light, then hard-edged rings and dots
 * over the top for the floating. The blur is what a table cell can never do
 * and is the entire reason this is a picture.
 */
function heroSvg(mood, seed) {
  const { a, b, c } = MOODS[mood];
  const r = rng(seed);

  // Orbit rings — thin, low-opacity, drifting off the edges so the frame reads
  // as a window onto something larger rather than a contained rectangle.
  let rings = '';
  for (let i = 0; i < 5; i++) {
    const cx = r() * W * 1.15 - W * 0.06;
    const cy = r() * H * 1.2 - H * 0.1;
    const rad = 60 + r() * 210;
    rings += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="#ffffff" stroke-opacity="${(0.05 + r() * 0.07).toFixed(3)}" stroke-width="${(1.2 + r() * 2).toFixed(1)}"/>`;
  }

  // Floating dots — a few soft, a few crisp, so the field has depth rather
  // than sitting on one plane.
  let dots = '';
  for (let i = 0; i < 26; i++) {
    const cx = r() * W;
    const cy = r() * H;
    const rad = 1.6 + r() * 5.5;
    const soft = r() > 0.62;
    dots += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(1)}" fill="#ffffff" fill-opacity="${(soft ? 0.1 + r() * 0.12 : 0.24 + r() * 0.4).toFixed(3)}"${soft ? ' filter="url(#soft)"' : ''}/>`;
  }

  /* Glass orbs — the "floating things". Placed rather than scattered: the
     type occupies the left third, so the weight sits right of centre and the
     largest one breaks the top edge, which is what stops the band reading as
     a rectangle with decoration inside it. */
  let orbs = '';
  const orbSpec = [
    { x: 0.79, y: 0.14, r: 150, fill: b },
    { x: 0.62, y: 0.52, r: 74, fill: c },
    { x: 0.93, y: 0.6, r: 96, fill: a },
    { x: 0.17, y: 0.2, r: 58, fill: c },
  ];
  for (const o of orbSpec) {
    orbs +=
      `<circle cx="${(o.x * W).toFixed(0)}" cy="${(o.y * H).toFixed(0)}" r="${o.r}" fill="${o.fill}" fill-opacity="0.34" filter="url(#soft)"/>` +
      `<circle cx="${(o.x * W).toFixed(0)}" cy="${(o.y * H).toFixed(0)}" r="${o.r}" fill="none" stroke="#ffffff" stroke-opacity="0.13" stroke-width="2"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <filter id="wide" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="115"/>
    </filter>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.085"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <!-- The type sits on the left. This guarantees it is legible whatever the
         orbs happen to be doing behind it, without dimming the right-hand
         side where all the colour is. -->
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${DEEP}" stop-opacity="0.82"/>
      <stop offset="42%" stop-color="${DEEP}" stop-opacity="0.42"/>
      <stop offset="78%" stop-color="${DEEP}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${DEEP}"/>

  <!-- The light. Three wide colour fields, heavily blurred, bleeding off the
       edges so no blob reads as a shape. -->
  <g filter="url(#wide)">
    <ellipse cx="${W * 0.1}" cy="${H * 0.16}" rx="360" ry="270" fill="${a}" fill-opacity="0.85"/>
    <ellipse cx="${W * 0.72}" cy="${H * 0.9}" rx="400" ry="280" fill="${b}" fill-opacity="0.72"/>
    <ellipse cx="${W * 1.02}" cy="${H * 0.1}" rx="290" ry="240" fill="${c}" fill-opacity="0.6"/>
  </g>

  ${rings}
  ${orbs}
  ${dots}

  <!-- Scrim first, then the sheen: the type has to win over the artwork. -->
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#sheen)"/>

  <!-- The wave, in the card's own white, baked into the bottom of the banner.
       The body below IS that white, so the seam disappears and the artwork
       reads as cut into rather than stacked on. Baked rather than shipped as a
       transparent PNG overlay: one request instead of two, and no dependence
       on a second image arriving for the first one to look finished.
       Images blocked → the flat band simply has a straight bottom edge. -->
  <path d="M0,${H - 96}
           C ${W * 0.2},${H - 150} ${W * 0.34},${H - 34} ${W * 0.55},${H - 58}
           C ${W * 0.74},${H - 79} ${W * 0.87},${H - 8} ${W},${H - 62}
           L ${W},${H} L 0,${H} Z"
        fill="#FFFFFF"/>
</svg>`;
}

/**
 * The real logo, rasterised for email.
 *
 * public/logo.svg is 1254x1254 — the blue ribbon mark on its black tile. It
 * cannot go into an email as an SVG (Gmail does not render SVG at all), so it
 * is rendered to PNG at 2x and declared at 1x in the template.
 *
 * The corners are rounded in the PIXELS rather than with border-radius,
 * because Outlook ignores border-radius on an image and would show a hard
 * black square where every other client shows a rounded tile. PNG keeps the
 * alpha, so the corners are genuinely transparent over the warm paper.
 *
 * It carries alt="" on purpose: the word "Sariro" sits beside it as live text,
 * so with images blocked the header still reads as the wordmark rather than as
 * a broken picture with the brand name repeated next to it.
 */
async function logoPng() {
  const TILE = 128;      // 2x the 64px it is displayed at
  const RADIUS = 30;     // 15px at display size
  const W_ = 352;        // 176px displayed
  const H_ = 128;        // 64px displayed
  const GAP = 28;

  const round = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">` +
      `<rect width="${TILE}" height="${TILE}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/>` +
    `</svg>`
  );

  const square = await sharp(join(OUT, '..', '..', 'logo.svg')).resize(TILE, TILE).png().toBuffer();
  const tile = await sharp(square).composite([{ input: round, blend: 'dest-in' }]).png().toBuffer();

  /* The wordmark is drawn INTO the image rather than set beside it as live
     text. That is the opposite of the rule the banners follow, and it is
     deliberate: an <img> whose alt is empty leaves a placeholder box in every
     client that blocks images, so "logo picture + live text" degrades to
     "broken picture + the word Sariro", which looks worse than either.

     One image carrying the whole lockup degrades instead to its alt text —
     the word "Sariro", styled in the template to the display face — which is
     exactly the header this had before the real logo went in. A logo is also
     the one place baking type into a picture is safe, because alt text can say
     the whole of what the picture says. A HEADING never can. */
  const word = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W_}" height="${H_}">` +
      `<text x="${TILE + GAP}" y="88" font-family="Segoe UI, Helvetica, Arial, sans-serif" ` +
      `font-size="62" font-weight="800" letter-spacing="-2" fill="${DEEP}">Sariro</text>` +
    `</svg>`
  );

  return sharp({ create: { width: W_, height: H_, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: tile, top: 0, left: 0 },
      { input: word, top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, 'logo.png'))
    .then((info) => report(info, 'logo.png'));
}

/**
 * The page ground: a warm paper tile with a faint dot grid.
 *
 * Tiled rather than one big image because it has to work behind an email of
 * any height, and because 4 KB repeated is kinder than 400 KB stretched on a
 * phone connection.
 */
function paperSvg() {
  const T = 96;
  let dots = '';
  for (let y = 0; y < T; y += 24) {
    for (let x = 0; x < T; x += 24) {
      dots += `<circle cx="${x + 12}" cy="${y + 12}" r="1.5" fill="#C9BCA8" fill-opacity="0.34"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><rect width="${T}" height="${T}" fill="#F4EFE7"/>${dots}</svg>`;
}

/**
 * A thin strip of drifting orbs, used as a divider inside the white card so
 * the body is not one uninterrupted rectangle of text.
 */
function stripSvg(mood, seed) {
  const { a, b, c } = MOODS[mood];
  const r = rng(seed);
  const w = 1040;
  const h = 120;

  /* Most of them out of focus. Crisp circles at this size read as clip art —
     blurred ones read as something behind the paper, which is the point. The
     few sharp ones are small, and only there to give the blur something to be
     out of focus RELATIVE to. */
  let art = '';
  for (let i = 0; i < 22; i++) {
    const cx = r() * w;
    const cy = h * 0.35 + r() * h * 0.85;
    const soft = r() > 0.3;
    const rad = soft ? 14 + r() * 34 : 2 + r() * 5;
    const fill = [a, b, c][Math.floor(r() * 3)];
    const op = soft ? 0.1 + r() * 0.14 : 0.16 + r() * 0.2;
    art += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="${fill}" fill-opacity="${op.toFixed(3)}"${soft ? ' filter="url(#s)"' : ''}/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="s" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="11"/></filter></defs><rect width="${w}" height="${h}" fill="#FFFFFF"/>${art}</svg>`;
}

mkdirSync(OUT, { recursive: true });

const report = (info, file) =>
  console.log(`  ${String(Math.round(info.size / 1024)).padStart(4)} KB  ${info.width}x${info.height}  images/email/${file}`);

const png = (svg, file, opts = {}) =>
  sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: opts.palette ?? false })
    .toFile(join(OUT, file))
    .then((info) => report(info, file));

/* The banners go out as JPEG. There is no transparency in them to lose, and a
   smooth blurred gradient is the one thing PNG is worst at — 290 KB as PNG
   against 40-odd as JPEG, on a banner a parent loads over mobile data. */
const jpg = (svg, file) =>
  sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(join(OUT, file))
    .then((info) => report(info, file));

const jobs = [];
let seed = 7;
for (const mood of Object.keys(MOODS)) {
  jobs.push(jpg(heroSvg(mood, (seed += 977)), `hero-${mood}.jpg`));
  jobs.push(png(stripSvg(mood, (seed += 313)), `strip-${mood}.png`, { palette: true }));
}
jobs.push(png(paperSvg(), 'paper.png', { palette: true }));
jobs.push(logoPng());

await Promise.all(jobs);
console.log(`\nArt written to public/images/email/.`);
console.log('These must be DEPLOYED before the emails can load them —');
console.log('until then every template falls back to its flat colour, which is by design.');
