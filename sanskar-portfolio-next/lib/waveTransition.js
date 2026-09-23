"use client";

// Shared "wave / boom" page-transition overlay used to leave the end of a
// case study (see EndOfScroll in app/case-study/[slug]/CaseStudyFrame.jsx)
// and to arrive at whatever comes next (the next case study, or back to the
// main portfolio — see the wave-entrance effect in PortfolioExperience.jsx).
//
// A real <a>/location.href navigation destroys the whole page, so a single
// continuous animation can't span it. Instead this plays in two matching
// halves: playWaveOut() covers the screen and THEN navigates (its
// onCovered callback), and the destination page calls playWaveIn() on
// mount to uncover itself. markWaveEntrance()/consumeWaveEntrance() pass
// the accent color across that navigation via sessionStorage, so both
// halves use the exact same color and the illusion holds together.
import { gsap } from "gsap";

const OVERLAY_ID = "wave-transition-overlay";
const STORAGE_KEY = "waveEnterAccent";

function ensureOverlay() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(OVERLAY_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = OVERLAY_ID;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="wave-layer wave-layer-back">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M0,150 C260,240 460,40 720,120 C980,200 1180,30 1440,130 L1440,900 L0,900 Z"/>
      </svg>
    </div>
    <div class="wave-layer wave-layer-front">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M0,90 C240,4 500,190 760,90 C1000,4 1220,170 1440,80 L1440,900 L0,900 Z"/>
      </svg>
    </div>
    <div class="wave-flash"></div>
  `;
  document.body.appendChild(el);
  return el;
}

function reducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function playWaveOut(accent, onCovered) {
  if (reducedMotion()) {
    if (onCovered) onCovered();
    return;
  }
  const el = ensureOverlay();
  if (!el) {
    if (onCovered) onCovered();
    return;
  }
  el.style.setProperty("--wave-color", accent || "#C25A2E");
  el.style.display = "block";
  const back = el.querySelector(".wave-layer-back");
  const front = el.querySelector(".wave-layer-front");
  const flash = el.querySelector(".wave-flash");
  gsap.killTweensOf([back, front, flash]);
  gsap.set([back, front], { yPercent: 115 });
  gsap.set(flash, { opacity: 0 });
  return gsap
    .timeline({ onComplete: () => onCovered && onCovered() })
    .to(back, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0)
    .to(front, { yPercent: 0, duration: 0.5, ease: "back.out(1.5)" }, 0.1)
    .to(flash, { opacity: 0.55, duration: 0.1, ease: "power1.out" }, 0.36) // the "boom" — a quick bright pop right as the wave lands
    .to(flash, { opacity: 0, duration: 0.32, ease: "power1.out" }, 0.46);
}

export function playWaveIn(accent) {
  if (reducedMotion()) return; // nothing was covered on the way in either — no reveal needed
  const el = ensureOverlay();
  if (!el) return;
  el.style.setProperty("--wave-color", accent || "#C25A2E");
  el.style.display = "block";
  const back = el.querySelector(".wave-layer-back");
  const front = el.querySelector(".wave-layer-front");
  gsap.killTweensOf([back, front]);
  gsap.set([back, front], { yPercent: 0 });
  return gsap
    .timeline({
      onComplete: () => {
        el.style.display = "none";
      },
    })
    .to(front, { yPercent: -115, duration: 0.55, ease: "power3.inOut" }, 0.08)
    .to(back, { yPercent: -115, duration: 0.65, ease: "power3.inOut" }, 0);
}

export function markWaveEntrance(accent) {
  try {
    sessionStorage.setItem(STORAGE_KEY, accent || "#C25A2E");
  } catch {
    // sessionStorage unavailable (private mode etc.) — the destination just won't play the reveal
  }
}

export function consumeWaveEntrance() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v) sessionStorage.removeItem(STORAGE_KEY);
    return v;
  } catch {
    return null;
  }
}
