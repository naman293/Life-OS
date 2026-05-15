'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), inMonth: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++)
    cells.push({ date: new Date(year, month + 1, d), inMonth: false });
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toISODateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DatePickerProps {
  value?: string;        // "YYYY-MM-DD" or empty
  onChange: (iso: string | null) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Set date' }: DatePickerProps) {
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Position popover beneath the trigger button
  const openPopover = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const POPOVER_WIDTH = 288;
    const MARGIN = 8;

    // Flip left if it would overflow the right edge
    let left = rect.left + window.scrollX;
    if (left + POPOVER_WIDTH > window.innerWidth - MARGIN) {
      left = rect.right + window.scrollX - POPOVER_WIDTH;
    }

    setPopoverPos({ top: rect.bottom + window.scrollY + 6, left: Math.max(MARGIN, left) });
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (date: Date) => {
    onChange(toISODateStr(date));
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const displayText = selected
    ? selected.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const cells = getCalendarDays(viewYear, viewMonth);

  const popover = open && popoverPos && mounted ? createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: popoverPos.top,
        left: popoverPos.left,
        zIndex: 99999,
        background: 'var(--bg-2)',
        border: '3px solid var(--text-0)',
        borderRadius: 12,
        boxShadow: '6px 6px 0 var(--text-0)',
        padding: 16,
        width: 288,
        animation: 'slideUp 0.18s cubic-bezier(0.16,1,0.3,1)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-0)', padding: '4px 8px', borderRadius: 4, fontSize: 16 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px', color: 'var(--text-0)' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-0)', padding: '4px 8px', borderRadius: 4 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '2px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map(({ date, inMonth }, i) => {
          const isSelected = selected && isSameDay(date, selected);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(date)}
              style={{
                width: '100%',
                aspectRatio: '1',
                border: isSelected
                  ? '2px solid var(--text-0)'
                  : isToday
                    ? '2px dashed var(--text-0)'
                    : '2px solid transparent',
                borderRadius: 6,
                background: isSelected ? 'var(--accent-yellow, #F3D76A)' : 'transparent',
                color: isSelected ? 'var(--text-0)' : inMonth ? 'var(--text-0)' : 'var(--text-2)',
                fontWeight: isSelected ? 800 : isToday ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background 0.1s',
                opacity: inMonth ? 1 : 0.35,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-1)'; }}
              onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <button
        type="button"
        onClick={() => selectDay(today)}
        style={{
          marginTop: 12,
          width: '100%',
          border: '2px solid var(--border-0)',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--text-1)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          padding: '6px 0',
          transition: 'all 0.15s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--accent-yellow, #F3D76A)';
          e.currentTarget.style.borderColor = 'var(--text-0)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--border-0)';
        }}
      >
        Today
      </button>
    </div>,
    document.body,
  ) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openPopover()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          border: '2px solid var(--text-0)',
          borderRadius: 6,
          background: open ? 'var(--accent-yellow, #F3D76A)' : 'var(--bg-2)',
          color: displayText ? 'var(--text-0)' : 'var(--text-2)',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '2px 2px 0 var(--text-0)',
          whiteSpace: 'nowrap',
          transition: 'background 0.12s',
          minWidth: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
          <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2"/>
          <line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="13" y1="2" x2="13" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>{displayText ?? <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--text-2)' }}>{placeholder}</span>}</span>
      </button>

      {/* Clear ✕ */}
      {selected && (
        <button
          type="button"
          onClick={clear}
          title="Clear date"
          style={{
            width: 18,
            height: 18,
            border: '2px solid var(--text-0)',
            borderRadius: '50%',
            background: 'var(--bg-2)',
            color: 'var(--text-0)',
            fontWeight: 900,
            fontSize: 9,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >✕</button>
      )}

      {popover}
    </div>
  );
}
