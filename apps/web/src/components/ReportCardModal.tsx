'use client';

import React, { useRef, useState } from 'react';
import { X, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useUser } from '@clerk/nextjs';

interface ReportCardModalProps {
  onClose: () => void;
  stats: {
    tasksDone: number;
    totalTasks: number;
    activeHabits: number;
    streak: string;
    weeklyRate: string;
    dailyHistory: { day: string; completed: number }[];
  };
}

export function ReportCardModal({ onClose, stats }: ReportCardModalProps) {
  const { user } = useUser();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fallbacks
  const initials = (user?.unsafeMetadata?.coolName as string)?.slice(0, 2).toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() || 'U';
  const name = (user?.unsafeMetadata?.coolName as string) || user?.fullName || user?.username || 'Cyber Citizen';
  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  // Pie Chart Math
  const completionRatio = stats.totalTasks > 0 ? stats.tasksDone / stats.totalTasks : 0;
  const pieDasharray = `${completionRatio * 100} 100`;

  // Line Chart Math
  const history = stats.dailyHistory.length > 0 ? stats.dailyHistory : [{ day: 'M', completed: 0 }];
  const maxVal = Math.max(...history.map(h => h.completed), 1); // floor of 1 to avoid dividing by 0
  const chartW = 300;
  const chartH = 60;
  const segmentW = history.length > 1 ? chartW / (history.length - 1) : chartW;

  const getPoints = () => history.map((val, i) => {
    const x = i * segmentW;
    const y = chartH - ((val.completed / maxVal) * chartH) + 5; // +5 padding
    return `${x},${y}`;
  }).join(' ');

  const getAreaPoints = () => {
    return `0,${chartH + 10} ${getPoints()} ${chartW},${chartH + 10}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      // Force higher scale for crystal clear font rendering on PNG
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: 'transparent' });
      const link = document.createElement('a');
      link.download = `life-os-report-${today.replace(/ /g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to generate report card.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(18,18,16,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif'
    }} onClick={onClose}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: -50, right: 0, background: 'transparent', border: 'none', color: '#F9F3E4', cursor: 'pointer', opacity: 0.8
        }}>
          <X size={32} strokeWidth={2.5} />
        </button>

        {/* ── The Report Card DOM ── */}
        <div ref={cardRef} style={{
          width: 380, height: 600, background: '#F9F3E4', borderRadius: 24, padding: 32,
          border: '4px solid #121210', boxShadow: '8px 12px 0 rgba(18, 18, 16, 1)',
          display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #121210', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#EF476F', letterSpacing: 2, textTransform: 'uppercase' }}>Life OS // Pass</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#121210', marginTop: 4, letterSpacing: -1 }}>DAILY REPORT</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#F9F3E4', background: '#121210', padding: '6px 10px', borderRadius: 6, border: '2px solid #121210' }}>
              {today}
            </div>
          </div>

          {/* Profile Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16, background: '#121210', border: '3px solid #121210',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '4px 4px 0 #06D6A0'
            }}>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 800, color: '#F9F3E4' }}>{initials}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#121210', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>CITIZEN</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#121210', letterSpacing: -0.5, lineHeight: 1.1 }}>{name}</div>
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Graphs Section: Flex layout matching pie and daily line! */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            {/* 1. PIE CHART */}
            <div style={{
              flex: '0 0 auto', width: 90, height: 90, background: '#F9F3E4', border: '3px solid #121210',
              borderRadius: 16, boxShadow: '4px 4px 0 #121210', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              <svg width="70" height="70" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="0" cy="0" r="0.8" fill="none" stroke="#E6DCC3" strokeWidth="0.3" />
                {/* Completion Path */}
                {completionRatio > 0 && (
                  <circle 
                    cx="0" cy="0" r="0.8" fill="none" stroke="#EF476F" strokeWidth="0.3" 
                    strokeDasharray={pieDasharray} 
                    pathLength="100" 
                    strokeLinecap={completionRatio === 1 ? 'butt' : 'round'}
                  />
                )}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#121210' }}>TASKS</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#EF476F', letterSpacing: -1, lineHeight: 1 }}>{stats.tasksDone}/{stats.totalTasks}</div>
              </div>
            </div>

            {/* 2. REAL DAILY LINE CHART */}
            <div style={{ 
              flex: 1, background: '#F9F3E4', border: '3px solid #121210', padding: 12, borderRadius: 16, 
              boxShadow: '4px 4px 0 #121210', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#121210', marginBottom: 'auto' }}>ACTIVITY SIGNAL</div>
              <div style={{ width: '100%', height: 50, position: 'relative' }}>
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${chartW} ${chartH + 10}`}>
                   {/* Gradient Fill under line */}
                  <polygon points={getAreaPoints()} fill="url(#graphGrad)" opacity={history.reduce((a, b) => a + b.completed, 0) === 0 ? 0 : 0.8} />
                  {/* The Line */}
                  <polyline points={getPoints()} fill="none" stroke={history.reduce((a, b) => a + b.completed, 0) === 0 ? "#121210" : "#06D6A0"} strokeWidth="4" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06D6A0" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06D6A0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#121210', padding: '16px 12px', borderRadius: 16, border: '3px solid #121210', boxShadow: '4px 4px 0 #EF476F' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#EF476F' }}>ACTIVE HABITS</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#F9F3E4', marginTop: 2, letterSpacing: -1 }}>{stats.activeHabits}</div>
            </div>
            <div style={{ background: '#121210', padding: '16px 12px', borderRadius: 16, border: '3px solid #121210', boxShadow: '4px 4px 0 #FFD166' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FFD166' }}>FIRE STREAK</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#F9F3E4', marginTop: 2, letterSpacing: -1 }}>{stats.streak}</div>
            </div>
          </div>

        </div>

        {/* External Download Button */}
        <button onClick={handleDownload} disabled={isDownloading} className="card-hover" style={{
          background: '#06D6A0', color: '#121210', border: '4px solid #121210', padding: '18px 24px', borderRadius: 20,
          fontSize: 16, fontWeight: 900, cursor: isDownloading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '6px 6px 0 #121210', transition: 'all 0.1s', marginTop: 8
        }}
        onMouseDown={(e) => { if(!isDownloading) e.currentTarget.style.transform = 'translate(4px, 4px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #121210'; }}
        onMouseUp={(e) => { if(!isDownloading) e.currentTarget.style.transform = 'translate(0)'; e.currentTarget.style.boxShadow = '6px 6px 0 #121210'; }}
        onMouseLeave={(e) => { if(!isDownloading) e.currentTarget.style.transform = 'translate(0)'; e.currentTarget.style.boxShadow = '6px 6px 0 #121210'; }}
        >
          {isDownloading ? <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={22} strokeWidth={3} />}
          {isDownloading ? 'MINTING PASS...' : 'DOWNLOAD OFFICIAL PASS'}
        </button>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
