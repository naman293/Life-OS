'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type Mode = 'FOCUS' | 'BREAK';

interface PomodoroContextType {
  focusMins: number;
  breakMins: number;
  timeLeft: number;
  isActive: boolean;
  mode: Mode;
  handleDurationChange: (type: Mode, val: number) => void;
  switchMode: (newMode: Mode) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export const usePomodoro = () => {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within a PomodoroProvider');
  return ctx;
};

// Generate a beautiful gentle chime using the Web Audio API
function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 0.8); // C5
    playNote(659.25, now + 0.2, 0.8); // E5
    playNote(783.99, now + 0.4, 1.5); // G5
  } catch(e) { console.error(e); }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<Mode>('FOCUS');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
         setTimeLeft((oldT) => {
             const t = oldT - 1;
             if (t <= 0) {
                 setTimeout(() => {
                     playNotificationSound();
                     setIsActive(false);

                     // XP Logic
                     if (mode === 'FOCUS') {
                       fetch('/api/focus', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ focusMins }),
                       })
                       .then(() => user?.reload())
                       .catch(err => console.error('Failed to save focus XP:', err));
                     }

                     const nextMode = mode === 'FOCUS' ? 'BREAK' : 'FOCUS';
                     setMode(nextMode);
                     setTimeLeft(nextMode === 'FOCUS' ? (focusMins * 60) : (breakMins * 60));
                     
                     if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(`Life OS`, {
                            body: mode === 'FOCUS' ? 'Focus time complete! Take a break.' : 'Break over! Back to work.'
                        });
                     }
                 }, 0);
                 return 0;
             }
             return t;
         });
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, mode, focusMins, breakMins]);

  const handleDurationChange = (type: Mode, val: number) => {
    const safeVal = Math.max(1, Math.min(120, val));
    if (type === 'FOCUS') {
      setFocusMins(safeVal);
      if (mode === 'FOCUS' && !isActive) setTimeLeft(safeVal * 60);
    } else {
      setBreakMins(safeVal);
      if (mode === 'BREAK' && !isActive) setTimeLeft(safeVal * 60);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'FOCUS' ? focusMins * 60 : breakMins * 60);
  };

  const toggleTimer = () => {
    if (!isActive && typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'FOCUS' ? focusMins * 60 : breakMins * 60);
  };

  return (
    <PomodoroContext.Provider value={{
      focusMins, breakMins, timeLeft, isActive, mode,
      handleDurationChange, switchMode, toggleTimer, resetTimer
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}
