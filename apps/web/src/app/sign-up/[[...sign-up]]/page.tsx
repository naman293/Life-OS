'use client';

import { SignUp } from "@clerk/nextjs";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { RobotLogo } from "@/components/RobotLogo";
import { useTransitionStore } from "@/lib/transitionStore";

/* ── Particle definitions ─────────────────────────────── */
const P = Array.from({ length: 250 }).map((_, i) => {
  const r = (n: number) => {
    let x = Math.sin((i + 1) * 12.345 + n) * 10000;
    return x - Math.floor(x);
  };
  const size = 4 + Math.round(r(0) * 18);
  const colors = ['#F3D76A', '#A8D8B9', '#F7B6DA', '#ADC4EC', '#F0B89A'];
  return {
    w: size, h: size,
    bg: colors[Math.floor(r(1) * colors.length)],
    rot: r(2) * 360,
    hx: r(3) * 100, 
    hy: r(4) * 100, 
    br: size > 12 ? Math.round(r(5) * 4) + 2 : 2,
  };
});

export default function SignUpPage() {
  const cardRef     = useRef<HTMLDivElement>(null);
  const robotRef    = useRef<HTMLDivElement>(null);
  const robotEye1   = useRef<HTMLDivElement>(null);
  const robotEye2   = useRef<HTMLDivElement>(null);
  const trigger     = useTransitionStore(s => s.trigger);
  const resetT      = useTransitionStore(s => s.reset);

  /* ── Physics refs (no state = ultra fast) ── */
  const pos  = useRef<{ x:number; y:number }[]>([]);
  const vel  = useRef<{ x:number; y:number }[]>([]);
  const mpos = useRef({ x: -9999, y: -9999 });
  const pels = useRef<(HTMLDivElement|null)[]>([]);

  /* ── Init particles ── */
  useLayoutEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;
    pos.current = P.map(p => ({ x: p.hx / 100 * W, y: p.hy / 100 * H }));
    vel.current = P.map(() => ({ x: 0, y: 0 }));
    P.forEach((p, i) => {
      const el = pels.current[i];
      if (el) el.style.transform = `translate3d(${pos.current[i].x - p.w/2}px,${pos.current[i].y - p.h/2}px, 0) rotate(${p.rot}deg)`;
    });
  }, []);

  /* ── Ultra-fast unified physics loop (120fps+) ── */
  useEffect(() => {
    let raf: number;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let robotX = window.innerWidth / 2;
    let robotY = window.innerHeight / 2;

    const R = 240, STR = 25000, SPRING = 0.04, DAMP = 0.88;
    const tick = () => {
      const { x: mx, y: my } = mpos.current;
      const W = window.innerWidth, H = window.innerHeight;
      
      /* 1. Simulate Particles */
      P.forEach((p, i) => {
        const hx = p.hx / 100 * W, hy = p.hy / 100 * H;
        const po = pos.current[i], v = vel.current[i];
        if (!po || !v) return;
        const dx = po.x - mx, dy = po.y - my;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        if (dist < R) {
          const f = (R - dist) / R * STR / (dist * dist);
          v.x += dx / dist * f;
          v.y += dy / dist * f;
        }
        v.x += (hx - po.x) * SPRING;
        v.y += (hy - po.y) * SPRING;
        v.x *= DAMP; v.y *= DAMP;
        po.x += v.x;  po.y += v.y;
        const el = pels.current[i];
        if (el) el.style.transform = `translate3d(${po.x - p.w/2}px,${po.y - p.h/2}px, 0) rotate(${p.rot}deg)`;
      });

      /* 2. Process Card Tilt (replacing slow React state) */
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        const overCard = mx > r.left && mx < r.right && my > r.top && my < r.bottom;
        
        let targetTiltX = 0, targetTiltY = 0;
        if (overCard) {
          targetTiltX = ((my - r.top)  / r.height - 0.5) * 9;
          targetTiltY = ((mx - r.left) / r.width  - 0.5) * -9;
          cardRef.current.style.boxShadow = '0 28px 72px rgba(18,18,16,0.13), 0 6px 20px rgba(18,18,16,0.07)';
        } else {
          cardRef.current.style.boxShadow = '0 10px 36px rgba(18,18,16,0.09), 0 2px 8px rgba(18,18,16,0.04)';
        }
        
        // Smooth interpolate tilt
        currentTiltX += (targetTiltX - currentTiltX) * 0.15;
        currentTiltY += (targetTiltY - currentTiltY) * 0.15;
        cardRef.current.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg) translateZ(${overCard ? 10 : 0}px)`;
      }

      /* 3. Background Giant Robot logic */
      if (robotRef.current) {
        // Smooth easing towards cursor
        robotX += (mx - robotX) * 0.08;
        robotY += (my - robotY) * 0.08;
        
        // Tilt the robot heavily based on where the cursor is on screen
        const rotX = ((robotY / H) - 0.5) * -45;
        const rotY = ((robotX / W) - 0.5) * 45;
        
        robotRef.current.style.transform = `translate3d(${robotX - 200}px, ${robotY - 200}px, -100px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        
        // Animate parallax eyes tracking cursor tighter
        if (robotEye1.current && robotEye2.current) {
          const eyeShiftX = ((mx / W) - 0.5) * 40;
          const eyeShiftY = ((my / H) - 0.5) * 40;
          robotEye1.current.style.transform = `translate3d(${eyeShiftX}px, ${eyeShiftY}px, 0)`;
          robotEye2.current.style.transform = `translate3d(${eyeShiftX}px, ${eyeShiftY}px, 0)`;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => { mpos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  /* ── Intercept Submit to Explode Immediately ── */
  useEffect(() => {
    const handleAuthSubmit = (e: MouseEvent | SubmitEvent) => {
      const target = e.target as HTMLElement;
      if (e.type === 'click' && !target.closest('.cl-formButtonPrimary')) return;
      if (e.type === 'submit' && !target.closest('.cl-form')) return;

      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        cardRef.current.style.opacity = '0';
        trigger(r.left, r.top, r.width, r.height);
      }
    };
    
    document.addEventListener('click', handleAuthSubmit, true);
    document.addEventListener('submit', handleAuthSubmit, true);

    const observer = new MutationObserver(() => {
      const err = document.querySelector('.cl-formFieldErrorText, .cl-alertText');
      if (err) {
        resetT();
        if (cardRef.current) cardRef.current.style.opacity = '1';
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', handleAuthSubmit, true);
      document.removeEventListener('submit', handleAuthSubmit, true);
      observer.disconnect();
    };
  }, [trigger, resetT]);

  return (
    <>
      <style>{`
        @keyframes ringRotate { to { transform: rotate(360deg); } }
        @keyframes cardIdle   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes floatAntenna { 0%,100%{transform:translateY(0) scale(1);box-shadow:0 0 10px #A8D8B9;} 50%{transform:translateY(-15px) scale(1.1);box-shadow:0 0 30px #A8D8B9;} }
        @keyframes blinkEye     { 0%,94%,100%{transform:scaleY(1)} 97%{transform:scaleY(0.1)} }
      `}</style>

      {/* ── Giant Background Robot ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, perspective:'1200px', pointerEvents:'none', overflow:'hidden' }}>
        <div ref={robotRef} style={{
          width: 400, height: 400, position: 'absolute', top: 0, left: 0,
          transformStyle: 'preserve-3d', willChange: 'transform',
          opacity: 0.15, // Subtle watermark style in background
        }}>
          {/* Antenna */}
          <div style={{ position:'absolute', top:-80, left:'50%', width:16, height:90, marginLeft:-8, background:'#121210', borderRadius:8, transform:'translateZ(-30px)' }} />
          <div style={{ position:'absolute', top:-110, left:'50%', width:40, height:40, marginLeft:-20, background:'#A8D8B9', borderRadius:'50%', border:'6px solid #121210', animation:'floatAntenna 3s infinite ease-in-out', transform:'translateZ(-30px)' }} />
          {/* Ears */}
          <div style={{ position:'absolute', top:'50%', left:-40, width:60, height:140, marginTop:-70, background:'#121210', borderRadius:20, transform:'rotateY(25deg) translateZ(-40px)' }} />
          <div style={{ position:'absolute', top:'50%', right:-40, width:60, height:140, marginTop:-70, background:'#121210', borderRadius:20, transform:'rotateY(-25deg) translateZ(-40px)' }} />
          {/* Main Face */}
          <div style={{
            position: 'absolute', inset: 0,
            background: '#EDE5D4', border: '16px solid #121210', borderRadius: 80,
            boxShadow: 'inset 0 -30px 0 rgba(0,0,0,0.06), 0 40px 80px rgba(18,18,16,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transformStyle: 'preserve-3d',
          }}>
            <div style={{
              width: '75%', height: '55%', background: '#121210', borderRadius: 40,
              boxShadow: 'inset 0 20px 40px rgba(0,0,0,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
              position: 'relative', overflow: 'hidden', transform: 'translateZ(-10px)',
            }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'35%', background:'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', borderRadius:'40px 40px 0 0' }} />
              <div ref={robotEye1} style={{ width: 60, height: 40, background: '#A8D8B9', borderRadius: 20, boxShadow: '0 0 40px #A8D8B9', willChange: 'transform', animation: 'blinkEye 5s infinite' }} />
              <div ref={robotEye2} style={{ width: 60, height: 40, background: '#A8D8B9', borderRadius: 20, boxShadow: '0 0 40px #A8D8B9', willChange: 'transform', animation: 'blinkEye 5s infinite' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Particles ── */}
      {P.map((p, i) => (
        <div
          key={i}
          ref={el => { pels.current[i] = el; }}
          style={{
            position: 'fixed', left: 0, top: 0,
            width: p.w, height: p.h,
            background: p.bg,
            borderRadius: p.br,
            opacity: 0.58,
            pointerEvents: 'none',
            willChange: 'transform',
            zIndex: 1,
          }}
        />
      ))}

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 45% 50%, #F9F3E4 0%, #ECE6D8 60%, #DDD5C5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Rings */}
        <div style={{ position:'absolute', top:-180, left:-180, width:640, height:640, borderRadius:'50%', border:'1.5px solid rgba(168,216,185,0.28)', animation:'ringRotate 75s linear infinite', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'absolute', bottom:-150, right:-150, width:480, height:480, borderRadius:'50%', border:'1.5px solid rgba(243,215,106,0.22)', animation:'ringRotate 60s linear infinite reverse', pointerEvents:'none', zIndex:0 }}/>

        {/* ── 3D Card ── */}
        <div style={{ perspective:'900px', zIndex:10, position:'relative' }}>
          <div
            ref={cardRef}
            style={{
              width: 480,
              background: '#FEFBEF',
              border: '1.5px solid #D8CFBE',
              borderRadius: 22,
              padding: '40px 48px 48px',
              willChange: 'transform',
              position: 'relative',
              animation: 'cardIdle 5.5s ease-in-out infinite',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ marginBottom:8 }}><RobotLogo size={64} /></div>
              <div style={{ fontSize:20, fontWeight:800, color:'#121210', letterSpacing:-0.5 }}>Life OS</div>
              <div style={{ fontSize:12, color:'#8B867C', marginTop:4 }}>Create your account to get started</div>
            </div>

            <div style={{ height:1, background:'#E4DDCF', marginBottom:22 }}/>

            <SignUp
              forceRedirectUrl="/"
              appearance={{
                variables: {
                  colorPrimary: '#121210',
                  colorBackground: 'transparent',
                  colorInputBackground: '#FEFBEF',
                  colorInputText: '#121210',
                  colorText: '#121210',
                  colorTextSecondary: '#7A756D',
                  colorNeutral: '#7A756D',
                  borderRadius: '10px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                },
                elements: {
                  rootBox:   { width: '100%', margin: 0, padding: 0, overflow: 'visible' },
                  cardBox:   { width: '100%', boxShadow: 'none', background: 'transparent', margin: 0, padding: 0, overflow: 'visible' },
                  card:      { background: 'transparent', boxShadow: 'none', border: 'none', padding: 0, margin: 0, width: '100%', overflow: 'visible' },
                  main:      { width: '100%', overflow: 'visible' },
                  header:    { display: 'none' },
                  headerTitle:       { display:'none' },
                  headerSubtitle:    { display:'none' },
                  socialButtonsRoot: { display:'none' },
                  dividerRow:        { display:'none' },
                  phoneNumberField:  { display:'none' },
                  footer:            { display: 'none' },
                  footerAction:      { display: 'none' },
                  formFieldLabel: {
                    color: '#2A2825', fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '5px',
                  },
                  formFieldInput: {
                    background: '#FEFBEF', border: '1.5px solid #D8CFBE', borderRadius: '10px',
                    color: '#121210', fontSize: '14px', padding: '10px 13px', width: '100%',
                  },
                  formButtonPrimary: {
                    background: '#121210', color: '#F9F3E4', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '700', padding: '11px 0', border: 'none',
                    boxShadow: '0 4px 14px rgba(18,18,16,0.18)', letterSpacing: '0.2px', marginTop: '4px', width: '100%',
                  },
                  alertText:          { color:'#A0302A', fontSize:'13px' },
                  formFieldErrorText: { color:'#A0302A', fontSize:'11px' },
                  identityPreviewText: { color:'#121210' },
                  formFieldInputShowPasswordButton: { color:'#8B867C' },
                },
              }}
            />

            <p style={{ margin:'16px 0 0', textAlign:'center', fontSize:13, color:'#8B867C', fontFamily:'Inter,system-ui,sans-serif' }}>
              Already have an account?{' '}
              <a href="/sign-in" style={{ color:'#121210', fontWeight:700, textDecoration:'underline', textUnderlineOffset:3 }}>Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
