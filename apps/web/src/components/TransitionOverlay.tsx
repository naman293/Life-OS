'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTransitionStore } from '@/lib/transitionStore';

const BRAND_COLORS = [
  '#F3D76A', '#A8D8B9', '#F7B6DA', '#ADC4EC', '#F0B89A', '#121210', '#FEFBEF', '#D8CFBE',
];

const CONFIG = {
  COLS: 13,
  ROWS: 11,
  FORMATION: 500,  
  SHATTER: 2800,    // REVERTED: Ultra-slow smooth water motion (2.8 seconds)
};

export function TransitionOverlay() {
  const isExploding = useTransitionStore(s => s.isExploding);
  const reset       = useTransitionStore(s => s.reset);
  const left        = useTransitionStore(s => s.cardCx);
  const top         = useTransitionStore(s => s.cardCy);
  const cardW       = useTransitionStore(s => s.cardW);
  const cardH       = useTransitionStore(s => s.cardH);

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const curtainRef   = useRef<HTMLDivElement>(null);
  const pathname     = usePathname();
  const hasRun       = useRef(false);

  useEffect(() => {
    if (!isExploding || hasRun.current) return;
    hasRun.current = true;

    const container = containerRef.current;
    const overlay   = overlayRef.current;
    const curtain   = curtainRef.current;
    if (!container || !overlay || !curtain) return;

    container.style.display   = 'block';
    container.style.opacity   = '1';
    overlay.innerHTML         = '';
    
    // START SOLID (Cream) - THIS KEEPS DASHBOARD CLEAN
    curtain.style.display    = 'block';
    curtain.style.opacity    = '1';
    curtain.style.background = '#FEFBEF'; 

    const cellW = cardW / CONFIG.COLS;
    const cellH = cardH / CONFIG.ROWS;
    const diag = Math.sqrt(window.innerWidth**2 + window.innerHeight**2);

    const pieces: HTMLDivElement[] = [];

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const p = document.createElement('div');
        const GAP = 2.5; 
        const px = left + (c * cellW) + GAP/2;
        const py = top + (r * cellH) + GAP/2;
        const pw = cellW - GAP;
        const ph = cellH - GAP;

        const cx = left + cardW / 2;
        const cy = top + cardH / 2;
        const dx = (px + pw/2) - cx;
        const dy = (py + ph/2) - cy;
        
        const angle = Math.atan2(dy, dx);
        const speed = (diag * 1.35) * (0.8 + Math.random() * 0.45); 
        
        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed;
        const rot = 0; // ZERO friction glide

        p.style.cssText = `
          position:fixed; left:${px}px; top:${py}px; width:${pw}px; height:${ph}px;
          background:${BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]};
          z-index:9999999; pointer-events:none; border-radius:10px;
          opacity: 0; transform: scale(0);
          will-change: transform, opacity;
          transition: transform 700ms cubic-bezier(0.19, 1, 0.22, 1), opacity 400ms ease-out;
          box-shadow: 0 4px 6px rgba(18,18,16,0.02);
        `;
        
        (p as any)._tx = tx;
        (p as any)._ty = ty;

        overlay.appendChild(p);
        pieces.push(p);
      }
    }

    /* ── PHASE 1: Smooth Formation ── */
    setTimeout(() => {
        pieces.forEach((p) => {
          setTimeout(() => {
            p.style.opacity   = '1';
            p.style.transform = `scale(1) translate3d(0,0,0)`;
          }, Math.random() * 450);
        });
    }, 50);

    /* ── PHASE 2: ULTRA-SLOW SMOOTH WATER SHATTER REVERSION ── */
    setTimeout(() => {
      // The Reveal is synchronized with the shatter (2.8s total sweep)
      curtain.style.transition = `opacity ${CONFIG.SHATTER}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      curtain.style.opacity    = '0'; 
      
      requestAnimationFrame(() => {
        pieces.forEach(p => {
          // Reverted: Slow smooth water motion: 2.8s
          p.style.transition = `transform ${CONFIG.SHATTER}ms cubic-bezier(0.35, 0.45, 0.45, 0.95), opacity 800ms ease-out 1800ms`;
          p.style.transform  = `translate3d(${(p as any)._tx}px, ${(p as any)._ty}px, 0)`;
          p.style.opacity    = '0';
        });
      });
    }, CONFIG.FORMATION + 200);

  }, [isExploding, left, top, cardW, cardH]);

  useEffect(() => {
    if (!isExploding) return;
    
    if (pathname === '/') {
        // ENFORCED CLEAN REVEAL Logic
        // Total Cycle: 500 (Formation) + 2800 (Shatter) + overhead 
        const totalToWait = CONFIG.FORMATION + CONFIG.SHATTER; 

        const t = setTimeout(() => {
            const container = containerRef.current;
            if (container) {
                container.style.display = 'none';
                if (overlayRef.current) overlayRef.current.innerHTML = '';
            }
            reset();
            hasRun.current = false;
        }, totalToWait); 
        return () => clearTimeout(t);
    }
  }, [isExploding, pathname, reset]);

  return (
    <div ref={containerRef} style={{ position:'fixed', inset:0, zIndex:2147483647, display: 'none' }}>
      <div 
        ref={curtainRef}
        style={{
          position:'absolute', inset:0, zIndex:1,
          pointerEvents:'none', background:'transparent', opacity:1,
          willChange: 'background, opacity'
        }}
      />
      <div 
        ref={overlayRef} 
        style={{ 
          position:'absolute', inset:0, zIndex:2, 
          pointerEvents:'none', overflow:'hidden' 
        }} 
      />
    </div>
  );
}
