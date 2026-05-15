'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser, UserButton, SignInButton, SignUpButton, Show } from '@clerk/nextjs';
import {
  LayoutDashboard, Calendar, CheckSquare, Zap, BarChart2, User, Bell, Search, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { QuickAddModal } from './QuickAddModal';
import { CustomCursor } from './CustomCursor';
import { NotificationDropdown } from './NotificationDropdown';
import { RobotLogo } from './RobotLogo';
import { BrainDumpModal } from './BrainDumpModal';

const NAV_ITEMS = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/calendar',  icon: Calendar,         label: 'Calendar'   },
  { href: '/tasks',     icon: CheckSquare,      label: 'Tasks'      },
  { href: '/pomodoro',  icon: Zap,              label: 'Focus Room' },
  { href: '/habits',    icon: Zap,              label: 'Habits'     },
  { href: '/analytics', icon: BarChart2,        label: 'Analytics'  },
  { href: '/profile',   icon: User,             label: 'Profile'    },
];

const PAGE_TITLES: Record<string, string> = {
  '/':          'Your daily overview',
  '/calendar':  'Stay on track',
  '/tasks':     'Your tasks',
  '/pomodoro':  'Focus Robot Room',
  '/habits':    'Your habits',
  '/analytics': 'Productivity insights',
  '/profile':   'Your profile',
};

function UserSyncEffect() {
  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/users/sync', { method: 'POST' }).catch(console.error);
  }, [isSignedIn]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const { user }    = useUser();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + I
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setBrainDumpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Don't show shell on auth pages
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  if (isAuthPage) return <>{children}</>;

  const title = PAGE_TITLES[pathname] ?? 'Life OS';

  return (
    <>
      <CustomCursor />
      <UserSyncEffect />
      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
          <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             className="icon-btn"
             style={{
               position: 'absolute', right: -16, top: 40, zIndex: 50,
               background: 'var(--bg-1)', border: '2px solid var(--border-0)',
               width: 32, height: 32, borderRadius: '50%', padding: 0
             }}
          >
             {isSidebarCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>

          <div className="sidebar-logo">
            <RobotLogo size={36} />
            <span className="sidebar-logo-text">Life OS</span>
          </div>

          <span className="sidebar-section-label">General</span>
          <nav className="sidebar-nav" aria-label="Main">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`sidebar-nav-item ${pathname === href ? 'active' : ''}`}
                aria-current={pathname === href ? 'page' : undefined}
                title={isSidebarCollapsed ? label : undefined}
              >
                <Icon aria-hidden="true" />
                <span style={{ display: 'inline-block' }}>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            {isLoaded && isSignedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <UserButton
                  appearance={{
                    elements: { 
                      avatarBox: { width: 34, height: 34 },
                      userButtonPopoverFooter: { display: 'none' } 
                    },
                  }}
                />
                <div className="user-details" style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.firstName ?? 'My Account'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--sidebar-text-muted)' }}>
                    Pro plan
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="main-content">
          <header className="topbar" role="banner">
            <h1 className="topbar-title">{title}</h1>
            <div className="topbar-actions">
              <div className="search-bar" role="search">
                <Search size={14} color="var(--text-2)" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search anything..."
                  aria-label="Global search"
                  id="global-search"
                />
              </div>
              <NotificationDropdown />
              <Show when="signed-in">
                <button
                  className="btn btn-primary"
                  id="quick-add-btn"
                  onClick={() => setQuickAddOpen(true)}
                  aria-haspopup="dialog"
                >
                  <Plus size={16} aria-hidden="true" />
                  Quick Add
                </button>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="btn">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary">Sign up</button>
                </SignUpButton>
              </Show>
            </div>
          </header>

          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      {quickAddOpen && (
        <QuickAddModal onClose={() => setQuickAddOpen(false)} />
      )}
      {brainDumpOpen && (
        <BrainDumpModal onClose={() => setBrainDumpOpen(false)} />
      )}
    </>
  );
}
