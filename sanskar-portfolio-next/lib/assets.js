// Ported from the original single-file portfolio's inline <script> ASSETS block.
// Populates window.ASSETS / window.__resources — read by experience.js during scene build.
export function initAssets() {
/* ============================================================================
   ASSETS — THE ONLY PLACE YOU PASTE IMAGES
   ----------------------------------------------------------------------------
   Every slot below is optional. Leave a slot as '' and the site draws a tidy
   labelled placeholder for it instead, so the page is never broken while you
   collect real work. Drop in a URL (or a relative path like 'img/case-1.jpg')
   and it takes over immediately — nothing else needs to change.

   Recommended sizes (bigger is fine, they're cover-cropped):
     cases    480×300  4:3-ish hero crop for each case-study card
     photos   300×300  square, for the journey polaroids
     gallery  720×540  4:3, for the full gallery grid + lightbox
   ========================================================================== */
window.ASSETS = {
  cases: [
    '',   // 1 — Prisma Encounter Redesign
    '',   // 2 — Healow AI Configurator
    '',   // 3 — Codeathon Design System
  ],
  photos: [
    '/images/photo-1.jpg',   // 1 — Moment #9
    '/images/photo-2.jpg',   // 2 — Moment #14
    '/images/photo-3.jpg',   // 3 — Moment #8
    '/images/photo-4.jpg',   // 4 — Moment #7
    '/images/photo-5.jpg',   // 5 — Moment #15
    '/images/photo-6.jpg',   // 6 — Moment #13
  ],
  gallery: [
    '/images/gallery-1.jpg',   // 1 — Moment #6
    '/images/gallery-2.jpg',   // 2 — Fort corridors, Jaipur
    '/images/gallery-3.jpg',   // 3 — Moment #10
    '/images/gallery-4.jpg',   // 4 — Moment #4
    '/images/gallery-5.jpg',   // 5 — Moment #5
    '/images/gallery-6.jpg',   // 6 — Moment #12
    '/images/gallery-7.jpg',   // 7 — Horse riding at the stables
    '/images/gallery-8.jpg',   // 8 — Squad goals, hilltop vibes
    '/images/gallery-9.jpg',   // 9 — Moment #11
  ],
};

/* ---------------------------------------------------------------------------
   Placeholder art, drawn as an inline SVG data URI (~700 bytes each instead of
   the ~500KB PNG each one used to be). Works anywhere a URL works: <img src>,
   CSS, and canvas drawImage for the 3D textures.
   ------------------------------------------------------------------------- */
(function(){
  const PALETTE = ['#C25A2E','#1F5E5B','#E5A83B','#5B84A0','#7BA05B','#4A2E52'];
  const xml = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // multiply a #rrggbb by k — keeps the gradient in-family without a colour lib
  const shade = (hex, k) => '#' + [1,3,5]
    .map(i => Math.round(parseInt(hex.substr(i,2),16) * k).toString(16).padStart(2,'0')).join('');

  function placeholder(w, h, label, col){
    const s = Math.min(w,h);
    /* Size the label off the crop, then clamp it so it can't run past the edges
       if you rename something long. Bold Helvetica averages ~0.55em per glyph,
       so max size = (86% of the width) / (0.55 × characters). */
    const t1 = Math.round(Math.min(s * 0.11, (w * 0.86) / (0.55 * Math.max(label.length, 1))));
    const t2 = Math.round(Math.min(s * 0.045, w * 0.049));   // "swap me" line
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
      + `<defs>`
      +   `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
      +     `<stop offset="0" stop-color="${shade(col,1.18)}"/><stop offset="1" stop-color="${shade(col,0.68)}"/>`
      +   `</linearGradient>`
      +   `<pattern id="s" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">`
      +     `<rect width="15" height="38" fill="#FBF3E3" opacity="0.06"/>`
      +   `</pattern>`
      + `</defs>`
      + `<rect width="${w}" height="${h}" fill="url(#g)"/>`
      + `<rect width="${w}" height="${h}" fill="url(#s)"/>`
      + `<g fill="#FBF3E3" font-family="Helvetica,Arial,sans-serif" text-anchor="middle">`
      +   `<text x="${w/2}" y="${h/2 + t1*0.28}" font-size="${t1}" font-weight="700" opacity="0.92">${xml(label)}</text>`
      +   `<text x="${w/2}" y="${h/2 + t1*0.28 + t2*2}" font-size="${t2}" font-weight="700"`
      +   ` letter-spacing="${(t2*0.18).toFixed(1)}" opacity="0.6">★ PLACEHOLDER — SWAP ME ★</text>`
      + `</g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // resolve(slot, index) → the pasted URL if there is one, else a placeholder
  const pick = (list, i, w, h, label) => (window.ASSETS[list][i] || '').trim()
    || placeholder(w, h, label, PALETTE[i % PALETTE.length]);

  const CASE_LABELS = ['Prisma Encounter','Healow AI','Codeathon System'];
  const PHOTO_LABELS = ['Garba night','Lobby','Navratri','Snow line','Under the stars','Golden hour'];
  const GAL_LABELS = ['On horseback','Hilltop crew','Fort corridors','Garba night','Snow trip',
                      'Navratri','Above the snow','Curtain call','Empty house','Nothing but sky'];

  const r = {};
  CASE_LABELS.forEach((l,i)  => r['caseImg'+(i+1)] = pick('cases',   i, 480, 300, l));
  PHOTO_LABELS.forEach((l,i) => r['photo'  +(i+1)] = pick('photos',  i, 300, 300, l));
  GAL_LABELS.forEach((l,i)   => r['gal'    +(i+1)] = pick('gallery', i, 720, 540, l));
  window.__resources = r;
})();
}
