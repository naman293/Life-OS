'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { ChevronRight, LogOut, Settings, Loader2, User, Zap, CheckSquare, Edit2, X } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AvatarCreator } from '@/components/AvatarCreator';
import { ReportCardModal } from '@/components/ReportCardModal';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, isLoaded }           = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSaveName = async () => {
    if (!user) return;
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, coolName: newName } });
      await user.reload();
      setIsEditingName(false);
    } catch (e) {
      console.error(e);
      alert('Failed to update name');
    }
  };

  const { tasks }     = useTasks();
  const { habits }    = useHabits();
  const { analytics } = useAnalytics('weekly');

  const doneTasks     = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasks    = tasks.length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const activeHabits  = habits.filter((h) => !h.archived).length;
  const maxStreak     = analytics?.maxStreak ?? 0;
  const avgWeeklyRate = analytics?.avgWeeklyRate ?? 0;

  if (!isLoaded) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-2)' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading profile…
      </div>
    );
  }

  // Clerk v7: pass redirectUrl directly — avoids the await + router.push race that caused infinite loading
  const handleSignOut = () => signOut({ redirectUrl: '/sign-in' });

  const initials = (user?.unsafeMetadata?.coolName as string)?.[0] ?? user?.firstName?.[0] ?? user?.username?.[0] ?? 'U';
  const joinDate  = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  // Gamification Data
  const focusXp = (user?.unsafeMetadata?.focusXp as number) || 0;
  const focusLevel = (user?.unsafeMetadata?.focusLevel as number) || 1;
  const xpInCurrentLevel = focusXp % 500;
  const progressPct = (xpInCurrentLevel / 500) * 100;

  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* ── Left: Profile Card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* XP Progress Card */}
          <div className="card" style={{ padding: 'var(--space-5)', position: 'relative', overflow: 'hidden', border: '3px solid #121210', boxShadow: '4px 4px 0px #121210' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Deep Work</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--text-1)', textShadow: '1px 1px 0px var(--accent-red-light)' }}>
                  Level {focusLevel}
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-2)' }}>
                {xpInCurrentLevel} / 500 XP
              </div>
            </div>
            
            <div style={{ height: 20, background: 'var(--bg-2)', borderRadius: 10, border: '2px solid #121210', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ 
                height: '100%', 
                width: `${progressPct}%`, 
                background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
                borderRight: '2px solid #121210',
                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }} />
            </div>
          </div>

          {/* Avatar + name */}
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-7)' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--space-4)' }}>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? 'Profile picture'}
                  style={{
                    width: 88, height: 88, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid var(--accent-yellow)',
                    boxShadow: '0 0 0 4px var(--accent-yellow-light)',
                  }}
                />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'var(--sidebar-bg)', color: 'var(--accent-yellow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700,
                  border: '3px solid var(--accent-yellow)',
                  boxShadow: '0 0 0 4px var(--accent-yellow-light)',
                }}>
                  {initials.toUpperCase()}
                </div>
              )}
              {/* Avatar Edit Button */}
              <button
                onClick={() => setShowAvatarCreator(true)}
                style={{
                  position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#EF476F', border: '2px solid #121210',
                  color: '#121210', borderRadius: '16px', padding: '4px 12px', display: 'flex',
                  alignItems: 'center', gap: 6, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 71, 111, 0.4)',
                  fontSize: 12, fontWeight: 800, zIndex: 10,
                  whiteSpace: 'nowrap',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                title="Edit Avatar"
              >
                <Edit2 size={12} strokeWidth={3} /> EDIT
              </button>
              {/* Online dot */}
              <div style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#A8D8B9', border: '2px solid var(--bg-2)',
              }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ background: 'var(--bg-2)', color: 'var(--text-1)', border: '2px solid #121210', borderRadius: 8, padding: '4px 8px', fontSize: 'var(--text-md)', fontWeight: 'var(--fw-semibold)', width: 140, outline: 'none' }}
                  />
                  <button onClick={handleSaveName} style={{ background: 'var(--accent-mint)', color: '#121210', border: '2px solid #121210', borderRadius: 8, padding: '4px 12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 0 #121210' }}>Save</button>
                  <button onClick={() => setIsEditingName(false)} style={{ background: 'transparent', color: 'var(--accent-red)', border: 'none', cursor: 'pointer' }}><X size={20} strokeWidth={3} /></button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', letterSpacing: -0.5, margin: 0 }}>
                    {(user?.unsafeMetadata?.coolName as string) || user?.fullName || user?.username || 'User'}
                  </h2>
                  <button onClick={() => { setNewName((user?.unsafeMetadata?.coolName as string) || user?.fullName || ''); setIsEditingName(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, transition: 'color 0.1s' }} onMouseOver={(e) => e.currentTarget.style.color = '#121210'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-3)'}>
                    <Edit2 size={16} strokeWidth={3} />
                  </button>
                </>
              )}
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', marginBottom: 2 }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-5)' }}>
              Member since {joinDate}
            </p>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { icon: <CheckSquare size={16} />, label: 'Tasks done',    value: doneTasks,      colour: '--accent-mint'    },
                { icon: <Zap size={16} />,         label: 'Active habits', value: activeHabits,   colour: '--accent-yellow'  },
                { icon: <span style={{fontSize:14}}>🔥</span>, label: 'Best streak', value: `${maxStreak}d`, colour: '--accent-peach' },
                { icon: <span style={{fontSize:14}}>📈</span>, label: 'Weekly rate', value: `${avgWeeklyRate}%`, colour: '--accent-blue'  },
              ].map(({ icon, label, value, colour }) => (
                <div key={label} style={{
                  padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                  background: `var(${colour})22`, border: `1px solid var(${colour})44`,
                  textAlign: 'center',
                }}>
                  <div style={{ color: `var(${colour})`, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)' }}>{value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Generate Daily Report Card */}
            <button
              onClick={() => setShowReportCard(true)}
              style={{
                width: '100%', background: 'var(--accent-yellow)', color: '#121210', border: '3px solid #121210',
                padding: '12px', borderRadius: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 0 #121210', transition: 'all 0.1s', marginTop: 'var(--space-5)',
                textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0px 0 #121210'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #121210'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #121210'; }}
            >
              <Zap size={18} strokeWidth={3} fill="#121210" /> Generate Daily Pass
            </button>
          </div>

          {/* Task completion bar */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>Task completion</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{completionPct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border-0)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${completionPct}%`,
                background: 'var(--sidebar-bg)',
                borderRadius: 999,
                transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{doneTasks} of {totalTasks} tasks done</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{totalTasks - doneTasks} remaining</span>
            </div>
          </div>
        </div>

        {/* ── Right: Account Settings ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Account section */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <User size={16} color="var(--text-2)" />
              <span style={{ fontWeight: 'var(--fw-semibold)' }}>Account</span>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 'var(--space-2)' }}>Signed in as</div>
              <div style={{
                fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)',
                padding: 'var(--space-3)', background: 'var(--bg-1)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-0)',
              }}>
                {user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 'var(--space-2)' }}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => openUserProfile()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--bg-1)', border: '1px solid var(--border-0)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--text-0)',
                    fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-0)'; }}
                  id="manage-account-btn"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Settings size={15} color="var(--text-2)" />
                    Manage account
                  </div>
                  <ChevronRight size={15} color="var(--text-2)" />
                </button>

                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'transparent', border: '1px solid var(--border-0)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--danger)',
                    fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)11'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  id="sign-out-btn"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LogOut size={15} />
                    Sign out
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Data summary */}
          <div className="card">
            <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Your Data</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Tasks', count: tasks.length, note: `${doneTasks} completed` },
                { label: 'Habits', count: habits.length, note: `${activeHabits} active` },
                { label: 'Best habit streak', count: `${maxStreak}d`, note: 'personal record' },
              ].map(({ label, count, note }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3)', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{note}</div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)' }}>{count}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 'var(--space-4)', padding: 'var(--space-3)',
              background: 'var(--accent-mint)22', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-mint)44',
              fontSize: 'var(--text-xs)', color: 'var(--text-1)', lineHeight: 1.6,
            }}>
              🔒 All your data is stored securely in a private PostgreSQL database. Only you can access it.
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      {showAvatarCreator && <AvatarCreator onClose={() => setShowAvatarCreator(false)} />}
      {showReportCard && (
        <ReportCardModal 
          onClose={() => setShowReportCard(false)} 
          stats={{
            tasksDone: doneTasks,
            totalTasks: totalTasks,
            activeHabits,
            streak: `${maxStreak}d`,
            weeklyRate: `${avgWeeklyRate}%`,
            dailyHistory: analytics?.dailyTrend ?? []
          }}
        />
      )}
    </div>
  );
}
