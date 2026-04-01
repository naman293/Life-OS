'use client';
import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorRef.current) {
        // Zero lag, zero transition positioning
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        
        const isNative = (e.target as HTMLElement)?.closest?.('[data-native-cursor]');
        if (isNative) {
           cursorRef.current.style.display = 'none';
        } else {
           cursorRef.current.style.display = 'block';
           cursorRef.current.style.opacity = '1';
        }
      }
    };

    const innerRef = document.getElementById('cursor-inner-scaler');

    const onDown = () => {
      if (innerRef) innerRef.style.transform = `scale(0.85)`;
    };
    const onUp = () => {
      if (innerRef) innerRef.style.transform = `scale(1)`;
    };
    
    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.style.display = 'none';
    };
    const onEnter = () => {
      if (cursorRef.current) cursorRef.current.style.display = 'block';
    };

    // We must track mouse enter/leave on the document so it hides when opening native menus
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      document.getElementById('custom-cursor-hide')?.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Overriding all browser defaults, shadow DOM pseudo elements, and native OS inputs */
        html, body, *, *::before, *::after, button, a, input, textarea, select, iframe, svg, path { 
            cursor: none !important; 
        }
        /* Except explicit native allowed handles like calendar resize bars */
        [data-native-cursor="ns-resize"], [data-native-cursor="ns-resize"] * { 
            cursor: ns-resize !important; 
        }
      `}} />
      <div
        ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 2147483647,
        pointerEvents: 'none',
        willChange: 'transform',
        transformOrigin: 'top left',
        // Offset so the perfect point of the SVG aligns exactly with the DOM hit-box
        marginLeft: '-2px',
        marginTop: '-1px',
      }}
    >
      <div 
        id="cursor-inner-scaler"
        style={{
            transformOrigin: 'top left',
            transition: 'transform 80ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            transform: 'scale(1)'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0px 3px 6px rgba(18,18,16,0.22))'
          }}
        >
        <defs>
          <linearGradient id="cursorThemeStripe" x1="0%" y1="100%" x2="100%" y2="0%">
            {/* Color mapping: Soft Pink, Cream White, and Light Blue from our specific theme */}
            <stop offset="0%" stopColor="#F7B6DA" />
            <stop offset="40%" stopColor="#F7B6DA" />
            
            <stop offset="40%" stopColor="#FEFBEF" />
            <stop offset="48%" stopColor="#FEFBEF" />
            
            <stop offset="48%" stopColor="#ADC4EC" />
            <stop offset="72%" stopColor="#ADC4EC" />
            
            <stop offset="72%" stopColor="#FEFBEF" />
            <stop offset="80%" stopColor="#FEFBEF" />
            
            <stop offset="80%" stopColor="#F7B6DA" />
            <stop offset="100%" stopColor="#F7B6DA" />
          </linearGradient>
        </defs>
        {/*
          Perfect 45-degree angled arrowhead.
          Left vertical, long perfect diagonal back up to origin.
        */}
        <path
          d="M 4 2 L 4 20 L 9 15 L 17 15 Z"
          fill="url(#cursorThemeStripe)"
          stroke="#121210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      </div>
    </div>
    </>
  );
}
