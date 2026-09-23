"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CASE_STUDIES } from "../case-studies-data";
import { playWaveIn, playWaveOut, markWaveEntrance, consumeWaveEntrance } from "@/lib/waveTransition";
import styles from "./case-study.module.css";

// Order the case studies are chained in — object key order, so this is just
// "however CASE_STUDIES is written" (currently prepinsta, then zeltgold).
const ORDER = Object.keys(CASE_STUDIES);

const NEAR_EDGE_PX = 32; // how close to the true top/bottom counts as "at the edge"
const SWIPE_PX = 40; // touch: how far a continued drag past the edge has to travel to count as "scroll more"

if (typeof window !== "undefined") window.__wave = { playWaveOut, playWaveIn }; // debug handle

export default function CaseStudyFrame({ src, title, slug }) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);
  const triggeredRef = useRef(false);

  // Arriving here via the wave (from the previous case study): reveal instead of just appearing.
  // useLayoutEffect (not useEffect) so this resolves before the browser paints — no flash of the
  // plain page before the overlay snaps on.
  useLayoutEffect(() => {
    const accent = consumeWaveEntrance();
    if (accent) playWaveIn(accent);
  }, []);

  // A same-origin iframe that loads fast (small file, warm cache) can finish before this effect's
  // onLoad listener is even attached — the native `load` event doesn't wait around, so React's
  // onLoad prop races it and sometimes just misses it, leaving `loaded` stuck false forever. Poll
  // readyState once as a fallback alongside the listener; whichever wins sets loaded.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const markLoaded = () => setLoaded(true);
    try {
      if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
        markLoaded();
        return;
      }
    } catch {
      // cross-origin — shouldn't happen for our own /case-studies files, but never break over it
    }
    iframe.addEventListener("load", markLoaded);
    return () => iframe.removeEventListener("load", markLoaded);
  }, [src]);

  useEffect(() => {
    if (!loaded) return;
    const iframe = iframeRef.current;
    let win, doc;
    try {
      win = iframe.contentWindow;
      doc = win.document;
    } catch {
      return; // shouldn't happen — the case-study files are same-origin — but never break the page over it
    }

    const idx = ORDER.indexOf(slug);
    // Chained both ways: scroll past the bottom goes to the next case study (or home, past the
    // last one); scroll past the top goes to the previous one (or home, before the first one) —
    // so the whole thing reads as one loop: home <-> prepinsta <-> zeltgold <-> home.
    const nextSlug = ORDER[idx + 1];
    const nextUrl = nextSlug ? `/case-study/${nextSlug}` : "/";
    const nextAccent = nextSlug ? CASE_STUDIES[nextSlug].accent : CASE_STUDIES[slug].accent;
    const prevSlug = ORDER[idx - 1];
    const prevUrl = prevSlug ? `/case-study/${prevSlug}` : "/";
    const prevAccent = prevSlug ? CASE_STUDIES[prevSlug].accent : CASE_STUDIES[slug].accent;

    const nearBottom = () => {
      const de = doc.documentElement;
      return de.scrollHeight - (win.innerHeight + de.scrollTop) < NEAR_EDGE_PX;
    };
    const nearTop = () => doc.documentElement.scrollTop < NEAR_EDGE_PX;
    // A fresh page load already sits at scrollTop 0 — nearTop() is true before the reader has
    // scrolled at all. Require one real scroll away from the top first, so landing here (or a
    // stray upward trackpad wobble on arrival) can't immediately bounce back to the previous page.
    let hasScrolledAway = false;
    const onScroll = () => {
      if (!hasScrolledAway && !nearTop()) hasScrolledAway = true;
    };

    const trigger = (url, accent) => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      markWaveEntrance(accent);
      playWaveOut(accent, () => {
        window.location.href = url; // the PARENT page navigates, not the iframe (`win` above)
      });
    };
    const triggerNext = () => trigger(nextUrl, nextAccent);
    const triggerPrev = () => trigger(prevUrl, prevAccent);

    const onWheel = (e) => {
      if (e.deltaY > 0 && nearBottom()) triggerNext();
      else if (e.deltaY < 0 && hasScrolledAway && nearTop()) triggerPrev();
    };

    if (typeof window !== "undefined") window.__caseNav = { triggerNext, triggerPrev, nearBottom, nearTop, nextUrl, prevUrl, nextAccent, prevAccent, get hasScrolledAway(){ return hasScrolledAway; } }; // debug handle

    let touchStartY = null;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (touchStartY == null) return;
      const dragged = touchStartY - e.touches[0].clientY; // positive = finger moved up = scrolling down
      if (dragged > SWIPE_PX && nearBottom()) triggerNext();
      else if (dragged < -SWIPE_PX && hasScrolledAway && nearTop()) triggerPrev();
    };

    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("wheel", onWheel, { passive: true });
    win.addEventListener("touchstart", onTouchStart, { passive: true });
    win.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      win.removeEventListener("scroll", onScroll);
      win.removeEventListener("wheel", onWheel);
      win.removeEventListener("touchstart", onTouchStart);
      win.removeEventListener("touchmove", onTouchMove);
    };
  }, [loaded, slug]);

  return (
    <div className={styles.frameWrap}>
      {!loaded && <div className={styles.loading}>Raising the curtain…</div>}
      <iframe ref={iframeRef} src={src} title={title} className={styles.frame} />
    </div>
  );
}
