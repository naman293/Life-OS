'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionStore } from '@/lib/transitionStore';

/* ── "Retro-Digital Forge" brand colours ── */
const BRAND_COLORS = [
  '#F3D76A', '#F3D76A', // Gold
  '#A8D8B9', '#A8D8B9', // Mint
  '#F7B6DA',            // Pink
  '#ADC4EC',            // Blue
  '#F0B89A',            // Peach
  '#121210',            // Charcoal
  '#FEFBEF', '#FEFBEF', // Cream
  '#D8CFBE',            // Border grey
];

const GRID_COLS   = 8;     // Reduced density for larger, fewer squares
const GRID_ROWS   = 6;     
const EXTRA_COUNT = 24;    // Minimal scatter chunks
const TOTAL_MS    = 2700;  // Extended duration for a slow-mo, graceful float

/* Phases (normalised 0→1): */
const STRIP_END  = 0.25;  // Detach completes early
const FADE_START = 0.58;  // Particles start fading beautifully
const BG_REVEAL  = 0.62;  // Dashboard starts bleeding through

const easeOut = (t: number) => 1 - (1 - t) ** 3;

type Part = {
  el:    HTMLDivElement;
  x:     number; y:    number;
  ox:    number; oy:   number;
  vx:    number; vy:   number;
  slipX: number; slipY: number;
  rot:   number; rotV: number;
  delay: number;
};

export function TransitionOverlay() {
  const isExploding = useTransitionStore(s => s.isExploding);
  const reset       = useTransitionStore(s => s.reset);

  const overlayRef  = useRef<HTMLDivElement>(null);
  const cardInRef   = useRef<HTMLDivElement>(null);
  const hasRun      = useRef(false);
  const rafRef      = useRef(0);
  const router      = useRouter();

  useEffect(() => {
    if (!isExploding || hasRun.current) return;
    hasRun.current = true;

    router.prefetch('/');

    const overlay = overlayRef.current;
    const cardIn  = cardInRef.current;
    if (!overlay || !cardIn) return;

    /* ── Show solid cream overlay — dashboard is completely hidden behind it ── */
    overlay.style.display    = 'block';
    overlay.style.background = 'radial-gradient(ellipse at 45% 50%, #F9F3E4 0%, #ECE6D8 60%, #DDD5C5 100%)';

    /* ── Navigate to dashboard right away — it pre-loads invisibly behind overlay ── */
    const navTimer = setTimeout(() => router.replace('/'), 120);

    /* ── Get card's exact position */
    const rect = cardIn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const cw   = rect.width;
    const ch   = rect.height;
    const diagDist = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) * 0.65;

    const parts: Part[] = [];

    const cellW = cw / GRID_COLS;
    const cellH = ch / GRID_ROWS;

    /* ── Grid: larger rectangles ── */
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const ox = (cx - cw / 2) + col * cellW + cellW * 0.08;
        const oy = (cy - ch / 2) + row * cellH + cellH * 0.08;

        const dx   = ox - cx;
        const dy   = oy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const maxD = Math.sqrt((cw / 2) ** 2 + (ch / 2) ** 2);
        
        // Base velocity for float: decelerating physics means we start high and drop to 0
        const speed = (diagDist / 60) * (0.6 + (dist / maxD) * 0.6);
        const chaos = (Math.random() - 0.5) * 0.35; // Smoother arrays, less chaos
        const angle = Math.atan2(dy, dx) + chaos;

        /* Gentle sideways slip */
        const perpAngle = angle + Math.PI / 2;
        const slipMag   = speed * (Math.random() - 0.5) * 0.35;

        // Rectangle size
        const w     = cellW * (0.6 + Math.random() * 0.4);
        const h     = cellH * (0.6 + Math.random() * 0.4);

        const el = document.createElement('div');
        el.style.cssText = `
          position:fixed; left:0; top:0; pointer-events:none;
          width:${w}px; height:${h}px;
          background:${BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]};
          border-radius:6px; /* slightly softer corners */
          will-change:transform,opacity; opacity:0;
          box-shadow: 0 4px 12px rgba(18,18,16,0.06);
        `;
        overlay.appendChild(el);

        parts.push({
          el, x: ox, y: oy, ox, oy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          slipX: Math.cos(perpAngle) * slipMag, slipY: Math.sin(perpAngle) * slipMag,
          rot: 0, rotV: (Math.random() - 0.5) * 6, // Very slow grace rotation
          delay: Math.random() * STRIP_END * 0.7,
        });
      }
    }

    /* ── Minimal background scatter ── */
    for (let i = 0; i < EXTRA_COUNT; i++) {
      const ox   = cx + (Math.random() - 0.5) * cw * 1.5;
      const oy   = cy + (Math.random() - 0.5) * ch * 1.5;
      const dx   = ox - cx;
      const dy   = oy - cy;
      const speed = (diagDist / 50) * (0.6 + Math.random() * 0.6);
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;

      const perpAngle = angle + Math.PI / 2;
      const slipMag   = speed * (Math.random() - 0.5) * 0.5;

      const size  = 12 + Math.random() * 16;

      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; left:0; top:0; pointer-events:none;
        width:${size}px; height:${size * (0.5 + Math.random() * 0.5)}px;
        background:${BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]};
        border-radius:6px; will-change:transform,opacity; opacity:0;
      `;
      overlay.appendChild(el);

      parts.push({
        el, x: ox, y: oy, ox, oy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        slipX: Math.cos(perpAngle) * slipMag, slipY: Math.sin(perpAngle) * slipMag,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8,
        delay: Math.random() * STRIP_END * 0.5,
      });
    }

    /* ── Slow, butter-smooth card cross-fade ── */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cardIn) {
          cardIn.style.transition = 'opacity 450ms ease-in-out';
          cardIn.style.opacity    = '0';
        }
      });
    });

    let t0: number | null = null;

    const animate = (ts: number) => {
      if (!t0) t0 = ts;
      const elapsed = ts - t0;
      const t       = Math.min(elapsed / TOTAL_MS, 1);

      /* Dashboard reveal fading overlay smoothly */
      if (t >= BG_REVEAL) {
        const p = easeOut((t - BG_REVEAL) / (1 - BG_REVEAL));
        overlay.style.opacity = String(1 - p);
      }

      /* ── Physics ── */
      for (const p of parts) {
        if (t < p.delay) {
          p.el.style.opacity = '0';
          continue;
        }

        if (t < STRIP_END) {
          /* Smooth breathing detachment */
          const stripFrac = (t - p.delay) / Math.max(STRIP_END - p.delay, 0.001);
          const alpha     = Math.min(1, stripFrac * 2.0);
          const jitter    = stripFrac * 1.2; // softened jitter
          
          const jx = Math.sin(elapsed / 120  + p.delay * 80) * jitter;
          const jy = Math.cos(elapsed / 100  + p.delay * 50) * jitter;
          
          p.rot = Math.sin(elapsed / 150 + p.delay * 60) * stripFrac * 1.5;
          p.x   = p.ox + jx;
          p.y   = p.oy + jy;
          
          p.el.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.rot}deg)`;
          p.el.style.opacity   = String(alpha);
        } else {
          /* Silky smooth floating burst — Decelerating velocity */
          const burstT   = (t - STRIP_END) / (1 - STRIP_END);
          
          // floatMultiplier linearly shrinks from 1 to 0. 
          // Velocity drops to 0, creating a perfect zero-gravity stall at the end.
          const floatMul = Math.max(0, 1 - burstT ** 1.3);

          p.x   += p.vx * floatMul + p.slipX * floatMul * 0.6;
          p.y   += p.vy * floatMul + p.slipY * floatMul * 0.6;
          p.rot += p.rotV * floatMul;

          const alpha = t < FADE_START
            ? 1
            : Math.max(0, 1 - easeOut((t - FADE_START) / (1 - FADE_START)));

          p.el.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.rot}deg)`;
          p.el.style.opacity   = String(alpha);
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        for (const p of parts) {
          if (overlay.contains(p.el)) overlay.removeChild(p.el);
        }
        overlay.style.display   = 'none';
        overlay.style.opacity   = '1';
        overlay.style.background = '';
        if (cardIn) cardIn.style.opacity = '1';
        hasRun.current = false;
        reset();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { clearTimeout(navTimer); cancelAnimationFrame(rafRef.current); };
  }, [isExploding, reset, router]);

  return (
    <>
      <style>{`
        @keyframes blinkEye2 { 0%,94%,100%{transform:scaleY(1)} 97%{transform:scaleY(0.1)} }
      `}</style>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'none', pointerEvents: 'none', overflow: 'hidden',
        }}
      >
        <div style={{ position:'absolute', top:-180, left:-180, width:640, height:640, borderRadius:'50%', border:'1.5px solid rgba(243,215,106,0.35)' }}/>
        <div style={{ position:'absolute', bottom:-150, right:-150, width:480, height:480, borderRadius:'50%', border:'1.5px solid rgba(168,216,185,0.3)' }}/>

        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div
            ref={cardInRef}
            style={{
              width: 420, background: '#FEFBEF',
              border: '1.5px solid #D8CFBE', borderRadius: 22,
              padding: '40px 36px 36px', position: 'relative',
              boxShadow: '0 10px 36px rgba(18,18,16,0.09)',
              willChange: 'opacity', opacity: 1,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#F9F3E4,#F3D76A,#F9F3E4)', borderRadius:'22px 22px 0 0', opacity:0.7 }}/>

            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ width:64, height:64, background:'#EDE5D4', border:'6px solid #121210', borderRadius:20, margin:'0 auto 8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ width:12, height:8, background:'#A8D8B9', borderRadius:3, animation:'blinkEye2 4s infinite' }}/>
                  <div style={{ width:12, height:8, background:'#A8D8B9', borderRadius:3, animation:'blinkEye2 4s infinite' }}/>
                </div>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:'#121210', letterSpacing:-0.5 }}>Life OS</div>
              <div style={{ fontSize:12, color:'#8B867C', marginTop:4 }}>Entering your workspace…</div>
            </div>

            <div style={{ height:1, background:'#E4DDCF', marginBottom:22 }}/>

            <div style={{ marginBottom:14 }}>
              <div style={{ height:12, width:80, background:'#D8CFBE', borderRadius:4, marginBottom:7 }}/>
              <div style={{ background:'#F0EBE0', borderRadius:10, height:40, border:'1.5px solid #D8CFBE' }}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ height:12, width:80, background:'#D8CFBE', borderRadius:4, marginBottom:7 }}/>
              <div style={{ background:'#F0EBE0', borderRadius:10, height:40, border:'1.5px solid #D8CFBE' }}/>
            </div>
            <div style={{ background:'#121210', borderRadius:10, height:42, marginBottom:16 }}/>
            <div style={{ height:13, background:'#E4DDCF', width:'60%', margin:'0 auto', borderRadius:4 }}/>
          </div>
        </div>
      </div>
    </>
  );
}
