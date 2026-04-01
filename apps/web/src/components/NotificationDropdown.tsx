'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useTasks } from '@/hooks/useTasks';

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, isSignedIn } = useAuth();
  
  // Get live tasks to show pending vs completed
  const { tasks } = useTasks();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueAt && t.dueAt.startsWith(todayStr));
  const completed = todayTasks.filter(t => t.status === 'DONE');
  const pending = todayTasks.filter(t => t.status !== 'DONE');

  const unreadCount = pending.length;
  const progressPercent = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0;
  
  // Point system logic (e.g., 50 XP per completed task)
  const totalXP = completed.length * 50;
  
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAndNotify = () => {
        const dStr = new Date().toISOString().split('T')[0];
        const tTasks = tasksRef.current.filter(t => t.dueAt && t.dueAt.startsWith(dStr));
        const comp = tTasks.filter(t => t.status === 'DONE').length;
        const pend = tTasks.filter(t => t.status !== 'DONE').length;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Hourly Progress Update 🚀', {
               body: `Completed: ${comp} | Pending: ${pend}\n${pend > 0 ? "You have pending tasks waiting to be crushed!" : "Awesome! Everything is caught up!"}`
            });
        }
    };

    // Align exactly to the top of the hour
    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60000 - (now.getSeconds() * 1000) - now.getMilliseconds();
    
    let intervalId: NodeJS.Timeout;
    const timeoutId = setTimeout(() => {
       checkAndNotify();
       intervalId = setInterval(checkAndNotify, 60 * 60 * 1000);
    }, msUntilNextHour);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="notification-container" ref={containerRef}>
      <button 
        className="icon-btn" 
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        style={{ position: 'relative', width: '40px', height: '40px' }}
      >
        <Bell size={20} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--danger)',
            borderRadius: '50%',
            border: '2px solid var(--bg-0)'
          }} />
        )}
      </button>

      {open && (
        <div 
          className="neo-card" 
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            width: '380px',
            padding: 'var(--space-5)',
            zIndex: 9999,
            animation: 'slideRightIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--bg-2)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--text-0)', paddingBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)' }}>Daily Report</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--accent-pink)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-lg)' }}>
              <Trophy size={20} strokeWidth={2.5} />
              {totalXP} XP
            </div>
          </div>

          {/* Progress Bar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>
                <span>Completion</span>
                <span>{progressPercent}%</span>
             </div>
             {/* Neo-brutalist progress tracking bar */}
             <div style={{ 
                 width: '100%', 
                 height: '24px', 
                 backgroundColor: 'var(--bg-1)', 
                 border: '2px solid var(--text-0)',
                 borderRadius: '8px',
                 overflow: 'hidden',
                 boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)'
             }}>
                 <div style={{ 
                     width: `${progressPercent}%`, 
                     height: '100%', 
                     backgroundColor: 'var(--accent-mint)', 
                     borderRight: progressPercent > 0 ? '2px solid var(--text-0)' : 'none',
                     transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
                 }} />
             </div>
          </div>

          {todayTasks.length === 0 ? (
             <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--text-2)', fontWeight: 'var(--fw-bold)' }}>
                No tasks scheduled for today. Kick back and relax!
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '360px', overflowY: 'auto', paddingRight: '8px' }}>
              <div style={{ fontSize: 'var(--text-md)' }}>
                <strong style={{ color: 'var(--text-0)' }}>Completed ({completed.length})</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: '8px' }}>
                    {completed.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--text-2)', textDecoration: 'line-through', fontWeight: 'var(--fw-bold)' }}>
                           <CheckCircle2 size={18} strokeWidth={2.5} color="var(--accent-mint)" /> {t.title}
                        </div>
                    ))}
                    {completed.length === 0 && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>No tasks finished yet.</span>}
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-md)' }}>
                <strong style={{ color: 'var(--text-0)' }}>Pending ({pending.length})</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: '8px' }}>
                    {pending.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontWeight: 'var(--fw-bold)' }}>
                           <Circle size={18} strokeWidth={2.5} color="var(--danger)" /> {t.title}
                        </div>
                    ))}
                    {pending.length === 0 && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>All caught up!</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideRightIn {
          from { opacity: 0; transform: translateX(20px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}} />
    </div>
  );
}
