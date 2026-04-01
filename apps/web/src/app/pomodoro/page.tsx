'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { usePomodoro } from '@/components/PomodoroProvider';

export default function PomodoroPage() {
  const {
      focusMins, breakMins, timeLeft, isActive, mode,
      handleDurationChange, switchMode, toggleTimer, resetTimer
  } = usePomodoro();

  const [isAngry, setIsAngry] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseTime = useRef<number>(Date.now());

  // Handle angry effect locally based on global isActive
  useEffect(() => {
    if (!isActive) {
      setIsAngry(false);
    }
  }, [isActive]);

  const [robotState, setRobotState] = useState<'idle' | 'dance' | 'type' | 'wave' | 'look' | 'squat'>('idle');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isFollowing = useRef(false);
  const originalCenter = useRef<{x: number, y: number} | null>(null);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const prevIsActive = useRef(isActive);

  const [animTick, setAnimTick] = useState(false);
  const isBreakingState = isActive && mode === 'BREAK';

  useEffect(() => {
    let tickSpeed = 2000;
    if (isBreakingState) {
       tickSpeed = 2000;
    } else if (robotState === 'wave') {
       tickSpeed = 800; // Slower wave as requested
    } else if (robotState === 'dance') {
       tickSpeed = 500;
    } else if (robotState === 'type') {
       tickSpeed = 300;
    } else if (robotState === 'squat') {
       tickSpeed = 1500;
    } else {
       tickSpeed = 2000;
    }

    const interval = setInterval(() => setAnimTick(p => !p), tickSpeed);
    return () => clearInterval(interval);
  }, [robotState, isBreakingState]);

  // Initial wave on start
  useEffect(() => {
    if (isActive && !prevIsActive.current && mode === 'FOCUS') {
      setRobotState('wave');
      setTimeout(() => setRobotState('idle'), 3000);
    }
    prevIsActive.current = isActive;
  }, [isActive, mode]);

  // Random behavior loop
  useEffect(() => {
    if (!isActive || mode !== 'FOCUS') {
      setRobotState('idle');
      return;
    }
    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
       if (!isAngry) {
          const states: Array<'idle' | 'dance' | 'type' | 'look' | 'wave' | 'squat'> = ['idle', 'idle', 'dance', 'type', 'look', 'wave', 'squat'];
          let nextState: any = 'idle';
          if (Math.random() > 0.4) {
             nextState = states[Math.floor(Math.random() * states.length)];
          }
          setRobotState(nextState);
       }
       const dur = Math.random() * 7000 + 3000;
       timeoutId = setTimeout(scheduleNext, dur);
    };
    timeoutId = setTimeout(scheduleNext, 2000);
    return () => clearTimeout(timeoutId);
  }, [isActive, mode, isAngry]);

  // AI Robot Interaction & Tracking Logic 
  useEffect(() => {
    let animFrame: number;
    const lerpSpeed = 0.05; 
    const followRadius = 150; 

    const chaseMouse = () => {
       if (isFollowing.current) {
          const dx = targetOffset.current.x - currentOffset.current.x;
          const dy = targetOffset.current.y - currentOffset.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > followRadius + 2) {
             const moveRatio = (dist - followRadius) / dist; 
             currentOffset.current.x += dx * moveRatio * lerpSpeed;
             currentOffset.current.y += dy * moveRatio * lerpSpeed;
             setOffset({ ...currentOffset.current });
          } else if (dist < followRadius - 2 && dist > 0.1) {
             const moveRatio = (followRadius - dist) / dist; 
             currentOffset.current.x -= dx * moveRatio * lerpSpeed;
             currentOffset.current.y -= dy * moveRatio * lerpSpeed;
             setOffset({ ...currentOffset.current });
          }
       }
       animFrame = requestAnimationFrame(chaseMouse);
    };
    chaseMouse();

    const updateEye = (eye: HTMLElement | null, pupil: HTMLElement | null, mouseX: number, mouseY: number) => {
      if (!eye || !pupil) return;
      const rect = eye.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = (rect.width / 2) - 8; 
      
      pupil.style.transition = 'transform 0.1s ease-out, background-color 0.2s ease';
      
      if (dist < maxR) {
        pupil.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      } else {
        const angle = Math.atan2(dy, dx);
        pupil.style.transform = `translate3d(${Math.cos(angle) * maxR}px, ${Math.sin(angle) * maxR}px, 0)`;
      }
    };

    const resetAnger = () => {
      setIsAngry(false);
      lastMouseTime.current = Date.now();

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (isActive && mode === 'FOCUS') {
        idleTimerRef.current = setTimeout(() => {
          setIsAngry(true);
        }, 5000);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (isFollowing.current && originalCenter.current) {
         targetOffset.current = { 
            x: e.clientX - originalCenter.current.x, 
            y: e.clientY - originalCenter.current.y 
         };
      }

      lastMouseTime.current = Date.now();
      updateEye(leftEyeRef.current, leftPupilRef.current, e.clientX, e.clientY);
      updateEye(rightEyeRef.current, rightPupilRef.current, e.clientX, e.clientY);
      resetAnger();
    };

    const onDoubleClick = () => {
       isFollowing.current = false;
       targetOffset.current = { x: 0, y: 0 };
       currentOffset.current = { x: 0, y: 0 };
       setOffset({ x: 0, y: 0 });
       setRobotState('dance');
       resetAnger();
    };

    const onKey = () => resetAnger();

    const onVisibilityChange = () => {
       if (document.hidden && isActive && mode === 'FOCUS') {
           setIsAngry(true);
       } else {
           resetAnger();
       }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKey, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    resetAnger();

    // Autonomous wandering eye logic
    const wanderInterval = setInterval(() => {
        if (Date.now() - lastMouseTime.current > 1000 && !isAngry) {
            const rx = (Math.random() - 0.5) * 15;
            const ry = (Math.random() - 0.5) * 15;
            
            if (leftPupilRef.current && rightPupilRef.current) {
                leftPupilRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                leftPupilRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
                rightPupilRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                rightPupilRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
            }
        }
    }, 1500);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearInterval(wanderInterval);
    };
  }, [isActive, mode, isAngry]);

  // Occasional Blinking Logic
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const blinkLoop = () => {
       setIsBlinking(true);
       setTimeout(() => setIsBlinking(false), 150); // fast blink duration
       // Wait between 2 and 6 seconds for the next blink
       const nextBlink = Math.random() * 4000 + 2000;
       blinkTimeout = setTimeout(blinkLoop, nextBlink);
    };
    blinkTimeout = setTimeout(blinkLoop, 2000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  // Computed visual styles
  const isScreaming = isAngry && isActive && mode === 'FOCUS';
  const isFocusing = isActive && mode === 'FOCUS' && !isAngry;
  const isBreaking = isActive && mode === 'BREAK';

  const robotColor = isScreaming ? 'var(--accent-1)' : '#ffffff'; 
  const primaryAccent = 'var(--accent-mint)';
  const eilikScreenBg = 'var(--text-0)';
  
  const eyeHeight = isBreaking || isBlinking ? '4px' : (isScreaming ? '22px' : '20px');
  const eyeBg = isScreaming ? 'var(--accent-1)' : primaryAccent;
  const eyeBorderRadius = isScreaming ? '8px' : '12px 12px 4px 4px';
  const eyeMarginTop = isScreaming ? '0px' : '0px';

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }}>

      {/* Whole Robot Figure Container */}
      <div 
        onClick={(e) => {
           e.stopPropagation();
           if (!isFollowing.current) {
             isFollowing.current = true;
             const rect = e.currentTarget.getBoundingClientRect();
             originalCenter.current = {
               x: rect.left + rect.width / 2 - currentOffset.current.x,
               y: rect.top + rect.height / 2 - currentOffset.current.y
             };
             targetOffset.current = { ...currentOffset.current };
           }
        }}
        style={{ 
          position: 'relative', 
          marginTop: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: '10px',
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: isFollowing.current ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          cursor: isFollowing.current ? 'grabbing' : 'pointer',
          zIndex: (offset.x !== 0 || offset.y !== 0) ? 50 : 0
        }}
      >
        
        {/* Speech Bubble / Hover state */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: `translateX(-50%) scale(${isScreaming ? 1 : 0})`,
          opacity: isScreaming ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          backgroundColor: 'var(--text-1)',
          color: 'var(--neo-bg)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-xl)',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--fw-bold)',
          width: '260px',
          textAlign: 'center',
          boxShadow: '4px 4px 0 #121210',
          zIndex: 10
        }}>
          DO NOT STAY AWAY FROM THE SCREEN!
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid var(--text-1)'
          }} />
        </div>

        {/* The Head */}
        <div style={{
            width: '160px',
            height: '145px',
            backgroundColor: robotColor,
            border: '5px solid var(--text-0)',
            borderRadius: '50% 50% 45% 45%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 10,
            transition: `all ${robotState === 'type' ? '0.3s' : robotState === 'dance' ? '0.5s' : robotState === 'wave' ? '0.6s' : '2s'} ease-in-out`,
            transform: isBreaking ? (animTick ? 'translateY(-8px)' : 'translateY(8px)') : 
                       robotState === 'dance' ? (animTick ? 'translateY(8px) rotate(-6deg)' : 'translateY(-8px) rotate(6deg)') : 
                       robotState === 'squat' ? 'translateY(15px)' :
                       (animTick ? 'translateY(-4px) rotate(2deg)' : 'translateY(0px) rotate(-1deg)'),
            boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.1), 4px 4px 0 var(--text-0)'
        }}>
            {/* The Black Face Screen */}
            <div style={{
                width: '128px',
                height: '100px',
                backgroundColor: eilikScreenBg,
                borderRadius: '60px 60px 45px 45px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid var(--text-0)',
                boxShadow: 'inset 0 8px 15px rgba(0,0,0,0.5)'
            }}>
                {/* Left Eye Container */}
                <div ref={leftEyeRef} style={{ position: 'relative', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div 
                      ref={leftPupilRef}
                      style={{
                        width: '28px',
                        height: eyeHeight,
                        backgroundColor: eyeBg,
                        borderRadius: eyeBorderRadius,
                        marginTop: eyeMarginTop,
                        transition: 'height 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, border-radius 0.2s',
                        boxShadow: `0 0 8px ${eyeBg}`
                      }} 
                    />
                </div>

                {/* Right Eye Container */}
                <div ref={rightEyeRef} style={{ position: 'relative', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div 
                      ref={rightPupilRef}
                      style={{
                        width: '28px',
                        height: eyeHeight,
                        backgroundColor: eyeBg,
                        borderRadius: eyeBorderRadius,
                        marginTop: eyeMarginTop,
                        transition: 'height 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, border-radius 0.2s',
                        boxShadow: `0 0 8px ${eyeBg}`
                      }} 
                    />
                </div>
            </div>
        </div>

        {/* The Body - Adjusted Oval Structure (Neck Completely Removed) */}
        <div style={{
            position: 'relative',
            width: 145, height: 160,
            marginTop: '-5px',
            backgroundColor: robotColor,
            border: '5px solid var(--text-0)',
            borderRadius: '45% 45% 40% 40%',
            zIndex: 5,
            transition: `all ${robotState === 'type' ? '0.3s' : robotState === 'dance' ? '0.5s' : robotState === 'wave' ? '0.6s' : '2s'} ease-in-out`,
            transform: isBreaking ? (animTick ? 'translateY(5px)' : 'translateY(-5px)') : 
                       robotState === 'dance' ? (animTick ? 'translateY(-10px) rotate(8deg)' : 'translateY(5px) rotate(-8deg)') : 
                       robotState === 'squat' ? 'translateY(25px) scaleY(0.9) scaleX(1.05)' :
                       (animTick ? 'translateY(2px)' : 'translateY(-2px)'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 'inset 0 -15px 0 rgba(0,0,0,0.1), 4px 4px 0 var(--text-0)'
        }}>
            {/* Neo-brutalist Bib / Chest Mint */}
            <div style={{
                position: 'absolute',
                top: -5,
                width: 135, height: 70,
                backgroundColor: eyeBg,
                borderBottom: '5px solid var(--text-0)',
                borderRadius: '60px 60px 40px 40px',
                zIndex: 2,
                transition: 'background-color 0.3s',
            }}>
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontWeight: 900, color: 'var(--text-0)', letterSpacing: 1, fontSize: '16px' }}>Eilik</div>
            </div>

            {/* Left Arm */}
            <div style={{
                position: 'absolute', top: 30, left: -30, zIndex: -1,
                width: 38, height: 95, 
                backgroundColor: robotColor, 
                border: '5px solid var(--text-0)',
                borderRadius: '50% 50% 40% 40%',
                transformOrigin: 'top right',
                transition: `all ${robotState === 'type' ? '0.3s' : robotState === 'dance' ? '0.5s' : robotState === 'wave' ? '0.6s' : '1s'} ease-in-out`,
                transform: isBreaking ? 'rotate(50deg) translate(20px, 15px)' : 
                           robotState === 'dance' ? (animTick ? 'rotate(-60deg)' : 'rotate(60deg)') :
                           robotState === 'type' ? (animTick ? 'rotate(35deg)' : 'rotate(15deg)') :
                           robotState === 'squat' ? 'rotate(40deg) translate(15px, -15px)' :
                           'rotate(15deg)',
                boxShadow: 'inset -9px 0 0 var(--accent-mint)' 
            }} />
            
            {/* Right Arm */}
            <div style={{
                position: 'absolute', top: 30, right: -30, zIndex: -1,
                width: 38, height: 95, 
                backgroundColor: robotColor, 
                border: '5px solid var(--text-0)',
                borderRadius: '50% 50% 40% 40%',
                transformOrigin: 'top left',
                transition: `all ${robotState === 'type' ? '0.3s' : robotState === 'dance' ? '0.5s' : robotState === 'wave' ? '0.6s' : '1s'} ease-in-out`,
                transform: isBreaking ? 'rotate(-50deg) translate(-20px, 15px)' : 
                           robotState === 'dance' ? (animTick ? 'rotate(60deg)' : 'rotate(-60deg)') :
                           robotState === 'wave' ? (animTick ? 'rotate(-140deg)' : 'rotate(-20deg)') :
                           robotState === 'type' ? (!animTick ? 'rotate(-35deg)' : 'rotate(-15deg)') :
                           robotState === 'squat' ? 'rotate(-40deg) translate(-15px, -15px)' :
                           'rotate(-15deg)',
                boxShadow: 'inset 9px 0 0 var(--accent-mint)'
            }} />
        </div>

        {/* Ground Hover Shadow effect */}
        <div style={{
           width: 140, height: 18,
           background: 'rgba(0,0,0,0.15)',
           borderRadius: '50%',
           marginTop: 15,
           transform: isBreaking ? 'scale(0.8)' : (animTick ? 'scale(1.1)' : 'scale(1)'),
           opacity: isBreaking ? 0.2 : (animTick ? 0.1 : 0.15),
           transition: `all ${robotState === 'type' ? '0.3s' : robotState === 'dance' ? '0.5s' : robotState === 'wave' ? '0.6s' : '2s'} ease-in-out`
        }} />

      </div>

      {/* Controls Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
          {/* Mode Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', background: 'var(--bg-1)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '2px solid var(--text-0)', boxShadow: '3px 3px 0 var(--text-0)' }}>
             <button 
                className={`btn ${mode === 'FOCUS' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: 'none', boxShadow: mode === 'FOCUS' ? '2px 2px 0 var(--text-0)' : 'none', transform: 'none' }}
                onClick={() => switchMode('FOCUS')}
             >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Focus</span>
                  <input 
                     type="number" 
                     value={focusMins} 
                     onChange={(e) => handleDurationChange('FOCUS', parseInt(e.target.value) || 1)}
                     style={{ width: '45px', textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-0)', border: '2px solid var(--text-0)', borderRadius: '4px', outline: 'none' }}
                     onClick={(e) => e.stopPropagation()}
                  />
                  <span>m</span>
                </div>
             </button>
             
             <div style={{ width: '2px', height: '24px', backgroundColor: 'var(--text-0)', opacity: 0.2 }} />

             <button 
                className={`btn ${mode === 'BREAK' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ border: 'none', boxShadow: mode === 'BREAK' ? '2px 2px 0 var(--text-0)' : 'none', transform: 'none' }}
                onClick={() => switchMode('BREAK')}
             >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Break</span>
                <input 
                   type="number" 
                   value={breakMins} 
                   onChange={(e) => handleDurationChange('BREAK', parseInt(e.target.value) || 1)}
                   style={{ width: '45px', textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-0)', border: '2px solid var(--text-0)', borderRadius: '4px', outline: 'none' }}
                   onClick={(e) => e.stopPropagation()}
                />
                <span>m</span>
              </div>
           </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {[15, 25, 45, 60].map(mins => (
            <button 
               key={mins}
               className="chip chip-yellow"
               style={{ cursor: 'pointer', border: '2px solid var(--text-0)', boxShadow: '2px 2px 0 var(--text-0)', fontWeight: 800 }}
               onClick={() => handleDurationChange('FOCUS', mins)}
            >
              {mins}m
            </button>
          ))}
        </div>

          {/* Huge Timer */}
          <div style={{
              fontSize: '110px',
              fontFamily: 'monospace',
              fontWeight: '900',
              letterSpacing: '-6px',
              color: isScreaming ? 'var(--accent-1)' : 'var(--text-0)',
              textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
              lineHeight: 1
          }}>
             {mins}:{secs}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
             <button 
               className="neo-btn" 
               style={{ 
                 width: '72px', height: '72px', borderRadius: '50%', 
                 backgroundColor: isActive ? 'var(--accent-yellow)' : 'var(--accent-mint)', 
                 display: 'flex', justifyContent: 'center', alignItems: 'center',
                 border: '3px solid var(--text-0)', boxShadow: '4px 4px 0 var(--text-0)', transition: 'all 0.1s'
               }}
               onClick={toggleTimer}
             >
                {isActive ? <Pause size={34} color="var(--text-0)" fill="var(--text-0)" /> : <Play size={34} color="var(--text-0)" fill="var(--text-0)" style={{ marginLeft: '6px' }} />}
             </button>
             <button 
               className="neo-btn" 
               style={{ 
                 width: '72px', height: '72px', borderRadius: '50%', 
                 backgroundColor: 'var(--bg-1)', 
                 display: 'flex', justifyContent: 'center', alignItems: 'center',
                 border: '3px solid var(--text-0)', boxShadow: '4px 4px 0 var(--text-0)', transition: 'all 0.1s'
               }}
               onClick={resetTimer}
             >
                <RotateCcw size={30} strokeWidth={2.5} />
             </button>
          </div>
      </div>
    </div>
  );
}
