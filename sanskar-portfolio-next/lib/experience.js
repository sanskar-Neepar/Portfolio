/*
 * Ported near-verbatim from the original single-file HTML portfolio's
 * <script type="module"> block (the Three.js "circus" scene: camera choreography,
 * chapter panels, cinema/gallery/gym overlays, music dock).
 *
 * Adaptations for Next.js:
 *  - `three` and `gsap` are real npm imports instead of a CDN <script>/importmap.
 *  - Embedded base64 photos were extracted to /public/images and swapped for URLs
 *    (see lib/assets.js, which must run first to populate window.ASSETS/__resources).
 *  - The whole script body is wrapped in initExperience(), called once from a
 *    useEffect after the JSX below has mounted (so every getElementById lookup
 *    still resolves exactly as it did in the original static HTML).
 *  - Two ScrollTrigger.refresh() calls were added (search "ScrollTrigger.refresh")
 *    so GSAP's own scroll cache never goes stale when the runway height changes —
 *    the hand-tuned damped-scroll "endless lap" logic itself is untouched.
 */
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initExperience() {
gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ palette / content (tweak here) ============ */
const Q = [
  {floor:'#E8785A', wall:'#1F5E5B'},
  {floor:'#E5A83B', wall:'#4A2E52'},
  {floor:'#7BA05B', wall:'#C25A2E'},
  {floor:'#5B84A0', wall:'#F0E3C8'},
];
/* ===== EDIT ME — case study cards: title, blurb, chips, and IMAGE_SRC per card ===== */
const CASES = [
  {t:'PrepInsta Prime Mobile App', d:'A 0→1 UX case study: rebuilding India’s placement-prep subscription as a native app. First for the students who had already paid, then for the ones who never would.', r:'Sole Product Designer', i:'1.5M-user platform · 4.8★ · +18% DAU/MAU', c:'#E8785A',
   chips:['0→1 Mobile App','EdTech · Growth','Design System'],
   url:'/case-study/prepinsta',
   img:'/images/case-1.jpg', video:'/videos/prepinsta-thumbnail.mp4'},
  {t:'Zeltgold · 0→1 Product Design', d:'A gold-savings platform: website, customer app, vendor app, admin console and redemption desk. Researched, designed and shipped to production, solo, in a month.', r:'Solo Product Designer', i:'5 surfaces · 1 month, research → shipped', c:'#5B84A0',
   chips:['0→1 Product Design','FinTech · Gold Savings','5 Surfaces, Solo'],
   url:'/case-study/zeltgold',
   img:'/images/case-2.jpg', video:'/videos/zeltgold-thumbnail.mp4'},
  {t:'Clinical Suite Redesign', d:'Rebuilt a clinical letter system used by 200,000 clinicians. Led user research, designed a workflow-first system, and shipped high-impact features iteratively , replacing a deeply outdated legacy tool.', r:'Lead UX Designer', i:'200K clinicians · 12M letters/year', c:'#7BA05B',
   chips:['HealthTech','Clinical UX','User Research'],
   url:'https://www.behance.net/gallery/247941787/Improving-Letter-Module',
   img:'/images/case-3.jpg'},
];
/* ===== EDIT ME — About-quadrant wall video: paste your mp4 URL (or file path) here when ready.
   Leave '' for the built-in animated showreel. PERFORMANCE: the video is 100% lazy — nothing is
   fetched at page load; the <video> only gets a src and starts buffering on the FIRST click of the
   showreel, so adding a URL later can never slow the site down. ===== */
const VIDEO_SRC = '';
/* ===== SHOWREEL PLACEHOLDER (EDIT ME) =====
   While VIDEO_SRC is empty, clicking the wall screen runs the theater camera move and plays this
   art ON THE WALL SCREEN, with the coming-soon type burned over it — no popup, no overlay.

   WHY A SPRITE SHEET AND NOT A .GIF: a gif only animates on the browser's own timer, and that
   timer is unreliable for an <img> that exists solely to be sampled — parked offscreen, at 1px,
   behind everything, it gets throttled or frozen on its first frame, which is exactly why the reel
   sat still. All 10 frames are laid out in one image instead and we advance through them ourselves
   from the render clock, so playback is deterministic and cannot be paused by the browser.
   Layout: 5 columns × 2 rows, each cell 480×384, 90ms per frame.
   Inlined as a data URI because the art is uploaded to WebGL, and a sibling asset file is blocked
   by the browser when the page is opened straight off disk. ===== */
const REEL_SHEET = '/images/reel-sheet.jpg';
const REEL_COLS=5, REEL_ROWS=2, REEL_FRAMES=10, REEL_FPS=1000/90; // 90ms per frame, as authored
const REEL_TITLE = 'Coming soon';
const REEL_SUB   = 'I\u2019m cooking something.';
/* ===== EDIT ME — long-form bio shown in the "My Story" popup ===== */
const BIO = {
  title:'About Sanskar',
  paras:[
    "Every great interface hides a massive amount of complexity. Over the past 5 years, I've designed across healthcare, AI, and fintech, learning that my true passion lies in making dense, high-stakes tools feel calm and intuitive.",
    "I approach design as a structural challenge first. I dive deep into the domain, unknotting tangled workflows before pushing a single pixel. Whether I'm building a 0-to-1 clinical dashboard or scaling a component library, I look for the most logical, unbreakable system.",
    "But logic alone isn't enough. I believe in the power of craft, the subtle tension of an animation, the crispness of a typographic scale, the warmth of a microcopy. I obsess over the small details because that's where trust is earned.",
    "Currently pushing the boundaries of healthcare UX at eClinicalWorks. I thrive in cross-functional teams where design and engineering speak the same language."
  ],
  chips:['Healthcare Tech','0-to-1 Products','Interaction Design','Systems Thinking','Prototyping','5 yrs'],
};
/* ===== EDIT ME — Act III journey story: chapters, photos (PHOTO_SRC/PHOTO_TAG) ===== */
const CHAPTERS = [
  {co:'Synoriq', dates:'2021 to 2023', role:'Product Designer', cap:'Where I learned to turn ambiguity into shipped product. Navigated tight regulatory constraints while advocating for user delight.'},
  {co:'eClinicalWorks', dates:'2023 – Present', role:'UX Designer', cap:'Scaling healthcare experiences and design systems for real clinical impact. Designing high-stakes AI tools that physicians use daily.'},
];
const PHOTOS = [ // PHOTO_SRC + PHOTO_TAG per print (all six hang together on the GALLERY wall at az≈3.22; ch kept only as a label of which era each print belongs to)
  /* TAGS (EDIT ME): retagged to match what's actually IN each print — the old tags described
     design work ("Design sprint whiteboard", "System architecture mapping") while the photos are
     Garba nights, snow, and campfires. They were also long enough to run off the polaroid edge;
     keep replacements short (the sticker auto-shrinks, but ~20 chars reads best). */
  {src:window.__resources.photo1, tag:'Garba night, full send', ch:0},
  {src:window.__resources.photo2, tag:'Lobby, off duty',        ch:0},
  {src:window.__resources.photo3, tag:'Navratri, three-piece',  ch:0},
  {src:window.__resources.photo4, tag:'Above the snow line',    ch:1},
  {src:window.__resources.photo5, tag:'Torch to the stars',     ch:1},
  {src:window.__resources.photo6, tag:'Golden hour, arm up',    ch:1},
];
/* ===== EDIT ME — testimonials band (between Acts III & IV) ===== */
const LINKEDIN_URL = 'https://www.linkedin.com/in/myself-sanskar/';
const RECS = [
  {q:"His creativity consistently goes beyond the expected, out-of-the-box ideas and a uniquely thoughtful approach to every problem. He elevates both the product and the people around him.",
   n:'Parth Panchal', r:'Senior Product Designer, eClinicalWorks', avatar:''},
  {q:"He always goes the extra mile to ensure the project is a success. Sanskar would be a great addition to any product team.",
   n:'Prasanth K. Rajan', r:'Senior Software Engineer · Client', avatar:''},
  {q:"Gave and received feedback well, quickly integrated design changes, and delivered cohesive, creative designs on time and within budget.",
   n:'Patrick Cockrum', r:'President, PCI Industries', avatar:''},
  {q:"His ability to swiftly grasp product knowledge and prepare multiple wireframes in record time showcased his exceptional skills as a designer.",
   n:'Sunil Kumawat', r:'Technical Project Manager, Synoriq', avatar:''},
];
/* ===== EDIT ME — Act IV contact badges ===== */
const CONTACTS = [
  ['Instagram', 'https://www.instagram.com/nota_sanskari/', 'ig'],
  ['Email', 'mailto:Designbysanskar@gmail.com', 'mail'],
  ['  +91 89495 27069', 'tel:+918949527069', 'phone'],
  ['Jaipur, India', '', 'pin'],
  ['Behance', 'https://www.behance.net/sanskarsharma3', 'be'],
  ['Dribbble', 'https://dribbble.com/sanskar112', 'drb'],
];
/* ===== EDIT ME — exercise mini-game at the gym mat (dumbbells): labels, rep goal, reward copy ===== */
const EXERCISE_LABEL='Click to Exercise';
const EXERCISE_GOAL=12;                                   // reps to fill the power bar
const EXERCISE_REWARD_TITLE='Heavy Lifter';
const EXERCISE_REWARD_COPY='Twelve clean reps, certified strong in curls AND in craft. Designers who lift ship heavier features.';
const VIEW_ALL_LABEL='View all case studies →'; // EDIT ME — pinned playbill in the Act II stage gap (opens the full bill)
const GALLERY_LABEL='Explore gallery →';        // EDIT ME — pinned ticket on the journey wall (opens the photo gallery)
/* Scroll timeline: intro [0,.08], then four acts fill the rest — one full lap of the ring.
   p=1 lands exactly 2π past p=ACT0, so the scroll wraps seamlessly and the circle continues. */
const ACT0=0.08, ACTW=(1-ACT0)/4, A = q => Math.PI/4 + q*Math.PI/2;
const pCenter = q => ACT0 + (q+0.5)*ACTW;

/* ============ WALL SPACING ============
   Wall content hangs on a ~r10.7 cylinder, so gaps ALONG the wall are angles, not
   distances: ARC(u) converts world units → radians at that radius. Use it whenever
   you want to think in units instead of radians.

   Every content zone (hero text, case stages, conveyor gallery, chapter plaques,
   testimonials, brick wall, contact chips, music prompt) owns a dedicated
   azimuth band, and each band's start/end is written literally at its own use
   site — search for "ZONE:" to find them. They are deliberately hard numbers:
   the bands were fitted by eye against the bulb garland and the camera path, so a
   single global gap constant can't reproduce them. Move a zone by editing its
   numbers and the neighbouring ZONE: comment. */
const ARC=u=>u/10.7;
const S_MD=ARC(.48);   // standard card-to-card / column-to-column gap

/* ============ helpers ============ */
function canvasTex(w,h,fn){
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  fn(c.getContext('2d'),w,h);
  const t = new THREE.CanvasTexture(c); t.anisotropy=4; t.colorSpace=THREE.SRGBColorSpace; return t;
}
function wrapText(ctx, text, x, y, maxW, lh){
  const words = text.split(' '); let line='', yy=y;
  for(const w of words){
    if(ctx.measureText(line+w).width > maxW && line){ ctx.fillText(line.trim(),x,yy); line=w+' '; yy+=lh; }
    else line += w+' ';
  }
  ctx.fillText(line.trim(),x,yy); return yy;
}
/* MEASURE-ONLY wrap: returns the lines `text` would break into at the CURRENT ctx.font.
   Needed so a block's height can be known BEFORE anything is painted, which is how the
   case-study cards keep their blurb from running into the tag chips. */
function wrapLines(ctx, text, maxW){
  const words = String(text).split(/\s+/).filter(Boolean); const lines=[]; let line='';
  for(const word of words){
    const test = line ? line+' '+word : word;
    if(ctx.measureText(test).width > maxW && line){ lines.push(line); line=word; }
    else line = test;
  }
  if(line) lines.push(line);
  return lines;
}
const mat = (color, o={}) => new THREE.MeshStandardMaterial({color, roughness:.8, metalness:.05, ...o});
const polar = (ang,r,y=0) => new THREE.Vector3(Math.sin(ang)*r, y, Math.cos(ang)*r);

/* ============ renderer / scene ============ */
const stage = document.getElementById('stage');
const mobile = innerWidth < 640;
/* PIXEL RATIO (EDIT ME): capped at 2 on desktop, 1.6 on phones — above that the
   shadow map + fullscreen grain cost far more than the sharpness is worth. */
const DPR_CAP = mobile ? 1.6 : 2;
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1210');
/* CINEMATIC DEPTH (EDIT ME — FOG_NEAR0/FOG_FAR0): warm atmospheric fog = cheap far-plane DOF.
   Baseline is barely-there (only the far side of the bowl softens); the render loop pulls it in
   slightly during camera travel and releases on holds. Reduced motion: no fog — flat clean framing. */
/* Fog colour tracks scene.background so the far side of the bowl dissolves into
   the dark instead of hazing over. The render loop pulls near/far in during
   camera travel (see the cinematic pass) — so the baseline must already BE
   FOG_NEAR0/FOG_FAR0, or frame 1 snaps. Reduced motion: no fog, flat framing. */
const FOG_NEAR0=11, FOG_FAR0=24;
if(!reduced) scene.fog = new THREE.Fog('#1a1210', FOG_NEAR0, FOG_FAR0);
const camera = new THREE.PerspectiveCamera(mobile?62:50, innerWidth/innerHeight, .1, 100);

/* ============ A) arena floor — painted gradient wheel ============ */
const floorTex = canvasTex(1024,1024,(ctx,w,h)=>{
  // per-pixel quadrant wheel — φ=atan2(dx,dy) matches world azimuth (x=sinφ·r, z=cosφ·r)
  /* FLOOR (EDIT ME — BASE / TINT_K / RIM_DARK): a warm sanded-boards ring, not a colour wheel.
     Each chapter's hue only TINTS the base by TINT_K, so the quadrant reads as a mood shift
     rather than a pie chart; radial falloff darkens toward the rim to seat the bowl. */
  const BASE=[0x6a,0x46,0x33], TINT_K=.22, RIM_DARK=.42;
  const img = ctx.createImageData(w,h);
  const cc = Q.map(q=>{ const c=new THREE.Color(q.floor); return [c.r*255,c.g*255,c.b*255]; });
  const bw=.34, lerp=(a,b,k)=>a+(b-a)*k, sm=t=>t*t*(3-2*t);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let phi=Math.atan2(x-w/2,y-h/2); if(phi<0)phi+=Math.PI*2;
    const f=phi/(Math.PI/2), q=Math.floor(f)%4, fr=f-Math.floor(f);
    let c0=cc[q], c1=c0, k=0;
    if(fr>1-bw){ c1=cc[(q+1)%4]; k=sm((fr-(1-bw))/bw)*.5; }
    else if(fr<bw){ c0=cc[(q+3)%4]; c1=cc[q]; k=.5+sm(fr/bw)*.5; }
    const dx=(x-w/2)/(w/2), dy=(y-h/2)/(h/2);
    const rr=Math.min(1,Math.sqrt(dx*dx+dy*dy));
    const fall=1-RIM_DARK*sm(Math.max(0,(rr-.30)/.70));      // centre stays lit, rim sinks
    const grain=1+.012*Math.sin(rr*w*.12)+.022*(Math.random()-.5); // fine sanded tooth, no visible rings
    const i4=(y*w+x)*4;
    for(let c=0;c<3;c++){
      const hue=lerp(c0[c],c1[c],k);
      img.data[i4+c]=Math.max(0,Math.min(255,(BASE[c]*(1-TINT_K)+hue*TINT_K)*fall*grain));
    }
    img.data[i4+3]=255;
  }
  ctx.putImageData(img,0,0);
  // two hairline painted rings — the only graphic on the floor
  ctx.strokeStyle='rgba(255,240,214,.13)'; ctx.lineWidth=2.5;
  for(const r of [.34,.70]){ ctx.beginPath(); ctx.arc(w/2,h/2,w/2*r,0,7); ctx.stroke(); }
  ctx.strokeStyle='rgba(40,22,12,.22)'; ctx.lineWidth=1.5;
  for(const r of [.345,.705]){ ctx.beginPath(); ctx.arc(w/2,h/2,w/2*r,0,7); ctx.stroke(); }
  // subtle grain
  for(let i=0;i<2600;i++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.04)`;
    ctx.fillRect(Math.random()*w,Math.random()*h,2,2); }
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(10.6,96), mat('#fff',{map:floorTex, roughness:.9}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
scene.add(floor);
// subtle dome
{
  const pos = floor.geometry.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=pos.getY(i);
    pos.setZ(i, .25*(1-(x*x+y*y)/(10.6*10.6))); }
  floor.geometry.computeVertexNormals();
}
// striped curb ring
const curbTex = canvasTex(1024,64,(ctx,w,h)=>{ // RETHEME: matte walnut ring, subtle grain (was red/white stripes)
  ctx.fillStyle='#7a5540'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(0,0,0,.12)';
  for(let i=0;i<70;i++){ ctx.fillRect(Math.random()*w,Math.random()*h,60+Math.random()*120,1.5); }
  ctx.fillStyle='rgba(255,240,220,.10)'; ctx.fillRect(0,4,w,3);
});
curbTex.wrapS = THREE.RepeatWrapping; curbTex.repeat.x = 3;
const curb = new THREE.Mesh(new THREE.TorusGeometry(10.55,.28,12,96), mat('#fff',{map:curbTex}));
curb.rotation.x = Math.PI/2; curb.position.y = .18; curb.castShadow = true; scene.add(curb);

/* ============ B) wall band (accent colors per quadrant) ============ */
const wallTex = canvasTex(2048,256,(ctx,w,h)=>{
  const seg=w/4, blend=90;
  const grad = ctx.createLinearGradient(0,0,w,0);
  for(let q=0;q<4;q++){
    const c = Q[q].wall;
    grad.addColorStop(Math.max(0,(q*seg+blend)/w), c);
    grad.addColorStop(Math.min(1,((q+1)*seg-blend)/w), c);
  }
  grad.addColorStop(0,Q[0].wall); grad.addColorStop(1,Q[0].wall);
  ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(0,0,0,.16)'; ctx.fillRect(0,0,w,10); ctx.fillRect(0,h-10,w,10);
  for(let i=0;i<3000;i++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.03)`;
    ctx.fillRect(Math.random()*w,Math.random()*h,2,2); }
});
/* align texture u=0 with azimuth 0 (quadrant 0 spans [0, π/2]) */
wallTex.wrapS = THREE.RepeatWrapping;
const wall = new THREE.Mesh(
  new THREE.CylinderGeometry(10.9,10.9,2.6,96,1,true),
  mat('#fff',{map:wallTex, side:THREE.BackSide, roughness:.92})
);
wall.position.y = 1.3 + .18; scene.add(wall);

/* ============ marquee title boards on the fascia band (the brown bar) ============ */
const SIGNS = [
  ['CHAPTER I · ABOUT','SANSKAR SHARMA'],
  ['CHAPTER II · SELECTED WORK','CASE STUDIES'],
  ['CHAPTER III · THE JOURNEY','THE JOURNEY'],
  ['CHAPTER IV · CONNECT',"LET'S CONNECT"],
];
function drawStar5(ctx,x,y,r,color){ ctx.fillStyle=color; ctx.save(); ctx.translate(x,y); ctx.beginPath();
  for(let i=0;i<10;i++){ const rr=i%2?r*.45:r, a=i*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); }
  ctx.closePath(); ctx.fill(); ctx.restore(); }
function buildSigns(){
  SIGNS.forEach(([eyebrow,title],q)=>{
    const tex = canvasTex(2560,220,(ctx,w,h)=>{
      ctx.translate(w,0); ctx.scale(-1,1); // pre-mirror: viewed from inside (BackSide) it reads correctly
      // painted wooden board
      ctx.fillStyle='#000000'; ctx.beginPath(); ctx.roundRect(20,8,w-40,h-16,30); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=6; ctx.stroke();
      ctx.strokeStyle='#C9A15E'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.roundRect(38,20,w-76,h-40,22); ctx.stroke();
      ctx.strokeStyle='rgba(201,161,94,.45)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(48,28,w-96,h-56,18); ctx.stroke();
      // marquee bulbs along the rails
      for(let i=0;i<30;i++){
        const x=90+i*(w-180)/29;
        for(const y of [20,h-20]){
          const gl=ctx.createRadialGradient(x,y,0,x,y,12);
          gl.addColorStop(0,'rgba(255,224,150,.95)'); gl.addColorStop(.45,'rgba(255,200,110,.4)'); gl.addColorStop(1,'rgba(255,200,110,0)');
          ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(x,y,12,0,7); ctx.fill();
          ctx.fillStyle='#FFE2A0'; ctx.beginPath(); ctx.arc(x,y,3.6,0,7); ctx.fill();
        }
      }
      // end stars in the quadrant's floor color
      drawStar5(ctx,120,h/2,28,Q[q].floor); drawStar5(ctx,w-120,h/2,28,Q[q].floor);
      // eyebrow
      ctx.textAlign='center'; if('letterSpacing' in ctx) ctx.letterSpacing='9px';
      ctx.fillStyle='#D9B06C'; ctx.font='800 25px Nunito';
      ctx.fillText('★   '+eyebrow+'   ★', w/2, 62);
      if('letterSpacing' in ctx) ctx.letterSpacing='3px';
      // title — fitted
      let fs=104; ctx.font=`${fs}px "Alfa Slab One"`;
      while(ctx.measureText(title).width > w-520 && fs>56){ fs-=4; ctx.font=`${fs}px "Alfa Slab One"`; }
      ctx.fillStyle='rgba(0,0,0,.42)'; ctx.fillText(title, w/2+4, h-42);
      ctx.fillStyle='#F7EDD9'; ctx.fillText(title, w/2, h-46);
    });
    const thL=1.16;
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(11.02,11.02,1.08,48,1,true,A(q)-thL/2,thL),
      new THREE.MeshStandardMaterial({map:tex, transparent:true, side:THREE.BackSide, roughness:.85,
        emissive:'#FFDFA0', emissiveIntensity:.1, emissiveMap:tex})
    );
    m.position.y = 3.4; scene.add(m); // bottom edge y≈2.86 clears the wall top (y≈2.78)
  });
}
/* ============ SKILLS — ONE consolidated brick wall (passed between the testimonials band and Let's Connect) ============ */
/* EDIT ME — SKILLS_BY_CATEGORY: skills lay onto the wall course by course in this order; each
   category keeps a subtly different brick tone (no labels, no banner). ALL previously scattered
   bricks are REMOVED — skills exist ONLY on this wall. */
const SKILLS_BY_CATEGORY={
  'Design & Tools':['Figma','Adobe XD','Photoshop','Illustrator','After Effects','Framer','Sketch'],
  'Craft & Method':['Interaction Design','Prototyping','Wireframing','Design Systems','Responsive Design','Motion Design','Visual Design','Information Architecture'],
  'Research & Strategy':['User Research','Usability Testing','Design Thinking','Product Strategy','Journey Mapping','A/B Testing'],
  'AI & Modern':['AI Prompting','AI-Assisted Design','Design Automation','Vibe-coding','Generative UI'],
  'Foundations':['Accessibility (WCAG 2.2)','Design Ops','HTML/CSS Basics','Stakeholder Management','Cross-functional Collab'],
};
/* BRICK-WALL LAYOUT (EDIT ME): the wall spans WALL_AZ0→WALL_AZ1 end-to-end on the stretch the camera
   passes between the testimonials (az ≈4.43–5.03) and the Connect badges (az 5.48+).
   SPACING PASS: the wall now sits a full ~.72u of clear wall from the recs band (left) AND the badge
   columns (right); ROW_GAP opened so the mortar courses read comfortably, not cramped.
   TRUE RUNNING BOND: even courses lay PER_ROW full bricks; odd courses lay a HALF brick, PER_ROW-1
   full bricks, then a HALF brick — every course fills the span edge-to-edge, so the wall reads as one
   clean rectangular panel (no ragged ends, no orphan bricks). Skills flow course by course in category
   order — the per-category tone still groups them — and leftover slots become blank filler bricks. */
const WALL_AZ0=5.084, WALL_AZ1=5.449, PER_ROW=5, WALL_Y0=.52, BRICK_H=.24, ROW_GAP=.008; // ZONE: wall owns az 5.084–5.449 — recs band (ends 5.041) sits ~.45u to the left, the big empty break now lives BEFORE the recs band (ch2 plaque→cards), ~.45u before the chip columns (start 5.487). TALLER COURSES (EDIT ME): BRICK_H .2→.24 — 7 courses now top out at ≈2.26, using the empty band under the garland (sags to ≈2.30) so labels run bigger and easier to read
const CAT_TONES=[.94,.86,1.0,.78,1.06]; // per-category tint × wall color — quiet group separation
function buildSkillBricks(){
  const span=WALL_AZ1-WALL_AZ0, arc=span/PER_ROW, baseC=new THREE.Color('#A5643F');
  const flat=[]; Object.values(SKILLS_BY_CATEGORY).forEach((cat,ci)=>cat.forEach(l=>flat.push({label:l,ci})));
  /* WEATHERED BRICK FACE (EDIT ME — distress parameters): per-brick tint jitter ±7%, ~12% darker
     weathered bricks, ONE small chipped corner on ~25%, speckle grain, edge AO + caught-light top.
     Jitter amplitudes kept LOW so the courses read straight and tidy. label=null → blank filler brick. */
  const makeBrick=(az0,w,y,label,ci)=>{
    const jit=.93+Math.random()*.14, dark=Math.random()<.12?.74:1;
    const bc=baseC.clone().multiplyScalar(CAT_TONES[ci]*jit*dark);
    const face='#'+bc.getHexString(), hi='#'+bc.clone().multiplyScalar(1.18).getHexString(), lo='#'+bc.clone().multiplyScalar(.62).getHexString();
    const CW=Math.max(96,Math.round(320*w/arc)), CH=100; // canvas width tracks brick width — mortar joints stay equal; CH raised 84→100 with the taller courses
    const tex=canvasTex(CW,CH,(ctx,cw,ch)=>{
      ctx.translate(cw,0); ctx.scale(-1,1); // pre-mirror (BackSide, viewed from inside the ring)
      ctx.fillStyle='#AFA287'; ctx.fillRect(0,0,cw,ch); // mortar frame (baked — reads as the joint)
      for(let n=0;n<cw*.25;n++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.06)`;
        ctx.fillRect(Math.random()*cw,Math.random()*ch,3,3); } // crumbly mortar grain
      ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(0,ch-4,cw,4); // joint shadow under each course
      // brick body — near-straight cut with a whisper of hand-made wobble
      const m0=9, J=()=>Math.random()*2-1; // SPACING PASS: m0 9 = thicker baked mortar joint between bricks
      ctx.beginPath(); ctx.moveTo(m0+J(),m0+J());
      for(let x=40;x<=cw-m0;x+=40) ctx.lineTo(Math.min(x,cw-m0)+J(),m0+J());
      for(let yy=28;yy<=ch-m0;yy+=28) ctx.lineTo(cw-m0+J(),Math.min(yy,ch-m0)+J());
      for(let x=cw-40;x>=m0;x-=40) ctx.lineTo(Math.max(x,m0)+J(),ch-m0+J());
      for(let yy=ch-28;yy>=m0;yy-=28) ctx.lineTo(m0+J(),Math.max(yy,m0)+J());
      ctx.closePath(); ctx.fillStyle=face; ctx.fill();
      if(Math.random()<.25){ // one small chipped corner — mortar tone bites into the brick
        const cx=Math.random()<.5?m0:cw-m0, cy=Math.random()<.5?m0:ch-m0;
        const cwd=(8+Math.random()*10)*(cx<cw/2?1:-1), chd=(5+Math.random()*7)*(cy<ch/2?1:-1);
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+cwd,cy); ctx.lineTo(cx,cy+chd); ctx.closePath();
        ctx.fillStyle='#C9BCA2'; ctx.fill(); }
      for(let n=0;n<cw*.7;n++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.05)`;
        ctx.fillRect(m0+Math.random()*(cw-2*m0),m0+Math.random()*(ch-2*m0),2,2); } // speckle grain
      for(let n=0;n<3;n++){ ctx.fillStyle=Math.random()<.5?lo:hi; ctx.globalAlpha=.09;
        ctx.beginPath(); ctx.ellipse(m0+Math.random()*(cw-2*m0),m0+Math.random()*(ch-2*m0),8+Math.random()*18,4+Math.random()*7,Math.random()*3,0,7); ctx.fill(); ctx.globalAlpha=1; }
      // depth: edge AO into the mortar line + caught light along the top
      ctx.strokeStyle='rgba(0,0,0,.30)'; ctx.lineWidth=6; ctx.strokeRect(m0+2,m0+2,cw-2*m0-4,ch-2*m0-4);
      ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(m0+4,m0+5); ctx.lineTo(cw-m0-4,m0+5); ctx.stroke();
      if(label){ // engraved skill — soft inset patch keeps it legible on the rough face
        ctx.fillStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.roundRect(cw*.07,ch*.22,cw*.86,ch*.58,9); ctx.fill();
        ctx.textAlign='center';
        let fs=36; ctx.font=`800 ${fs}px Nunito`; // BIGGER LABELS (EDIT ME): 27→36 to match the taller brick face
        while(ctx.measureText(label).width>cw-38 && fs>14){ fs--; ctx.font=`800 ${fs}px Nunito`; }
        ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillText(label,cw/2+1.5,ch/2+fs*.36+1.5); // debossed shadow
        ctx.fillStyle='rgba(247,237,217,.96)'; ctx.fillText(label,cw/2,ch/2+fs*.36);
      }
    });
    const g=new THREE.Group(); scene.add(g);
    const rad=10.883-Math.random()*.005; // near-flush courses — only a hair of unevenness catches light
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,BRICK_H,10,1,true,az0+.0008,w-.0016), // bricks butt together; canvas margin = mortar
      new THREE.MeshStandardMaterial({map:tex, side:THREE.BackSide, roughness:.96, bumpMap:tex, bumpScale:.012}));
    m.position.y=y; m.userData={type:'brick', group:g, noLift:true};
    if(label===SECRET_BRICK_LABEL){ // THE SECRET BRICK (EGG) — no marker; click flips it to reveal SECRET_FACT
      m.userData.secret=true; m.userData.baseTex=tex;
      m.userData.factTex=canvasTex(320,100,(ctx,cw,ch)=>{ // matches the taller brick canvas
        ctx.translate(cw,0); ctx.scale(-1,1);
        ctx.fillStyle=face; ctx.fillRect(0,0,cw,ch);
        ctx.strokeStyle='rgba(194,90,46,.7)'; ctx.lineWidth=4; ctx.strokeRect(2,2,cw-4,ch-4);
        ctx.fillStyle='#7a5a3a'; ctx.font='800 16px Nunito'; ctx.textAlign='center'; // palette-matched brown (was a one-off orange-brown)
        wrapText(ctx,SECRET_FACT,cw/2,ch/2-10,cw-26,19);
      });
    }
    g.add(m); if(label) clickables.push(m); // labeled bricks hover/pop; fillers stay inert masonry
  };
  let idx=0,row=0;
  while(idx<flat.length){
    const odd=row%2, y=WALL_Y0+row*(BRICK_H+ROW_GAP)+BRICK_H/2;
    const fillCi=()=>flat[Math.min(idx,flat.length-1)].ci; // fillers borrow the neighboring category tone
    if(odd) makeBrick(WALL_AZ0, arc*.5, y, null, fillCi()); // leading half brick — squares the course end
    for(let k=0;k<PER_ROW-odd;k++){
      const s=idx<flat.length? flat[idx++]:null;
      makeBrick(WALL_AZ0+odd*arc*.5+k*arc, arc, y, s?s.label:null, s?s.ci:fillCi());
    }
    if(odd) makeBrick(WALL_AZ1-arc*.5, arc*.5, y, null, fillCi()); // trailing half brick
    row++;
  }
  // (mortar is baked into each brick's canvas margin; half bricks square off the bond — no backing mesh)
}
/* ============ LIFE PROPS — lived-in set dressing around the floor (ambient, additive only) ============
   VIGNETTES (EDIT ME — azimuth/radius per cluster):
   · cozy corner (rug + chair + side table + laptop + plant + mug + books + globe + speaker) az .55 r 6.3
   · camera-on-tripod + small plant az 3.35 r 6.4 · gym mat (dumbbells + kettlebell) az 4.35 r 8.9
   · "Fluffy" framed portrait leaning on the curb az 3.05 r 10.15
   SAFE ZONES respected: character ring r7.8 + intro walk radial (az ≈ -0.2), camera orbit r≤3.7 and the
   Chapter II dolly lanes (az 1.94–2.78, r≤5.9), Chapter IV set (bike/vinyl/plane 5.1–6.3), stages, pedestal. */
const FLUFFY_LABEL='Fluffy';           // EDIT ME — pet portrait caption
const FLUFFY_SRC='/images/fluffy.jpg'; // EDIT ME — art for the leaning frame (blank = painted cat placeholder)
const lifeProps={};
function buildLifeProps(){
  const fy=r=>.25*(1-(r*r)/(10.6*10.6)); // floor dome height at radius r
  const wood=mat('#5a4632',{roughness:.7}), woodL=mat('#7a5540',{roughness:.75}),
        cream=mat('#F3E2C2',{roughness:.85}), dark=mat('#2B2622',{roughness:.6}),
        accent=mat('#C25A2E',{roughness:.6}), leaf=mat('#7BA05B',{roughness:.8});
  const shadow=(parent,r,x=0,z=0)=>{ const s=new THREE.Mesh(new THREE.CircleGeometry(r,18),
    new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.16,depthWrite:false}));
    s.rotation.x=-Math.PI/2; s.position.set(x,.012,z); parent.add(s); };
  const plantAt=(parent,x,z,s)=>{ const p=new THREE.Group(); p.position.set(x,0,z); p.scale.setScalar(s); parent.add(p);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.13,.10,.2,12), accent); pot.position.y=.1; pot.castShadow=true; p.add(pot);
    const lv=new THREE.Group(); lv.position.y=.22; p.add(lv);
    for(let i=0;i<5;i++){ const l=new THREE.Mesh(new THREE.SphereGeometry(.085,10,8), leaf);
      const a2=i/5*Math.PI*2; l.position.set(Math.cos(a2)*.07,.06+(i%2)*.07,Math.sin(a2)*.07);
      l.scale.set(.6,1.25,.6); l.rotation.z=Math.cos(a2)*.4; l.rotation.x=Math.sin(a2)*.4; lv.add(l); }
    shadow(p,.16); return lv; };
  // — cozy corner —
  const cz=new THREE.Group(); cz.position.copy(polar(.55,6.3,fy(6.3))); cz.rotation.y=.55; scene.add(cz);
  const rug=new THREE.Mesh(new THREE.CircleGeometry(1.15,26), mat('#a8593a',{roughness:.95}));
  rug.rotation.x=-Math.PI/2; rug.position.y=.008; cz.add(rug);
  const rugRing=new THREE.Mesh(new THREE.RingGeometry(.85,.95,26), cream);
  rugRing.rotation.x=-Math.PI/2; rugRing.position.y=.012; cz.add(rugRing);
  const tbl=new THREE.Group(); tbl.position.set(.15,-0,-.1); cz.add(tbl);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.045,20), woodL); top.position.y=.5; top.castShadow=true; tbl.add(top);
  for(let i=0;i<3;i++){ const a2=i/3*Math.PI*2+.5; const leg=new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.5,8), wood);
    leg.position.set(Math.cos(a2)*.3,.25,Math.sin(a2)*.3); tbl.add(leg); }
  shadow(tbl,.44);
  const lap=new THREE.Group(); lap.position.set(.1,.525,.06); lap.rotation.y=-.5; tbl.add(lap); // laptop, screen ajar
  lap.add(new THREE.Mesh(new THREE.BoxGeometry(.3,.016,.2), dark));
  const scr=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.012), dark); scr.position.set(0,.09,-.135); scr.rotation.x=-.42; lap.add(scr);
  // EGG: the screen shows a "currently designing…" status that rotates each page load (LAPTOP_STATUSES)
  const scrTex=canvasTex(256,160,(ctx,w,h)=>{
    ctx.fillStyle='#18222b'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#8fb6cf'; ctx.font='800 15px Nunito'; ctx.textAlign='left';
    ctx.fillText('currently designing…',16,44);
    ctx.fillStyle='#F3E2C2'; ctx.font='800 20px Nunito';
    wrapText(ctx,LAPTOP_STATUSES[Math.floor(Math.random()*LAPTOP_STATUSES.length)],16,80,w-30,26);
    ctx.fillStyle='rgba(143,182,207,.4)'; for(let i=0;i<3;i++) ctx.fillRect(16,120+i*10,60+i*40,3);
  });
  const glowM=new THREE.MeshStandardMaterial({map:scrTex, color:'#9aa8b2', emissive:'#fff', emissiveMap:scrTex, emissiveIntensity:.55, roughness:.4});
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(.27,.17), glowM); glow.position.set(0,.09,-.128); glow.rotation.x=-.42; lap.add(glow);
  const mug=new THREE.Mesh(new THREE.CylinderGeometry(.032,.028,.06,10), accent); mug.position.set(-.24,.53,.12); tbl.add(mug);
  const chair=new THREE.Group(); chair.position.set(-.62,0,.4); chair.rotation.y=-2.3; cz.add(chair); // casually angled
  const seat=new THREE.Mesh(new THREE.BoxGeometry(.42,.05,.42), woodL); seat.position.y=.44; seat.castShadow=true; chair.add(seat);
  const cush=new THREE.Mesh(new THREE.BoxGeometry(.38,.04,.38), cream); cush.position.y=.485; chair.add(cush);
  const back=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.04), woodL); back.position.set(0,.66,-.21); back.rotation.x=.12; chair.add(back);
  for(const [dx,dz] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.02,.022,.44,8), wood); leg.position.set(dx,.22,dz); chair.add(leg); }
  shadow(chair,.34);
  const bks=new THREE.Group(); bks.position.set(-.14,0,-.62); cz.add(bks); // book stack + globe
  ['#1F5E5B','#C25A2E','#E5A83B'].forEach((c,i)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(.3-.03*i,.045,.22), mat(c,{roughness:.8}));
    b.position.y=.025+.047*i; b.rotation.y=(i-1)*.35; bks.add(b); });
  const gStand=new THREE.Mesh(new THREE.CylinderGeometry(.02,.05,.08,10), dark); gStand.position.set(0,.18,0); bks.add(gStand);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12), mat('#5B84A0',{roughness:.55}));
  globe.position.set(0,.3,0); globe.rotation.z=.35; globe.castShadow=true; bks.add(globe);
  globe.userData={type:'egg-globe', group:bks, noLift:true}; clickables.push(globe); // EGG: click → spin + pin
  const pinG=new THREE.Group(); pinG.rotation.order='YXZ'; pinG.rotation.y=GLOBE_PIN[1]; pinG.rotation.x=-GLOBE_PIN[0]; globe.add(pinG);
  const pinDot=new THREE.Mesh(new THREE.SphereGeometry(.014,8,8),
    new THREE.MeshStandardMaterial({color:'#FFD35A', emissive:'#FFB84A', emissiveIntensity:.5}));
  pinDot.position.z=.135; pinDot.visible=false; pinG.add(pinDot);
  lifeProps.globe=globe; lifeProps.globePin=pinDot;
  for(let i=0;i<7;i++){ const land=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), leaf);
    land.position.set(0,.3,0).add(polar(i*1.9,.115,(i%3-1)*.05)); land.scale.set(1,.7,.35); bks.add(land); }
  shadow(bks,.2);
  const spk=new THREE.Mesh(new THREE.BoxGeometry(.2,.32,.18), dark); spk.position.set(.62,.16,.58); spk.rotation.y=.5; spk.castShadow=true; cz.add(spk);
  for(const dy of [.06,-.05]){ const grill=new THREE.Mesh(new THREE.CircleGeometry(dy>0?.055:.035,14), cream);
    grill.position.set(0,dy,.092); spk.add(grill); }
  lifeProps.plantA=plantAt(cz,.62,-.62,1);
  // — tripod + camera —
  const tp=new THREE.Group(); tp.position.copy(polar(3.35,6.4,fy(6.4))); tp.rotation.y=3.35+.4; scene.add(tp);
  for(let i=0;i<3;i++){ const a2=i/3*Math.PI*2; const leg=new THREE.Mesh(new THREE.CylinderGeometry(.016,.02,1.05,8), dark);
    leg.position.set(Math.cos(a2)*.19,.5,Math.sin(a2)*.19); leg.rotation.z=Math.cos(a2)*.36; leg.rotation.x=-Math.sin(a2)*.36; tp.add(leg); }
  const cam2=new THREE.Mesh(new THREE.BoxGeometry(.22,.15,.12), dark); cam2.position.y=1.08; cam2.castShadow=true; tp.add(cam2);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.05,.055,.1,12), mat('#9aa4ac',{metalness:.5,roughness:.35}));
  lens.rotation.x=Math.PI/2; lens.position.set(0,1.08,.1); tp.add(lens);
  shadow(tp,.3); lifeProps.plantB=plantAt(tp,.5,.35,.6);
  // — gym corner —
  const gym=new THREE.Group(); gym.position.copy(polar(4.35,8.9,fy(8.9))); gym.rotation.y=4.35; scene.add(gym);
  const gmat=new THREE.Mesh(new THREE.BoxGeometry(1.1,.03,.6), mat('#1F4E4A',{roughness:.95})); gmat.position.y=.02; gym.add(gmat); // deep circus teal (was an off-palette slate blue)
  let firstDb=null;
  for(const [dz,ry] of [[-.14,.2],[.12,-.35]]){ const db=new THREE.Group(); db.position.set(-.2,.09,dz); db.rotation.y=ry; gym.add(db);
    db.add(new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.3,8), mat('#9aa4ac',{metalness:.6,roughness:.3})));
    db.rotation.z=Math.PI/2;
    for(const dy of [-.13,.13]){ const w2=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.05,12), dark);
      w2.position.y=dy; db.add(w2); }
    if(!firstDb) firstDb=db; }
  const kb=new THREE.Mesh(new THREE.SphereGeometry(.09,14,10), dark); kb.position.set(.3,.09,.05); kb.castShadow=true; gym.add(kb);
  const kbh=new THREE.Mesh(new THREE.TorusGeometry(.055,.016,8,14,Math.PI), accent); kbh.position.set(.3,.17,.05); gym.add(kbh);
  shadow(gym,.55);
  lifeProps.gymDb=firstDb; // the dumbbell the character "picks up" during the exercise mini-game
  // EXERCISE PROMPT — circular in-world invite floating over the gym mat; fades in when the character is near
  const exTex=canvasTex(256,256,(ctx,w,h)=>{
    ctx.fillStyle='rgba(232,120,90,.96)'; ctx.beginPath(); ctx.arc(w/2,h/2,w*.44,0,7); ctx.fill();
    ctx.strokeStyle='#F7EDD9'; ctx.lineWidth=6; ctx.setLineDash([12,9]); ctx.beginPath(); ctx.arc(w/2,h/2,w*.38,0,7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#F7EDD9'; ctx.textAlign='center'; ctx.font='800 30px Nunito';
    const words=EXERCISE_LABEL.split(' ');
    words.forEach((wd,i)=>ctx.fillText(wd, w/2, h/2 - (words.length-1)*17 + i*34 + 10));
  });
  const exM=new THREE.MeshBasicMaterial({map:exTex, transparent:true, opacity:0, depthWrite:false});
  const exMesh=new THREE.Mesh(new THREE.CircleGeometry(.36,32), exM);
  exMesh.userData={type:'exercise', group:new THREE.Group(), noLift:true};
  // CATCHY RING (EDIT ME — colors/speed): festive segmented ring that spins around the invite,
  // circus palette segments with tiny bulb dots between them — the spin is what pulls the eye.
  const ringTex=canvasTex(256,256,(ctx,w,h)=>{
    const COLS=['#F4B942','#C25A2E','#3E8E7E','#F7EDD9','#E8785A','#7B5EA7'];
    const R=w*.465, SEGS=COLS.length*2, gap=.05;
    ctx.lineWidth=13; ctx.lineCap='round';
    for(let i=0;i<SEGS;i++){ const a0=(i/SEGS)*Math.PI*2;
      ctx.strokeStyle=COLS[i%COLS.length];
      ctx.beginPath(); ctx.arc(w/2,h/2,R,a0+gap,a0+(Math.PI*2)/SEGS-gap); ctx.stroke(); }
    for(let i=0;i<SEGS;i++){ const a=(i/SEGS)*Math.PI*2; // little marquee bulbs at the joints
      ctx.fillStyle='#FFE9B0'; ctx.beginPath();
      ctx.arc(w/2+Math.cos(a)*R, h/2+Math.sin(a)*R, 5.5, 0, 7); ctx.fill(); }
  });
  const exRingM=new THREE.MeshBasicMaterial({map:ringTex, transparent:true, opacity:0, depthWrite:false});
  const exRing=new THREE.Mesh(new THREE.PlaneGeometry(1.06,1.06), exRingM); exRing.position.z=-.005; // just behind the disc
  const exG=new THREE.Group(); exG.add(exRing); exG.add(exMesh); exG.position.copy(polar(4.35,8.55,fy(8.55)+.95)); exG.visible=false;
  scene.add(exG); clickables.push(exMesh);
  lifeProps.exercise={g:exG, m:exM, ring:exRing, ringM:exRingM};
  // — "Fluffy" — framed pet portrait leaning on the curb —
  const fl=new THREE.Group(); fl.position.copy(polar(3.05,10.15,fy(10.15))); fl.rotation.y=3.05+Math.PI; fl.rotation.x=-.22; scene.add(fl);
  /* FRAME SHAPE (EDIT ME): re-proportioned from the near-square pet portrait to a 2:3 poster so
     the art fits edge to edge instead of being centre-cropped. Canvas .56×.785 ≈ the source's
     384×538; the wood keeps a ~.05 border all round. */
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.66,.885,.04), woodL); frame.position.y=.45; frame.castShadow=true; fl.add(frame);
  const art=canvasTex(256,358,(ctx,w,h)=>{
    ctx.fillStyle='#F3E2C2'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#E8C9A0'; ctx.fillRect(14,14,w-28,h-28);
    ctx.fillStyle='#8a5a3a'; ctx.beginPath(); ctx.ellipse(w/2,h*.48,52,46,0,0,7); ctx.fill(); // Fluffy the cat
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(w/2+s*24,h*.34); ctx.lineTo(w/2+s*44,h*.2); ctx.lineTo(w/2+s*8,h*.26); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.ellipse(w/2,h*.56,24,18,0,0,7); ctx.fill();
    ctx.fillStyle='#2B2622';
    ctx.beginPath(); ctx.arc(w/2-18,h*.45,4.5,0,7); ctx.arc(w/2+18,h*.45,4.5,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(w/2,h*.54,3.5,0,7); ctx.fill();
    ctx.strokeStyle='#2B2622'; ctx.lineWidth=2;
    for(const s of [-1,1]) for(const dy of [-3,3]){ ctx.beginPath(); ctx.moveTo(w/2+s*10,h*.55+dy);
      ctx.lineTo(w/2+s*40,h*.53+dy*2); ctx.stroke(); }
    ctx.fillStyle='#7a5a3a'; ctx.font='italic 800 26px Nunito'; ctx.textAlign='center';
    ctx.fillText(FLUFFY_LABEL, w/2, h-24);
  });
  const canv=new THREE.Mesh(new THREE.PlaneGeometry(.56,.785),
    new THREE.MeshStandardMaterial({map:art, roughness:.85}));
  canv.position.set(0,.45,.025); fl.add(canv);
  canv.userData={type:'egg-fluffy', group:fl, noLift:true}; clickables.push(canv); // EGG: hover → slow wink
  /* The tracking pupils + blink lid only make sense on the painted cat. With real art in the
     frame they'd float on top of it as stray dots, so they're built but hidden, and the
     eye-follow / wink handlers are left un-wired (lifeProps.fluffy stays null). Clear
     FLUFFY_SRC and they come straight back. */
  const fpup=[];
  for(const s of [-1,1]){ const pu=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6), mat('#141210'));
    pu.position.set(s*.0394,.483,.036); pu.userData={bx:s*.0394,by:.483}; pu.visible=!FLUFFY_SRC; fl.add(pu); fpup.push(pu); }
  const flid=new THREE.Mesh(new THREE.PlaneGeometry(.034,.028), mat('#8a5a3a',{roughness:.85}));
  flid.position.set(-.0394,.486,.037); flid.scale.y=.01; flid.visible=!FLUFFY_SRC; fl.add(flid);
  if(!FLUFFY_SRC) lifeProps.fluffy={pupils:fpup, lid:flid};
  if(FLUFFY_SRC){ const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>{ const c=art.image,ctx=c.getContext('2d');
      const s2=Math.max((c.width-28)/img.width,(c.height-28)/img.height);
      ctx.save(); ctx.beginPath(); ctx.rect(14,14,c.width-28,c.height-28); ctx.clip();
      ctx.drawImage(img,14+((c.width-28)-img.width*s2)/2,14+((c.height-28)-img.height*s2)/2,img.width*s2,img.height*s2);
      ctx.restore(); art.needsUpdate=true; };
    img.src=FLUFFY_SRC; }
  lifeProps.glowM=glowM;
  // — COMPUTER DESK SETUP (Chapter IV · Let's Connect) —
  // EDIT ME: DESK_AZ / DESK_R = position · DESK_SCREEN_LABEL = monitor text (swap the canvas draw for an image texture to show real work)
  // SAFE ZONE: r6.4 sits between the camera orbit (r≤3.7) and the character ring (r7.8); the Ch.IV bike/vinyl/plane set is r8.5+;
  // recs band / badges are wall-mounted — no overlap, and az 5.0 keeps the walk path + sightlines clear.
  const DESK_AZ=5.68, DESK_R=8.45, DESK_SCREEN_LABEL='ready to collaborate?';
  const dk=new THREE.Group(); dk.position.copy(polar(DESK_AZ,DESK_R,fy(DESK_R))); dk.rotation.y=DESK_AZ+Math.PI; scene.add(dk);
  const dTop=new THREE.Mesh(new THREE.BoxGeometry(.92,.04,.46), woodL); dTop.position.y=.58; dTop.castShadow=true; dk.add(dTop);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.58,8), wood);
    leg.position.set(sx*.4,.29,sz*.17); dk.add(leg); }
  shadow(dk,.52); shadow(dk,.2,.1,.55);
  const mBase=new THREE.Mesh(new THREE.BoxGeometry(.16,.018,.1), dark); mBase.position.set(.06,.61,-.13); dk.add(mBase);
  const mNeck=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.12,8), dark); mNeck.position.set(.06,.67,-.14); dk.add(mNeck);
  const mScr=new THREE.Mesh(new THREE.BoxGeometry(.44,.27,.022), dark); mScr.position.set(.06,.81,-.14); mScr.castShadow=true; dk.add(mScr);
  const dScrTex=canvasTex(256,160,(ctx,w,h)=>{ // EDIT ME — monitor screen: redraw or drop an image here
    ctx.fillStyle='#141c22'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#8FB6CF'; ctx.font='700 20px Nunito'; ctx.textAlign='center';
    ctx.fillText(DESK_SCREEN_LABEL, w/2, h/2-6);
    ctx.fillStyle='rgba(143,182,207,.4)'; for(let i=0;i<3;i++) ctx.fillRect(48,h/2+18+i*12,160-i*40,4);
  });
  const dGlowM=new THREE.MeshStandardMaterial({map:dScrTex, color:'#9aa8b2', emissive:'#fff', emissiveMap:dScrTex, emissiveIntensity:.5, roughness:.4});
  const dGlow=new THREE.Mesh(new THREE.PlaneGeometry(.41,.24), dGlowM); dGlow.position.set(.06,.81,-.128); dk.add(dGlow);
  const kbd=new THREE.Mesh(new THREE.BoxGeometry(.28,.016,.1), cream); kbd.position.set(.08,.61,.06); kbd.rotation.y=.05; dk.add(kbd);
  const mouse=new THREE.Mesh(new THREE.SphereGeometry(.024,10,8), dark); mouse.scale.set(1,.65,1.35); mouse.position.set(.3,.612,.08); dk.add(mouse);
  const dMug=new THREE.Mesh(new THREE.CylinderGeometry(.03,.027,.055,10), accent); dMug.position.set(.4,.63,-.08); dk.add(dMug);
  for(let i=0;i<3;i++){ const bku=new THREE.Mesh(new THREE.BoxGeometry(.16-i*.02,.028,.11), [accent,cream,leaf][i]);
    bku.position.set(-.36,.615+i*.03,-.13); bku.rotation.y=(i-1)*.14; dk.add(bku); }
  const lampG=new THREE.Group(); lampG.position.set(.42,.6,-.16); dk.add(lampG); // soft desk lamp
  const lArm=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.24,6), dark); lArm.rotation.z=.45; lArm.position.set(-.05,.11,0); lampG.add(lArm);
  const lShade=new THREE.Mesh(new THREE.ConeGeometry(.045,.06,12,1,true), accent); lShade.rotation.z=2.4; lShade.position.set(-.12,.22,0); lampG.add(lShade);
  const lBulb=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),
    new THREE.MeshStandardMaterial({color:'#FFF2D8', emissive:'#FFD9A0', emissiveIntensity:.8})); lBulb.position.set(-.13,.21,0); lampG.add(lBulb);
  const dch=new THREE.Group(); dch.position.set(.62,0,.3); dch.rotation.y=2.2; dk.add(dch); // desk chair, casually angled beside
  const dSeat=new THREE.Mesh(new THREE.BoxGeometry(.3,.03,.3), accent); dSeat.position.y=.32; dSeat.castShadow=true; dch.add(dSeat);
  const dBack=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.03), accent); dBack.position.set(0,.48,-.15); dch.add(dBack);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const l3=new THREE.Mesh(new THREE.CylinderGeometry(.012,.015,.32,8), wood);
    l3.position.set(sx*.12,.16,sz*.12); dch.add(l3); }
  shadow(dch,.22);
  plantAt(dk,-.72,.3,.75);
  dk.updateMatrixWorld(true);
  const dSit=dk.localToWorld(new THREE.Vector3(-.3,.6,.06));   // cat's landing spot on the desktop (left of keyboard)
  lifeProps.desk={g:dk, glow:dGlowM, sit:dSit, front:polar(DESK_AZ,DESK_R-.62,fy(DESK_R-.62)),
    exit:polar(DESK_AZ,6.9,fy(6.9)), exitAz:DESK_AZ, sitYaw:DESK_AZ+Math.PI/2}; // sitYaw = face arena center
  // — THE CAT — wanders a gentle loop at r 6.9 (past the plant, around the chair) —
  const cg=new THREE.Group(); scene.add(cg);
  const cbody=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.16,4,10), mat('#3a3632',{roughness:.8}));
  cbody.rotation.z=Math.PI/2; cbody.position.y=.12; cbody.castShadow=true; cg.add(cbody);
  cbody.userData={type:'egg-cat', group:cg, noLift:true}; clickables.push(cbody); // EGG: 1 click = pause, 3 = nap
  const chead=new THREE.Group(); chead.position.set(.13,.17,0); cg.add(chead);
  chead.add(new THREE.Mesh(new THREE.SphereGeometry(.055,12,10), mat('#3a3632',{roughness:.8})));
  const muzz=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6), cream); muzz.position.set(.04,-.01,0); chead.add(muzz);
  for(const s of [-1,1]){ const ear=new THREE.Mesh(new THREE.ConeGeometry(.018,.035,6), mat('#3a3632'));
    ear.position.set(-.005,.055,s*.03); chead.add(ear); }
  const ctail=new THREE.Group(); ctail.position.set(-.13,.16,0); cg.add(ctail);
  const tl2=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.14,3,6), mat('#3a3632'));
  tl2.rotation.z=-.9; tl2.position.set(-.05,.05,0); ctail.add(tl2);
  const clegs=[];
  for(const [dx,dz] of [[.08,.035],[.08,-.035],[-.08,.035],[-.08,-.035]]){
    const lg2=new THREE.Group(); lg2.position.set(dx,.09,dz); cg.add(lg2);
    const l3=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.09,6), mat('#3a3632')); l3.position.y=-.045; lg2.add(l3);
    clegs.push(lg2); }
  shadow(cg,.14);
  lifeProps.cat={g:cg, head:chead, tail:ctail, legs:clegs, az:1.2, lookK:0};
  window.__life=lifeProps; // debug handle
}
const buildPainted = ()=>{ buildSigns(); buildAboutExtras(); buildCaseStages(); buildJourney(); buildRecsBand(); buildConnectExtras(); buildSkillBricks(); buildLifeProps(); };
/* Canvas text bakes into a texture ONCE, so a face that is still loading when a
   texture is painted gets a system-font fallback baked in permanently. The old
   list awaited two faces but the canvases draw in five — italic 400 (testimonial
   quotes, chapter captions) and 700 (card blurbs) were routinely missed. Await
   everything the canvases actually use. */
const painted = Promise.all([
  '400 16px "Alfa Slab One"',
  '400 16px Nunito', '700 16px Nunito', '800 16px Nunito', 'italic 400 16px Nunito',
].map(f => document.fonts.load(f).catch(()=>{})))
  .then(buildPainted, buildPainted);

/* ============ B) seating tiers + audience ============ */
const bgGroup=new THREE.Group(); scene.add(bgGroup); // FAR parallax layer — seating bowl + audience lag the camera a touch (see cinematic pass)
const tierColors = ['#6B4A38','#7d5a44','#8f6a50'];
for(let t=0;t<3;t++){
  const rIn = 11.15 + t*1.15, yTop = 2.95 + t*.85;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(rIn,rIn,.85,96,1,true), mat(tierColors[t],{side:THREE.DoubleSide}));
  side.position.y = yTop-.42; bgGroup.add(side);
  const seat = new THREE.Mesh(new THREE.RingGeometry(rIn,rIn+1.25,96), mat(tierColors[t]));
  seat.rotation.x = -Math.PI/2; seat.position.y = yTop; bgGroup.add(seat);
}
// audience — instanced capsules + heads
const N_AUD = 110;
const audBody = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.16,.3,3,8), mat('#888'), N_AUD);
const audHead = new THREE.InstancedMesh(new THREE.SphereGeometry(.11,8,8), mat('#E8C9A0'), N_AUD);
const audCols = ['#C0392B','#E5A83B','#1F5E5B','#4A2E52','#7BA05B','#5B84A0','#E8785A','#F0E3C8'];
{
  const m = new THREE.Matrix4(), col = new THREE.Color();
  for(let i=0;i<N_AUD;i++){
    const q = Math.floor(Math.random()*4);
    // keep gaps in front of each quadrant center (content zone ±0.32 rad)
    let ang;
    do{ ang = q*Math.PI/2 + Math.random()*Math.PI/2; } while(Math.abs(((ang-A(q))+Math.PI)%(2*Math.PI)-Math.PI) < .34);
    const t = Math.floor(Math.random()*3), r = 11.35+t*1.15, y = 3.25+t*.85;
    const p = polar(ang,r,y);
    m.makeTranslation(p.x,p.y,p.z); audBody.setMatrixAt(i,m);
    m.makeTranslation(p.x,p.y+.34,p.z); audHead.setMatrixAt(i,m);
    audBody.setColorAt(i, col.set(audCols[i%audCols.length]).offsetHSL(0,-.08,(Math.random()-.5)*.08));
  }
  scene.add(audBody,audHead); bgGroup.add(audBody,audHead); // audience rides the far parallax layer
}

/* ============ C) big-top cone + valance + pole ============ */
const coneTex = canvasTex(1024,512,(ctx,w,h)=>{ // RETHEME: soft canopy/skylight instead of tent stripes
  const g2=ctx.createLinearGradient(0,0,0,h);
  g2.addColorStop(0,'#FFF6E6'); g2.addColorStop(1,'#EFE0C8');
  ctx.fillStyle=g2; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(122,90,60,.10)'; // faint structural ribs
  for(let i=0;i<20;i++) ctx.fillRect(i*w/20-1.5,0,3,h);
  ctx.fillStyle='rgba(0,0,0,.05)';
  for(let i=0;i<1400;i++){ ctx.fillRect(Math.random()*w,Math.random()*h,2,2); }
});
coneTex.wrapS = THREE.RepeatWrapping;
const cone = new THREE.Mesh(
  new THREE.ConeGeometry(14.6, 8.4, 64, 1, true),
  mat('#fff',{map:coneTex, side:THREE.DoubleSide, transparent:true, opacity:.98,
    emissive:'#FFE9C8', emissiveIntensity:.28, roughness:.95})
);
cone.position.y = 5.2 + 4.2; scene.add(cone);
// slim fascia ring where the canopy meets the walls (was the scalloped valance)
{
  const fascia = new THREE.Mesh(new THREE.TorusGeometry(14.32,.09,10,96), mat('#4A3020',{roughness:.6}));
  fascia.rotation.x = Math.PI/2; fascia.position.y = 5.25; scene.add(fascia);
}
// soft skylight cap at the peak (was the pennant flag)
{
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.5,20,14,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:'#FFF6E6', emissive:'#FFE9C8', emissiveIntensity:.85, roughness:.4}));
  cap.position.y = 13.35; scene.add(cap);
}
// center pole + rig removed

/* ============ lighting ============ */
scene.add(new THREE.AmbientLight('#FFD9B0', .75));
scene.add(new THREE.HemisphereLight('#FFE2BC','#4a2a1c', .65));
const spot = new THREE.SpotLight('#FFE7C2', 260, 45, .5, .7, 2);
spot.position.set(0,11,0); spot.castShadow = true;
spot.shadow.mapSize.set(1024,1024); spot.shadow.bias = -.0004;
scene.add(spot, spot.target);
const peak = new THREE.PointLight('#FFB973', 50, 26, 1.8); peak.position.set(0,9.4,0); scene.add(peak);
const rim1 = new THREE.PointLight('#FF9A6A', 80, 26, 1.9); rim1.position.set(9,5,9); scene.add(rim1);
const rim2 = new THREE.PointLight('#6AA8CC', 70, 26, 1.9); rim2.position.set(-9,5,-9); scene.add(rim2);
// Act II stage spotlight — snaps onto the focused case study card
const stageSpot = new THREE.SpotLight('#FFEFD0', 0, 26, .36, .5, 1.7);
scene.add(stageSpot, stageSpot.target);

/* ============ string lights ============ */
const N_STR=22, BULB=8, N_BULB=N_STR*BULB;
const bulbs = new THREE.InstancedMesh(
  new THREE.SphereGeometry(.055,8,8),
  new THREE.MeshBasicMaterial({color:'#FFE8C8', toneMapped:false}), N_BULB); // softer, smaller modern bulbs
const bulbPhase = new Float32Array(N_BULB);
{
  const m=new THREE.Matrix4(), col=new THREE.Color(); let k=0;
  for(let s=0;s<N_STR;s++){
    const a0=(s/N_STR)*Math.PI*2, a1=((s+1)/N_STR)*Math.PI*2;
    for(let b=0;b<BULB;b++){
      const t=(b+.5)/BULB, ang=a0+(a1-a0)*t;
      const sag = Math.sin(t*Math.PI)*.42;   // garlands draped across the wall face
      const p = polar(ang, 10.45, 2.72-sag);
      m.makeTranslation(p.x,p.y,p.z); bulbs.setMatrixAt(k,m);
      bulbPhase[k]=Math.random()*6.28; bulbs.setColorAt(k,col.set('#FFE8C8')); k++;
    }
  }
  scene.add(bulbs);
}

/* ============ THE CHARACTER — stylized Sanskar (ported from the shared fullbody design) ============
   The model (pinstriped shirt, chinos, beard, wavy hair) is re-hung on animated joints so the walk,
   idle stand, presenting and per-act outfit color changes all drive it.
   EDIT ME: palette + HEIGHT below. */
const SKIN_TONE='#d08d64', HAIR_COLOR='#2b1c15', BEARD_COLOR='#33221a', HEIGHT=1.7;
/* EDIT ME — OUTFIT COLOR MAPPING (per act: ABOUT, CASE STUDIES, JOURNEY, CONNECT).
   top = shirt, pants = chinos, shoes; pinstripes/placket stay cream. */
const OUTFITS=[
  {top:'#c4757c', pants:'#4c4952', shoes:'#ece8e0'},  // casual creative — the original rose shirt
  {top:'#5B84A0', pants:'#33424E', shoes:'#ece8e0'},  // presenting — steel blue
  {top:'#7BA05B', pants:'#4A4238', shoes:'#d8c9a8'},  // relaxed everyday — sage
  {top:'#4A2E52', pants:'#241a12', shoes:'#241a12'},  // sharp — plum
];
/* EDIT ME — INTRO SEQUENCE. ✔ POLE-DESCENT FULLY REMOVED (audit): POLE_SPINS / POLE_TOP / POLE_GRIP_R /
   DESCEND_END / LAND_END and every descent + landing branch (camera AND character) are deleted — nothing
   references pole position, spiral rotation, or descent progress anywhere anymore.
   NEW INTRO — idle stand → walk-out (one-time, see hasIntroPlayed):
   · IDLE_END: fraction of the intro scroll range held as the OPENING SHOT — the character STANDS at
     START_R on the About radial, facing the camera, breathing (idle pose below). The first scroll past
     IDLE_END is the idle→walk transition trigger.
   · START_R: the idle stand spot's radius from ring centre (ground height .13). */
const IDLE_END=.12, START_R=.34;
/* SPIRAL_DIRECTION (EDIT ME): sign of the cat's wander-loop azimuth advance (formerly shared with the
   removed pole helix — kept solely for the cat). */
const SPIRAL_DIRECTION=1;
/* FIXED WALK TARGET — the About presenting spot. NEVER derived from camera angle or wall proximity:
   az ABOUT_ANG on the r 7.8 ring sits inside Chapter I, ~13° off the intro camera axis = centered on arrival.
   WALK_BLEND (in scroll-progress units) eases the hold at this spot into the normal ring-walk after the
   intro — and mirrors just before the loop seam, so the wrap stays perfectly seamless. */
const ABOUT_ANG=.585, WALK_BLEND=.045; // = orbitAngle(pCenter(0)) - .2 — the Chapter I hold spot, so the walk-out lands exactly where the camera is already looking
const char=new THREE.Group();
const matSkin=mat(SKIN_TONE,{roughness:.55, emissive:'#421e10', emissiveIntensity:.14});
const matTop=mat(OUTFITS[0].top,{roughness:.9}), matTopD=mat('#8a474e',{roughness:.9});
const matStripe=mat('#f4e8e1',{roughness:.9});
const matPants=mat(OUTFITS[0].pants,{roughness:.85});
const matShoes=mat(OUTFITS[0].shoes,{roughness:.6}), matSole=mat('#d6cfc3',{roughness:.8});
const matHair=mat(HAIR_COLOR,{roughness:.78}), matBeard=mat(BEARD_COLOR,{roughness:.82});
const RIG={};
{
  const M=(geo,m,p=[0,0,0],r=[0,0,0],s=[1,1,1])=>{ const o=new THREE.Mesh(geo,m);
    o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); o.castShadow=true; return o; };
  const sph=(r,w=24,h=18)=>new THREE.SphereGeometry(r,w,h);
  const hips=new THREE.Group(); hips.position.y=.97; char.add(hips); RIG.hips=hips;
  hips.add(M(sph(.155,32,24), matPants, [0,0,0],[0,0,0],[1.05,.72,.55])); // pelvis
  // legs: hip pivot (world y .93) → knee (world .50); trousers with cuffs + built shoes
  const mkLeg=(s)=>{
    const hip=new THREE.Group(); hip.position.set(s*.086,-.04,0); hips.add(hip);
    hip.add(M(new THREE.CylinderGeometry(.075,.058,.42,20), matPants, [0,-.21,0],[0,0,s*.025]));
    const knee=new THREE.Group(); knee.position.y=-.43; hip.add(knee);
    knee.add(M(new THREE.CylinderGeometry(.058,.042,.44,20), matPants, [s*.007,-.21,0],[0,0,s*.012]));
    knee.add(M(new THREE.TorusGeometry(.04,.01,10,22), matPants, [s*.0095,-.415,0],[Math.PI/2,0,0],[1,1,.9]));
    knee.add(M(sph(.06,20,14), matShoes, [s*.012,-.438,-.012],[0,0,0],[.85,.85,.95]));
    knee.add(M(sph(.052,20,14), matShoes, [s*.014,-.452,.055],[0,0,0],[.9,.75,1.1]));
    knee.add(M(sph(.05,20,14), matShoes, [s*.016,-.458,.125],[0,0,0],[.95,.68,1.5]));
    knee.add(M(new THREE.CapsuleGeometry(.028,.19,6,12), matSole, [s*.014,-.476,.055],[Math.PI/2,0,0],[1.25,1,.8]));
    return {hip,knee};
  };
  RIG.legL=mkLeg(-1); RIG.legR=mkLeg(1);
  // torso pivots at the waist; inner group carries the source model's absolute-y coordinates
  const torso=new THREE.Group(); hips.add(torso); RIG.torso=torso;
  const ti=new THREE.Group(); ti.position.y=-.97; torso.add(ti); RIG.chest=ti; // breathing scales this
  const prof=[[.165,.98],[.168,1.08],[.165,1.18],[.158,1.27],[.148,1.34],[.128,1.40],[.09,1.455],[.058,1.50]];
  const SXt=1.10, SZt=.62;
  const rAt=y=>{ for(let i=1;i<prof.length;i++){ if(y<=prof[i][1]){ const [r0,y0]=prof[i-1],[r1,y1]=prof[i];
    return r0+(r1-r0)*(y-y0)/(y1-y0); } } return prof[prof.length-1][0]; };
  ti.add(M(new THREE.LatheGeometry(prof.map(p2=>new THREE.Vector2(p2[0],p2[1])),40), matTop, [0,0,0],[0,0,0],[SXt,1,SZt]));
  ti.add(M(new THREE.CircleGeometry(.165,40), matTopD, [0,.981,0],[Math.PI/2,0,0],[SXt,SZt,1]));
  for(let i=0;i<26;i++){ // pinstripes wrapped to the torso profile
    const phi=i/26*Math.PI*2; if(Math.abs(phi-Math.PI/2)<.14) continue;
    const pts2=[];
    for(let y=.984;y<=1.472;y+=.05){ const r=rAt(y);
      let px=Math.cos(phi)*r*SXt, pz=Math.sin(phi)*r*SZt;
      const nx=Math.cos(phi)*SZt, nz=Math.sin(phi)*SXt, nl=Math.hypot(nx,nz);
      px+=nx/nl*.0015; pz+=nz/nl*.0015;
      pts2.push(new THREE.Vector3(px,y,pz)); }
    const st=M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2),12,.003,5), matStripe);
    st.castShadow=false; ti.add(st);
  }
  const ppts=[]; for(let y=.99;y<=1.48;y+=.04) ppts.push(new THREE.Vector3(0,y,rAt(y)*SZt+.002));
  ti.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ppts),12,.007,8), matTop)); // placket
  for(const y of [1.06,1.16,1.26,1.36,1.44])
    ti.add(M(new THREE.CylinderGeometry(.008,.008,.006,12), mat('#7a4a38',{roughness:.5}), [0,y,rAt(y)*SZt+.0085],[Math.PI/2,0,0]));
  ti.add(M(new THREE.TorusGeometry(.078,.016,12,32), matTop, [0,1.49,0],[Math.PI/2,0,0],[1.10,.80,1])); // collar
  for(const s of [-1,1]) ti.add(M(new THREE.BoxGeometry(.085,.013,.07), matTop, [s*.068,1.464,.064],[-1,s*.5,-s*.18]));
  ti.add(M(new THREE.CylinderGeometry(.05,.057,.14,20), matSkin, [0,1.52,0])); // neck
  // arms: shoulder (world 1.405) → elbow; striped sleeves split at the joint
  const mkArm=(s)=>{
    ti.add(M(sph(.072,22,16), matTop, [s*.165,1.402,0],[0,0,0],[1,.85,.95])); // deltoid
    const sh=new THREE.Group(); sh.position.set(s*.2,1.405,0); ti.add(sh);
    sh.add(M(new THREE.CapsuleGeometry(.046,.17,6,14), matTop, [0,-.11,0]));
    const el=new THREE.Group(); el.position.y=-.24; sh.add(el);
    el.add(M(new THREE.CapsuleGeometry(.043,.15,6,14), matTop, [0,-.1,0]));
    for(let k2=0;k2<6;k2++){ const a2=k2/6*Math.PI*2;
      const st=M(new THREE.CylinderGeometry(.0026,.0026,.16,5), matStripe, [Math.cos(a2)*.0472,-.11,Math.sin(a2)*.0472]);
      st.castShadow=false; sh.add(st);
      const st2=M(new THREE.CylinderGeometry(.0026,.0026,.14,5), matStripe, [Math.cos(a2)*.0445,-.1,Math.sin(a2)*.0445]);
      st2.castShadow=false; el.add(st2); }
    el.add(M(new THREE.TorusGeometry(.04,.009,10,24), matTop, [0,-.205,0],[Math.PI/2,0,0])); // cuff
    el.add(M(sph(.034,18,12), matSkin, [0,-.25,.004],[0,0,0],[.72,1.15,.5])); // hand
    el.add(M(sph(.012,10,8), matSkin, [-s*.02,-.232,.012],[0,0,0],[.8,1.2,.8])); // thumb
    return {sh,el};
  };
  RIG.armL=mkArm(-1); RIG.armR=mkArm(1);
  // head — full stylized 3D: face, beard, wavy hair (from the shared design)
  const head=new THREE.Group(); head.position.set(0,1.665,0); head.scale.setScalar(.94);
  ti.add(head); RIG.headG=head;
  head.add(M(sph(.115,40,30), matSkin, [0,0,0],[0,0,0],[.95,1.08,.96]));
  head.add(M(sph(.088,28,20), matSkin, [0,-.055,.012],[0,0,0],[.92,.88,.86]));
  const matSclera=mat('#f8f4ee',{roughness:.35}), matIris=mat('#5a3620',{roughness:.4}),
        matPupil=mat('#14100d',{roughness:.4}), matLip=mat('#a9614f',{roughness:.6}),
        matMouth=mat('#542f2b',{roughness:.7}), matTeeth=mat('#f6f1e8',{roughness:.38});
  for(const s of [-1,1]){
    head.add(M(sph(.022,18,12), matSclera, [s*.043,.01,.08]));
    head.add(M(sph(.013,14,10), matIris, [s*.043,.009,.0985],[0,0,0],[1,1,.55]));
    head.add(M(sph(.0068,10,8), matPupil, [s*.043,.009,.1032],[0,0,0],[1,1,.5]));
    head.add(M(sph(.0046,8,6), new THREE.MeshBasicMaterial({color:'#fff'}), [s*.043+.0068,.016,.1038]));
    head.add(M(new THREE.TorusGeometry(.03,.0072,8,18,1.15), matHair, [s*.045,.038,.1],[-.22,0,(Math.PI/2-.575)-s*.1],[1,1,.6]));
    head.add(M(sph(.027,16,12), matSkin, [s*.112,.006,-.002],[0,0,0],[.5,1.05,.8]));
  }
  head.add(M(new THREE.CapsuleGeometry(.0135,.036,6,12), matSkin, [0,-.004,.108],[-.3,0,0]));
  head.add(M(sph(.022,18,14), matSkin, [0,-.028,.124],[0,0,0],[1,.86,.82]));
  head.add(M(sph(.012,12,8), matSkin, [-.016,-.032,.108],[0,0,0],[1,.78,.8]));
  head.add(M(sph(.012,12,8), matSkin, [.016,-.032,.108],[0,0,0],[1,.78,.8]));
  head.add(M(sph(.03,20,14), matMouth, [0,-.062,.098],[0,0,0],[1.45,.5,.5]));
  head.add(M(new THREE.CapsuleGeometry(.0085,.046,6,12), matTeeth, [0,-.0585,.113],[0,0,Math.PI/2],[1,1,.62]));
  head.add(M(new THREE.CapsuleGeometry(.0068,.038,6,12), matLip, [0,-.075,.108],[0,0,Math.PI/2],[1,.9,.6]));
  for(const s of [-1,1]) head.add(M(sph(.0062,8,6), matMouth, [s*.0365,-.06,.1],[0,0,0],[1,.75,.5]));
  for(const s of [-1,1]){ // beard
    head.add(M(sph(.06,20,14), matBeard, [s*.078,-.042,.02],[0,0,0],[.85,.95,.92]));
    head.add(M(sph(.057,20,14), matBeard, [s*.044,-.094,.048],[0,0,0],[.82,.88,.88]));
    head.add(M(new THREE.CapsuleGeometry(.0185,.05,6,12), matBeard, [s*.1035,-.016,.002],[.1,0,s*.06]));
    head.add(M(sph(.03,16,12), matBeard, [s*.0175,-.038,.106],[0,0,-s*.32],[1.15,.4,.5]));
  }
  head.add(M(sph(.012,10,8), matBeard, [0,-.0405,.11],[0,0,0],[1,.55,.5]));
  head.add(M(sph(.058,20,14), matBeard, [0,-.1,.05],[0,0,0],[1.02,.88,.82]));
  head.add(M(sph(.028,16,12), matBeard, [0,-.09,.082],[0,0,0],[1.35,.72,.62]));
  const H=[[.117,[0,.024,-.014],[1,1.02,.94],32],[.078,[.01,.095,-.008],[1.25,.85,.92]],
    [.052,[-.062,.108,.03],[1.05,.95,.9]],[.056,[-.03,.112,.042],[1.25,.75,.85]],
    [.047,[.052,.104,.042],[1.1,.62,.8]],[.045,[-.01,.118,.02],[1.1,.7,.8]],
    [.04,[-.086,.068,.028],[.7,.75,.8]],[.04,[.086,.068,.028],[.7,.75,.8]],
    [.05,[-.1,.034,-.01],[.52,.82,.92]],[.05,[.1,.034,-.01],[.52,.82,.92]],
    [.088,[0,-.004,-.058],[.92,.72,.78]]];
  for(const [r,p2,s2,seg] of H) head.add(M(sph(r,seg||20,14), matHair, p2,[0,0,0],s2));
  head.add(M(new THREE.TorusGeometry(.042,.012,8,18,2.2), matHair, [-.062,.118,.052],[-1.2,.35,.9]));
  head.add(M(new THREE.TorusGeometry(.036,.01,8,18,2), matHair, [.058,.105,.048],[-1.25,-.35,-.6]));
}
const outfitCols=OUTFITS.map(o=>({top:new THREE.Color(o.top), topD:new THREE.Color(o.top).multiplyScalar(.62),
  pants:new THREE.Color(o.pants), shoes:new THREE.Color(o.shoes)}));
const outfitState={idx:0, pulse:0};
let walkPhase=0, walkAmp=0, headYaw=0;
const wrapPI=x2=>((x2+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
let yawCur=0, prevYawF=0, headingYaw=0; // smoothed facing state; headingYaw = last REAL direction of travel
const charSmooth=new THREE.Vector3(0,0,0); // damped character tracker — the intro camera's single source of truth
const lastCP=new THREE.Vector3(0,0,0);
// contact shadow blob — scales/fades with height off the ground
const blob = new THREE.Mesh(new THREE.CircleGeometry(.34,20),
  new THREE.MeshBasicMaterial({color:'#000', transparent:true, opacity:.32, depthWrite:false}));
blob.rotation.x=-Math.PI/2;
scene.add(char, blob);

/* ============ wall decor sprites (nailed / pinned) ============ */
const ICONS = { // small "things from my life" pins (RETHEME — EDIT ME: swap/add freely)
  headphones(ctx,w,h){ ctx.strokeStyle='#2B2622'; ctx.lineWidth=9; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(w/2,h*.52,w*.28,Math.PI,0); ctx.stroke();
    ctx.fillStyle='#C25A2E';
    for(const s of [-1,1]){ ctx.beginPath(); ctx.roundRect(w/2+s*w*.28-10,h*.5,20,30,7); ctx.fill(); } },
  camera(ctx,w,h){ ctx.fillStyle='#2B2622'; ctx.beginPath(); ctx.roundRect(w*.16,h*.34,w*.68,h*.4,10); ctx.fill();
    ctx.fillStyle='#3a3632'; ctx.fillRect(w*.3,h*.26,w*.2,h*.1);
    ctx.strokeStyle='#C9A15E'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(w/2,h*.54,w*.14,0,7); ctx.stroke();
    ctx.fillStyle='#5B84A0'; ctx.beginPath(); ctx.arc(w/2,h*.54,w*.07,0,7); ctx.fill(); },
  coffee(ctx,w,h){ ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.roundRect(w*.26,h*.36,w*.4,h*.4,8); ctx.fill();
    ctx.strokeStyle='#F3E2C2'; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(w*.7,h*.53,w*.1,-1.2,1.2); ctx.stroke();
    ctx.strokeStyle='rgba(240,227,200,.8)'; ctx.lineWidth=5; ctx.lineCap='round';
    for(const dx of [-8,6]){ ctx.beginPath(); ctx.moveTo(w/2+dx,h*.28); ctx.quadraticCurveTo(w/2+dx+6,h*.2,w/2+dx,h*.12); ctx.stroke(); } },
  plant(ctx,w,h){ ctx.fillStyle='#C25A2E'; ctx.beginPath(); ctx.moveTo(w*.34,h*.62); ctx.lineTo(w*.66,h*.62); ctx.lineTo(w*.6,h*.88); ctx.lineTo(w*.4,h*.88); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#7BA05B'; ctx.lineWidth=8; ctx.lineCap='round';
    for(const [dx,dy] of [[0,-1],[-.16,-.7],[.16,-.7]]){ ctx.beginPath(); ctx.moveTo(w/2,h*.6);
      ctx.quadraticCurveTo(w/2+dx*w*.9,h*.42,w/2+dx*w,h*.6+dy*h*.32); ctx.stroke(); } },
  sneaker(ctx,w,h){ ctx.fillStyle='#F7EDD9'; ctx.beginPath();
    ctx.moveTo(w*.14,h*.62); ctx.quadraticCurveTo(w*.2,h*.34,w*.44,h*.4); ctx.quadraticCurveTo(w*.66,h*.46,w*.86,h*.58);
    ctx.lineTo(w*.86,h*.68); ctx.lineTo(w*.14,h*.68); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#C25A2E'; ctx.fillRect(w*.14,h*.66,w*.72,8);
    ctx.strokeStyle='#2B2622'; ctx.lineWidth=4;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(w*(.3+i*.09),h*.44); ctx.lineTo(w*(.36+i*.09),h*.54); ctx.stroke(); } },
  vinyl(ctx,w,h){ ctx.fillStyle='#141210'; ctx.beginPath(); ctx.arc(w/2,h/2,w*.36,0,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.16)'; ctx.lineWidth=2;
    for(const r of [.16,.22,.28]){ ctx.beginPath(); ctx.arc(w/2,h/2,w*r,0,7); ctx.stroke(); }
    ctx.fillStyle='#E5A83B'; ctx.beginPath(); ctx.arc(w/2,h/2,w*.1,0,7); ctx.fill(); },
  pencil(ctx,w,h){ ctx.save(); ctx.translate(w/2,h/2); ctx.rotate(-.7);
    ctx.fillStyle='#E5A83B'; ctx.fillRect(-w*.3,-9,w*.5,18);
    ctx.fillStyle='#F0C9A0'; ctx.beginPath(); ctx.moveTo(w*.2,-9); ctx.lineTo(w*.34,0); ctx.lineTo(w*.2,9); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#2B2622'; ctx.beginPath(); ctx.moveTo(w*.29,-3); ctx.lineTo(w*.34,0); ctx.lineTo(w*.29,3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#C25A2E'; ctx.fillRect(-w*.36,-9,w*.07,18); ctx.restore(); },
  helmet(ctx,w,h){ ctx.fillStyle='#C25A2E'; ctx.beginPath(); ctx.arc(w/2,h*.52,w*.3,Math.PI,0); ctx.fill();
    ctx.fillRect(w*.2,h*.5,w*.6,h*.14);
    ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.roundRect(w*.3,h*.42,w*.34,h*.14,8); ctx.fill(); },
  mappin(ctx,w,h){ ctx.fillStyle='#5B84A0'; ctx.beginPath(); ctx.arc(w/2,h*.42,w*.2,Math.PI*.95,Math.PI*2.05);
    ctx.lineTo(w/2,h*.78); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#F7EDD9'; ctx.beginPath(); ctx.arc(w/2,h*.42,w*.08,0,7); ctx.fill(); },
  plane(ctx,w,h){ ctx.fillStyle='#F7EDD9'; ctx.beginPath();
    ctx.moveTo(w*.14,h*.6); ctx.lineTo(w*.86,h*.3); ctx.lineTo(w*.5,h*.62); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#d8ccb4'; ctx.beginPath();
    ctx.moveTo(w*.5,h*.62); ctx.lineTo(w*.86,h*.3); ctx.lineTo(w*.58,h*.78); ctx.closePath(); ctx.fill(); },
  bulb(ctx,w,h){ ctx.fillStyle='#FFE08A'; ctx.beginPath(); ctx.arc(w/2,h*.4,w*.26,0,7); ctx.fill();
    ctx.fillStyle='#9a8a6a'; ctx.fillRect(w*.42,h*.6,w*.16,h*.18);
    ctx.strokeStyle='#FFE08A'; ctx.lineWidth=4;
    for(let i=0;i<6;i++){ const a=i*Math.PI/3; ctx.beginPath();
      ctx.moveTo(w/2+Math.cos(a)*w*.32,h*.4+Math.sin(a)*w*.32);
      ctx.lineTo(w/2+Math.cos(a)*w*.42,h*.4+Math.sin(a)*w*.42); ctx.stroke(); } },
  heart(ctx,w,h){ ctx.fillStyle='#D8543A'; ctx.save(); ctx.translate(w/2,h*.42); ctx.beginPath();
    ctx.moveTo(0,h*.28); ctx.bezierCurveTo(-w*.5,-h*.08,-w*.18,-h*.34,0,-h*.1);
    ctx.bezierCurveTo(w*.18,-h*.34,w*.5,-h*.08,0,h*.28); ctx.fill(); ctx.restore(); },
};
const swayers = [];   // {obj, phase, amp}
const decorGroup = new THREE.Group(); scene.add(decorGroup);
function addNail(parent, y){
  const nail = new THREE.Mesh(new THREE.SphereGeometry(.035,8,8), mat('#d8d2c0',{metalness:.7,roughness:.3}));
  nail.position.set(0,y,.02); parent.add(nail); return nail;
}
function wallDecor(icon, ang, y, size, sway=true){
  const g = new THREE.Group();
  const tex = canvasTex(128,128,ICONS[icon]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size,size),
    new THREE.MeshStandardMaterial({map:tex, transparent:true, roughness:.85, side:THREE.DoubleSide}));
  g.add(m); addNail(g, size*.52);
  g.position.copy(polar(ang,10.72,y));
  g.rotation.y = ang + Math.PI;
  decorGroup.add(g);
  if(sway && !reduced) swayers.push({obj:g, phase:Math.random()*6.28, amp:.035+Math.random()*.04});
  return g;
}
// scatter per quadrant — offsets (rad) from quadrant start, avoiding center content zone
const scatter = [ // per-quadrant life-object pins (keys from ICONS above)
  ['plant','coffee'],
  ['camera','pencil','bulb','vinyl','mappin','heart'],
  ['mappin','plane','coffee'],
  ['helmet','sneaker','heart','headphones'],
];
const offsByQ = [
  [.14,1.54],                   // q0: clear of the wall-printed hero text (left) + video (right)
  [.14,.26,.38,.50,.62,.74], // q1: ALL pins packed into the case-study stretch (az ≤2.31) — the wall from there to the conveyor belt (2.88) stays completely empty, isolating the photo section
  [.70,.785],               // q2: two small pins below the ch1 plaque — the milestone-path strip between the plaques stays clean
  [1.51,1.29,1.40,1.50],         // q3: clear of the widened contact badges (az ≈5.53–5.96) + the music prompt (az 6.06)
];
for(let q=0;q<4;q++){
  const base = q*Math.PI/2, offs = offsByQ[q];
  scatter[q].forEach((ic,i)=>{
    if(i>=offs.length) return;
    const y = q===2 ? .68+(i%2)*.16 : 1.15+((i%3)*.55)+(i%2?.2:0); // BUG FIX: q2's 2nd pin (y was 1.18) rose into the ch1/Synoric plaque's span (1.05\u20132.20) and poked out as a stray white triangle at its corner \u2014 both pins now sit safely under the plaque's 1.045 bottom edge
    const sz = q===2 ? .34+(i%2)*.08 : .5+(i%3)*.12;
    wallDecor(ic, base+offs[i], y, sz);
  });
}
// (bunting removed in the retheme — the string lights alone dress the wall top)

/* ============ case study posters (clickable) ============ */
const clickables = [];
function posterTex(cs){
  return canvasTex(512,640,(ctx,w,h)=>{
    ctx.fillStyle='#FBF3E3'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=cs.c; ctx.lineWidth=20; ctx.strokeRect(16,16,w-32,h-32);
    ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=5; ctx.strokeRect(34,34,w-68,h-68);
    ctx.fillStyle=cs.c; ctx.beginPath(); ctx.arc(w/2,172,80,0,7); ctx.fill();
    ctx.fillStyle='#FBF3E3'; ctx.save(); ctx.translate(w/2,172); ctx.beginPath();
    for(let i=0;i<10;i++){ const r=i%2?20:48,a=i*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} 
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle='#2B1D16'; ctx.font='800 42px Nunito'; ctx.textAlign='center';
    wrapText(ctx, cs.t, w/2, 322, w-100, 52);
    ctx.font='700 26px Nunito'; ctx.fillStyle='#7a5a3a';
    ctx.fillText('★ CLICK TO READ ★', w/2, h-64);
  });
}
/* ============ case study cards — THREE LAYOUT OPTIONS ============
   'A' = playbill posters nailed flat on the wall (the original)
   'B' = fanned deck — tighter arc, cards angled toward the camera
   'C' = spotlight stages (DEFAULT) — each case on its own little stage, spotlight visits each
*/
const CARD_LAYOUT = 'C';
const CARD_ANG  = [A(1)-.42, A(1), A(1)+.42]; // stage azimuths along the quadrant arc
const CARD_ZOOM = [.30, .54, .77];            // EDIT ME — per-card focus centers within Act II scroll (0..1)
const stages = [];
function drawCardImagePlaceholder(ctx,cs){
  const rx=36,ry=40,rw=440,rh=250;
  ctx.save(); ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.clip();
  ctx.fillStyle=cs.c; ctx.fillRect(rx,ry,rw,rh);
  ctx.fillStyle='rgba(255,255,255,.14)';
  for(let i=0;i<8;i++){ ctx.save(); ctx.translate(rx+i*62,ry); ctx.rotate(.5); ctx.fillRect(0,-40,26,rh+120); ctx.restore(); }
  ctx.fillStyle='rgba(251,243,227,.9)'; ctx.save(); ctx.translate(rx+rw/2,ry+rh/2); ctx.beginPath();
  for(let i=0;i<10;i++){ const rr=i%2?26:62, aa=i*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr); }
  ctx.closePath(); ctx.fill(); ctx.restore(); ctx.restore();
  ctx.strokeStyle='#2B1D16'; ctx.lineWidth=3; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.stroke();
}
/* CARD SKINS (EDIT ME — PAPER / FRAME / RULE / CHIP_*)
   Two variants of the same card: `hover` swaps the paper for a darker stock and the coloured
   frame for brass. NOTE the hover state deliberately does NOT touch the type colours or the
   case colour cs.c — the old hover tinted the whole material emissive warm-brown, which read as
   "the card changed colour". Depth now comes from the darker paper, the different stroke, and
   the drop shadow added in buildCaseStages. */
const CARD_SKIN = {
  base:  {paper:'#FBF3E3', frame:null,      rule:'rgba(0,0,0,.22)', chipFill:'#F3E2C2', chipEdge:'#C9A15E', chipInk:'#6a4a2e'},
  hover: {paper:'#E4D2AC', frame:'#C9A15E', rule:'rgba(0,0,0,.34)', chipFill:'#F6E8CB', chipEdge:'#8A6A3A', chipInk:'#5a3d22'}
};
/* VIDEO-THUMBNAIL CARDS (EDIT ME — CASES[i].video): a case whose entry has a `video` URL plays
   that video, muted + looping, into the same hero-image slot the static `img` uses — same rounded
   clip and border, just a live source. One <video> element is shared between a card's base and
   hover skins (two canvases, one decode), and every registered target is redrawn once per render
   frame from updateCardVideos() (called from renderFrame — search "updateCardVideos()"). */
const cardVideoTargets = []; // {video, draws:[{tex,rx,ry,rw,rh}]}
function getCardVideo(cs){
  if(!cs.video) return null;
  if(!cs.__videoEl){
    const v=document.createElement('video');
    v.src=cs.video; v.muted=true; v.loop=true; v.playsInline=true; v.autoplay=true; v.preload='auto';
    /* A video that's never attached to the document sometimes never actually starts playing —
       readyState reaches 4 (fully decoded) but it just sits paused on frame 0, which is why the
       card read as solid black. Parking it off-screen (not display:none, which some browsers
       freeze) keeps it a normal rendering client so autoplay behaves the same as an on-page
       <video>. It has to stay inside the viewport rect, though — Chrome auto-pauses playing
       <video> elements it considers scrolled off-screen, which a -9999px position triggers
       immediately; a 2×2px corner at 0,0 is invisible but still "on screen" as far as that
       heuristic is concerned. updateCardVideos() also nudges playback back on if it ever stops. */
    v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1;';
    document.body.appendChild(v);
    const tryPlay=()=>v.play().catch(()=>{});
    tryPlay();
    v.addEventListener('loadeddata', tryPlay);
    v.addEventListener('canplay', tryPlay);
    cs.__videoEl=v;
  }
  return cs.__videoEl;
}
function cardVideoReady(cs){ const v=cs.__videoEl; return !!v && v.readyState>=2; }
function attachCardVideo(cs, tex, rx, ry, rw, rh){
  const video=getCardVideo(cs); if(!video) return;
  let entry=cardVideoTargets.find(e=>e.video===video);
  if(!entry){ entry={video, draws:[]}; cardVideoTargets.push(entry); }
  entry.draws.push({tex,rx,ry,rw,rh});
}
function updateCardVideos(){
  for(const {video,draws} of cardVideoTargets){
    if(video.paused && !video.ended) video.play().catch(()=>{}); // self-heals if the browser ever pauses it
    if(video.readyState<2 || !video.videoWidth) continue;
    for(const {tex,rx,ry,rw,rh} of draws){
      const c=tex.image, ctx=c.getContext('2d');
      ctx.save(); ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.clip();
      const s2=Math.max(rw/video.videoWidth, rh/video.videoHeight);
      ctx.drawImage(video, rx+(rw-video.videoWidth*s2)/2, ry+(rh-video.videoHeight*s2)/2, video.videoWidth*s2, video.videoHeight*s2);
      ctx.restore();
      ctx.strokeStyle='#2B1D16'; ctx.lineWidth=3; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.stroke();
      tex.needsUpdate=true;
    }
  }
}
function cardTex(cs, hover){
  const SK = hover ? CARD_SKIN.hover : CARD_SKIN.base;
  const tex = canvasTex(512,680,(ctx,w,h)=>{
    ctx.fillStyle=SK.paper; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=SK.frame||cs.c; ctx.lineWidth=16; ctx.strokeRect(10,10,w-20,h-20);
    ctx.strokeStyle=SK.rule; ctx.lineWidth=4; ctx.strokeRect(26,26,w-52,h-52);
    drawCardImagePlaceholder(ctx,cs); // hero image slot (async swap below)
    /* TEXT + CHIPS (EDIT ME — TEXT_TOP / CHIP_TOP / TEXT_CHIP_GAP)
       OVERLAP FIX: the chips used to be pinned to a hard-coded y (582) while the blurb flowed
       from wherever the title happened to end — so any card with a long title or blurb ran its
       last line straight through the pills. Now the chip row is measured and RESERVED first,
       then the title + blurb are auto-fitted into the band left above it. The two blocks are
       physically incapable of touching. */
    const TEXT_TOP = 320;      // top edge of the title block (image slot ends at 290)
    const TEXT_CHIP_GAP = 24;  // guaranteed clear air between the blurb and the pills
    const CHIP_BOTTOM = 614, CHIP_H = 38, CHIP_GAP = 14, CHIP_ROW_GAP = 8;
    // 1 — lay the chip row(s) out first. The row grows UPWARDS from a fixed bottom edge, so the
    //     pills always clear the footer line, and adding a 4th/5th chip wraps instead of spilling.
    const layoutChips = px => {
      ctx.font=`800 ${px}px Nunito`;
      const cws = cs.chips.map(c=>ctx.measureText(c).width+26);
      const rows=[[]]; let cur=0;
      for(let j=0;j<cs.chips.length;j++){
        const cw=cws[j], first=rows[rows.length-1].length===0, need=first?cw:CHIP_GAP+cw;
        if(!first && cur+need > w-70){ rows.push([]); cur=cw; } else cur+=need;
        rows[rows.length-1].push({label:cs.chips[j], cw});
      }
      return rows;
    };
    let fpx, chipRows;
    // prefer ONE row at the largest font that allows it …
    for(fpx=19; fpx>=12; fpx--){ chipRows=layoutChips(fpx); if(chipRows.length===1) break; }
    // … otherwise take the largest font that needs no more than two rows
    if(chipRows.length>1){ for(fpx=19; fpx>=12; fpx--){ chipRows=layoutChips(fpx); if(chipRows.length<=2 || fpx===12) break; } }
    const chipFpx = fpx;
    const CHIP_TOP = CHIP_BOTTOM - chipRows.length*CHIP_H - (chipRows.length-1)*CHIP_ROW_GAP;
    // 2 — auto-fit title + blurb into the band ABOVE the reserved chip row
    const bandBottom = CHIP_TOP - TEXT_CHIP_GAP;
    let tPx=34, dPx=21, tLines, dLines, tLh, dLh, BLOCK_GAP=16;
    for(;;){
      ctx.font=`${tPx}px "Alfa Slab One"`; tLines=wrapLines(ctx, cs.t, w-90);  tLh=Math.round(tPx*1.24);
      ctx.font=`700 ${dPx}px Nunito`;      dLines=wrapLines(ctx, cs.d, w-100); dLh=Math.round(dPx*1.34);
      const h2 = tLines.length*tLh + BLOCK_GAP + dLines.length*dLh;
      if(TEXT_TOP + h2 <= bandBottom) break;
      if(dPx>14) dPx--; else if(tPx>24) tPx--; else break; // shrink the blurb first, then the title
    }
    /* Belt and braces: if someone later pastes in a truly enormous title or blurb, trim the
       overflow with an ellipsis rather than letting it bleed into the chips. */
    if(tLines.length>3){ tLines=tLines.slice(0,3); tLines[2]=tLines[2].replace(/[\s.,;:]+$/,'')+'\u2026'; }
    const maxDesc = Math.max(1, Math.floor((bandBottom - TEXT_TOP - tLines.length*tLh - BLOCK_GAP)/dLh));
    if(dLines.length>maxDesc){ dLines=dLines.slice(0,maxDesc); dLines[maxDesc-1]=dLines[maxDesc-1].replace(/[\s.,;:]+$/,'')+'\u2026'; }
    ctx.textAlign='center';
    ctx.fillStyle='#2B1D16'; ctx.font=`${tPx}px "Alfa Slab One"`;
    tLines.forEach((l,i)=>ctx.fillText(l, w/2, TEXT_TOP + tPx + i*tLh));
    const descTop = TEXT_TOP + tLines.length*tLh + BLOCK_GAP;
    ctx.fillStyle='#7a5a3a'; ctx.font=`700 ${dPx}px Nunito`;
    dLines.forEach((l,i)=>ctx.fillText(l, w/2, descTop + dPx + i*dLh));
    // 3 — paint the chips into their reserved, centred row(s)
    ctx.font=`800 ${chipFpx}px Nunito`;
    chipRows.forEach((row,ri)=>{
      const rowW=row.reduce((a,b)=>a+b.cw,0)+CHIP_GAP*(row.length-1);
      const top=CHIP_TOP+ri*(CHIP_H+CHIP_ROW_GAP), base=top+CHIP_H/2+chipFpx*0.35;
      let x=w/2-rowW/2;
      row.forEach(({label,cw})=>{
        ctx.fillStyle=SK.chipFill; ctx.strokeStyle=SK.chipEdge; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.roundRect(x,top,cw,CHIP_H,CHIP_H/2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=SK.chipInk; ctx.fillText(label, x+cw/2, base); x+=cw+CHIP_GAP;
      });
    });
    ctx.font='800 17px Nunito'; ctx.fillStyle='#a4552f';
    if('letterSpacing' in ctx) ctx.letterSpacing='4px';
    ctx.fillText('★ CLICK FOR THE FULL STORY ★', w/2, h-36);
    if('letterSpacing' in ctx) ctx.letterSpacing='0px';
  });
  const rx=36,ry=40,rw=440,rh=250;
  if(cs.img){ // instant placeholder — the poster frame, up until the video (if any) is decodable
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>{ if(cs.video && cardVideoReady(cs)) return; // video already took over this slot
      const c=tex.image, ctx=c.getContext('2d');
      ctx.save(); ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.clip();
      const s2=Math.max(rw/img.width, rh/img.height);
      ctx.drawImage(img, rx+(rw-img.width*s2)/2, ry+(rh-img.height*s2)/2, img.width*s2, img.height*s2);
      ctx.restore();
      ctx.strokeStyle='#2B1D16'; ctx.lineWidth=3; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.stroke();
      tex.needsUpdate=true; };
    img.src=cs.img;
  }
  if(cs.video) attachCardVideo(cs, tex, rx, ry, rw, rh);
  return tex;
}
/* Landscape twin of cardShadowTex, for the 1.86×1.15 chapter plaques. */
const plaqueShadowTex = canvasTex(360,232,(ctx,w,h)=>{
  ctx.fillStyle='#000'; ctx.shadowColor='rgba(0,0,0,.95)'; ctx.shadowBlur=30; ctx.shadowOffsetY=6;
  ctx.beginPath(); ctx.roundRect(w*0.15,h*0.15,w*0.70,h*0.68,16); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0;
});
/* DROP SHADOW (EDIT ME — blur / inset): one soft blurred slab reused by all three cards. Painted
   black-on-transparent; the mesh below multiplies it to black and fades its opacity on hover. */
const cardShadowTex = canvasTex(256,340,(ctx,w,h)=>{
  ctx.fillStyle='#000'; ctx.shadowColor='rgba(0,0,0,.95)'; ctx.shadowBlur=34; ctx.shadowOffsetY=6;
  ctx.beginPath(); ctx.roundRect(w*0.16,h*0.14,w*0.68,h*0.70,12); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0;
});
const stageStripeTex = canvasTex(512,64,(ctx,w,h)=>{ // RETHEME: walnut stage sides with a brass edge
  ctx.fillStyle='#5a4632'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(0,0,0,.14)';
  for(let i=0;i<40;i++){ ctx.fillRect(Math.random()*w,Math.random()*h,40+Math.random()*80,1.2); }
  ctx.fillStyle='#C9A15E'; ctx.fillRect(0,0,w,5);
});
function buildCaseStages(){
  if(CARD_LAYOUT==='A'){ buildWallPosters(); return; }
  const fan = CARD_LAYOUT==='B';
  CASES.forEach((cs,i)=>{
    const ang = fan ? A(1)+(i-1)*.24 : CARD_ANG[i];
    const rr  = fan ? 8.4 : 9.0; // outside the character's walking path (r≈7.8)
    const outer=new THREE.Group(); outer.position.copy(polar(ang,rr,0)); outer.rotation.y=ang+Math.PI;
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.95,1.05,.34,28,1,true),
      new THREE.MeshStandardMaterial({map:stageStripeTex, roughness:.8}));
    st.position.y=.17; st.castShadow=true; outer.add(st);
    const top=new THREE.Mesh(new THREE.CircleGeometry(.95,28), mat(cs.c,{roughness:.85}));
    top.rotation.x=-Math.PI/2; top.position.y=.345; outer.add(top);
    const inner=new THREE.Group(); inner.position.y=.35; outer.add(inner); // hover lifts this
    const cardGeo=new THREE.PlaneGeometry(1.5,2.0);
    /* SHADOW slab sits BEHIND the card and fades in on hover — this is the depth cue that replaces
       the old emissive colour wash. Oversized and nudged down so it reads as cast, not as a border. */
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.5*1.42, 2.0*1.34),
      new THREE.MeshBasicMaterial({map:cardShadowTex, color:0x000000, transparent:true,
        opacity:0, depthWrite:false, toneMapped:false}));
    shadow.position.set(.02, 1.02-.06, -.015); shadow.renderOrder=-1; inner.add(shadow);
    /* UNLIT (EDIT ME): the card art is a fully painted poster texture — titles, chips, borders,
       and now video thumbnails — meant to be read exactly as drawn. MeshStandardMaterial let the
       scene's real lights (notably stageSpot, which snaps to ~120 intensity on the focused card)
       wash across it unevenly, which read as glare over any video playing in the hero slot.
       MeshBasicMaterial is unlit so lighting can no longer touch it; the deliberate non-focus dim
       a few lines down (s.mat.color.setScalar) still works — it multiplies the texture directly. */
    const cm=new THREE.MeshBasicMaterial({map:cardTex(cs), transparent:true});
    const card=new THREE.Mesh(cardGeo, cm);
    card.position.y=1.02; card.castShadow=true;
    /* HOVER SKIN: a second, identical card carrying the darker/brass texture, held at opacity 0
       just in front. Cross-fading it keeps the artwork and the type colours untouched. */
    const cmHov=new THREE.MeshBasicMaterial({map:cardTex(cs,true),
      transparent:true, opacity:0, depthWrite:false});
    const cardHov=new THREE.Mesh(cardGeo, cmHov);
    cardHov.position.set(0, 1.02, .004); inner.add(cardHov);
    card.userData={type:'case', idx:i, group:inner, hovMat:cmHov, shadowMat:shadow.material, shadowMesh:shadow};
    inner.rotation.x=-.05; if(fan) inner.rotation.y=(i-1)*-.32; // OPTION B tilt
    inner.add(card); clickables.push(card);
    scene.add(outer);
    stages.push({outer, inner, mat:cm, matHov:cmHov, ang, r:rr});
  });
  /* "VIEW ALL CASE STUDIES" (EDIT ME — VIEW_ALL_LABEL / position): a pinned wall playbill in the gap
     between two stages — same nail + cream-ticket decor language as the rest of the wall, NOT a web
     button. Hover = the standard decor lift/glow; click = the full bill in the poster modal. */
  const vg2=new THREE.Group();
  const vm=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.30), // UNIFIED BADGE SPEC: every wall ticket is 1.2×.30 at y.60, nail .17
    new THREE.MeshStandardMaterial({map:badgeTexf(VIEW_ALL_LABEL,'x'), transparent:true, roughness:.8}));
  vm.userData={type:'cases-all', group:vg2};
  vg2.add(vm); addNail(vg2,.17);
  vg2.position.copy(polar(A(1)-.30,10.7,.60)); vg2.rotation.y=A(1)-.30+Math.PI;
  decorGroup.add(vg2); clickables.push(vm);
  if(!reduced) swayers.push({obj:vg2, phase:2.6, amp:.02});
  lifeProps.viewAll={g:vg2}; // SLIDING PLAYBILL: the render loop drags it right→left across the act as you scroll
}
function buildWallPosters(){ /* OPTION A — playbill posters nailed flat on the wall (original layout) */
  CASES.forEach((cs,i)=>{
    const ang = A(1) + (i-1)*.36 + .08;
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.62),
      new THREE.MeshStandardMaterial({map:posterTex(cs), roughness:.75, emissive:'#000'}));
    p.userData = {type:'case', idx:i, group:g};
    g.add(p); addNail(g,.86);
    g.position.copy(polar(ang,10.7,1.62));
    g.rotation.y = ang+Math.PI;
    decorGroup.add(g); clickables.push(p);
    if(!reduced) swayers.push({obj:g, phase:i*2, amp:.015});
  });
}

/* ============ testimonials band + Act IV connect (badges, zoo) ============ */
const zoo={ready:false};
function initialsAvatar(ctx,x,y,r,name,col){
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
  ctx.strokeStyle='#C9A15E'; ctx.lineWidth=4; ctx.stroke();
  ctx.fillStyle='#FBF3E3'; ctx.font=`800 ${r}px Nunito`; ctx.textAlign='center';
  ctx.fillText(name.split(' ').map(w2=>w2[0]).join(''), x, y+r*.36);
}
function recTex(rec,i){ // TESTIMONIAL CARD (EDIT ME): 768×540 canvas → 1.75×1.23 plane; quote is the hero
  const cols=['#1F5E5B','#4A2E52','#C25A2E'];
  const tex=canvasTex(768,540,(ctx,w,h)=>{
    ctx.fillStyle='#FBF3E3'; ctx.beginPath(); ctx.roundRect(4,4,w-8,h-8,26); ctx.fill();
    ctx.strokeStyle='#4A3020'; ctx.lineWidth=9; ctx.stroke();
    initialsAvatar(ctx,92,96,52,rec.n,cols[i%3]);
    ctx.textAlign='left'; ctx.fillStyle='#2B1D16'; ctx.font='800 40px Nunito'; ctx.fillText(rec.n,184,86); // SPACING PASS: more air after the avatar
    ctx.font='700 28px Nunito'; ctx.fillStyle='#7a5a3a'; ctx.fillText(rec.r,184,126);
    ctx.fillStyle='#0A66C2'; ctx.beginPath(); ctx.roundRect(w-98,36,64,64,12); ctx.fill(); // "in" badge
    ctx.fillStyle='#fff'; ctx.font='800 42px Nunito'; ctx.textAlign='center'; ctx.fillText('in',w-66,82);
    ctx.font='italic 400 36px Nunito'; ctx.fillStyle='#2B1D16';
    wrapText(ctx,'“'+rec.q+'”',w/2,232,w-140,54); // SPACING PASS: wider side padding + taller leading around the quote
  });
  if(rec.avatar){ const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>{ const c=tex.image,ctx=c.getContext('2d');
      ctx.save(); ctx.beginPath(); ctx.arc(92,96,52,0,7); ctx.clip();
      const s2=Math.max(104/img.width,104/img.height);
      ctx.drawImage(img,92-img.width*s2/2,96-img.height*s2/2,img.width*s2,img.height*s2); ctx.restore();
      ctx.strokeStyle='#C9A15E'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(92,96,52,0,7); ctx.stroke();
      tex.needsUpdate=true; };
    img.src=rec.avatar; }
  return tex;
}
function badgeTexf(label,url){
  return canvasTex(512,128,(ctx,w,h)=>{
    ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.roundRect(10,20,w-20,h-40,44); ctx.fill();
    ctx.strokeStyle='#C0392B'; ctx.lineWidth=6; if(!url) ctx.setLineDash([12,10]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#2B1D16'; ctx.textAlign='center';
    let fs=40; ctx.font=`800 ${fs}px Nunito`; // shrink-to-fit — long labels stay inside the pill
    while(ctx.measureText(label).width>w-70 && fs>22){ fs-=2; ctx.font=`800 ${fs}px Nunito`; }
    ctx.fillText(label, w/2, h/2+fs*.35);
  });
}
function buildRecsBand(){ // recommendations band between Chapters III & IV
  // SIZING (EDIT ME): 1.75×1.23 cards; HOVER POP-OUT: eases to r 9.15 at ×1.55 (see hover handler)
  /* SPACING PASS: card pitch = card width + S_MD (clear wall visible between quote cards);
     the whole band keeps ≥.72u from the journey photos (left) and the skills wall (right). */
  /* ZONE: testimonials own az 4.495–5.041 — shifted LEFT (larger az) as far as the brick wall allows
     (~.45u kept before the wall at 5.084), opening a big ~2.6-unit break of empty wall between the
     ch2 plaque (edge 4.253) and the first card. Card pitch tightened to ARC(.3) — the staggered card
     heights keep the trio airy without needing the full ~.55u item gap. */
  const RECS_C=4.768, RECS_STEP=ARC(1.75)+ARC(.3);
  const angs=[RECS_C-RECS_STEP,RECS_C,RECS_C+RECS_STEP], ys=[1.42,1.62,1.42]; // symmetric stagger — side cards share one eye-line
  RECS.forEach((rec,i)=>{
    const g=new THREE.Group();
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.75,1.23),
      new THREE.MeshStandardMaterial({map:recTex(rec,i), transparent:true, roughness:.85}));
    m.userData={type:'rec', idx:i, group:g, noLift:true,
      base:{x:0,y:0,z:0}, pop:{x:0,y:0,z:0}};
    g.add(m); addNail(g,.64);
    g.position.copy(polar(angs[i],10.7,ys[i])); g.rotation.y=angs[i]+Math.PI;
    m.userData.base={x:g.position.x,y:g.position.y,z:g.position.z};
    const pp=polar(angs[i],9.15,ys[i]+.2); m.userData.pop={x:pp.x,y:pp.y,z:pp.z};
    decorGroup.add(g); clickables.push(m);
    if(!reduced && i!==1) swayers.push({obj:g, phase:i*2.4, amp:.014});
  });
  const g=new THREE.Group(); // View on LinkedIn → opens LINKEDIN_URL
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.30), // UNIFIED BADGE SPEC: 1.2×.30 at y.60
    new THREE.MeshStandardMaterial({map:badgeTexf('View on LinkedIn →','x'), transparent:true, roughness:.8}));
  m.userData={type:'link', url:LINKEDIN_URL, group:g};
  g.add(m); addNail(g,.17);
  g.position.copy(polar(RECS_C,10.7,.60)); g.rotation.y=RECS_C+Math.PI; // follows the center card
  decorGroup.add(g); clickables.push(m);
}
function drawContactIcon(ctx,key,x,y,r){ // minimal line icons, no emoji
  ctx.strokeStyle='#FBF3E3'; ctx.fillStyle='#FBF3E3'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.lineJoin='round';
  if(key==='ig'){ ctx.beginPath(); ctx.roundRect(x-r*.62,y-r*.62,r*1.24,r*1.24,r*.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y,r*.3,0,7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x+r*.4,y-r*.4,r*.1,0,7); ctx.fill(); }
  else if(key==='mail'){ ctx.beginPath(); ctx.roundRect(x-r*.7,y-r*.48,r*1.4,r*.96,8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-r*.7,y-r*.4); ctx.lineTo(x,y+r*.12); ctx.lineTo(x+r*.7,y-r*.4); ctx.stroke(); }
  else if(key==='phone'){ ctx.beginPath(); ctx.roundRect(x-r*.38,y-r*.66,r*.76,r*1.32,10); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y+r*.42,r*.1,0,7); ctx.fill(); }
  else if(key==='pin'){ ctx.beginPath(); ctx.arc(x,y-r*.18,r*.42,Math.PI*.95,Math.PI*2.05); ctx.lineTo(x,y+r*.62); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y-r*.18,r*.14,0,7); ctx.fill(); }
  else if(key==='be'){ ctx.font=`800 ${Math.round(r*1.15)}px Nunito`; ctx.textAlign='center'; ctx.fillText('Bē',x,y+r*.42); }
  else if(key==='drb'){ ctx.beginPath(); ctx.arc(x,y,r*.6,0,7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x-r*.85,y-r*.55,r*1.1,.3,1.25); ctx.stroke();
    ctx.beginPath(); ctx.arc(x-r*.15,y-r*1.35,r*1.45,.9,1.65); ctx.stroke(); }
}
function contactBadgeTex(label,url,icon){ // CHIP SIZING (EDIT ME): 512×154 canvas → 1.0×.30 plane
  return canvasTex(512,154,(ctx,w,h)=>{
    ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.roundRect(8,10,w-16,h-20,60); ctx.fill();
    ctx.strokeStyle='#C0392B'; ctx.lineWidth=7; if(!url) ctx.setLineDash([14,11]); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle='rgba(192,57,43,.4)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(20,21,w-40,h-42,50); ctx.stroke();
    ctx.fillStyle=url?'#C0392B':'#7a5a3a'; ctx.beginPath(); ctx.arc(84,h/2,42,0,7); ctx.fill(); // SPACING PASS: icon inset from the pill edge
    drawContactIcon(ctx,icon,84,h/2,27);
    let fs=44; ctx.font=`800 ${fs}px Nunito`; ctx.textAlign='left';
    while(ctx.measureText(label).width > w-214 && fs>24){ fs-=2; ctx.font=`800 ${fs}px Nunito`; }
    ctx.fillStyle='#2B1D16'; ctx.fillText(label,152,h/2+fs*.36);
  });
}
function buildConnectExtras(){
  /* CONTACT BADGES (EDIT ME — widened after removing the portal doorway that used to sit at
     az 5.756–5.968): the two columns now spread across that whole freed band instead of
     clustering at 5.487–5.719, and the badges themselves are bigger (1.2×.34, was 1.0×.30) so
     the wall reads as one deliberately spacious section rather than a small block next to a gap. */
  const cols=[5.534,5.534+ARC(2.4)+S_MD*2], rows=[2.14,1.60,1.06];
  CONTACTS.forEach(([label,url,icon],i)=>{
    const ang=cols[Math.floor(i/3)], y=rows[i%3];
    const g=new THREE.Group();
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.34),
      new THREE.MeshStandardMaterial({map:contactBadgeTex(label,url,icon), transparent:true, roughness:.8}));
    m.userData = url ? {type:'link', url, group:g} : {type:'none', group:g, noLift:true};
    g.add(m); addNail(g,.21);
    g.position.copy(polar(ang,10.7,y)); g.rotation.y=ang+Math.PI;
    decorGroup.add(g); if(url) clickables.push(m);
  });
  buildZoo();
}
function buildZoo(){ // Chapter IV set-dressing — THINGS I LOVE (RETHEME: replaces the circus animals)
  /* EDIT ME — BIKE_* colors; positions (SPACING PASS): bike 6.12/r8.6, vinyl 5.99/r8.7, plane 4.52/r9.6
     — all clear of the badge columns and the recs band; nothing stacked */
  // — ROYAL ENFIELD CONTINENTAL GT 650 (static, café-racer profile: red tank + cowl, twin pipes, spoked wheels)
  const BIKE_TANK='#D2222A', BIKE_FRAME='#26221f', BIKE_SEAT='#1d1a17';
  const chrome=mat('#b7bec4',{metalness:.85,roughness:.22}), alloy=mat('#8f9499',{metalness:.6,roughness:.4});
  const bikeG=new THREE.Group(); bikeG.position.copy(polar(6.12,8.6,0)); scene.add(bikeG);
  const bk=new THREE.Group(); bk.rotation.order='YXZ'; bk.rotation.y=-6.12-Math.PI/2; bikeG.add(bk);
  const wheels=[];
  for(const dx of [-.46,.5]){
    const wh=new THREE.Group(); wh.position.set(dx,.27,0); bk.add(wh);
    const tire=new THREE.Mesh(new THREE.TorusGeometry(.215,.05,10,28), mat('#241f1b',{roughness:.9}));
    tire.castShadow=true; wh.add(tire);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.17,.014,8,28), chrome); wh.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.05,14), alloy); hub.rotation.x=Math.PI/2; wh.add(hub);
    for(let i=0;i<10;i++){ const sp=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.32,4), chrome);
      sp.rotation.z=i/10*Math.PI*2; wh.add(sp); }
    wheels.push(wh);
  }
  // front fork + fenders
  for(const s of [-1,1]){ const fk=new THREE.Mesh(new THREE.CylinderGeometry(.014,.017,.5,8), chrome);
    fk.rotation.z=-.42; fk.position.set(.4,.5,s*.045); fk.castShadow=true; bk.add(fk); }
  for(const [dx,ry] of [[.5,.3],[-.46,.34]]){ const fd=new THREE.Mesh(new THREE.CylinderGeometry(.245,.245,.1,14,1,true,dx>0?2.2:1.9,1.35), alloy);
    fd.rotation.z=Math.PI/2; fd.rotation.y=Math.PI/2; fd.position.set(dx,ry,0); bk.add(fd); }
  // frame: backbone + downtube + rear subframe
  const fr1=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.6,8), mat(BIKE_FRAME,{metalness:.4,roughness:.5}));
  fr1.rotation.z=Math.PI/2-.12; fr1.position.set(.02,.52,0); bk.add(fr1);
  const fr2=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.34,8), mat(BIKE_FRAME,{metalness:.4,roughness:.5}));
  fr2.rotation.z=-.5; fr2.position.set(.3,.42,0); bk.add(fr2);
  const fr3=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.4,8), mat(BIKE_FRAME,{metalness:.4,roughness:.5}));
  fr3.rotation.z=1.15; fr3.position.set(-.3,.42,0); bk.add(fr3);
  // parallel-twin engine with fin stack
  const eng=new THREE.Group(); eng.position.set(.04,.33,0); bk.add(eng);
  const crank=new THREE.Mesh(new THREE.BoxGeometry(.26,.16,.16), alloy); crank.castShadow=true; eng.add(crank);
  for(let i=0;i<5;i++){ const fin=new THREE.Mesh(new THREE.BoxGeometry(.2,.014,.19), mat('#6d7378',{metalness:.7,roughness:.35}));
    fin.position.y=.1+i*.028; eng.add(fin); }
  const engCap=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.05,12), chrome); engCap.rotation.x=Math.PI/2; engCap.position.set(-.08,-.02,0); eng.add(engCap);
  // red teardrop tank with cream racing stripe + knee recess feel
  const tank=new THREE.Mesh(new THREE.SphereGeometry(.145,20,16), mat(BIKE_TANK,{roughness:.25,metalness:.2}));
  tank.scale.set(1.75,.72,.85); tank.position.set(.08,.585,0); tank.castShadow=true; bk.add(tank);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.015,10), chrome); cap.position.set(.1,.695,0); bk.add(cap);
  const stripe=new THREE.Mesh(new THREE.SphereGeometry(.146,20,16), mat('#F3E2C2',{roughness:.3}));
  stripe.scale.set(1.74,.71,.2); stripe.position.set(.08,.588,0); bk.add(stripe);
  // café seat + red rear cowl
  const seat=new THREE.Mesh(new THREE.BoxGeometry(.26,.045,.15), mat(BIKE_SEAT,{roughness:.85}));
  seat.position.set(-.22,.575,0); bk.add(seat);
  const cowl=new THREE.Mesh(new THREE.SphereGeometry(.09,14,12,0,Math.PI*2,0,Math.PI/2), mat(BIKE_TANK,{roughness:.25,metalness:.2}));
  cowl.scale.set(1.5,.9,.85); cowl.position.set(-.4,.565,0); cowl.castShadow=true; bk.add(cowl);
  // clip-on bars + mirrors
  const tri=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.06,10), alloy); tri.position.set(.35,.66,0); bk.add(tri);
  for(const s of [-1,1]){ const bar=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.16,8), chrome);
    bar.rotation.x=Math.PI/2; bar.rotation.z=-.15; bar.position.set(.36,.67,s*.11); bk.add(bar);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.07,8), mat('#241f1b')); grip.rotation.x=Math.PI/2; grip.position.set(.36,.665,s*.185); bk.add(grip);
    const mir=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.008,10), chrome); mir.rotation.x=Math.PI/2; mir.position.set(.34,.78,s*.14); bk.add(mir);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.1,6), chrome); stem.position.set(.345,.725,s*.13); bk.add(stem); }
  // round headlamp + chrome bezel
  const bezel=new THREE.Mesh(new THREE.CylinderGeometry(.062,.062,.05,16), chrome); bezel.rotation.z=Math.PI/2; bezel.position.set(.44,.6,0); bk.add(bezel);
  const headlight=new THREE.Mesh(new THREE.SphereGeometry(.052,12,10),
    new THREE.MeshStandardMaterial({color:'#FFF2D8', emissive:'#FFD9A0', emissiveIntensity:.9, roughness:.3}));
  headlight.position.set(.465,.6,0); bk.add(headlight);
  // twin upswept exhausts, one each side
  for(const s of [-1,1]){ const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.014,.017,.55,10), chrome);
    pipe.rotation.z=Math.PI/2-.1; pipe.position.set(-.14,.19,s*.1); pipe.castShadow=true; bk.add(pipe);
    const muf=new THREE.Mesh(new THREE.CylinderGeometry(.032,.024,.28,10), chrome);
    muf.rotation.z=Math.PI/2-.12; muf.position.set(-.5,.235,s*.11); muf.castShadow=true; bk.add(muf); }
  // kickstand lean — parked, not rolling
  bk.rotation.x=-.06;
  const stand=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.26,6), alloy); stand.rotation.x=.45; stand.position.set(.02,.14,-.09); bk.add(stand);
  [tank,seat,cowl].forEach(mm=>{ mm.userData={type:'egg-bike', group:bk, noLift:true}; clickables.push(mm); }); // EGG: click → rev
  // — VINYL turntable + floating headphones on a walnut plinth —
  const vg=new THREE.Group(); vg.position.copy(polar(5.99,8.7,0)); vg.rotation.y=5.99+Math.PI; scene.add(vg);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,.5,20), mat('#5a4632',{roughness:.7}));
  plinth.position.y=.25; plinth.castShadow=true; vg.add(plinth);
  const deck=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.05,20), mat('#2B2622',{roughness:.5}));
  deck.position.y=.53; vg.add(deck);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.014,28), mat('#141210',{roughness:.35}));
  disc.position.y=.565; vg.add(disc);
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.016,18), mat('#C25A2E',{roughness:.6}));
  label.position.y=.567; vg.add(label);
  const arm2=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.3,8), mat('#C9A15E',{metalness:.6,roughness:.35}));
  arm2.rotation.z=Math.PI/2-.3; arm2.rotation.y=.5; arm2.position.set(.16,.6,-.14); vg.add(arm2);
  const phones=new THREE.Group(); phones.position.y=1.15; vg.add(phones);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.16,.022,10,24,Math.PI), mat('#2B2622',{roughness:.6}));
  phones.add(band);
  for(const s of [-1,1]){ const cup=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.06,14), mat('#C25A2E',{roughness:.5}));
    cup.rotation.z=Math.PI/2; cup.position.set(s*.16,-.02,0); phones.add(cup); }
  // — paper plane, drifting a lazy loop —
  const pg2=new THREE.Group(); pg2.position.copy(polar(4.52,9.6,.70)); scene.add(pg2); // SPACING PASS: loops LOW, before the band — no longer drifts across the testimonial cards
  const pl=new THREE.Group(); pl.rotation.order='YXZ'; pg2.add(pl);
  for(const s of [-1,1]){ const wing=new THREE.Mesh(new THREE.CircleGeometry(.22,3), mat('#F7EDD9',{side:THREE.DoubleSide,roughness:.9}));
    wing.rotation.set(s*.35,0,-.5); wing.position.set(0,0,s*.05); wing.castShadow=true; pl.add(wing); }
  zoo.bike={bk, wheels, light:headlight};
  zoo.vinyl={disc, phones};
  zoo.plane={pl};
  // MUSIC PROMPT (EDIT ME — MUSIC_PROMPT_TEXT / MUSIC_BTN_*): a real 3D PUSH-BUTTON on the wall above
  // the turntable, next to the headphones — walnut backplate, brass rim, raised cream key face with the
  // label. Same click ('music') and hover glow as before, but it reads as a pressable object.
  const MUSIC_BTN_AZ=6.06, MUSIC_BTN_Y=.95;
  const mg2=new THREE.Group();
  mg2.position.copy(polar(MUSIC_BTN_AZ,10.74,MUSIC_BTN_Y)); mg2.rotation.y=MUSIC_BTN_AZ+Math.PI;
  const mBack=new THREE.Mesh(new THREE.BoxGeometry(1.5,.44,.06), mat('#4A3020',{roughness:.7}));           // walnut backplate
  const mRim=new THREE.Mesh(new THREE.BoxGeometry(1.38,.34,.05), mat('#C9A15E',{metalness:.5,roughness:.35})); // brass bezel
  mRim.position.z=.04;
  const mKey=new THREE.Mesh(new THREE.BoxGeometry(1.28,.26,.08), mat('#F7EDD9',{roughness:.85}));          // raised cream key
  mKey.position.z=.085;
  const mFaceTex=canvasTex(512,104,(ctx,w,h)=>{ // label printed on the key face
    ctx.textAlign='center'; ctx.fillStyle='#2B1D16';
    let lf=34; ctx.font=`800 ${lf}px Nunito`;
    while(ctx.measureText('♪  '+MUSIC_PROMPT_TEXT).width>w-40 && lf>16){ lf--; ctx.font=`800 ${lf}px Nunito`; }
    ctx.fillText('♪  '+MUSIC_PROMPT_TEXT, w/2, h/2+lf*.36);
  });
  const mLbl=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.26),
    new THREE.MeshStandardMaterial({map:mFaceTex, transparent:true, roughness:.85}));
  mLbl.position.z=.126;
  for(const nb of [-1,1]){ // brass mounting screws — same hardware language as the nailed decor
    const sc=new THREE.Mesh(new THREE.SphereGeometry(.032,8,8), mat('#d8d2c0',{metalness:.7,roughness:.3}));
    sc.position.set(nb*.66,.15,.035); mg2.add(sc);
    const sc2=sc.clone(); sc2.position.y=-.15; mg2.add(sc2);
  }
  for(const m3 of [mBack,mRim,mKey,mLbl]){ m3.userData={type:'music', group:mg2, noLift:true}; mg2.add(m3); clickables.push(m3); }
  decorGroup.add(mg2);
  zoo.ready=true;
}

/* ============ Act III — CONVEYOR-BELT photo gallery ============
   The knife-throw reveal was REPLACED by a circus-machine conveyor: the six polaroids hang from a
   walnut+brass belt track that spans (almost) the full visible wall, drift steadily to the left,
   shrink away at the far end and roll back in on the near end — a continuous loop.
   TUNING (EDIT ME): BELT_AZ0/1 = track span, BELT_SPEED = drift (rad/s — "normal", unhurried),
   BELT_EDGE = fade-out arc at each end, BELT_PH_Y = photo hang height. */
const BELT_AZ0=3.02, BELT_AZ1=3.64, BELT_SPAN=BELT_AZ1-BELT_AZ0; // POLISH PASS: belt recentered so the empty wall on BOTH sides is EQUAL (~1.9u to case card edge ≈2.85 and ~1.9u to ch1 plaque edge ≈3.81) — balanced isolation instead of lopsided dead air
const BELT_SPEED=.045, BELT_EDGE=.06, BELT_PH_Y=1.40;
const journey=[];
let lastT=0;
const _t1=new THREE.Vector3(), _t2=new THREE.Vector3();
// shared impact/celebration puff pool (used by the gym mini-game reward burst)
const PUFF_N=64, puffVel=new Float32Array(PUFF_N*3), puffLife=new Float32Array(PUFF_N);
const puffPos=new Float32Array(PUFF_N*3); for(let i=0;i<PUFF_N;i++) puffPos[i*3+1]=-999;
const puffGeo=new THREE.BufferGeometry();
puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPos,3));
const puffPts=new THREE.Points(puffGeo, new THREE.PointsMaterial({color:'#FFD9A0', size:.1, transparent:true, opacity:.9, depthWrite:false}));
puffPts.visible=false; scene.add(puffPts);
let puffCursor=0;

/* ============ Act III — journey story: milestone path, chapter stations, conveyor polaroids ============ */
function polaroidTex(ph,i){
  const stickerCols=['#E5A83B','#7BA05B','#5B84A0','#E8785A','#C25A2E','#4A2E52'];
  const drawSticker=(ctx,h)=>{ ctx.save(); ctx.translate(34,h-46); ctx.rotate(-.09);
    /* STICKER FIT (EDIT ME — STICKER_MAX): the pill starts 26px from the left edge of a 256px
       texture, so anything past ~216px ran clean off the print. The label now shrinks to fit
       instead of overflowing. */
    const STICKER_MAX=216;
    let fpx=17, tw;
    for(;;){ ctx.font=`800 ${fpx}px Nunito`; tw=ctx.measureText(ph.tag).width+22;
      if(tw<=STICKER_MAX || fpx<=11) break; fpx--; }
    ctx.fillStyle=stickerCols[i%6]; ctx.beginPath(); ctx.roundRect(-8,-16,tw,30,6); ctx.fill();
    ctx.fillStyle='#FBF3E3'; ctx.textAlign='left'; ctx.fillText(ph.tag,3,fpx*0.35-1); ctx.restore(); };
  const tex=canvasTex(256,296,(ctx,w,h)=>{
    ctx.fillStyle='#FBF3E3'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=3; ctx.strokeRect(1.5,1.5,w-3,h-3);
    ctx.fillStyle='#2a2320'; ctx.fillRect(20,20,w-40,w-40); // photo slot (PHOTO_SRC swaps in async)
    ctx.fillStyle='rgba(251,243,227,.5)'; ctx.save(); ctx.translate(w/2,20+(w-40)/2); ctx.beginPath();
    for(let s2=0;s2<10;s2++){ const rr=s2%2?14:34, aa=s2*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
    drawSticker(ctx,h);
  });
  const img=new Image(); img.crossOrigin='anonymous';
  img.onload=()=>{ const c=tex.image, ctx=c.getContext('2d'), iw=c.width-40;
    const s2=Math.max(iw/img.width, iw/img.height);
    ctx.save(); ctx.beginPath(); ctx.rect(20,20,iw,iw); ctx.clip();
    ctx.drawImage(img,20+(iw-img.width*s2)/2,20+(iw-img.height*s2)/2,img.width*s2,img.height*s2);
    ctx.restore(); drawSticker(ctx,c.height); tex.needsUpdate=true; };
  if(ph.src) img.src=ph.src;
  return tex;
}
/* PLAQUE SKINS (EDIT ME — wood / frame / rule / star)
   Same idea as the case cards: `hover` deepens the walnut and lifts the frame to a pale brass.
   The role pill (#7BA05B / #E8785A), the company name and the caption keep their exact colours —
   hovering must not restate your work history in a different palette. */
const PLAQUE_SKIN = {
  base:  {wood:['#573a24','#4A3020','#38240f'], frame:'#C9A15E', rule:'rgba(201,161,94,.4)',  star:'#C9A15E'},
  hover: {wood:['#3E2818','#31200F','#221304'], frame:'#F0D9A8', rule:'rgba(240,217,168,.55)', star:'#F0D9A8'}
};
function stationTex(c,i,hover){
  const SK = hover ? PLAQUE_SKIN.hover : PLAQUE_SKIN.base;
  return canvasTex(600,378,(ctx,w,h)=>{ // WIDER canvas (512→600) matches the 1.86×1.15 plaque — company name + caption keep side margins
    // card body: warm walnut with a vertical sheen + soft edge vignette (self-contained contrast, no wall backing needed)
    const bg=ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,SK.wood[0]); bg.addColorStop(.5,SK.wood[1]); bg.addColorStop(1,SK.wood[2]);
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(6,6,w-12,h-12,22); ctx.fill();
    // gold double frame
    ctx.strokeStyle=SK.frame; ctx.lineWidth=5; ctx.beginPath(); ctx.roundRect(18,18,w-36,h-36,16); ctx.stroke();
    ctx.strokeStyle=SK.rule; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(28,28,w-56,h-56,11); ctx.stroke();
    // corner star accents — ties the cards to the circus decor language
    const star=(x,y,r)=>{ ctx.fillStyle=SK.star; ctx.save(); ctx.translate(x,y); ctx.beginPath();
      for(let s=0;s<10;s++){ const rr=s%2?r*.45:r, aa=s*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr); }
      ctx.closePath(); ctx.fill(); ctx.restore(); };
    [[46,46],[w-46,46],[46,h-46],[w-46,h-46]].forEach(p=>star(p[0],p[1],8));
    ctx.textAlign='center';
    if('letterSpacing' in ctx) ctx.letterSpacing='6px';
    ctx.fillStyle='#D9B06C'; ctx.font='800 24px Nunito';
    const eb='CHAPTER '+(i+1)+' · '+c.dates.toUpperCase();
    ctx.fillText(eb, w/2, 66);
    const ew=ctx.measureText(eb).width/2; // flanking rules around the eyebrow
    ctx.strokeStyle='rgba(217,176,108,.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(w/2-ew-16,58); ctx.lineTo(w/2-ew-44,58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2+ew+16,58); ctx.lineTo(w/2+ew+44,58); ctx.stroke();
    if('letterSpacing' in ctx) ctx.letterSpacing='1px';
    ctx.font='50px "Alfa Slab One"';
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillText(c.co, w/2+3, 137); // soft inset shadow on the name
    ctx.fillStyle='#F7EDD9'; ctx.fillText(c.co, w/2, 134);
    ctx.font='800 23px Nunito'; const rw=ctx.measureText(c.role).width+40;
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(w/2-rw/2+2,161,rw,42,21); ctx.fill();
    ctx.fillStyle=i?'#E8785A':'#7BA05B'; ctx.beginPath(); ctx.roundRect(w/2-rw/2,158,rw,42,21); ctx.fill();
    ctx.fillStyle='#2B1D16'; ctx.fillText(c.role, w/2, 187);
    ctx.font='italic 400 22px Nunito'; ctx.fillStyle='rgba(247,237,217,.88)';
    wrapText(ctx, c.cap, w/2, 246, w-140, 30);
  });
}
function buildJourney(){
  /* — MILESTONE PATH (EDIT ME — labels/captions below): painted straight onto the wall between the two
     chapter plaques. A dashed rising arc from 2020 (ch1, right) to PRESENT (ch2, left) with star
     milestone nodes + an arrowhead into chapter 2 — the "then → now" growth story told visually. */
  const PATH_A=A(2)+.12, PATH_SPAN=.17; // centred in the gap between the plaques (az ≈3.95–4.14)
  const MILESTONES=[ // right → left; [year, caption]
    ['2021','starting my journey'], ['2023','leveling up my game'], ['PRESENT','center stage']];
  const PATH_QUOTE='Every act builds on the last.'; // EDIT ME
  const pathTex=canvasTex(1024,690,(ctx,w,h)=>{
    ctx.translate(w,0); ctx.scale(-1,1); // pre-mirror (BackSide) — canvas-left = screen-left (ch2)
    ctx.shadowColor='rgba(0,0,0,.35)'; ctx.shadowOffsetX=3; ctx.shadowOffsetY=4;
    /* PATH SHAPE (EDIT ME — P0/C/P2): end nodes pulled inboard (120→185 from each edge) and the
       whole arc raised ~65px, so captions below the 2021/2023 nodes have room for a second line
       without running off the bottom of the texture. */
    const P0={x:w-185,y:440}, C={x:w/2,y:530}, P2={x:185,y:320}; // gentle sag then rise, right → left
    const pt=t=>({x:(1-t)*(1-t)*P0.x+2*(1-t)*t*C.x+t*t*P2.x, y:(1-t)*(1-t)*P0.y+2*(1-t)*t*C.y+t*t*P2.y});
    ctx.strokeStyle='rgba(217,176,108,.95)'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.setLineDash([1,24]);
    ctx.beginPath(); ctx.moveTo(P0.x,P0.y); ctx.quadraticCurveTo(C.x,C.y,P2.x,P2.y); ctx.stroke(); ctx.setLineDash([]);
    const dir=Math.atan2(P2.y-C.y,P2.x-C.x); // arrowhead just past the PRESENT node, pointing at ch2
    ctx.save(); ctx.translate(P2.x+Math.cos(dir)*52,P2.y+Math.sin(dir)*52); ctx.rotate(dir);
    ctx.fillStyle='#D9B06C'; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-16,-14); ctx.lineTo(-16,14);
    ctx.closePath(); ctx.fill(); ctx.restore();
    const star=(x,y,r,col)=>{ ctx.fillStyle=col; ctx.save(); ctx.translate(x,y); ctx.beginPath();
      for(let s=0;s<10;s++){ const rr=s%2?r*.45:r, aa=s*Math.PI/5-Math.PI/2; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr); }
      ctx.closePath(); ctx.fill(); ctx.restore(); };
    ctx.textAlign='center';
    /* LABEL FIT (EDIT ME — CAP_MAX/CAP_MIN): captions were drawn at a fixed size from the node
       centre, so "starting my journey" ran off the right edge of the texture and collided with
       "leveling up my game". Each caption now gets a width BUDGET — the smaller of its distance
       to the texture edge and half its distance to the nearest neighbouring node — then wraps to
       at most two lines, shrinking only when wrapping alone isn't enough. */
    const CAP_MAX=46, CAP_MIN=28;
    const nodes=[0,.5,1].map(t=>pt(t)), capSide=[false,false,true]; // false = caption below the node
    const capBudget=i=>{ const q=nodes[i]; let d=Math.min(q.x, w-q.x); // clear of the texture edge
      // only captions on the SAME side of the path can ever collide, so only those constrain width
      nodes.forEach((r,j)=>{ if(j!==i && capSide[j]===capSide[i]) d=Math.min(d, Math.abs(r.x-q.x)/2); });
      return Math.max(170, d*2-52); };   // 52px of guaranteed air between neighbouring captions
    const fitCap=(txt,maxW)=>{
      for(let px=CAP_MAX; px>=CAP_MIN; px-=2){
        ctx.font=`italic 400 ${px}px Nunito`;
        const ls=wrapLines(ctx,txt,maxW);
        if(ls.length<=2 && Math.max(...ls.map(l=>ctx.measureText(l).width))<=maxW) return {px,lines:ls};
      }
      ctx.font=`italic 400 ${CAP_MIN}px Nunito`;
      return {px:CAP_MIN, lines:wrapLines(ctx,txt,maxW).slice(0,2)};
    };
    [[0,false],[.5,false],[1,true]].forEach(([t,above],mi)=>{ const p=pt(t), [yr,cap]=MILESTONES[mi];
      ctx.fillStyle='#3c2617'; ctx.beginPath(); ctx.arc(p.x,p.y,30,0,7); ctx.fill();
      ctx.strokeStyle='#D9B06C'; ctx.lineWidth=4; ctx.stroke();
      star(p.x,p.y,16,'#FFE9B0');
      if('letterSpacing' in ctx) ctx.letterSpacing='3px';
      const yrFont = yr==='PRESENT' ? '800 58px Nunito' : '800 82px Nunito';
      ctx.fillStyle='#F7EDD9'; ctx.font=yrFont; ctx.fillText(yr,p.x,p.y+(above?-58:86));
      if('letterSpacing' in ctx) ctx.letterSpacing='0px';
      // caption: wrapped + auto-sized, stacked clear of the year in whichever direction it sits
      const {px:cpx, lines:cl}=fitCap(cap, capBudget(mi)), clh=Math.round(cpx*1.14);
      ctx.fillStyle='rgba(247,237,217,.8)'; ctx.font=`italic 400 ${cpx}px Nunito`;
      if(above){ const last=p.y-108; cl.forEach((l,k)=>ctx.fillText(l,p.x,last-(cl.length-1-k)*clh)); }
      else     { const first=p.y+142; cl.forEach((l,k)=>ctx.fillText(l,p.x,first+k*clh)); } });
    /* QUOTE: was a hard 84px, wide enough that its flanking stars fell off the texture. Shrinks
       to fit with a comfortable margin, and the stars are placed from the MEASURED width. */
    let qpx=84; ctx.font=`italic 700 ${qpx}px Nunito`;
    while(ctx.measureText(PATH_QUOTE).width > w-200 && qpx>44){ qpx-=2; ctx.font=`italic 700 ${qpx}px Nunito`; }
    ctx.fillStyle='rgba(247,237,217,.92)'; ctx.fillText(PATH_QUOTE,w/2,106);
    const qw=ctx.measureText(PATH_QUOTE).width/2;
    star(w/2-qw-40,94,10,'#D9B06C'); star(w/2+qw+40,94,10,'#D9B06C');
    ctx.shadowColor='transparent';
    ctx.globalCompositeOperation='destination-out'; // weathered paint, same treatment as the hero print
    for(let i=0;i<450;i++){ ctx.fillStyle=`rgba(0,0,0,${Math.random()*.35})`;
      ctx.fillRect(Math.random()*w,Math.random()*h,2.2,2.2); }
    ctx.globalCompositeOperation='source-over';
  });
  const pathMesh=new THREE.Mesh(new THREE.CylinderGeometry(10.88,10.88,1.25,32,1,true,PATH_A-PATH_SPAN/2,PATH_SPAN),
    new THREE.MeshStandardMaterial({map:pathTex, transparent:true, side:THREE.BackSide, roughness:.95}));
  pathMesh.position.y=1.55; scene.add(pathMesh); // same vertical band as the plaques
  // — chapter stations: ch2 lamp warmer/brighter = the "then → now" growth cue —
  CHAPTERS.forEach((c,i)=>{
    const ang=A(2)+(i?.30:-.06); // ch2 eCW LEFT (larger azimuth); ch1 Synoric pulled RIGHTWARD toward ch2 (−.26→−.04) so a wide empty band separates it from the conveyor gallery (belt ends 3.50, ch1 edge ≈3.81)
    const g=new THREE.Group();
    const plq=new THREE.Mesh(new THREE.PlaneGeometry(1.86,1.15), // BIGGER PLAQUES (EDIT ME): now 1.86×1.15 — extra width so long company names never touch the frame
      new THREE.MeshStandardMaterial({map:stationTex(c,i), transparent:true, roughness:.8}));
    /* Depth cue on hover = darker wood + pale-brass frame + a cast shadow, cross-faded on a second
       identical plane. NOT an emissive tint, which would recolour the whole plaque. */
    const plqShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.86*1.30, 1.15*1.42),
      new THREE.MeshBasicMaterial({map:plaqueShadowTex, color:0x000000, transparent:true,
        opacity:0, depthWrite:false, toneMapped:false}));
    plqShadow.position.set(.02,-.05,-.015); plqShadow.renderOrder=-1; g.add(plqShadow);
    const plqHovMat=new THREE.MeshStandardMaterial({map:stationTex(c,i,true), transparent:true,
      opacity:0, roughness:.8, depthWrite:false});
    const plqHov=new THREE.Mesh(new THREE.PlaneGeometry(1.86,1.15), plqHovMat);
    plqHov.position.z=.004; g.add(plqHov);
    g.add(plq); addNail(g,.62);
    g.position.copy(polar(ang,10.7,1.62)); g.rotation.y=ang+Math.PI; // LOWERED to y1.62 — plaque top (≈2.20) stays clear of the bulb garland (sags to ≈2.30), no more bulbs cutting across the cards
    // HOVER POP-OUT (same language as the testimonial cards): eases toward the camera and enlarges
    const pp=polar(ang,9.35,1.78);
    plq.userData={type:'plaque', group:g, noLift:true, hovMat:plqHovMat, shadowMat:plqShadow.material,
      base:{x:g.position.x,y:g.position.y,z:g.position.z}, pop:{x:pp.x,y:pp.y,z:pp.z}};
    clickables.push(plq);
    decorGroup.add(g);
    /* GLARE FIX (EDIT ME — lamp intensity/pos): chapter lamps dimmed (26/13 → 11/7) and pulled off the
       wall (r 10.0 → 9.6, falloff 6.5 → 5.5) so they warm the zone WITHOUT washing out the plaque text. */
    const lamp=new THREE.PointLight(i?'#FFCF8A':'#E8B27A', i?11:7, 5.5, 1.9);
    lamp.position.copy(polar(ang,9.6,2.85)); scene.add(lamp);
    // (the dark wall backing behind each plaque was REMOVED — the card now carries its own contrast)
  });
  // — THE CONVEYOR GALLERY: photos ride a circus-machine belt spanning the whole gallery wall —
  /* BELT ZONE (EDIT ME — BELT_AZ0/1 near the top): az 2.82–3.58 — the full stretch between the last
     scatter pin (≈2.81) and the ch1 plaque edge (≈3.59), i.e. edge-to-edge of the screen when this
     wall is in view. Structure: a walnut track band with brass edge (same wood as the case stages),
     two spinning brass wheels at the ends, and the six polaroids hanging below, evenly pitched.
     The render loop drifts them leftward, scales them away at the far end and loops them back in. */
  const trackH=.14, trackY=2.02;
  const track=new THREE.Mesh(new THREE.CylinderGeometry(10.66,10.66,trackH,48,1,true,BELT_AZ0-.015,BELT_SPAN+.03),
    new THREE.MeshStandardMaterial({map:stageStripeTex, side:THREE.BackSide, roughness:.8}));
  track.position.y=trackY; scene.add(track);
  const under=new THREE.Mesh(new THREE.CylinderGeometry(10.665,10.665,.03,48,1,true,BELT_AZ0-.015,BELT_SPAN+.03),
    new THREE.MeshStandardMaterial({color:'#C9A15E', metalness:.5, roughness:.4, side:THREE.BackSide}));
  under.position.y=trackY-trackH/2-.015; scene.add(under); // brass rail the clips ride along
  lifeProps.beltWheels=[];
  for(const az of [BELT_AZ0, BELT_AZ1]){ // end wheels — the "machinery" that sells the loop
    const wg=new THREE.Group(); wg.position.copy(polar(az,10.58,trackY)); wg.rotation.y=az+Math.PI; scene.add(wg);
    const wheel=new THREE.Group(); wg.add(wheel);
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(.15,.035,10,24), mat('#C9A15E',{metalness:.55,roughness:.35})));
    for(let s=0;s<4;s++){ const sp=new THREE.Mesh(new THREE.BoxGeometry(.27,.03,.03), mat('#4A3020',{roughness:.6}));
      sp.rotation.z=s*Math.PI/4; wheel.add(sp); }
    wheel.add(new THREE.Mesh(new THREE.SphereGeometry(.045,10,10), mat('#8a5a3a',{roughness:.5})));
    lifeProps.beltWheels.push(wheel);
  }
  PHOTOS.forEach((ph,i)=>{
    const g=new THREE.Group();
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.94,1.08), // slightly smaller prints — all six fit the trimmed belt with clear air between
      new THREE.MeshStandardMaterial({map:polaroidTex(ph,i), transparent:true, roughness:.85}));
    m.userData={type:'photo', idx:i, group:g, noLift:true}; // belt owns the position — no hover lift
    g.add(m); addNail(g,.49); // the clip that hangs the print from the brass rail
    decorGroup.add(g); clickables.push(m);
    journey.push({g, m, off0:((i+.5)/PHOTOS.length)*BELT_SPAN, rz:(i%2? -.03:.03)}); // half-slot phase — no photo parks exactly on an edge (reduced-motion belt is parked)
  });
  /* "EXPLORE GALLERY" (EDIT ME — GALLERY_LABEL / position): pinned ticket mid-path below the quote —
     same decor language (nail, cream pill, sway); click opens the full photo gallery overlay. */
  const gg=new THREE.Group();
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.30), // UNIFIED BADGE SPEC: 1.2×.30 at y.60
    new THREE.MeshStandardMaterial({map:badgeTexf(GALLERY_LABEL,'x'), transparent:true, roughness:.8}));
  gm.userData={type:'gallery', group:gg};
  gg.add(gm); addNail(gg,.17);
  const GALLERY_BADGE_AZ=(BELT_AZ0+BELT_AZ1)/2; // centred under the conveyor gallery
  gg.position.copy(polar(GALLERY_BADGE_AZ,10.7,.62)); gg.rotation.y=GALLERY_BADGE_AZ+Math.PI;
  decorGroup.add(gg); clickables.push(gm);
  if(!reduced) swayers.push({obj:gg, phase:3.4, amp:.02});
}

/* ============ about avatar on pedestal (q1) ============ */
{
  const ang = A(0)-.145; // avatar sits between the wall text (left) and video (right)
  /* CLIPPING FIX (EDIT ME — ABOUT_PROP_SAFE_R): the character tours + presents on the r 7.8 ring, so
     every floor prop in this quadrant must keep its inner edge outside r 7.8 + ABOUT_PROP_SAFE_R.
     The pedestal (radius .7) derives its radius from that rule (8.3 → 8.95) — no more leg clipping
     during the walk-in, tour, or the presenting hold. */
  const ABOUT_PROP_SAFE_R=.45, PED_R=7.8+ABOUT_PROP_SAFE_R+.7; // = 8.95
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,.5,20), mat('#1F5E5B'));
  ped.position.copy(polar(ang,PED_R,.5)); ped.castShadow=true; scene.add(ped);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(.56,.05,8,20), mat('#F0E3C8'));
  trim.rotation.x=Math.PI/2; trim.position.copy(polar(ang,PED_R,.76)); scene.add(trim);
  const avTex = canvasTex(160,200,(ctx,w,h)=>{
    ctx.fillStyle='#E8785A'; ctx.beginPath(); ctx.roundRect(w*.3,h*.45,w*.4,h*.4,16); ctx.fill(); // torso
    ctx.fillStyle='#F0C9A0'; ctx.beginPath(); ctx.arc(w/2,h*.3,w*.22,0,7); ctx.fill(); // head
    ctx.fillStyle='#2B1D16'; ctx.beginPath(); ctx.arc(w/2,h*.17,w*.19,Math.PI,0); ctx.fill(); // hair
    ctx.beginPath(); ctx.arc(w*.43,h*.29,3,0,7); ctx.arc(w*.57,h*.29,3,0,7); ctx.fill();
    ctx.strokeStyle='#2B1D16'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(w/2,h*.34,8,.2,Math.PI-.2); ctx.stroke();
    ctx.strokeStyle='#F0C9A0'; ctx.lineWidth=8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(w*.32,h*.5); ctx.lineTo(w*.16,h*.38); ctx.stroke(); // waving arm
    ctx.beginPath(); ctx.moveTo(w*.68,h*.5); ctx.lineTo(w*.8,h*.68); ctx.stroke();
  });
  const av = new THREE.Mesh(new THREE.PlaneGeometry(.8,1),
    new THREE.MeshStandardMaterial({map:avTex, transparent:true, roughness:.9, side:THREE.DoubleSide}));
  av.position.copy(polar(ang,PED_R,1.28)); av.rotation.y=ang+Math.PI; scene.add(av);
}

/* ============ ABOUT quadrant — video embedded in the wall + "My Story" ticket ============ */
let vid=null, videoReady=false, videoFailed=false;
let vGroup=null, posterMat=null, screenMat=null, vFrameMat=null, muteTex=null;
let vScreenPoint=null, vScreenAng=0; // world point + azimuth of the wall screen (set in buildAboutExtras) — the theater camera's anchor
function drawShowreelPoster(ctx,w,h,fallback){
  ctx.translate(w,0); ctx.scale(-1,1); // pre-mirror — curved surface is viewed from inside the ring
  ctx.fillStyle='#17423F'; ctx.fillRect(0,0,w,h);
  const vg=ctx.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,w*.6);
  vg.addColorStop(0,'rgba(255,240,210,.07)'); vg.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
  for(let i=0;i<1600;i++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.05)`;
    ctx.fillRect(Math.random()*w,Math.random()*h,2,2); }
  ctx.textAlign='center';
  if('letterSpacing' in ctx) ctx.letterSpacing='4px';
  ctx.fillStyle='#F7EDD9'; ctx.font='60px "Alfa Slab One"';
  ctx.fillText(fallback?'FILM COMING SOON':'THE SHOWREEL', w/2, 116);
  if('letterSpacing' in ctx) ctx.letterSpacing='0px';
  if(fallback){
    ctx.fillStyle='rgba(247,237,217,.8)'; ctx.font='800 26px Nunito';
    ctx.fillText("I'm cooking something. Check back soon.", w/2, h*.58);
    return;
  }
  for(let i=0;i<14;i++){ const a2=i/14*Math.PI*2; // bulb ring around the play button
    ctx.fillStyle='#FFE2A0'; ctx.beginPath(); ctx.arc(w/2+Math.cos(a2)*112,h*.56+Math.sin(a2)*112,6,0,7); ctx.fill(); }
  ctx.fillStyle='#E5A83B'; ctx.beginPath(); ctx.arc(w/2,h*.56,88,0,7); ctx.fill();
  ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=6; ctx.stroke();
  ctx.fillStyle='#2B1D16'; ctx.beginPath();
  ctx.moveTo(w/2-26,h*.56-42); ctx.lineTo(w/2+46,h*.56); ctx.lineTo(w/2-26,h*.56+42); ctx.closePath(); ctx.fill();
  if('letterSpacing' in ctx) ctx.letterSpacing='8px';
  ctx.fillStyle='rgba(247,237,217,.85)'; ctx.font='800 24px Nunito';
  ctx.fillText('★  CLICK TO PLAY  ★', w/2, h-40);
  if('letterSpacing' in ctx) ctx.letterSpacing='0px';
}
function redrawMute(){
  if(!muteTex) return;
  const c=muteTex.image, ctx=c.getContext('2d');
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.arc(80,80,68,0,7); ctx.fill();
  ctx.strokeStyle='#C0392B'; ctx.lineWidth=7; ctx.stroke();
  ctx.fillStyle='#2B1D16'; ctx.beginPath();
  ctx.moveTo(44,66); ctx.lineTo(64,66); ctx.lineTo(86,46); ctx.lineTo(86,114); ctx.lineTo(64,94); ctx.lineTo(44,94); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2B1D16'; ctx.lineWidth=8; ctx.lineCap='round';
  if(!vid || vid.muted){ ctx.beginPath(); ctx.moveTo(100,64); ctx.lineTo(124,96); ctx.moveTo(124,64); ctx.lineTo(100,96); ctx.stroke(); }
  else{ for(const r of [16,28]){ ctx.beginPath(); ctx.arc(90,80,r,-.9,.9); ctx.stroke(); } }
  muteTex.needsUpdate=true;
}
function glowPulse(){ // soft bloom around the recessed frame when playback starts
  if(reduced || !vFrameMat) return;
  gsap.fromTo(vFrameMat,{emissiveIntensity:.06},{emissiveIntensity:.55,duration:.4,yoyo:true,repeat:1,
    onComplete:()=>{vFrameMat.emissiveIntensity=.12;}});
  gsap.fromTo(vGroup.scale,{x:.985,y:.985,z:.985},{x:1,y:1,z:1,duration:.7,ease:'back.out(2)'});
}
/* ===== SHOWREEL THEATER — clicking the wall video ZOOMS BEHIND THE CHARACTER (waist-up, back view)
   so they watch the reel run on the wall screen like a movie (sample-image framing). The camera blend
   lives in the render loop; here only the eased state + UI:
   · cinema3d.k    = seat-framing blend 0→1 (glide behind the character)
   · cinema3d.push = the slow dolly "into the screen" while the reel plays
   The SAME hidden <video> feeds the wall's VideoTexture — playback never restarts or stutters. */
const theaterUi=document.getElementById('theater-ui');
let cinemaOpen=false, cinemaTl=null;
const cinema3d={k:0,push:0};
const _cinPos=new THREE.Vector3(), _cinLook=new THREE.Vector3(), _watchSpot=new THREE.Vector3();
const CIN_CHAR_SCALE=.13; // EDIT ME — character shrinks to this while the reel plays (≈10% of frame height)
function openCinema(){
  if(cinemaOpen || videoFailed) return; cinemaOpen=true;
  theaterUi.classList.add('on');
  /* SCROLL LOCK: openOverlay sets documentElement overflow:hidden — page scroll is the ONLY camera
     driver, so the scroll choreography freezes while the theater camera owns the frame;
     closeOverlay (in closeCinema's onComplete) restores normal scrolling. */
  openOverlay(theaterUi);
  cinemaTl?.kill(); // never orphan an in-flight open/close tween on rapid toggles
  if(reduced){ cinemaTl=gsap.to(cinema3d,{k:1,push:.4,duration:.35,ease:'none'}); return; }
  /* OPEN TIMELINE — quick + smooth: .55s power3.inOut glide to the seat framing (the character shrink
     rides ease(cinema3d.k) in the render loop), then a 1.4s push toward the screen while the movie runs. */
  cinemaTl=gsap.timeline()
    .to(cinema3d,{k:1,duration:.55,ease:'power3.inOut'},0)
    .to(cinema3d,{push:1,duration:1.4,ease:'power2.inOut'},.6);
}
function closeCinema(){
  if(!cinemaOpen) return; cinemaOpen=false;
  cinemaTl?.kill();
  /* SCROLL UNLOCK IMMEDIATELY (not on tween end): scrolling away closes the theater and the page keeps
     scrolling without a hitch — the camera glides back while the scroll choreography resumes. */
  theaterUi.classList.remove('on'); closeOverlay(theaterUi);
  /* CLOSE TIMELINE — the mirrored opposite, quick: pull out of the push and glide back to the
     scroll-driven framing (the character grows back via the render-loop shrink factor). */
  cinemaTl=gsap.timeline()
    .to(cinema3d,{push:0,duration:reduced?.25:.35,ease:'power2.inOut'},0)
    .to(cinema3d,{k:0,duration:reduced?.35:.55,ease:'power3.inOut'},reduced?0:.15);
}
document.getElementById('cinema-x').addEventListener('click',e=>{ e.stopPropagation(); closeCinema(); });
// SCROLL-TO-EXIT: any scroll intent while the theater is open closes it and scrolling continues seamlessly
for(const ev of ['wheel','touchmove']) addEventListener(ev,()=>{ if(cinemaOpen) closeCinema(); },{passive:true});
/* COMING-SOON REEL — owns the wall screen whenever there's no playable VIDEO_SRC. The gif is drawn
   into an offscreen canvas every frame (that's how an animated gif becomes a live WebGL texture) and
   the coming-soon type is burned in over it, so the whole thing reads as a projection rather than a
   dialog floating in front of the scene. */
let reelTex=null, reelT0=0, reelGif=null; // reelGif = the decoded sprite strip
function ensureFallbackReel(){
  if(reelTex || !screenMat) return;
  if(REEL_SHEET && !reelGif){
    /* One decode of the whole strip, then we blit a different cell each frame. No DOM node needed
       and nothing for the browser to throttle. */
    reelGif=new Image();
    reelGif.onerror=()=>{ reelGif=null; }; // art missing → dark projection + type, the reel still runs
    reelGif.src=REEL_SHEET;
  }
  const c=document.createElement('canvas'); c.width=1024; c.height=576;
  reelTex=new THREE.CanvasTexture(c);
  reelTex.colorSpace=THREE.SRGBColorSpace; reelTex.wrapS=THREE.RepeatWrapping; reelTex.repeat.x=-1; reelTex.offset.x=1; // un-mirror for BackSide
  screenMat.map=reelTex; screenMat.color.set('#fff'); screenMat.needsUpdate=true;
  gsap.to(posterMat,{opacity:0,duration:.6});
  reelT0=performance.now();
}
function drawFallbackReel(){ // called from the render loop while the reel owns the screen
  const c=reelTex.image, ctx=c.getContext('2d'), w=c.width, h=c.height;
  const t=(performance.now()-reelT0)/1000;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#0C0810'; ctx.fillRect(0,0,w,h);
  /* NO canvas mirror here. The screen is the inside of the curved wall (BackSide), which needs the
     content flipped exactly ONCE — and reelTex already does that with repeat.x=-1 / offset.x=1.
     The old reel ALSO flipped the canvas, so the two cancelled out and every word came back
     reversed. Elsewhere in this file (the wall print, the poster) the flip is done on the canvas
     instead and those textures carry no repeat trick — one flip, either way, never both. */
  ctx.save();
  if(reelGif && reelGif.naturalWidth){
    // advance the flipbook off the render clock — not off the browser's gif timer
    const fw=reelGif.naturalWidth/REEL_COLS, fh=reelGif.naturalHeight/REEL_ROWS;
    const f=Math.floor(t*REEL_FPS)%REEL_FRAMES, sx=(f%REEL_COLS)*fw, sy=Math.floor(f/REEL_COLS)*fh;
    // STRETCHED to fill the screen edge to edge (swap to the `cover` maths below to crop instead)
    ctx.drawImage(reelGif, sx,sy,fw,fh, 0,0,w,h);
  }
  // scrim so the type stays legible over any frame of the art
  const sc=ctx.createLinearGradient(0,0,0,h);
  sc.addColorStop(0,'rgba(10,7,14,.70)'); sc.addColorStop(.44,'rgba(10,7,14,.20)'); sc.addColorStop(1,'rgba(10,7,14,.84)');
  ctx.fillStyle=sc; ctx.fillRect(0,0,w,h);
  ctx.textAlign='center';
  if('letterSpacing' in ctx) ctx.letterSpacing='11px';
  ctx.fillStyle='#D9B06C'; ctx.font='800 27px Nunito';
  ctx.fillText('THE SHOWREEL', w/2, h*.235);
  if('letterSpacing' in ctx) ctx.letterSpacing='2px';
  // auto-fit: Alfa Slab One is wide, so a longer REEL_TITLE would run off the screen edge
  const TT=REEL_TITLE.toUpperCase();
  let tpx=96; ctx.font=`${tpx}px "Alfa Slab One"`;
  while(ctx.measureText(TT).width > w-150 && tpx>40){ tpx-=3; ctx.font=`${tpx}px "Alfa Slab One"`; }
  ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillText(TT, w/2+5, h*.53+5);
  ctx.fillStyle='#F7EDD9'; ctx.fillText(TT, w/2, h*.53);
  if('letterSpacing' in ctx) ctx.letterSpacing='0px';
  let spx=33; ctx.font=`800 ${spx}px Nunito`;
  while(ctx.measureText(REEL_SUB).width > w-200 && spx>18){ spx-=1; ctx.font=`800 ${spx}px Nunito`; }
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillText(REEL_SUB, w/2+3, h*.685+3);
  ctx.fillStyle='rgba(247,237,217,.94)'; ctx.fillText(REEL_SUB, w/2, h*.685);
  // slow blinking marker so the frame never looks like a frozen still
  const bl=.35+.35*Math.sin(t*2.2);
  ctx.fillStyle='rgba(232,120,90,'+bl.toFixed(3)+')';
  ctx.beginPath(); ctx.arc(w/2, h*.79, 7, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle='rgba(255,255,255,'+(Math.random()*.03)+')'; ctx.fillRect(0,0,w,h); // projector flicker
  const vg=ctx.createRadialGradient(w/2,h/2,h*.3,w/2,h/2,w*.62);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
  reelTex.needsUpdate=true;
}
function toggleVideo(){
  if(!posterMat) return;
  /* No reel yet (or the URL was blocked) → the coming-soon art takes over the WALL SCREEN and the
     theater camera runs as normal. Nothing is layered in front of the scene. */
  if(videoFailed || !VIDEO_SRC){ ensureFallbackReel(); glowPulse(); openCinema(); return; }
  if(!vid){ // first click: bind the in-DOM cinema <video>, drive a THREE.VideoTexture on the wall
    vid=document.getElementById('cinema-video');
    vid.muted=true; vid.loop=true; vid.playsInline=true; vid.crossOrigin='anonymous'; vid.preload='auto';
    vid.src=VIDEO_SRC;
    vid.addEventListener('error',()=>{ videoFailed=true;
      ensureFallbackReel(); redrawMute(); }); // seamless swap to the canvas reel — the theater stays open
    vid.addEventListener('canplay',()=>{ if(videoReady) return; videoReady=true;
      const vt=new THREE.VideoTexture(vid);
      vt.colorSpace=THREE.SRGBColorSpace; vt.wrapS=THREE.RepeatWrapping; vt.repeat.x=-1; vt.offset.x=1; // un-mirror for BackSide
      screenMat.map=vt; screenMat.color.set('#fff'); screenMat.needsUpdate=true; });
    vid.play().catch(()=>{});
    glowPulse(); gsap.to(posterMat,{opacity:0,duration:.9,delay:.15}); redrawMute();
    openCinema(); return; // CINEMA FOCUS: first play = the takeover moment
  }
  if(vid.paused){ vid.play().catch(()=>{}); glowPulse(); gsap.to(posterMat,{opacity:0,duration:.6}); openCinema(); }
  else if(!cinemaOpen){ openCinema(); } // already playing on the wall → clicking re-enters the theater
  else{ vid.pause(); gsap.to(posterMat,{opacity:.45,duration:.5}); closeCinema(); }
}
function toggleMute(){ if(vid) vid.muted=!vid.muted; else toggleVideo(); redrawMute(); }
function buildAboutExtras(){
  /* LAYOUT (EDIT ME): Act I — screen-right = smaller azimuth.
     Video panel RIGHT of center, wall-printed hero text LEFT, ticket below the text. */
  const VID_A=A(0)-.33, TXT_A=A(0)+.27;
  // — hero text printed straight onto the wall (same treatment as the Journey quote) —
  const AB_HEAD='I design products that reach millions and resonate with people.'; // EDIT ME
  const AB_SUB='Product designer, 5 years. I build and scale products across fintech, healthcare, AI, and consumer tech, turning complexity into intuitive experiences.'; // EDIT ME
  const heroTex=canvasTex(1536,640,(ctx,w,h)=>{
    ctx.translate(w,0); ctx.scale(-1,1); // pre-mirror (BackSide)
    ctx.textAlign='center';
    ctx.font='108px "Alfa Slab One"';
    ctx.fillStyle='rgba(0,0,0,.35)'; wrapText(ctx,AB_HEAD,w/2+5,144,w-150,124); // soft inset shadow
    ctx.fillStyle='#F7EDD9'; const y2=wrapText(ctx,AB_HEAD,w/2,140,w-150,124);
    ctx.font='700 46px Nunito';
    ctx.fillStyle='rgba(0,0,0,.3)'; wrapText(ctx,AB_SUB,w/2+3,y2+95,w-200,58); // SPACING PASS: bigger head → sub gap
    ctx.fillStyle='rgba(247,237,217,.92)'; wrapText(ctx,AB_SUB,w/2,y2+92,w-200,58);
    ctx.globalCompositeOperation='destination-out'; // weathered print
    for(let i=0;i<700;i++){ ctx.fillStyle=`rgba(0,0,0,${Math.random()*.4})`;
      ctx.fillRect(Math.random()*w,Math.random()*h,2.2,2.2); }
    ctx.globalCompositeOperation='source-over';
  });
  const hero=new THREE.Mesh(new THREE.CylinderGeometry(10.87,10.87,1.7,48,1,true,TXT_A-.20,.40),
    new THREE.MeshStandardMaterial({map:heroTex, transparent:true, side:THREE.BackSide, roughness:.95}));
  /* SAFE ZONE: bulb garland sags to y≈2.30 in front of the wall — keep the text band top (≈2.21)
     below it. hero y is the tweak: lower = more clearance from bulbs/bunting. */
  hero.position.y=1.48; scene.add(hero); // SPACING PASS: a touch lower — extra clearance from the sagging bulb garland
  vGroup=new THREE.Group(); scene.add(vGroup);
  // recessed poster-frame that follows the wall curve
  const frameTex=canvasTex(1024,640,(ctx,w,h)=>{
    ctx.translate(w,0); ctx.scale(-1,1);
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#C9A15E'; ctx.lineWidth=8; ctx.strokeRect(18,18,w-36,h-36);
    ctx.strokeStyle='rgba(201,161,94,.4)'; ctx.lineWidth=3; ctx.strokeRect(34,34,w-68,h-68);
    ctx.fillStyle='#160d08'; ctx.fillRect(64,58,w-128,h-116); // cavity
    const bev=ctx.createLinearGradient(0,58,0,140);
    bev.addColorStop(0,'rgba(0,0,0,.9)'); bev.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bev; ctx.fillRect(64,58,w-128,82); // top bevel shadow → reads recessed
    for(let i=0;i<900;i++){ ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},.04)`;
      ctx.fillRect(Math.random()*w,Math.random()*h,2,2); }
  });
  vFrameMat=new THREE.MeshStandardMaterial({map:frameTex, side:THREE.BackSide, roughness:.85,
    emissive:'#FFD9A0', emissiveIntensity:.06, emissiveMap:frameTex});
  const frame=new THREE.Mesh(new THREE.CylinderGeometry(10.86,10.86,1.98,32,1,true,VID_A-.155,.31), vFrameMat);
  frame.position.y=1.7; vGroup.add(frame);
  for(const s of [-1,1]){ // nails pinning the frame to the wall
    const nl=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8), mat('#d8d2c0',{metalness:.7,roughness:.3}));
    nl.position.copy(polar(VID_A+s*.125,10.78,2.6)); vGroup.add(nl);
  }
  // screen: video surface behind + poster thumbnail in front (fades on play)
  screenMat=new THREE.MeshBasicMaterial({color:'#0d0805', toneMapped:false, side:THREE.BackSide});
  const screen=new THREE.Mesh(new THREE.CylinderGeometry(10.81,10.81,1.6,32,1,true,VID_A-.132,.264), screenMat);
  screen.position.y=1.72; screen.userData={type:'video', group:vGroup, noLift:true};
  vGroup.add(screen); clickables.push(screen);
  vScreenPoint=polar(VID_A,10.8,1.72); vScreenAng=VID_A; // theater camera anchors
  _watchSpot.copy(polar(VID_A,8.0,.13)); // where the character stands to watch — pulled well BACK from the screen
  const posterTexV=canvasTex(1024,576,(ctx,w,h)=>drawShowreelPoster(ctx,w,h,false));
  posterMat=new THREE.MeshStandardMaterial({map:posterTexV, transparent:true, side:THREE.BackSide, roughness:.8});
  const posterM=new THREE.Mesh(new THREE.CylinderGeometry(10.79,10.79,1.6,32,1,true,VID_A-.132,.264), posterMat);
  posterM.position.y=1.72; posterM.userData={type:'video', group:vGroup, noLift:true};
  vGroup.add(posterM); clickables.push(posterM);
  // mute/unmute bulb beside the frame
  muteTex=canvasTex(160,160,()=>{});
  const mute=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),
    new THREE.MeshStandardMaterial({map:muteTex, transparent:true, roughness:.8}));
  mute.userData={type:'mute', group:vGroup, noLift:true};
  mute.position.copy(polar(VID_A-.215,10.72,.74)); mute.rotation.y=VID_A-.215+Math.PI; // SPACING PASS: clear of the screen's bottom corner
  vGroup.add(mute); clickables.push(mute); redrawMute();
  // "My Story →" ticket stub — opens the bio popup
  const ticketTex=canvasTex(512,320,(ctx,w,h)=>{
    ctx.fillStyle='#F3E2C2'; ctx.beginPath(); ctx.roundRect(14,58,w-28,h-116,24); ctx.fill();
    ctx.strokeStyle='#C0392B'; ctx.lineWidth=10; ctx.stroke();
    ctx.strokeStyle='rgba(192,57,43,.5)'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.roundRect(30,74,w-60,h-148,16); ctx.stroke();
    ctx.setLineDash([10,10]); ctx.beginPath(); ctx.moveTo(w*.76,58); ctx.lineTo(w*.76,h-58); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(w*.875,h/2); ctx.rotate(-Math.PI/2); ctx.textAlign='center';
    ctx.fillStyle='#C0392B'; ctx.font='800 21px Nunito'; ctx.fillText('BIO',0,8); ctx.restore();
    ctx.textAlign='center'; ctx.fillStyle='#2B1D16'; ctx.font='42px "Alfa Slab One"';
    ctx.fillText('MY STORY →', w*.42, h*.5+6);
    if('letterSpacing' in ctx) ctx.letterSpacing='5px';
    ctx.fillStyle='#a4552f'; ctx.font='800 19px Nunito'; ctx.fillText('THE FULL STORY', w*.42, h*.5+42);
    if('letterSpacing' in ctx) ctx.letterSpacing='0px';
  });
  const tk=new THREE.Group();
  const tkM=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.62),
    new THREE.MeshStandardMaterial({map:ticketTex, transparent:true, roughness:.85}));
  tkM.userData={type:'story', group:tk};
  tk.add(tkM); addNail(tk,.34);
  tk.position.copy(polar(TXT_A-.30,10.7,1.0)); tk.rotation.y=TXT_A-.30+Math.PI; // between text and video, clear of both
  decorGroup.add(tk); clickables.push(tkM);
  if(!reduced) swayers.push({obj:tk, phase:1.3, amp:.03});
}

/* ============ scroll choreography — endless lap ============ */
/* EDIT ME — SCROLL_DAMP: per-frame catch-up toward raw scroll (0..1 at 60fps).
   ~.08 = floaty glide, ~.12 = snappier. All scroll-driven motion reads the smoothed value,
   decoupled from wheel-event spikes (the render loop does the easing — our eased scrub). */
const SCROLL_DAMP=.11, SCROLL_RATE=-Math.log(1-SCROLL_DAMP)*60;
let rawP = 0, progress = 0;
/* SCROLL RANGE CACHE: reading documentElement.scrollHeight forces a synchronous
   layout. It used to happen inside the scroll handler, i.e. on every wheel tick
   of a 1900vh page — a reliable source of stutter. The page height only changes
   on resize, so measure it there instead. */
let scrollMax = 1;
function measureScroll(){ scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
measureScroll();
function onScroll(){
  rawP = scrollY/scrollMax;
  // (loop wrap lives in the render loop — see LOOP-WRAP FIX — so it can wait for the damped value)
}
addEventListener('scroll', onScroll, {passive:true});
/* CAMERA EASING (EDIT ME): EASE_ORBIT 0 = linear orbit; higher = slower drift through each act
   center (a gentle hold) and brisker glides between acts. Boundaries stay exact, so the loop seam
   and act hand-offs are unchanged. */
const EASE_ORBIT=.55;
const orbitAngle = p => {
  const f=(p-ACT0)/ACTW, q=Math.floor(f), fr=f-q;
  const es=fr + EASE_ORBIT*Math.sin(2*Math.PI*fr)/(2*Math.PI); // slope 1-EASE at center, 1+EASE at edges
  return A(0) + (q + es - .5) * (Math.PI/2);
};
function actProx(p){ let best=0, bq=0;
  for(let q=0;q<4;q++){ const v=Math.max(0,1-Math.abs(p-pCenter(q))/(ACTW*.5)); if(v>best){best=v;bq=q;} }
  return [best,bq];
}
const ease = t => t*t*(3-2*t);

/* panels + UI */
/* ===== EDIT ME — SITE_TITLE (intro heading + browser tab) ===== */
const SITE_TITLE='Sanskar Sharma';
/* ===== EDIT ME — SCROLL_LENGTH_MULTIPLIER: total scroll runway (1 = original pacing; 2.5 ≈ calm & deliberate).
   All beats are mapped in normalized progress, so lengthening the runway stretches every transition equally —
   intro walk-out, orbits, card zooms and holds stay perfectly in sync. ===== */
const SCROLL_LENGTH_MULTIPLIER=3;
document.getElementById('scroll-space').style.height=(760*SCROLL_LENGTH_MULTIPLIER)+'vh';
measureScroll(); onScroll(); ScrollTrigger.refresh(); /* SEAM FIX: re-measure AFTER the runway multiplier changes the page height —
   the first measureScroll ran before it, leaving a stale scrollMax that made the loop-wrap scrollTo land
   at the wrong spot (the reported jump at the end of the circle). */
document.getElementById('site-title').textContent=SITE_TITLE;
document.title=SITE_TITLE+' · Interactive Portfolio';
const panels=[...Array(4)].map((_,i)=>document.getElementById('p'+i));
const dots=[...document.querySelectorAll('.dot')];
const titleEl=document.getElementById('title');
/* Last-written overlay state, so the per-frame sync can skip no-op DOM writes.
   `kids` is the cached .chip/.tag list that used to be re-queried every frame. */
const ovState = {
  titleOp: -1, titleY: NaN,
  panels: panels.map(el=>({op:-1, tx:NaN, on:null, lit:null, kids:[...el.querySelectorAll('.chip,.tag')]})),
};
/* CHAPTER JUMP (EDIT ME — NAV_DURATION): the runway is ~1900vh, so the browser's
   native `behavior:'smooth'` crawls for many seconds and can't be interrupted.
   Tween the scroll position ourselves: fixed duration regardless of distance,
   and any wheel/touch/key input aborts it so the page never fights the user. */
const NAV_DURATION = 1.15;
let navTween = null;
function cancelNav(){ if(navTween){ navTween.kill(); navTween = null; } }
for(const ev of ['wheel','touchstart','keydown']) addEventListener(ev, cancelNav, {passive:true});
function gotoChapter(q){
  measureScroll(); // never navigate on a stale scroll range
  const top = pCenter(q) * scrollMax;
  cancelNav();
  if(reduced){ window.scrollTo({top, behavior:'auto'}); return; }
  const o = {y: scrollY};
  navTween = gsap.to(o, {y: top, duration: NAV_DURATION, ease:'power2.inOut', overwrite:true,
    onUpdate:()=>window.scrollTo(0, o.y), onComplete:()=>{ navTween = null; }});
}
dots.forEach(d=>d.addEventListener('click',()=>gotoChapter(+d.dataset.a)));
document.getElementById('links').innerHTML =
  ['Resume','Dribbble','Behance','Read my writing'].map(l=>`<button class="chip">${l}</button>`).join('');
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
  c.textContent = '★ '+c.textContent.replace('★ ','');
  setTimeout(()=>c.textContent=c.textContent.replace('★ ',''),900);
}));

/* ============ OVERLAY PLUMBING ============
   Scroll lock is reference-counted: closing the case modal while the gallery is
   still open used to unlock the page behind it. Focus is parked on the overlay
   and returned to whatever was focused before, and Tab is kept inside — the
   overlays already claim role="dialog" aria-modal="true", so they need to behave
   like one. */
/* Tracked as a SET of open overlays, not a counter: openCase() is re-entrant
   (the "full bill" list opens a case from inside the already-open modal), and a
   naive counter would tick to 2, get decremented once, and leave the page
   scroll-locked for good. Membership makes every open idempotent. */
const openOverlays = new Set();
let lastFocus = null;
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function openOverlay(el){
  if(openOverlays.size === 0){
    lastFocus = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
  }
  openOverlays.add(el);
  const first = el.querySelector(FOCUSABLE);
  (first || el).focus({preventScroll:true});
}
function closeOverlay(el){
  if(!openOverlays.delete(el) || openOverlays.size) return;
  document.documentElement.style.overflow = '';
  if(lastFocus && lastFocus.focus){ lastFocus.focus({preventScroll:true}); lastFocus = null; }
}
addEventListener('keydown', e=>{
  if(e.key !== 'Tab' || !openOverlays.size) return;
  const open = [...openOverlays].pop();   // Set keeps insertion order → innermost
  if(!open) return;
  const f = [...open.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
  if(!f.length) return;
  const first = f[0], last = f[f.length-1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

/* modal + overlay elements (looked up once; the helpers above close over them) */
const modal=document.getElementById('modal');
const galleryOv=document.getElementById('gallery-ov'), gGrid=document.getElementById('ggrid'),
      gLight=document.getElementById('glight');
function openCase(i){
  const cs=CASES[i];
  document.getElementById('m-eyebrow').textContent='★ Selected Work ★';
  document.getElementById('m-title').textContent=cs.t;
  document.getElementById('m-desc').textContent=cs.d;
  document.getElementById('m-meta').style.display='';
  document.getElementById('m-role').innerHTML='<span class="lbl">Role</span><span>'+cs.r+'</span>'; 
  document.getElementById('m-impact').innerHTML='<span class="lbl">Impact</span><span>'+cs.i+'</span>';
  document.getElementById('m-chips').innerHTML=cs.chips.map(c=>`<span>${c}</span>`).join('');
  document.querySelector('.poster').style.borderColor=cs.c;
  // Behance link
  const existingLink = document.getElementById('m-behance');
  if(existingLink) existingLink.remove();
  if(cs.url){
    const lnk = document.createElement('a');
    lnk.id = 'm-behance';
    lnk.href = cs.url;
    lnk.target = '_blank';
    lnk.rel = 'noopener';
    // internal case studies (served from /case-study/…) get the portfolio's own accent + label;
    // external ones (Behance) keep the blue Behance button.
    const isInternal = cs.url.startsWith('/');
    lnk.textContent = isInternal ? 'View full case study →' : 'View on Behance ↗';
    lnk.style.cssText = `display:block;text-align:center;margin-top:24px;margin-bottom:8px;font-weight:800;font-size:14px;color:#fff;background:${isInternal?'#C25A2E':'#0057ff'};padding:12px 24px;border-radius:999px;letter-spacing:0.05em;transition:opacity 0.2s;`;
    document.getElementById('m-chips').after(lnk);
  }
  modal.classList.add('open'); openOverlay(modal);
}
function openStory(){ // "My Story" — same circus-poster modal, longer bio
  document.getElementById('m-eyebrow').textContent='★ About Me ★';
  document.getElementById('m-title').textContent=BIO.title;
  document.getElementById('m-desc').innerHTML=BIO.paras.map(p=>`<p>${p}</p>`).join('');
  document.getElementById('m-meta').style.display='none';
  document.getElementById('m-chips').innerHTML=BIO.chips.map(c=>`<span>${c}</span>`).join('');
  document.querySelector('.poster').style.borderColor='#1F5E5B';
  modal.classList.add('open'); openOverlay(modal);
}
function closeModal(){
  if(!modal.classList.contains('open')) return;
  modal.classList.remove('open'); closeOverlay(modal);
}
function openPhoto(i){ // polaroid → enlarge in the existing modal
  const ph=PHOTOS[i];
  document.getElementById('m-eyebrow').textContent='★ From the Journey ★';
  document.getElementById('m-title').textContent=ph.tag;
  document.getElementById('m-desc').innerHTML=`<img src="${ph.src}" alt="${ph.tag}" crossorigin="anonymous" style="width:100%;border-radius:8px;border:5px solid #4A3020">`;
  document.getElementById('m-meta').style.display='none'; // hide the container, not the children — openCase only re-shows #m-meta
  document.getElementById('m-chips').innerHTML='';
  document.querySelector('.poster').style.borderColor='#C25A2E';
  modal.classList.add('open'); openOverlay(modal);
}
function openRec(i){ // full-readability popup for a recommendation (click)
  const rec=RECS[i];
  document.getElementById('m-eyebrow').textContent='★ LinkedIn Recommendation ★';
  document.getElementById('m-title').textContent=rec.n;
  document.getElementById('m-desc').innerHTML='<p style="font-family:Nunito,sans-serif;font-style:italic;font-size:clamp(16px,2vw,18px);line-height:1.6;color:#2B1D16">“'+rec.q+'”</p><p style="margin-top:16px;font-weight:800;color:#7a5a3a;font-size:clamp(13px,1.5vw,15px);letter-spacing:0.02em">'+rec.r+'</p>';
  document.getElementById('m-meta').style.display='none';
  document.getElementById('m-chips').innerHTML='';
  document.querySelector('.poster').style.borderColor='#0A66C2';
  modal.classList.add('open'); openOverlay(modal);
}
function openAllCases(){ // VIEW-ALL: the full bill in the existing poster modal — each row opens its case
  document.getElementById('m-eyebrow').textContent='★ All Case Studies ★';
  document.getElementById('m-title').textContent='The Full Bill';
  const d=document.getElementById('m-desc');
  const thumbStyle='width:72px;height:52px;object-fit:cover;border-radius:6px;border:2px solid #4A3020';
  d.innerHTML=CASES.map((cs,i)=>`<div class="case-row" data-i="${i}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:10px;border:2px solid ${cs.c};border-radius:12px;cursor:pointer;background:#FBF3E3;box-shadow:0 4px 0 rgba(0,0,0,0.1);transition:transform 0.2s">
    ${cs.video
      ? `<video src="${cs.video}" muted loop autoplay playsinline style="${thumbStyle}"></video>`
      : `<img src="${cs.img}" crossorigin="anonymous" style="${thumbStyle}" alt="">`}
    <span style="flex:1"><b style="display:block;font-size:clamp(15px,1.8vw,17px);color:#2B1D16">${cs.t}</b><span style="font-size:clamp(12px,1.4vw,14px);color:#7a5a3a;font-weight:400;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${cs.d}</span></span>
    <span style="font-weight:800;color:#a4552f;font-size:16px">→</span></div>`).join('');
  d.querySelectorAll('.case-row').forEach(r=>r.addEventListener('click',e=>{
    const i=+r.dataset.i, cs=CASES[i];
    if(cs.url && cs.url.startsWith('/')){ closeModal(); playCaseTransition(cs, e); }
    else openCase(i);
  }));
  document.getElementById('m-meta').style.display='none';
  document.getElementById('m-chips').innerHTML='';
  document.querySelector('.poster').style.borderColor='#C9A15E';
  modal.classList.add('open'); openOverlay(modal);
}
/* ============ CASE-STUDY ZOOM TRANSITION (EDIT ME — TRANSITION_DURATION) ============
   For a case with its own page (CASES[i].url starting with '/'), clicking skips the poster popup
   entirely: the card's own video zooms from the click point to fill the screen, the rest of the
   scene blurs out behind it, then we navigate. No popup, no extra click — this IS the "open the
   case study" action. Cases without a video (or with an external url, e.g. Behance) still use the
   ordinary openCase() modal — there's nothing to zoom into. */
const TRANSITION_DURATION = 0.9; // seconds, the video's grow tween (excludes the quick fade-in)
function playCaseTransition(cs, e){
  if(!cs.url) return;
  if(reduced || !cs.video){ location.href=cs.url; return; } // no motion to play — just go
  const backdrop=document.getElementById('case-transition-backdrop');
  const stage=document.getElementById('case-transition-stage');
  const vid=document.getElementById('case-transition-video');
  const ox = e && e.clientX!=null ? e.clientX/innerWidth*100 : 50;
  const oy = e && e.clientY!=null ? e.clientY/innerHeight*100 : 50;
  vid.style.transformOrigin = ox+'% '+oy+'%';
  vid.src = cs.video; vid.currentTime = 0; vid.muted = true; vid.play().catch(()=>{});
  stage.style.pointerEvents = 'auto';
  gsap.killTweensOf([backdrop, vid]);
  gsap.set(backdrop, {opacity:0});
  gsap.set(vid, {opacity:0, scale:.001, borderRadius:28});
  return gsap.timeline({onComplete:()=>{ location.href=cs.url; }})
    .to(backdrop, {opacity:1, duration:.4, ease:'power2.out'}, 0)
    .to(vid, {opacity:1, duration:.22, ease:'power1.out'}, 0)
    .to(vid, {scale:.97, borderRadius:10, duration:TRANSITION_DURATION, ease:'power3.inOut'}, .08);
}
/* ============ GALLERY (EDIT ME — GALLERY_PHOTOS) ============
   EXTENSION POINT: drop the full photo set here — one {src, cap} per photo; the grid and the lightbox
   render whatever this array holds. Defaults reuse the journey polaroids at higher resolution. */
const GALLERY_PHOTOS=[
  {src:"/images/gallery-7.jpg",caption:"Saddled up on the sand"},
  {src:"/images/gallery-8.jpg",caption:"Hilltop crew"},
  {src:"/images/gallery-2.jpg",caption:"Fort corridors, Jaipur"},
  {src:"/images/gallery-4.jpg",caption:"Garba night, first lap"},
  {src:"/images/gallery-5.jpg",caption:"Five up in the snow"},
  {src:"/images/gallery-1.jpg",caption:"Dupatta on, Navratri"},
  {src:"/images/photo-4.jpg",caption:"Above the snow line"},
  {src:"/images/photo-3.jpg",caption:"Navratri, three-piece"},
  {src:"/images/photo-1.jpg",caption:"Garba, mid-move"},
  {src:"/images/gallery-3.jpg",caption:"Curtain call, full cast"},
  {src:"/images/gallery-9.jpg",caption:"Empty house, before the show"},
  {src:"/images/gallery-6.jpg",caption:"Nothing but sky"},
  {src:"/images/photo-6.jpg",caption:"Golden hour, arm up"},
  {src:"/images/photo-2.jpg",caption:"Lobby, off duty"},
  {src:"/images/photo-5.jpg",caption:"Torch to the stars"},
];
let galleryBuilt=false;
function openGallery(){
  if(!galleryBuilt){ galleryBuilt=true;
    gGrid.innerHTML=GALLERY_PHOTOS.map((p2,i)=>`<figure data-i="${i}"><img src="${p2.src}" alt="${p2.caption}" loading="lazy" crossorigin="anonymous"><figcaption>${p2.caption}</figcaption></figure>`).join('');
    gGrid.querySelectorAll('figure').forEach(f=>f.addEventListener('click',()=>{
      const p2=GALLERY_PHOTOS[+f.dataset.i];
      gLight.querySelector('img').src=p2.src; gLight.querySelector('p').textContent=p2.caption;
      gLight.classList.add('open');
    }));
    gLight.addEventListener('click',()=>gLight.classList.remove('open'));
    document.getElementById('gallery-back').addEventListener('click',closeGallery);
  }
  galleryOv.classList.add('open'); openOverlay(galleryOv);
}
function closeGallery(){
  if(!galleryOv.classList.contains('open')) return;
  gLight.classList.remove('open');
  galleryOv.classList.remove('open'); closeOverlay(galleryOv);
}
/* ============ MUSIC ECOSYSTEM (EDIT ME — MUSIC_PROMPT_TEXT / PLAYLIST / PLAYLIST_URL) ============
   Click the pinned invite by the turntable → the performer puts the headset ON (eased hand-to-ear
   raise, headset mesh seats on his head) and the playlist panel opens.
   EMBED APPROACH USED: a persistent YouTube IFRAME (youtube.com/embed/videoseries?list=<id parsed
   from PLAYLIST_URL>&enablejsapi=1) inside the panel — it plays in-page here, and because the iframe
   is NEVER detached (minimizing only hides the panel around it) audio continues on the mini-player;
   play/pause uses the YT postMessage API. If an embed is ever blocked, the always-visible "Open in
   YouTube Music ↗" link is the graceful fallback.
   MINI-PLAYER: panel ✕ = minimize (music keeps playing) · mini click = re-expand · mini ⏸/▶ =
   pause/resume · mini ✕ = full stop (iframe removed, headset comes off). */
const MUSIC_PROMPT_TEXT='Listen to my favorite playlist 🎧';
const PLAYLIST_URL='https://music.youtube.com/playlist?list=PLYrifiKCM-ZlKYbt8z5cPehuWmTRp_E-x'; // EDIT ME — "Aditya Rikhari: All Songs" (YouTube Music); paste any playlist URL with ?list= to swap it
const PLAYLIST=[ // EDIT ME — placeholder tracks; clicking row N starts the playlist embed at position N
  {t:'Maan Meri Jaan (swap me)', a:'King'},
  {t:'Oops! (swap me)',          a:'King'},
  {t:'Tu Aake Dekhle (swap me)', a:'King'},
];
const dock=document.getElementById('music-dock'), mList=document.getElementById('m-list'),
      mEmbed=document.getElementById('m-embed'), mTrackEl=document.getElementById('m-track'),
      mMiniT=document.getElementById('m-mini-t'), mEq=document.querySelector('.m-eq');
document.getElementById('m-open').href=PLAYLIST_URL;
let musicBuilt=false, musicOn=false, musicPaused=false, ytFrame=null;
const ytListId=(PLAYLIST_URL.match(/[?&]list=([\w-]+)/)||[])[1]||'';
/* The enablejsapi postMessage channel stays deaf until the embed has been sent
   a `listening` handshake, so firing commands at a freshly-created iframe was a
   coin flip: the mini-player's ⏸ would flip its glyph while the audio carried
   on. Handshake on every load (re-pointing .src reloads it) and hold commands
   until then. This is YouTube's undocumented widget protocol — the always-visible
   "Open in YouTube Music ↗" link stays the guaranteed fallback. */
let ytReady=false, ytQueue=[];
function ytPost(msg){
  try{ ytFrame && ytFrame.contentWindow && ytFrame.contentWindow.postMessage(JSON.stringify(msg),'*'); }
  catch(e){}
}
function ytHandshake(){
  ytReady=true;
  ytPost({event:'listening', id:'circus-player', channel:'widget'});
  const q=ytQueue; ytQueue=[];
  for(const f of q) ytCmd(f);
}
function ytCmd(func){
  if(!ytFrame) return;
  if(!ytReady){ if(!ytQueue.includes(func)) ytQueue.push(func); return; }
  ytPost({event:'command', func, args:[]});
}
function playIndex(i){ // (re)points the persistent iframe at the playlist, starting at row i
  const src=`https://www.youtube.com/embed/videoseries?list=${ytListId}&index=${i}&autoplay=1&enablejsapi=1`;
  ytReady=false; ytQueue=[];              // a new src reloads the embed → re-handshake
  if(!ytFrame){
    ytFrame=document.createElement('iframe');
    ytFrame.allow='autoplay; encrypted-media';
    ytFrame.title='Playlist player';
    ytFrame.addEventListener('load', ytHandshake);
    ytFrame.src=src; mEmbed.appendChild(ytFrame);
  }
  else ytFrame.src=src;
  musicPaused=false; updatePP();
  const tr=PLAYLIST[i]; const label=tr?`${tr.t.replace(' (swap me)','')} · ${tr.a}`:'My favorite playlist';
  mTrackEl.textContent=label; mMiniT.textContent=label;
}
function updatePP(){ document.getElementById('m-pp').textContent=musicPaused?'▶':'⏸'; mEq.classList.toggle('paused',musicPaused); }
function startMusic(){ // the in-world prompt was clicked
  if(!musicBuilt){ musicBuilt=true;
    mList.innerHTML=`<div data-i="0"><span class="m-num">★</span><span style="flex:1"><b>Play the full playlist</b><br><span>My favorite, on YouTube Music</span></span><b>▶</b></div>`+
      PLAYLIST.map((tr,i)=>`<div data-i="${i}"><span class="m-num">${i+1}</span><span style="flex:1"><b>${tr.t}</b><br><span>${tr.a}</span></span><b>▶</b></div>`).join('');
    mList.querySelectorAll('div[data-i]').forEach(r=>r.addEventListener('click',()=>playIndex(+r.dataset.i)));
    document.getElementById('m-min').addEventListener('click',()=>dock.classList.add('mini')); // minimize — audio persists
    document.getElementById('m-mini').addEventListener('click',e=>{ if(e.target.tagName!=='BUTTON') dock.classList.remove('mini'); });
    document.getElementById('m-pp').addEventListener('click',()=>{ musicPaused=!musicPaused; ytCmd(musicPaused?'pauseVideo':'playVideo'); updatePP(); });
    document.getElementById('m-stop').addEventListener('click',stopMusic);
  }
  dock.classList.remove('hidden','mini');
  if(!musicOn){ musicOn=true; headsetOn(); }
}
function stopMusic(){ // full stop: audio off, dock away, headset comes off (reverse animation)
  if(ytFrame){ ytFrame.remove(); ytFrame=null; }
  ytReady=false; ytQueue=[];
  dock.classList.add('hidden'); dock.classList.remove('mini');
  musicOn=false; musicPaused=false; updatePP(); headsetOff();
}
/* CHARACTER HEADSET (EDIT ME — colors/size): walnut band + brass cups seated on the head. musicPose.arm
   drives the eased hand-to-ear raise inside the render loop (the loop READS the tween each frame, so it
   never fights the locomotion writes — no snapping). Reduced motion: headset appears/disappears seated. */
const musicPose={arm:0};
const headsetG=new THREE.Group(); headsetG.visible=false; RIG.headG.add(headsetG);
{ const band=new THREE.Mesh(new THREE.TorusGeometry(.128,.016,8,22,Math.PI), mat('#2B1D16',{roughness:.6}));
  band.position.y=.015; headsetG.add(band);
  for(const s of [-1,1]){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.028,14), mat('#C9A15E',{metalness:.35,roughness:.4}));
    cup.rotation.z=Math.PI/2; cup.position.set(s*.125,-.012,0); headsetG.add(cup);
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.014,12), mat('#2B1D16',{roughness:.8}));
    pad.rotation.z=Math.PI/2; pad.position.set(s*.108,-.012,0); headsetG.add(pad);
  }
}
let musicTl=null;
function headsetOn(){
  if(reduced){ headsetG.visible=true; headsetG.scale.setScalar(1); return; }
  musicTl?.kill(); headsetG.scale.setScalar(.01);
  musicTl=gsap.timeline()
    .to(musicPose,{arm:1,duration:.55,ease:'power2.inOut'})     // hand rises to the ear
    .add(()=>{ headsetG.visible=true; })
    .to(headsetG.scale,{x:1,y:1,z:1,duration:.4,ease:'back.out(2.2)'}) // headset seats
    .to(musicPose,{arm:0,duration:.55,ease:'power2.inOut'},'+=.15');   // arm settles back down
}
function headsetOff(){
  if(reduced){ headsetG.visible=false; return; }
  musicTl?.kill();
  musicTl=gsap.timeline()
    .to(musicPose,{arm:1,duration:.5,ease:'power2.inOut'})      // hand reaches up
    .to(headsetG.scale,{x:.01,y:.01,z:.01,duration:.3,ease:'power2.in'})
    .add(()=>{ headsetG.visible=false; })
    .to(musicPose,{arm:0,duration:.5,ease:'power2.inOut'});     // arm returns
}
/* ============ speech bubbles · talking statues · easter eggs ============ */
/* ===== EDIT ME — statue voice lines (rotation: motivation → fact → cheeky; no immediate repeats) ===== */
const LINES_MOTIVATION=["This guy designs like it's second nature.","Millions of users, zero fuss.","Clean work: every pixel earns its place."];
const LINES_FACTS=["5 years in, still sketches every idea first.","Healthcare, fintech, AI: shipped across all three.","Loves a good ride as much as a good grid."];
const LINES_CHEEKY=["Okay, the bike is a nice touch.","Is that cat photobombing again?","Scroll slower, enjoy the show."];
/* ===== EDIT ME — easter-egg copy & tuning ===== */
const EGG_BIKE_LINE='0 to design in 3 seconds.';           // bike: click → rev + this line
const GT_LINE='GT 650, my dream bike';                       // drive-by caption when the camera passes the bike
const EGG_CAT_LINE='meow. (nap time)';                      // cat: 3rd click → nap + this line
const SECRET_BRICK_LABEL='AI Prompting';                    // which skill brick hides the secret (click flips it)
const SECRET_FACT='Secret: I once sketched a clinic redesign from a hospital waiting room.';
const LAPTOP_STATUSES=['a calmer encounter screen','tokens for a new theme','this very portfolio','weekend ride routes'];
const GLOBE_PIN=[.62,1.05];                                 // [lat, lon] (radians) of the favorite-place pin
const GLOBE_LINE='The Himalayas, best ride of my life.';     // globe: click → spin, pin glows, this line
const PARTY_KEY='ride';                                     // type it anywhere → party mode
const PARTY_LINE='RIDE MODE. Okay, back to work.';
// — pooled speech bubbles (3 slots, projected from world anchors each frame; never block content) —
const bubWrap=document.createElement('div'); bubWrap.id='bubbles'; document.body.appendChild(bubWrap);
const bubbles=[...Array(3)].map(()=>{ const el=document.createElement('div'); el.className='bub';
  bubWrap.appendChild(el); return {el, p:new THREE.Vector3(), off:0, until:0}; });
const _bv=new THREE.Vector3(), _mr=new THREE.Matrix4();
/* ============ EXERCISE MINI-GAME (EDIT ME — EXERCISE_* consts near the top) ============
   Flow: character nears the gym mat → circular in-world prompt fades in → click: the character crouches,
   grips a dumbbell (mat one hides, held one appears in its hands), stands with weight → FOCUS MODE
   (camera push-in + edge blur + radial streaks + vignette, all DOM — cheap and reversible) → each click
   on the big button = one curl rep, counter + vertical power bar fill → reward poster at the goal →
   everything eases back. Scrolling away cancels gracefully; Escape works too. */
const gymGame={active:false, ui:false, k:0, cam:0, crouch:0, lift:0, curl:0, reps:0, held:null, p0:0, pNow:0};
const _gymV=new THREE.Vector3(), _gymL=new THREE.Vector3();
const gymEls={ov:document.getElementById('gym-ov'), btn:document.getElementById('gym-btn'),
  count:document.querySelector('#gym-count b'), countBox:document.getElementById('gym-count'),
  fill:document.getElementById('gym-fill'), reward:document.getElementById('gym-reward')};
gymEls.btn.innerHTML=EXERCISE_LABEL.split(' ').join('<br>');
document.getElementById('gym-reward-title').textContent=EXERCISE_REWARD_TITLE;
document.getElementById('gym-reward-copy').textContent=EXERCISE_REWARD_COPY;
function buildHeldDumbbell(){ // twin of the mat dumbbell — lives in the character's hands during the game
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.3,8), mat('#9aa4ac',{metalness:.6,roughness:.3})));
  for(const dy of [-.13,.13]){ const w2=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.05,12), mat('#2B2622',{roughness:.6}));
    w2.position.y=dy; g.add(w2); }
  g.rotation.z=Math.PI/2; // bar horizontal — across both hands
  return g;
}
function startExercise(){
  if(gymGame.active) return;
  gymGame.active=true; gymGame.reps=0; gymGame.p0=gymGame.pNow;
  gymEls.count.textContent='0'; gymEls.fill.style.height='0%';
  gymEls.reward.classList.remove('show'); gymEls.btn.style.display='';
  if(lifeProps.exercise) gsap.to(lifeProps.exercise.m,{opacity:0,duration:.3,overwrite:true});
  const held=buildHeldDumbbell(); held.visible=false; char.add(held); gymGame.held=held;
  const grip=()=>{ if(!gymGame.active) return; if(lifeProps.gymDb) lifeProps.gymDb.visible=false; if(gymGame.held) gymGame.held.visible=true; };
  const tl=gsap.timeline(); gymGame.tl=tl; // kept so endExercise can kill a mid-flight pickup cleanly
  if(reduced){
    tl.add(grip)
      .to(gymGame,{k:1,lift:1,cam:1,duration:.6,ease:'power2.inOut'})
      .add(()=>showGymUI());
  } else {
    tl.to(gymGame,{crouch:1,duration:.65,ease:'power2.inOut'})            // anticipation — bend down to the mat
      .add(grip)                                                          // the grip
      .to(gymGame,{lift:1,k:1,duration:.55,ease:'power2.out'},'+=.12')    // take the weight
      .to(gymGame,{crouch:0,duration:.75,ease:'power3.inOut'},'<.05')     // stand up heavy — eased, no snap
      .to(gymGame,{cam:1,duration:.85,ease:'power2.inOut'},'-=.25')       // focus-mode camera push-in
      .add(()=>showGymUI(),'-=.2');
  }
}
function showGymUI(){ if(!gymGame.active||gymGame.ending) return; gymGame.ui=true; gymEls.ov.classList.add('on'); gymEls.ov.setAttribute('aria-hidden','false'); }
function exerciseRep(){ // one click = one curl
  if(!gymGame.active||!gymGame.ui||gymGame.reps>=EXERCISE_GOAL) return;
  gymGame.reps++;
  gymEls.count.textContent=gymGame.reps;
  gymEls.countBox.classList.remove('pop'); void gymEls.countBox.offsetWidth; gymEls.countBox.classList.add('pop');
  gymEls.fill.style.height=(gymGame.reps/EXERCISE_GOAL*100)+'%';
  gsap.killTweensOf(gymGame,'curl');
  gsap.timeline()
    .to(gymGame,{curl:1,duration:reduced?.2:.3,ease:'power2.out'})       // up — effort
    .to(gymGame,{curl:0,duration:reduced?.2:.38,ease:'power2.inOut'});   // down — control
  if(gymGame.reps>=EXERCISE_GOAL){
    gymEls.btn.style.display='none';
    gymGame.rewardCall=gsap.delayedCall(.75,()=>{ gymGame.rewardCall=null; if(gymGame.active&&!gymGame.ending) gymEls.reward.classList.add('show'); });
  }
}
function endExercise(){
  if(!gymGame.active||gymGame.ending) return;
  gymGame.ending=true; gymGame.ui=false;
  gymEls.ov.classList.remove('on'); gymEls.ov.setAttribute('aria-hidden','true'); gymEls.reward.classList.remove('show');
  if(gymGame.tl){ gymGame.tl.kill(); gymGame.tl=null; }               // stop a mid-flight pickup (and its callbacks)
  if(gymGame.rewardCall){ gymGame.rewardCall.kill(); gymGame.rewardCall=null; }
  gsap.killTweensOf(gymGame);
  gsap.to(gymGame,{cam:0,k:0,lift:0,curl:0,crouch:0,duration:reduced?.4:.8,ease:'power2.inOut',onComplete:()=>{
    if(gymGame.held){ char.remove(gymGame.held); gymGame.held=null; }
    if(lifeProps.gymDb) lifeProps.gymDb.visible=true;
    gymGame.active=false; gymGame.ending=false;
  }});
}
gymEls.btn.addEventListener('click', exerciseRep);
document.getElementById('gym-done').addEventListener('click', endExercise);
document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&gymGame.active) endExercise(); });

function say(worldPos, text, ms=2600, off=.45){ // SPACING PASS: bubbles ride a little higher off their anchors
  const b=bubbles.find(x=>x.until<=performance.now()) || bubbles[0];
  b.p.copy(worldPos); b.off=off; b.el.textContent=text;
  b.until=performance.now()+ms; b.el.style.opacity=1;
}
function updateBubbles(){
  const now=performance.now();
  for(const b of bubbles){
    if(b.until<=now){ b.el.style.opacity=0; continue; }
    _bv.copy(b.p); _bv.y+=b.off; _bv.project(camera);
    if(_bv.z>1 || Math.abs(_bv.x)>1.05 || Math.abs(_bv.y)>1.05){ b.el.style.opacity=0; continue; }
    b.el.style.opacity=1;
    // translate3d (not left/top) so a moving bubble stays on the compositor
    b.el.style.transform=`translate3d(${((_bv.x*.5+.5)*innerWidth).toFixed(1)}px,${((-_bv.y*.5+.5)*innerHeight).toFixed(1)}px,0) translate(-50%,-120%)`;
  }
}
// — talking statues: one audience figure near the camera speaks as each chapter settles —
let audInfo=null, talker=null, lastTalkAct=-1, lastTalkT=-9, lineFlavor=0;
const lastPick=[-1,-1,-1];
function speakFromAudience(aCam){
  if(!audInfo){ audInfo=[]; const v2=new THREE.Vector3(); // lazily extract instance positions (once)
    for(let i=0;i<N_AUD;i++){ audBody.getMatrixAt(i,_mr); v2.setFromMatrixPosition(_mr);
      audInfo.push({i, x:v2.x, y:v2.y, z:v2.z, az:Math.atan2(v2.x,v2.z)}); } }
  const want=aCam+(Math.random()-.5)*.5;
  let best=null, bd=9;
  for(const s of audInfo){ const d=Math.abs(wrapPI(s.az-want)); if(d<bd){ bd=d; best=s; } }
  if(!best) return;
  const flav=[LINES_MOTIVATION,LINES_FACTS,LINES_CHEEKY][lineFlavor];
  let idx; do{ idx=Math.floor(Math.random()*flav.length); }while(idx===lastPick[lineFlavor]&&flav.length>1);
  lastPick[lineFlavor]=idx; const line=flav[idx]; lineFlavor=(lineFlavor+1)%3;
  say(_bv.set(best.x,best.y,best.z), line, 3000, .55);
  if(!reduced){ talker={i:best.i, until:performance.now()+3000, base:new THREE.Matrix4()};
    audBody.getMatrixAt(best.i, talker.base); } // tiny lean while it talks (reduced: bubble only)
}
// — secret brick / globe / party helpers —
function toggleSecretBrick(mesh){
  const u=mesh.userData; u.open=!u.open;
  gsap.to(mesh.scale,{y:.02,duration:.22,ease:'power2.in',onComplete:()=>{
    mesh.material.map=u.open?u.factTex:u.baseTex; mesh.material.needsUpdate=true;
    mesh.material.emissive.set(u.open?'#6a4a20':'#000');
    gsap.to(mesh.scale,{y:1,duration:.35,ease:'back.out(2)'});
  }});
}
function spinGlobe(){
  const g2=lifeProps.globe; if(!g2||g2.userData.spinning) return; g2.userData.spinning=true;
  gsap.to(g2.rotation,{y:g2.rotation.y+Math.PI*4,duration:reduced?.01:1.6,ease:'power3.out',onComplete:()=>{
    g2.userData.spinning=false; const pd=lifeProps.globePin; pd.visible=true;
    gsap.fromTo(pd.material,{emissiveIntensity:1.6},{emissiveIntensity:.5,duration:1.2});
    pd.getWorldPosition(_bv); say(_bv, GLOBE_LINE, 3000, .12);
  }});
}
let partyK=0, keyBuf='';
function partyBurst(){ // warm confetti via the pooled points — no allocations
  if(reduced) return;
  for(let n=0;n<3;n++) setTimeout(()=>{
    const px=char.position.x, py=char.position.y+1.3, pz=char.position.z;
    for(let k2=0;k2<12;k2++){ const i=(puffCursor++)%PUFF_N;
      puffPos[i*3]=px; puffPos[i*3+1]=py; puffPos[i*3+2]=pz;
      puffVel[i*3]=(Math.random()-.5)*2.4; puffVel[i*3+1]=1+Math.random()*1.8; puffVel[i*3+2]=(Math.random()-.5)*2.4;
      puffLife[i]=.6+Math.random()*.35; }
    puffGeo.attributes.position.needsUpdate=true; puffPts.visible=true; }, n*170);
}
addEventListener('keydown',e=>{ // hidden key combo: type PARTY_KEY anywhere
  if(e.key && e.key.length===1){ keyBuf=(keyBuf+e.key.toLowerCase()).slice(-8);
    if(keyBuf.endsWith(PARTY_KEY)){ keyBuf=''; partyK=1; partyBurst(); say(char.position, PARTY_LINE, 2800, 1.9); } } });

document.getElementById('modal-x').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
/* ESCAPE: closes the innermost layer only, so the lightbox doesn't take the
   whole gallery down with it. The old handler missed the gallery and lightbox
   completely — Escape did nothing there. */
addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(gLight.classList.contains('open')){ gLight.classList.remove('open'); return; }
  if(cinemaOpen){ closeCinema(); return; } // Escape closes the cinema focus first
  if(modal.classList.contains('open')){ closeModal(); return; }
  if(galleryOv.classList.contains('open')){ closeGallery(); }
});

/* ============ raycast hover / click ============
   `hovered` is resolved in the render loop from the last pointer position. Two
   things that needed fixing:

   1. TOUCH. A tap fires no pointermove first, so `hovered` was still null and
      every 3D object was dead on phones — cards, badges, the works.
      Now a pointerdown from a non-mouse device seeds the pointer and resolves
      the hit immediately, before the click lands.
   2. COST. The loop raycast ~60 objects every frame whether or not anything had
      moved. It now runs only when the pointer actually moved or the camera did,
      and not at all behind an overlay. */
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2();
let hovered=null, ptrDirty=true, ptrInside=false;
const setPtr = e => { ptr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); ptrDirty=true; ptrInside=true; };
addEventListener('pointermove', setPtr, {passive:true});
addEventListener('pointerdown', e=>{ if(e.pointerType!=='mouse'){ setPtr(e); resolveHover(true); } }, {passive:true});
addEventListener('pointerleave', ()=>{ ptrInside=false; ptrDirty=true; });
addEventListener('click',e=>{ if(cinemaOpen){ closeCinema(); return; } // any click outside the ✕ also leaves the movie
  if(!hovered || modal.classList.contains('open') || gymGame.active) return; // no world clicks mid-workout
  const u=hovered.userData;
  if(u.type==='case'){ const cs=CASES[u.idx];
    if(cs.url && cs.url.startsWith('/')) playCaseTransition(cs, e); else openCase(u.idx); }
  else if(u.type==='story') openStory();
  else if(u.type==='video') toggleVideo();
  else if(u.type==='mute') toggleMute();
  else if(u.type==='photo') openPhoto(u.idx);
  else if(u.type==='rec') openRec(u.idx);
  else if(u.type==='egg-bike'){ zoo.bike.rev=1; say(u.group.getWorldPosition(_bv), EGG_BIKE_LINE, 2400, 1.1); } // EGG: rev
  else if(u.type==='egg-cat'){ const C=lifeProps.cat; C.clicks=(C.clicks||0)+1; // EGG: 3 clicks → nap
    if(C.clicks>=3){ C.clicks=0; C.nap=clock.getElapsedTime()+6; say(C.g.position, EGG_CAT_LINE, 2400, .5); }
    else C.pause=clock.getElapsedTime()+2.2; }
  else if(u.type==='brick'&&u.secret) toggleSecretBrick(hovered); // EGG: the secret skill brick flips
  else if(u.type==='egg-globe') spinGlobe();
  else if(u.type==='link'){ gsap.fromTo(u.group.scale,{x:.92,y:.92,z:.92},{x:1,y:1,z:1,duration:.4,ease:'back.out(3)'}); // press feedback
    u.url.startsWith('http') ? window.open(u.url,'_blank') : (location.href=u.url); }
  else if(u.type==='cases-all') openAllCases();
  else if(u.type==='gallery') openGallery();
  else if(u.type==='music') startMusic();
  else if(u.type==='exercise'){ if(lifeProps.exercise && lifeProps.exercise.m.opacity>.35) startExercise(); }
});

/* ============ render loop ============ */
const clock=new THREE.Clock();
const camPos=new THREE.Vector3(), camLook=new THREE.Vector3();
const _m=new THREE.Matrix4(), _c=new THREE.Color();
const BULB_HZ=20; let lastBulbT=-9;   // bulb twinkle refresh rate (see the twinkle block)
/* CONTEXT LOSS: phones drop the WebGL context when the tab is backgrounded under
   memory pressure. Unhandled, the canvas becomes a permanently black rectangle —
   so pause the loop, let the browser restore, and resume. three.js re-uploads
   textures and geometry on demand, so nothing needs rebuilding by hand. */
const loaderEl = document.getElementById('loader');
let ctxLost=false;
renderer.domElement.addEventListener('webglcontextlost', e=>{
  e.preventDefault();            // required, or the context is never restored
  ctxLost=true;
  loaderEl.classList.remove('done');   // show the curtain again rather than a black hole
}, false);
renderer.domElement.addEventListener('webglcontextrestored', ()=>{
  ctxLost=false; lastT=clock.getElapsedTime();  // don't hand the loop a huge dt
  loaderEl.classList.add('done');
}, false);

let __rafId = null;
function tick(){
  __rafId = requestAnimationFrame(tick);
  if(!ctxLost) renderFrame();
}
window.__render = p => { window.__p = p; renderFrame(); };
window.__dbg = {scene, camera, THREE, openGallery, startMusic, stopMusic, openAllCases, renderer, get ctxLost(){ return ctxLost; }, CASES, cardVideoTargets, playCaseTransition}; // debug handles
/* ============ CINEMATIC PASS state (EDIT ME — PARA_*, MOVE_GAIN, CAM_SWEEP/CAM_BIAS) ============
   PARA_BG / PARA_MID: azimuth lag (rad per rad/s of smoothed camera azimuth speed) applied to the far
   seating bowl and the wall-decor layer — the far layer lags a touch more ⇒ depth parallax on travel.
   MOVE_GAIN maps camera speed (u/s) into the 0..1 moveK that drives fog pull-in (fake far DOF), the
   deeper vignette and the letterbox bars — quick onset, gentle release on holds. Reduced motion: all 0.
   (CAM_SWEEP/CAM_BIAS/_aboutDir removed with the pole-descent camera arc.) */
const PARA_BG=.034, PARA_MID=.010, MOVE_GAIN=.5; // deeper layer lag = stronger depth parallax on travel
let aPrev=null, aVelS=0, moveK=0, lastCineOp=-1; const camPrev=new THREE.Vector3();
/* ONE-TIME INTRO GATE (hasIntroPlayed): flips true the first time scroll passes ACT0. From then on,
   scrolling back to the top does NOT replay the idle-stand opening shot — the character/camera simply
   resume the normal endless ring loop. In-memory only (no storage), so a fresh load replays the intro. */
let hasIntroPlayed=false;
let holdDone=false; // first arrival at the Chapter I hold consumed — releases the camera-angle hold so the loop seam is angle-exact
const cineEl=document.getElementById('cine');
function renderFrame(){
  const t=clock.getElapsedTime();
  const dt=Math.min(Math.max(t-lastT,0),.05); lastT=t;
  // SCROLL DAMPING: exponential lerp toward raw scroll (tune SCROLL_DAMP above) — frame-rate
  // independent and driven from the animation loop; reduced motion halves the catch-up rate.
  const sk=1-Math.exp(-dt*(reduced? SCROLL_RATE*.5 : SCROLL_RATE));
  progress += (rawP - progress)*sk;
  if(Math.abs(rawP - progress) < .00004) progress = rawP;
  /* LOOP-WRAP FIX (EDIT ME — WRAP_EPS): the lap wraps ONLY once the damped progress has caught up with
     the end of the scroll (within WRAP_EPS); raw + smoothed then shift together by exactly (1-ACT0).
     orbitAngle(1) ≡ orbitAngle(ACT0) (mod 2π) and the character seam is pre-mirrored, so nothing on
     screen moves at the wrap. (Previously the wrap fired in the scroll handler while the damped value
     still lagged — a fast scroll could throw p far below ACT0 and re-trigger the intro: the reported
     snap/flash at the loop point.) */
  const WRAP_EPS=.003;
  if(rawP>=.9995 && rawP-progress<=WRAP_EPS){
    measureScroll(); // guard against a stale range — embedded-viewport height changes don't always fire resize
    window.scrollTo({top:ACT0*scrollMax}); rawP=ACT0;
    progress=Math.max(progress-(1-ACT0), ACT0-.0005);
  }
  /* BACKWARD WRAP — the circle loops in reverse too: once the intro has played, scrolling UP past the
     seam jumps to the equivalent end-of-runway spot (orbitAngle is identical mod 2π there), so you can
     orbit backward forever. The .0008 margin below the forward wrap's parking spot prevents ping-pong. */
  else if(hasIntroPlayed && holdDone && rawP<=ACT0-.0008 && progress-rawP<=WRAP_EPS){
    measureScroll();
    window.scrollTo({top:.99945*scrollMax}); rawP=.99945;
    progress=Math.min(progress+(1-ACT0), .9994);
  }
  const p=(window.__p!=null ? window.__p : progress);
  const introK0 = THREE.MathUtils.clamp(p/ACT0,0,1);
  if(p>=ACT0) hasIntroPlayed=true; // one-time intro consumed — top of page now resumes the normal loop
  if(p>=pCenter(0)) holdDone=true; // first Chapter-I arrival done — release the hold (see camera angle below)
  const [prox,actQ]=actProx(p);
  /* CAMERA START (EDIT ME): on the FIRST pass the ring angle is held at the Chapter I HOLD angle until
     the hold — the opening frame is the About wall dead centre and the performer walks straight up the
     lens axis into it. AFTER that first arrival (holdDone) the clamp releases to ACT0: orbitAngle(1) ≡
     orbitAngle(ACT0) mod 2π, so both loop seams are angle-exact (the hold clamp was the seam jump). */
  const a=orbitAngle(THREE.MathUtils.clamp(p, holdDone? ACT0 : pCenter(0), 1));

  // --- camera ---
  const camR = 2.6 + ease(prox)*1.1;
  const orbit = polar(a, camR, 2.45);
  const look = polar(a, 10.5, 2.0);
  // EDIT ME — CHAPTER I ARRIVAL FRAMING: lower + closer three-quarter shot (character reads large, floor in frame).
  // Blends in only while settled on quadrant 0; prox falloff returns to the standard orbit as you scroll on.
  if(actQ===0){ const w0=ease(prox);
    orbit.lerp(polar(a, 3.35, 1.8), w0); look.lerp(polar(a, 10.5, 1.7), w0); }
  // --- Act II sub-choreography: wide establishing shot, then dolly card→card (tweak CARD_ZOOM) ---
  let f0=0,f1=0,f2=0,maxF=0,focusIdx=-1;
  {
    const u=(p-(ACT0+ACTW))/ACTW; // 0..1 within Act II
    if(u>0&&u<1){
      const hw=.115, ramp=.09; // hold half-width + ramp — wider ramp = softer spotlight/dim crossfade
      const fs=CARD_ZOOM.map(c=>THREE.MathUtils.clamp((hw-Math.abs(u-c))/ramp,0,1));
      [f0,f1,f2]=fs; maxF=Math.max(f0,f1,f2); focusIdx=fs.indexOf(maxF);
      if(!reduced && stages.length===3){
        const AN=[ // [u, camera pos, look target] — wide → card1 → card2 → card3 → wide
          [.09,           polar(A(1)-.30,1.5,2.85),          polar(A(1)-.05,10.5,1.6)],
          [CARD_ZOOM[0],  polar(stages[0].ang,5.9,1.7),      polar(stages[0].ang,9.0,1.35)],
          [CARD_ZOOM[1],  polar(stages[1].ang,5.9,1.7),      polar(stages[1].ang,9.0,1.35)],
          [CARD_ZOOM[2],  polar(stages[2].ang,5.9,1.7),      polar(stages[2].ang,9.0,1.35)],
          [.93,           polar(A(1)+.32,1.6,2.75),          polar(A(1)+.55,10.5,1.7)],
        ];
        let hp,hl;
        if(u<=AN[0][0]){ hp=AN[0][1]; hl=AN[0][2]; }
        else if(u>=AN[4][0]){ hp=AN[4][1]; hl=AN[4][2]; }
        else{ let j=0; while(u>AN[j+1][0]) j++;
          const k=(u-AN[j][0])/(AN[j+1][0]-AN[j][0]);
          const k2=ease(THREE.MathUtils.clamp((k-.12)/.76,0,1)); // dwell on each stop, longer eased glide
          hp=AN[j][1].clone().lerp(AN[j+1][1],k2);
          hl=AN[j][2].clone().lerp(AN[j+1][2],k2);
          const pb=1-.12*Math.sin(Math.PI*k2); hp.x*=pb; hp.z*=pb; // gentle pull-back between cards
        }
        // blend into/out of the hijack so entry (from Act I) and exit (to Act III) match the orbit exactly
        const w=ease(THREE.MathUtils.clamp(u/.07,0,1))*ease(THREE.MathUtils.clamp((1-u)/.07,0,1));
        orbit.lerp(hp,w); look.lerp(hl,w);
      }
    }
  }
  const spotK = hasIntroPlayed? 1 : .3 + .7*introK0; // spotlight ramps in with the intro only once
  spot.intensity = 260*spotK;
  if(p < ACT0 && !hasIntroPlayed){ /* INTRO CAMERA — idle establishing shot → travel-with-walker → orbit.
       ✔ pole-descent + landing camera phases REMOVED — no spiral/descent references remain.
       ONE shared progress (introK0) drives character AND camera; both derive from charSmooth
       (the damped tracker), so they can never drift apart or jitter. */
    const CAM_A = orbitAngle(ACT0); // final azimuth — matches the Chapter I orbit exactly (invisible handoff)
    if(reduced){ // reduced motion: one synced glide, still tracking the character
      const k=ease(introK0);
      camPos.lerpVectors(polar(CAM_A, 4.0, 2.6), orbit, k);
      camLook.lerpVectors(_t2.set(charSmooth.x,charSmooth.y+1,charSmooth.z), look, k);
    } else if(introK0 < IDLE_END){ /* 1) OPENING SHOT — a slow dolly push-in on the standing character
         (never a frozen frame: scroll always visibly responds). Ends exactly at the walk-out lerp's
         start point (r 4.6, y 2.7) — zero-jump idle→walk camera handoff. */
      const kh=ease(introK0/IDLE_END);
      camPos.copy(polar(CAM_A+Math.PI+.8, 4.85-.25*kh, 2.82-.12*kh));
      camLook.set(charSmooth.x,charSmooth.y+.95,charSmooth.z);
    } else { /* 2) WALK-OUT — eases out of the establishing frame into the Chapter I orbit while the
         character walks, arriving at the exact About camera position/look-at (orbit/look) on settle. */
      const kw=ease((introK0-IDLE_END)/(1-IDLE_END));
      camPos.lerpVectors(polar(CAM_A+Math.PI+.8, 4.6, 2.7), orbit, kw);
      const kLook=ease(THREE.MathUtils.clamp(kw/.8,0,1));
      camLook.set(charSmooth.x,charSmooth.y+.95,charSmooth.z).lerp(look, kLook);
    }
  } else { camPos.copy(orbit); camLook.copy(look); }
  if(gymGame.cam>0){ // EXERCISE FOCUS MODE — camera pushes in on the lifter from a 3/4 front; fully eased both ways
    const gk=ease(gymGame.cam);
    const fx=Math.sin(char.rotation.y), fz=Math.cos(char.rotation.y); // character's forward in world space
    _gymV.set(char.position.x + fx*2.05 - fz*.5, char.position.y+1.18, char.position.z + fz*2.05 + fx*.5);
    camPos.lerp(_gymV, gk);
    camLook.lerp(_gymL.set(char.position.x, char.position.y+.92, char.position.z), gk);
  }
  if(cinema3d.k>0 && vScreenPoint){ /* SHOWREEL THEATER — movie framing (eased both ways). Same screen
       framing as the original seat cam (r 5.35 → 6.35 push, look-at on screen centre); the character
       stands far ahead near the screen at CIN_CHAR_SCALE, so it reads as a small silhouette (~10% of
       frame height) instead of a giant over-the-shoulder figure. */
    const ck=ease(cinema3d.k), cph=ease(cinema3d.push);
    _cinPos.set(Math.sin(vScreenAng)*(5.35+cph*1.0), 1.5+cph*.18, Math.cos(vScreenAng)*(5.35+cph*1.0));
    _cinLook.copy(vScreenPoint);
    camPos.lerp(_cinPos, ck); camLook.lerp(_cinLook, ck);
  }
  camera.position.copy(camPos); camera.lookAt(camLook);

  // --- cinematic pass: depth parallax + movement-reactive fog / vignette / letterbox ---
  { const first=aPrev===null;
    const dA=first?0:wrapPI(a-aPrev); aPrev=a;
    const spd=first?0:camera.position.distanceTo(camPrev)/Math.max(dt,.001); camPrev.copy(camera.position);
    aVelS+=(THREE.MathUtils.clamp(dA/Math.max(dt,.001),-2,2)-aVelS)*(1-Math.exp(-dt*4));
    const mTgt=reduced?0:THREE.MathUtils.clamp(spd*MOVE_GAIN,0,1);
    moveK+=(mTgt-moveK)*(1-Math.exp(-dt*(mTgt>moveK?5:2)));
    if(!reduced){
      bgGroup.rotation.y=-aVelS*PARA_BG;     // far bowl lags most — background parallax
      decorGroup.rotation.y=-aVelS*PARA_MID; // wall decor: a hair of lag — depth without detaching from its nails
    }
    if(scene.fog){ scene.fog.near=FOG_NEAR0-moveK*2.5; scene.fog.far=FOG_FAR0-moveK*5; } // far-DOF fake tightens on travel
    const cineOp=+Math.max(moveK*.8, ease(cinema3d.k)*.85).toFixed(2); // vignette + letterbox breathe with movement; full bars through the theater moment
    if(cineOp!==lastCineOp){ lastCineOp=cineOp; cineEl.style.opacity=cineOp; }
  }

  // --- character: one-time intro (idle stand → walk out) → weighted ring walk; scroll-deterministic ---
  // Walk destination: ALWAYS the hardcoded About target (ABOUT_ANG). After the intro the character holds
  // there while the camera arrives, then the offset fades and the normal ring-walk takes over — no jump.
  const ringAng = a - .2;
  const offAmt = ABOUT_ANG - (orbitAngle(pCenter(0))-.2); // 0 by construction — the intro spot IS the hold spot
  const kHold = 1-ease(THREE.MathUtils.clamp((p-ACT0)/WALK_BLEND,0,1));          // fades after the intro
  const kSeam = ease(THREE.MathUtils.clamp((p-(1-WALK_BLEND))/WALK_BLEND,0,1));  // pre-wrap mirror (loop seam)
  const charAng = ringAng + offAmt*Math.min(1, kHold+kSeam);
  const walkPos = polar(charAng, 7.8, .13);
  const cp = _t1; let idleK=0, yawDirect=false, yawTarget=0; // idleK=1 during the opening idle stand — drives the breathing/weight-shift pose below
  if(introK0 < 1 && !hasIntroPlayed){
    if(reduced){ cp.copy(walkPos); cp.y += (1-ease(introK0))*1.4; } // gentle glide/lower-in
    else if(introK0 < IDLE_END){ /* a) IDLE STAND — THE OPENING SHOT (✔ pole descent/landing branches removed).
         START POSE/POSITION (EDIT ME — START_R, IDLE_END): standing at r START_R on the About radial,
         ground height .13, FACING THE CAMERA (yaw = the intro camera azimuth, set directly below).
         Zero travel ⇒ stepDist≈0 keeps the walk cycle silent; the rig's built-in idleSway + chest
         breathing + the idleK lift/weight-shift read as a calm, alive stand (rig has no blink support). */
      cp.copy(polar(charAng, START_R, .13));
      yawDirect=true; yawTarget=orbitAngle(ACT0)+Math.PI+.8; // face straight down the lens — the camera holds this azimuth
      idleK=1;
    } else { /* b) WALK-OUT — IDLE→WALK TRANSITION TRIGGER: the first scroll past IDLE_END eases the stand
         into the normal grounded walk cycle (kw accelerates from 0 — no snap out of idle; yaw eases from
         camera-facing to the travel direction via the wrap-safe turn easing below). */
      const kw=ease((introK0-IDLE_END)/(1-IDLE_END)); // eased accel + decel
      /* WALK LANE (EDIT ME — LANE_BOW): the straight radial line from centre to the About spot runs
         through the desk/chair set, so the path bows LANE_BOW rad to the open side and closes to 0
         on arrival — same start and end, no furniture clipping. */
      const LANE_BOW=.34;
      const bow=LANE_BOW*Math.sin(Math.PI*kw)*(1-kw*.15);
      cp.copy(polar(charAng+bow, START_R + (7.8-START_R)*kw, .13));
      yawTarget = charAng - Math.PI/2*ease(THREE.MathUtils.clamp((kw-.7)/.3,0,1)); // face walk dir → turn to travel
    }
  } else cp.copy(walkPos);
  // SHOWREEL THEATER: the character eases to the watch spot in front of the screen (the walk cycle
  // animates the travel via stepDist) and will face the screen — back to camera, waist-up in frame.
  if(cinema3d.k>0) cp.lerp(_watchSpot, ease(cinema3d.k));
  // stride sync: phase advances with ground distance — no foot sliding
  const vx=cp.x-lastCP.x, vz=cp.z-lastCP.z; // ACTUAL per-frame ground velocity — the heading source
  const stepDist=Math.min(Math.hypot(vx,vz),.3);
  walkPhase += stepDist*3.4; // EDIT ME: stride frequency
  walkAmp += (THREE.MathUtils.clamp(stepDist/Math.max(dt,.001)*.5,0,1)-walkAmp)*(1-Math.exp(-dt*8));
  lastCP.copy(cp);
  const airY=Math.max(0,cp.y-walkPos.y);
  const bob=Math.abs(Math.sin(walkPhase))*.045*walkAmp*(reduced?.35:1);
  // IDLE STAND pose layer (idleK): slow breathing lift + a subtle lateral weight shift — calm, never frozen
  const idleLift=idleK*.02*Math.sin(t*1.6), idleShift=idleK*.03*Math.sin(t*.55);
  char.position.set(cp.x + idleShift*Math.cos(yawCur), cp.y + bob + .015*Math.sin(t*1.9) + idleLift, cp.z - idleShift*Math.sin(yawCur)); // + breathing lift
  charSmooth.lerp(char.position, 1-Math.exp(-dt*8)); // damped tracker (rate 8/s) that the intro camera follows
  // FACING — one meaningful target at all times: the camera during the idle stand, walk direction on the
  // way out, travel direction while touring, wall content while presenting. Turns are eased + wrap-safe.
  if(yawDirect){ yawCur=yawTarget; }
  else {
    /* FORWARD HEADING (EDIT ME — HEAD_EPS): yaw derives from the ACTUAL movement vector (cp − lastCP),
       so the body always faces where it truly travels — forward on scroll-down, turns-and-walks-forward
       on scroll-up, and never reads backward during the post-intro hold fade or the loop seam (the old
       formula assumed a heading from charAng and could invert there). Model forward is local -Z ⇒
       heading = atan2(-vx,-vz). Below HEAD_EPS (standstill) the last heading simply HOLDS — no flip-flap.
       While an act is settled (prox→1) facing blends to the wall content: a presenting pose, never a
       moonwalk. The turn easing is wrap-safe shortest-path — it cannot overshoot past the target. */
    const HEAD_EPS=.0005;
    if(stepDist>HEAD_EPS) headingYaw=Math.atan2(vx,vz); // face INTO the travel direction (was reversed — looked like walking backward)
    let tgt;
    if(introK0<1 && !hasIntroPlayed && !reduced) tgt=yawTarget; // walk-out target from the intro sequencer
    else { const gesture=charAng+Math.PI;
      tgt = headingYaw + wrapPI(gesture-headingYaw)*ease(prox); }
    yawCur += wrapPI(tgt-yawCur)*(1-Math.exp(-dt*6));
  }
  char.rotation.y = yawCur;
  if(cinema3d.k>0) char.rotation.y = yawCur + wrapPI(vScreenAng - yawCur)*ease(cinema3d.k); // face the movie screen
  const yawRate=wrapPI(yawCur-prevYawF)/Math.max(dt,.001); prevYawF=yawCur;
  const turnLean=THREE.MathUtils.clamp(yawRate*.05,-.15,.15); // anticipatory lean into turns
  // weighted locomotion + idle (counter-rotation, breathing, micro weight-shift)
  const swing=Math.sin(walkPhase)*.55*walkAmp*(reduced?.4:1);
  const idleSway=Math.sin(t*.6+1)*.035*(1-walkAmp);
  RIG.legL.hip.rotation.x=swing; RIG.legR.hip.rotation.x=-swing;
  RIG.legL.knee.rotation.x=Math.max(0,-Math.sin(walkPhase-.45))*.75*walkAmp;
  RIG.legR.knee.rotation.x=Math.max(0, Math.sin(walkPhase-.45))*.75*walkAmp;
  RIG.hips.rotation.y=swing*.22;
  RIG.hips.rotation.z=idleSway+Math.sin(walkPhase*2)*.02*walkAmp + turnLean; // lean into turns
  RIG.torso.rotation.y=-swing*.3; RIG.torso.rotation.z=-idleSway*.6 - turnLean*.4;
  RIG.torso.rotation.x=walkAmp*.05; // forward weight while walking
  RIG.chest.scale.y=1+.012*Math.sin(t*1.9); // breathing
  const armSw=Math.sin(walkPhase+.25)*.5*walkAmp;
  const presK=ease(prox)*((introK0>=1||hasIntroPlayed)?1:0)*(1-ease(cinema3d.k)); // presenting arm lowers while watching the movie
  RIG.armL.sh.rotation.x=armSw;
  RIG.armL.sh.rotation.z=-.1; // natural A-pose (hand rests calmly at the side)
  RIG.armL.el.rotation.x=-.25 - Math.max(0,Math.sin(walkPhase+.7))*.3*walkAmp;
  RIG.armR.sh.rotation.x=-armSw*(1-presK) - presK*1.15; // raise to present, eased
  RIG.armR.sh.rotation.z=.1 + presK*.3; // (pole-grip arm pose removed with the pole)
  RIG.armR.el.rotation.x=-.25 - presK*.5 - Math.max(0,-Math.sin(walkPhase+.7))*.3*walkAmp*(1-presK);
  // natural joint limits — keep arms out of the body/pole
  RIG.armR.sh.rotation.x=THREE.MathUtils.clamp(RIG.armR.sh.rotation.x,-2.1,1.5);
  RIG.armL.el.rotation.x=THREE.MathUtils.clamp(RIG.armL.el.rotation.x,-1.5,0);
  RIG.armR.el.rotation.x=THREE.MathUtils.clamp(RIG.armR.el.rotation.x,-1.5,0);
  if(musicPose.arm>0){ // MUSIC HEADSET: right hand rises to the ear — blends OVER locomotion, fully eased
    const mk=ease(musicPose.arm);
    RIG.armR.sh.rotation.x+=(-2.35-RIG.armR.sh.rotation.x)*mk;
    RIG.armR.el.rotation.x+=(-1.15-RIG.armR.el.rotation.x)*mk;
  }
  if(gymGame.active){ // EXERCISE: crouch → grip → stand → curls; blends OVER locomotion, fully eased
    const gk=Math.max(gymGame.k,gymGame.lift), cr=gymGame.crouch, cu=gymGame.curl, w=Math.max(gk,cr);
    RIG.legL.knee.rotation.x+=cr*1.0; RIG.legR.knee.rotation.x+=cr*1.1; // knees give in the crouch
    RIG.torso.rotation.x+=cr*.55 - cu*.1*gk;                            // hinge down / lean back a touch at the top
    char.position.y-=cr*.3;                                             // hips sink
    const reach=cr*(1-gymGame.lift);                                    // arms reach for the floor pre-grip
    const shX=-(.28+cu*.42)*gk - reach*1.05;
    const elX=-(.5+cu*1.12)*gk - reach*.15;
    for(const A of [RIG.armL,RIG.armR]){ // both hands on the bar — symmetric grip
      A.sh.rotation.x+=(shX-A.sh.rotation.x)*w;
      A.sh.rotation.z+=(((A===RIG.armL)?-.16:.16)-A.sh.rotation.z)*w;
      A.el.rotation.x+=(elX-A.el.rotation.x)*w;
    }
    if(!reduced && cu>.65) RIG.torso.rotation.x+=.04*Math.sin(t*40)*(cu-.65); // a whisper of strain at the top
    if(gymGame.held) gymGame.held.position.set(0, .55+gymGame.lift*.1+cu*.4-cr*.33, .3-cu*.1); // bar rides between the hands
  }
  { // head: subtle look toward the active wall content; billboard portrait faces camera
    const want=charAng+Math.PI;
    let dy=want-char.rotation.y; dy=((dy+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
    headYaw += (THREE.MathUtils.clamp(dy,-.55,.55)*presK - headYaw)*(1-Math.exp(-dt*5));
    RIG.headG.rotation.y=headYaw; RIG.headG.rotation.x=.04*Math.sin(t*.8)-presK*.05;
  }
  { // outfit color crossfade per act (mapping in OUTFITS) + small settle flourish on swap
    const want=(introK0>=.98 && prox>.25)? actQ : outfitState.idx;
    if(want!==outfitState.idx){ outfitState.idx=want; outfitState.pulse=1; }
    outfitState.pulse*=Math.exp(-dt*3.2);
    const oc=outfitCols[outfitState.idx];
    const ck=1-Math.exp(-dt*(reduced?9:4.5));
    matTop.color.lerp(oc.top,ck); matTopD.color.lerp(oc.topD,ck);
    matPants.color.lerp(oc.pants,ck); matShoes.color.lerp(oc.shoes,ck);
    /* SHOWREEL SHRINK: this line runs EVERY frame, so the theater shrink must be applied here (a
       gsap tween on char.scale gets overwritten). ease(cinema3d.k) blends 1 → CIN_CHAR_SCALE. */
    const cinShrink=1-(1-CIN_CHAR_SCALE)*ease(cinema3d.k);
    char.scale.setScalar((HEIGHT/1.79)*(1+.05*Math.sin(outfitState.pulse*9)*outfitState.pulse)*cinShrink);
  }
  char.visible = reduced? (introK0>.03||hasIntroPlayed) : true;
  blob.position.set(cp.x,.155,cp.z);
  const airK=THREE.MathUtils.clamp(airY*.6,0,1);
  blob.scale.setScalar(1+airK*1.5);
  blob.material.opacity=.32*(1-airK*.75)*(char.visible?1:0);

  // spotlight follows character
  spot.target.position.copy(char.position);
  spot.position.set(cp.x*.15, 11, cp.z*.15);

  // --- Act II focus: spotlight snap + dim/lift ---
  if(stages.length===3){
    const fs=[f0,f1,f2];
    stages.forEach((s,i)=>{
      const f=fs[i], dimK=maxF*(1-(maxF?f/maxF:0)); // non-focused cards dim while one is focused
      s.mat.color.setScalar(1-.45*dimK);
      if(s.matHov) s.matHov.color.setScalar(1-.45*dimK); // hover skin dims with the base card
      s.outer.scale.setScalar(1+.06*f-.02*dimK);    // focused card settles up subtly
    });
    if(focusIdx>=0 && maxF>.03){
      const s=stages[focusIdx];
      stageSpot.intensity=120*maxF;
      stageSpot.position.copy(polar(s.ang,6.8,6.4));
      stageSpot.target.position.copy(polar(s.ang,9.0,1.1));
    } else stageSpot.intensity=0;
  }

  if(puffPts.visible){ let alive=false; // celebration puffs (gym reward) — shared pool update
    for(let i2=0;i2<PUFF_N;i2++){ if(puffLife[i2]>0){ alive=true; puffLife[i2]-=dt;
      puffPos[i2*3]+=puffVel[i2*3]*dt; puffPos[i2*3+1]+=puffVel[i2*3+1]*dt; puffPos[i2*3+2]+=puffVel[i2*3+2]*dt;
      puffVel[i2*3+1]-=2.2*dt;
      if(puffLife[i2]<=0) puffPos[i2*3+1]=-999; } }
    puffGeo.attributes.position.needsUpdate=true; if(!alive) puffPts.visible=false; }
  // --- Act III conveyor gallery: photos drift leftward along the belt, shrink out at the far end,
  //     loop back in at the near end. REDUCED MOTION: belt parked — photos sit evenly spaced. ---
  if(journey.length){
    const mv = reduced? 0 : t*BELT_SPEED;
    for(const j of journey){
      const az = BELT_AZ0 + (((j.off0+mv)%BELT_SPAN)+BELT_SPAN)%BELT_SPAN;
      j.g.position.copy(polar(az,10.68,BELT_PH_Y)); j.g.rotation.y=az+Math.PI; j.g.rotation.z=j.rz;
      const s = ease(THREE.MathUtils.clamp(Math.min(az-BELT_AZ0, BELT_AZ1-az)/BELT_EDGE, 0, 1));
      j.g.scale.setScalar(Math.max(s,.001)); j.g.visible = s>.03; // rolls off / rolls on at the wheels
    }
    if(!reduced && lifeProps.beltWheels) for(const w of lifeProps.beltWheels) w.rotation.z -= dt*1.1;
  }

  // --- decor sway ---
  for(const s of swayers) s.obj.rotation.z = (s.base||0) + Math.sin(t*1.2+s.phase)*s.amp + (s.obj.userData.rotZExtra||0);

  // --- ambient life: cat · plant sway · laptop glow · Fluffy's eyes · statues · party · bubbles ---
  // EXERCISE prompt: fades in when the character walks near the gym mat; billboards toward the camera
  if(lifeProps.exercise){
    const EX=lifeProps.exercise;
    if(EX.y0===undefined) EX.y0=EX.g.position.y;
    const near=introK0>=1 && !gymGame.active && Math.abs(wrapPI(charAng-4.35))<.55;
    EX.m.opacity+=((near?1:0)-EX.m.opacity)*(1-Math.exp(-dt*5));
    EX.ringM.opacity=EX.m.opacity;
    EX.g.visible=EX.m.opacity>.02;
    if(EX.g.visible){ EX.g.position.y=EX.y0+Math.sin(t*1.6)*.04; EX.g.lookAt(camera.position);
      if(!reduced){ EX.ring.rotation.z=t*1.4; // colorful ring spins to catch the eye
        const pu=1+.045*Math.sin(t*2.6); EX.ring.scale.set(pu,pu,1); } }
  }
  // "VIEW ALL CASE STUDIES" playbill: dragged right→left along the wall as the camera walks the
  // case-study act (EDIT ME — sweep range ±.30 around A(1), eased so it settles at each end)
  if(lifeProps.viewAll){
    const VA=lifeProps.viewAll;
    const k=ease(THREE.MathUtils.clamp((wrapPI(charAng-(A(1)-.45)))/.9, 0, 1));
    const az=A(1)-.30+k*.60; // right gap → all the way past the left stage
    VA.g.position.copy(polar(az,10.7,.60)); VA.g.rotation.y=az+Math.PI;
  }
  gymGame.pNow=p; // scroll snapshot the mini-game anchors to
  if(gymGame.active && gymGame.ui && Math.abs(gymGame.pNow-gymGame.p0)>.012) endExercise(); // scrolled away — bow out gracefully
  if(lifeProps.cat){
    const C=lifeProps.cat, cfy=.25*(1-(6.9*6.9)/(10.6*10.6));
    // --- ONE-TIME DESK MOMENT: first camera arrival at Chapter IV (Let's Connect) → cat visits the desk.
    //     In-memory flag (C.deskDone) — never repeats this session. EDIT ME: DESK_SIT_SECS = how long it sits.
    const DESK_SIT_SECS=6;
    if(!C.deskDone && lifeProps.desk && actQ===3 && prox>.5 && introK0>=1){
      C.deskDone=true; C.nap=0; C.pause=0; C.script={ph:reduced?'sitR':'ring', t0:t};
    }
    const S=C.script, D=lifeProps.desk;
    if(S && reduced){ // reduced motion: no arcs — appears seated on the desk, then calmly back to its spot
      if(S.ph==='sitR'){ C.g.position.copy(D.sit); C.g.rotation.y=D.sitYaw;
        C.legs.forEach(l=>l.rotation.x=1.1); C.tail.rotation.z=1.15+.1*Math.sin(t*.8);
        if(t-S.t0>DESK_SIT_SECS || actQ!==3){ C.g.position.copy(D.exit); C.az=D.exitAz; C.script=null;
          C.legs.forEach(l=>l.rotation.x=0); } }
    }
    else if(reduced){ C.tail.rotation.z=.35+.15*Math.sin(t*.8); } // sits; gentle tail sway
    else if(S){ // scripted desk sequence: walk → crouch → jump → land → sit → hop down → resume wandering
      // timing: walk (distance-based, ~1.05 u/s) · crouch .28s · jump .55s · land .3s · sit DESK_SIT_SECS · down .5s
      const P=C.g.position;
      if(S.ph==='ring'){ // trots around its usual ring toward the desk (never cuts across the arena / pole)
        let d=(D.exitAz-C.az)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2;
        const stp=Math.sign(d)*Math.min(Math.abs(d), dt*.55);
        C.az+=stp; C.gait=(C.gait||0)+dt*10;
        const cfy2=.25*(1-(6.9*6.9)/(10.6*10.6));
        P.set(Math.sin(C.az)*6.9, cfy2+.014*Math.abs(Math.sin(C.gait)), Math.cos(C.az)*6.9);
        C.g.rotation.y=C.az+(d<0?Math.PI:0);
        C.legs.forEach((l,i2)=>l.rotation.x=Math.sin(C.gait+(i2%2?Math.PI:0)+(i2<2?0:.55))*.6);
        C.tail.rotation.z=.3+.25*Math.sin(t*3.2);
        if(Math.abs(d)<.03){ S.ph='walk'; S.t0=t; }
      } else if(S.ph==='walk'){ // trots to the desk-front mark
        const dx=D.front.x-P.x, dz=D.front.z-P.z, dist=Math.hypot(dx,dz);
        if(dist<.07){ S.ph='crouch'; S.t0=t; }
        else{ const stp=dt*1.05; P.x+=dx/dist*stp; P.z+=dz/dist*stp;
          C.gait=(C.gait||0)+dt*9; P.y=D.front.y+.014*Math.abs(Math.sin(C.gait));
          C.g.rotation.y=Math.atan2(-dz,dx);
          C.legs.forEach((l,i2)=>l.rotation.x=Math.sin(C.gait+(i2%2?Math.PI:0)+(i2<2?0:.55))*.55);
          C.tail.rotation.z=.35+.25*Math.sin(t*3); }
      } else if(S.ph==='crouch'){ // anticipation — gathers low, aims at the desktop
        const k=Math.min(1,(t-S.t0)/.28);
        C.g.scale.y=1-.2*Math.sin(k*Math.PI*.5); C.legs.forEach(l=>l.rotation.x=.6*k);
        const dx=D.sit.x-P.x, dz=D.sit.z-P.z; C.g.rotation.y=Math.atan2(-dz,dx);
        if(k>=1){ S.ph='jump'; S.t0=t; S.fx=P.x; S.fy=P.y; S.fz=P.z; }
      } else if(S.ph==='jump'){ // launch — parabolic arc up onto the desk, legs tucked, slight stretch
        const k=Math.min(1,(t-S.t0)/.55), e=k*(2-k);
        P.x=S.fx+(D.sit.x-S.fx)*e; P.z=S.fz+(D.sit.z-S.fz)*e;
        P.y=S.fy+(D.sit.y-S.fy)*k + .3*Math.sin(k*Math.PI);
        C.g.scale.y=1+.12*Math.sin(k*Math.PI); C.legs.forEach(l=>l.rotation.x=.9*(1-k));
        C.tail.rotation.z=-.2+.5*k;
        if(k>=1){ S.ph='land'; S.t0=t; C.g.rotation.y=D.sitYaw; }
      } else if(S.ph==='land'){ // landing squash-and-settle
        const k=Math.min(1,(t-S.t0)/.3);
        P.copy(D.sit); C.g.scale.y=1-.16*Math.sin(k*Math.PI);
        C.legs.forEach(l=>{ l.rotation.x=.35*k; l.scale.y=1-.7*k; });
        if(k>=1){ S.ph='sit'; S.t0=t; }
      } else if(S.ph==='sit'){ // sits neatly — compact curl, tail wrapped, idle looks; leaves after a beat or when you scroll on
        C.g.scale.set(1,.9,1); P.copy(D.sit); P.y-=.045; C.g.rotation.y=D.sitYaw; // loaf — legs tucked away
        C.legs.forEach(l=>{ l.rotation.x=.35; l.scale.y=.3; });
        C.tail.rotation.z=1.35+.12*Math.sin(t*1.6);
        C.head.rotation.y=.35*Math.sin(t*.7)+.1*Math.sin(t*2.3);
        if(t-S.t0>DESK_SIT_SECS || actQ!==3){ S.ph='down'; S.t0=t; S.fx=P.x; S.fy=P.y; S.fz=P.z; }
      } else if(S.ph==='down'){ // clean hop down, then back to its own business (wander resumes at D.exitAz)
        const k=Math.min(1,(t-S.t0)/.5), e=k*k*(3-2*k);
        P.x=S.fx+(D.exit.x-S.fx)*e; P.z=S.fz+(D.exit.z-S.fz)*e;
        P.y=S.fy+(D.exit.y-S.fy)*(k*k) + .16*Math.sin(k*Math.PI);
        C.legs.forEach(l=>{ l.rotation.x=.7*(1-k); l.scale.y=.3+.7*k; }); C.g.scale.y=1+.06*Math.sin(k*Math.PI);
        const dx2=D.exit.x-S.fx, dz2=D.exit.z-S.fz; C.g.rotation.y=Math.atan2(-dz2,dx2);
        if(k>=1){ C.script=null; C.az=D.exitAz; C.gait=0; C.g.scale.set(1,1,1); C.head.rotation.y=0; }
      }
    }
    else if(C.nap>t){ // EGG payoff: curls up for a quick nap
      C.g.scale.set(1,.82,1); C.tail.rotation.z=1.3; C.legs.forEach(l=>l.rotation.x=1.2);
      C.head.rotation.y=2.2; C.g.position.y=cfy-.015;
    } else { // gentle wander loop at r 6.9 — past the plant, around the chair (EDIT: speed .075)
      C.g.scale.set(1,1,1);
      const paused=C.pause>t;
      const sp=paused?0:Math.max(0,Math.sin(t*.11)+.35)/1.35; // bursts of walking with natural pauses
      C.az+=SPIRAL_DIRECTION*dt*sp*.075; // wander advances in SPIRAL_DIRECTION (the cat's loop sense)
      C.gait=(C.gait||0)+dt*7*sp;
      C.g.position.set(Math.sin(C.az)*6.9, cfy+.012*Math.abs(Math.sin(C.gait)), Math.cos(C.az)*6.9);
      C.g.rotation.y=C.az+(SPIRAL_DIRECTION<0?Math.PI:0); // heading = path tangent IN the travel direction
      C.legs.forEach((l,i2)=>l.rotation.x=Math.sin(C.gait+(i2%2?Math.PI:0)+(i2<2?0:.55))*.5*Math.min(sp*3,1));
      C.lookK+=(((sp<.06)?1:0)-C.lookK)*(1-Math.exp(-dt*3)); // pauses → looks around
      C.head.rotation.y=Math.sin(t*.9)*.5*C.lookK + (paused? .4*Math.sin(t*2):0);
      C.tail.rotation.z=.35+.22*Math.sin(t*2.1);
    }
  }
  if(lifeProps.plantA && !reduced){ const s3=Math.sin(t*1.4)*.04;
    lifeProps.plantA.rotation.z=s3; lifeProps.plantB.rotation.z=-s3*.8; } // leaves sway, barely
  if(lifeProps.glowM) lifeProps.glowM.emissiveIntensity=.5+.08*Math.sin(t*7)+.05*Math.sin(t*13); // laptop flicker
  if(lifeProps.desk) lifeProps.desk.glow.emissiveIntensity=.45+.07*Math.sin(t*6.3)+.04*Math.sin(t*11); // desk monitor flicker
  if(lifeProps.fluffy){ const F=lifeProps.fluffy; // Fluffy's eyes gently follow the cursor
    for(const pu of F.pupils){ pu.position.x=pu.userData.bx+ptr.x*.008; pu.position.y=pu.userData.by+ptr.y*.006; } }
  // statues: one nearby figure comments as each chapter settles (LINES_* arrays)
  if(actQ!==lastTalkAct && prox>.55 && t-lastTalkT>4 && introK0>=1){
    lastTalkAct=actQ; lastTalkT=t; speakFromAudience(a);
  }
  if(talker){ const k3=(talker.until-performance.now())/3000;
    if(k3<=0){ audBody.setMatrixAt(talker.i,talker.base); audBody.instanceMatrix.needsUpdate=true; talker=null; }
    else{ _m.copy(talker.base); _mr.makeRotationZ(Math.sin(t*6)*.06*Math.sin(Math.min(1,k3*3)*Math.PI));
      _m.multiply(_mr); audBody.setMatrixAt(talker.i,_m); audBody.instanceMatrix.needsUpdate=true; } }
  if(partyK>0){ // hidden PARTY_KEY celebration: warm light lift + spotlight sweep, eases back to normal
    partyK*=Math.exp(-dt*(reduced?2.2:.55));
    if(partyK<.012) partyK=0;
    else if(!reduced){ spot.target.position.copy(polar(t*5.5, 6+2*Math.sin(t*2.3), .5));
      spot.intensity=260*(1+partyK*.8); }
  }
  updateBubbles();
  syncOverlay(p, actQ, prox);

  // --- Chapter IV life set: bike loop · spinning vinyl + floating headphones · drifting paper plane ---
  // EDIT ME: bike loop 14s · vinyl ~33rpm · plane loop 11s; reduced motion = slow gentle idles
  if(zoo.ready){
    const rzA=reduced?0:1;
    const B=zoo.bike; // GT 650 is parked — static save for the click-rev shudder
    B.rev=(B.rev||0)*Math.exp(-dt*1.6); // EGG: click-rev decays
    B.bk.position.y=.035*Math.sin(t*26)*B.rev;
    B.wheels.forEach(w2=>{ w2.rotation.z-=dt*9*B.rev; });
    B.light.material.emissiveIntensity=.7+.3*Math.sin(t*2.1)+B.rev*1.5;
    // drive-by caption: camera passing near the parked GT 650 → dream-bike callout (once per pass)
    const bwp=B.bk.getWorldPosition(_bv);
    const near=camera.position.distanceTo(bwp)<5.2;
    if(near && !B.nearSaid){ B.nearSaid=true; say(bwp, GT_LINE, 3000, 1.15); }
    else if(!near && camera.position.distanceTo(bwp)>6.5) B.nearSaid=false;
    const V=zoo.vinyl;
    V.disc.rotation.y+=dt*(reduced?.8:3.5);
    V.phones.position.y=1.15+.05*Math.sin(t*1.1+1)*rzA;
    V.phones.rotation.y+=dt*.4*rzA;
    V.phones.scale.setScalar(1+.02*Math.sin(t*2.4)*rzA); // soft pulse
    const P=zoo.plane, pt2=(t/11)*Math.PI*2*rzA+4;
    P.pl.position.set(Math.cos(pt2)*.5, .12*Math.sin(pt2*2), Math.sin(pt2)*.5);
    P.pl.rotation.y=-pt2-Math.PI/2;
    P.pl.rotation.x=.35*Math.cos(pt2)*rzA; // banking
  }

  /* --- bulb twinkle ---
     176 instance colours + a full instanceColor upload, every frame, for a
     shimmer whose fastest term is 1.6 rad/s. 20Hz is indistinguishable and
     costs a third as much. (EDIT ME — BULB_HZ) */
  if(!reduced && t-lastBulbT >= 1/BULB_HZ){
    lastBulbT=t;
    for(let k=0;k<N_BULB;k++){
      const tw=.82+.14*Math.sin(t*1.6+bulbPhase[k]); // gentle, not carnival-blinky
      bulbs.setColorAt(k,_c.setRGB(tw,tw*.9,tw*.72));
    }
    bulbs.instanceColor.needsUpdate=true;
  }

  // auto-pause the wall video when the camera leaves Act I (never while the cinema focus is open — scroll is locked then anyway)
  if(vid && !vid.paused && !cinemaOpen && (actQ!==0 || prox<.18)){ vid.pause(); gsap.to(posterMat,{opacity:.45,duration:.5}); }
  if(reelTex) drawFallbackReel(); // fallback showreel — animated every frame while it owns the screen
  updateCardVideos(); // case-study cards with a video thumbnail — redraw the live frame into their card art

  resolveHover();

  renderer.render(scene,camera);
}

/* HOVER RESOLUTION — pulled out of the render loop so a touch `pointerdown` can
   force it synchronously (see the input section).

   Gating: skip entirely behind an overlay, otherwise resolve when the pointer
   moved, the camera moved, or HOVER_MIN_HZ says we're stale. That floor matters
   — plenty of clickable things move on their own (conveyor polaroids, the
   sliding playbill, the billboarding gym prompt), so a pointer-and-camera-only
   gate would leave a resting cursor blind to a photo drifting underneath it.
   12Hz catches it within ~80ms and still costs a fifth of the old every-frame
   raycast against ~60 objects. (EDIT ME — HOVER_MIN_HZ) */
const _hoverCam=new THREE.Vector3();
const HOVER_MIN_HZ=12; let lastHoverT=-9;
function resolveHover(force){
  if(modal.classList.contains('open')
     || galleryOv.classList.contains('open') || cinemaOpen || cinema3d.k>0){
    if(hovered) setHover(null);
    return;
  }
  const camMoved = _hoverCam.distanceToSquared(camera.position) > 1e-6;
  if(camMoved) _hoverCam.copy(camera.position);
  const now = clock.getElapsedTime();
  if(!force && !ptrDirty && !camMoved && now-lastHoverT < 1/HOVER_MIN_HZ) return;
  lastHoverT = now; ptrDirty = false;
  if(!ptrInside){ setHover(null); return; }
  ray.setFromCamera(ptr,camera);
  setHover(ray.intersectObjects(clickables)[0]?.object || null);
}
function setHover(nh){
  if(nh!==hovered){
    if(hovered){ const u=hovered.userData;
      if(!u.noLift) gsap.to(u.group.position,{duration:.3,y:u.baseY});
      if(u.type!=='case'&&u.type!=='plaque') hovered.material.emissive?.set('#000');
      if(u.type==='plaque'){ gsap.to(u.hovMat,{opacity:0,duration:.25,ease:'power2.out'});
        gsap.to(u.shadowMat,{opacity:0,duration:.25,ease:'power2.out'}); }
      if(u.type==='case'){ gsap.to(u.hovMat,{opacity:0,duration:.25,ease:'power2.out'});
        gsap.to(u.shadowMat,{opacity:0,duration:.25,ease:'power2.out'});
        gsap.to(u.shadowMesh.scale,{x:1,y:1,duration:.25,ease:'power2.out'}); }
      if(u.type==='video'&&vFrameMat) gsap.to(vFrameMat,{duration:.3,emissiveIntensity:vid&&!vid.paused?.12:.06});
      if(u.type==='rec'||u.type==='plaque'){ gsap.to(u.group.position,{x:u.base.x,y:u.base.y,z:u.base.z,duration:.45,ease:'power3.out'});
        gsap.to(u.group.scale,{x:1,y:1,z:1,duration:.45,ease:'power3.out'}); }
      if(u.type==='brick'){ gsap.to(u.group.scale,{x:1,y:1,z:1,duration:.45,ease:'power2.inOut'}); // eases back flush — no snap
        gsap.to(hovered.material,{emissiveIntensity:0,duration:.4}); } }
    hovered=nh;
    if(hovered){ const u=hovered.userData;
      if(!u.noLift){ if(u.baseY===undefined) u.baseY=u.group.position.y;
        gsap.to(u.group.position,{duration:.3,y:u.baseY+.12}); }
      /* CASE CARDS are excluded from the generic warm-brown emissive tint on purpose — that tint
         recoloured the whole card. They get the darker paper + brass stroke + drop shadow instead. */
      if(u.type!=='case'&&u.type!=='plaque') hovered.material.emissive?.set('#6a4a20');
      if(u.type==='plaque'){ gsap.to(u.hovMat,{opacity:1,duration:.28,ease:'power2.out'});
        gsap.to(u.shadowMat,{opacity:.55,duration:.28,ease:'power2.out'}); }
      if(u.type==='case'){ gsap.to(u.hovMat,{opacity:1,duration:.28,ease:'power2.out'});
        gsap.to(u.shadowMat,{opacity:.6,duration:.28,ease:'power2.out'});
        gsap.to(u.shadowMesh.scale,{x:1.05,y:1.05,duration:.28,ease:'power2.out'}); }
      if(u.type==='video'&&vFrameMat) gsap.to(vFrameMat,{duration:.3,emissiveIntensity:.3});
      if(u.type==='rec'||u.type==='plaque'){ // HOVER POP-OUT: card eases forward toward the camera and enlarges (readable)
        gsap.to(u.group.position,{x:u.pop.x,y:u.pop.y,z:u.pop.z,duration:.45,ease:'power3.out'});
        gsap.to(u.group.scale,{x:u.type==='rec'?1.55:1.35,y:u.type==='rec'?1.55:1.35,z:u.type==='rec'?1.55:1.35,duration:.45,ease:'power3.out'}); }
      // BRICK HOVER POP-OUT (EDIT ME): group scale <1 shrinks the cylinder radius → the brick physically
      // eases FORWARD out of the wall toward the camera (~.3u) and reads bigger; warm glow brightens the
      // engraving. One brick at a time (single `hovered`); neighbors stay flush — the .01-arc mortar gap
      // gives clearance. REDUCED MOTION: highlight only, no translation.
      if(u.type==='brick'){ if(!reduced) gsap.to(u.group.scale,{x:.972,y:1,z:.972,duration:.4,ease:'power3.out'}); // x/z only — no vertical drift
        hovered.material.emissive.set('#FFB870'); hovered.material.emissiveMap=hovered.material.map;
        gsap.fromTo(hovered.material,{emissiveIntensity:0},{emissiveIntensity:.38,duration:.35}); }
      if(u.type==='egg-fluffy'){
        if(lifeProps.fluffy){ const L2=lifeProps.fluffy.lid; // EGG: Fluffy's slow wink (painted cat only)
          gsap.timeline().to(L2.scale,{y:1,duration:.35}).to(L2.scale,{y:.01,duration:.45,delay:.25}); }
        else if(!reduced) gsap.fromTo(u.group.scale,{x:1,y:1,z:1}, // poster art: a small tip-forward nudge instead
          {x:1.05,y:1.05,z:1.05,duration:.3,yoyo:true,repeat:1,ease:'power2.out'}); }
    }
    document.body.style.cursor = hovered? 'pointer':'';
  }
}

/* ============ HTML overlay sync (called from renderFrame) ============ */
function syncOverlay(p, actQ, prox){
  /* WRITE-ON-CHANGE: this block runs 60×/s. It used to re-run four
     querySelectorAll calls per frame and rewrite opacity / transform /
     pointerEvents unconditionally, so the browser saw ~500 style mutations a
     second that were almost all no-ops. Child lists are cached once at startup
     and every write is guarded by a compare against the last value. */
  const tOp = THREE.MathUtils.clamp(1-p/.06,0,1);
  if(tOp !== ovState.titleOp){ ovState.titleOp = tOp; titleEl.style.opacity = tOp; }
  if(tOp > 0){ // once the title is gone it stays gone — no need to keep moving it
    const ty = Math.round(-p*400);
    if(ty !== ovState.titleY){ ovState.titleY = ty; titleEl.style.transform = `translateY(${ty}px)`; }
  }
  for(let q=0;q<4;q++){
    let d = (p-pCenter(q))/(ACTW*.46);
    let vis = THREE.MathUtils.clamp(1-Math.abs(d),0,1);
    if(q===1){ // Act II: panel rides the wide establishing shot, exits as the card zoom begins
      const u1=(p-(ACT0+ACTW))/ACTW;
      vis = THREE.MathUtils.clamp(u1/.05,0,1)*THREE.MathUtils.clamp((.20-u1)/.06,0,1);
      d = THREE.MathUtils.clamp((u1-.08)*2.5,-1,1);
    }
    const st = ovState.panels[q];
    const op = +ease(vis).toFixed(3), tx = Math.round(-d*(reduced?60:220)), on = vis>.5;
    if(op !== st.op){ st.op = op; panels[q].style.opacity = op; }
    if(tx !== st.tx){ st.tx = tx; panels[q].style.transform = `translateX(${tx}px)`; }
    if(on !== st.on){ st.on = on;
      panels[q].style.pointerEvents = on ? 'auto':'none';
      for(const el of st.kids) el.style.pointerEvents = on ? 'auto':'none'; }
    const lit = actQ===q && prox>.25;
    if(lit !== st.lit){ st.lit = lit; dots[q].classList.toggle('on', lit); }
  }
}

/* ============ boot ============ */
/* The loader used to hide on the very first frame, while buildPainted() was
   still waiting on document.fonts — so the curtain lifted on an empty arena and
   the signs, stages, plaques, bricks and props popped in afterwards. It now
   waits for the build (and for one painted frame), with a ceiling so a font
   failure can't leave the loader up forever. */
let curtainUp = false;
function raiseCurtain(){
  if(curtainUp) return; curtainUp = true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>loaderEl.classList.add('done')));
}
painted.then(raiseCurtain, raiseCurtain);
setTimeout(raiseCurtain, 6000);
tick();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.fov = innerWidth<640?62:50;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP));
  measureScroll(); ScrollTrigger.refresh(); // page height changed → refresh the cached scroll range
  onScroll();               // and re-derive progress from the new range
  ovState.titleOp = -1;     // force the overlay cache to re-emit at the new size
  for(const s of ovState.panels){ s.op = -1; s.tx = NaN; }
}, {passive:true});

  return function destroyExperience() {
    if (__rafId != null) cancelAnimationFrame(__rafId);
  };
}
