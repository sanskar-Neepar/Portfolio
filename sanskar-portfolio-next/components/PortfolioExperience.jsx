"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { initAssets } from "@/lib/assets";
import { initExperience } from "@/lib/experience";
import { playWaveIn, consumeWaveEntrance } from "@/lib/waveTransition";

/*
 * The markup below is the original portfolio's <body> content, moved to JSX
 * almost unchanged (class -> className, a couple of style/attr spellings for
 * JSX). Every id is read by lib/experience.js via getElementById, so ids are
 * kept byte-identical to the original file — don't rename them without also
 * updating experience.js.
 */
export default function PortfolioExperience() {
  const started = useRef(false);

  // Arriving here via the wave from the last case study: reveal instead of just appearing.
  // useLayoutEffect so it resolves before paint — see lib/waveTransition.js.
  useLayoutEffect(() => {
    const accent = consumeWaveEntrance();
    if (accent) playWaveIn(accent);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    initAssets();
    const destroy = initExperience();

    // The original script reads innerWidth/innerHeight once, synchronously,
    // to size the renderer/camera. In a Next.js client-mount (unlike the
    // original static HTML, parsed after layout had already settled) that can
    // race the pane's final layout and leave the canvas sized to a stale
    // viewport. Re-firing 'resize' after paint makes the experience's own
    // resize handler (which already does the right recalculation) self-correct.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (typeof destroy === "function") destroy();
    };
  }, []);

  return (
    <>
      <div id="scroll-space"></div>
      <div id="stage"></div>
      <div id="post"></div>
      <div id="cine"></div>

      <div id="loader" role="status" aria-live="polite">
        <div className="wheel"></div>
        <p>SETTING THE STAGE…</p>
      </div>

      <div id="title" style={{ display: "none" }}>
        <p>Welcome, this is</p>
        <h1 id="site-title">Sanskar Sharma</h1>
        <p style={{ letterSpacing: ".18em" }}>
          AN INTERACTIVE PORTFOLIO · FOUR CHAPTERS
        </p>
        <div className="hint">SCROLL TO BEGIN ↓</div>
      </div>

      <div className="panel" id="p0">
        <div className="chips">
          <span className="tag">5 yrs exp</span>
          <span className="tag">Healthcare UX</span>
          <span className="tag">Design Systems</span>
          <span className="tag">Prototyping</span>
        </div>
      </div>
      <div className="panel" id="p1">
        <div className="body">
          Three selected projects, each on its own small stage in the round.
        </div>
        <div className="note">
          ☞ Keep scrolling, the camera visits each project. Click a card for
          the full story.
        </div>
      </div>
      <div className="panel" id="p2">
        <div className="chips" id="links"></div>
      </div>
      <div className="panel" id="p3">
        <div className="body">
          The door is always open, tap a badge on the wall to reach me.
        </div>
        <div className="note">☞ Every badge on the wall is clickable, say hi.</div>
      </div>

      <div id="ticket">
        <span className="lbl">CHAPTERS</span>
        <div className="dots">
          <button
            className="dot"
            data-a="0"
            title="About"
            aria-label="Go to chapter 1: About"
          ></button>
          <button
            className="dot"
            data-a="1"
            title="Case Studies"
            aria-label="Go to chapter 2: Case Studies"
          ></button>
          <button
            className="dot"
            data-a="2"
            title="Journey"
            aria-label="Go to chapter 3: Journey"
          ></button>
          <button
            className="dot"
            data-a="3"
            title="Connect"
            aria-label="Go to chapter 4: Connect"
          ></button>
        </div>
        <span className="lbl">★</span>
      </div>

      <div
        id="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m-title"
        tabIndex={-1}
      >
        <div className="poster">
          <button id="modal-x" aria-label="Close">
            ✕
          </button>
          <div className="eyebrow" id="m-eyebrow">
            Selected Work
          </div>
          <h3 id="m-title"></h3>
          <div className="desc" id="m-desc"></div>
          <div className="meta" id="m-meta">
            <div className="m-col" id="m-role"></div>
            <div className="m-col" id="m-impact"></div>
          </div>
          <div className="mchips" id="m-chips"></div>
        </div>
      </div>

      {/* SHOWREEL THEATER: hidden host for the <video> that feeds the wall's VideoTexture, plus the fixed close button shown while the theater camera is active */}
      <div id="cinema-ov" aria-hidden="true">
        <video
          id="cinema-video"
          playsInline
          muted
          loop
          preload="auto"
          crossOrigin="anonymous"
        ></video>
      </div>
      <div id="theater-ui">
        <button id="cinema-x" aria-label="Leave the movie">
          ✕
        </button>
      </div>

      {/* GALLERY (photos come from GALLERY_PHOTOS in lib/experience.js): responsive grid + lightbox; back returns to the 3D scene */}
      <div
        id="gallery-ov"
        role="dialog"
        aria-modal="true"
        aria-label="Photo gallery"
        tabIndex={-1}
      >
        <div className="ghead">
          <p className="eyeb">★ From the journey, the full album ★</p>
          <h2>The Gallery</h2>
          <button id="gallery-back">← Back to the circus</button>
        </div>
        <div id="ggrid"></div>
        <div id="glight">
          <img alt="" />
          <p></p>
        </div>
      </div>

      {/* MUSIC DOCK: playlist panel <-> persistent mini-player (see MUSIC ECOSYSTEM in lib/experience.js) */}
      <div id="music-dock" className="hidden" aria-live="polite">
        <div className="m-head">
          <span className="m-note">♪</span>
          <b id="m-track">My favorite playlist</b>
          <button id="m-min" title="Minimize, music keeps playing">
            ✕
          </button>
        </div>
        <div className="m-body">
          <div id="m-list"></div>
          <div id="m-embed"></div>
          <a id="m-open" target="_blank" rel="noopener">
            Open in YouTube Music ↗
          </a>
        </div>
        <div className="m-mini" id="m-mini" title="Expand player">
          <span className="m-eq">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <span id="m-mini-t">Playing…</span>
          <button id="m-pp" title="Play / pause">
            ⏸
          </button>
          <button id="m-stop" title="Stop, headset comes off">
            ✕
          </button>
        </div>
      </div>

      {/* EXERCISE MINI-GAME overlay (labels live in lib/experience.js: EXERCISE_LABEL / EXERCISE_GOAL / reward copy) */}
      <div id="gym-ov" aria-hidden="true">
        <div className="gym-blur"></div>
        <div className="gym-streaks"></div>
        <div className="gym-vig"></div>
        <div id="gym-count">
          <b>0</b>
          <span>Reps</span>
        </div>
        <div id="gym-bar">
          <div id="gym-fill"></div>
        </div>
        <span className="gym-bar-label">Power</span>
        <button id="gym-btn" type="button"></button>
        <div id="gym-reward" role="dialog" aria-modal="true">
          <div className="gym-reward-card">
            <div className="gr-eyebrow">★ Achievement Unlocked ★</div>
            <h3 id="gym-reward-title"></h3>
            <p id="gym-reward-copy"></p>
            <button id="gym-done" type="button">
              Back to the show
            </button>
          </div>
        </div>
      </div>

      {/* CASE-STUDY ZOOM TRANSITION: clicking a case card with its own page (see playCaseTransition
          in lib/experience.js) plays this instead of the poster modal — the card's video zooms to
          fill the screen, then navigates to /case-study/[slug]. Two layers: a blurred scrim behind,
          the video itself in front, so the blur fades in independently of the video's own opacity. */}
      <div id="case-transition-backdrop" aria-hidden="true"></div>
      <div id="case-transition-stage" aria-hidden="true">
        <video id="case-transition-video" muted playsInline></video>
      </div>
    </>
  );
}
