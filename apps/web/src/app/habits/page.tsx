'use client';

import { useState } from 'react';
import { useHabits, useHabitLogs, useToggleLog, useDeleteHabit, computeStreak, computeWeeklyRate } from '@/hooks/useHabits';
import { Loader2, Trash2, TrendingUp, Zap, Award } from 'lucide-react';

const COLOUR_MAP: Record<string, string> = {
  yellow: '#F3D76A', pink: '#F7B6DA', blue: '#ADC4EC',
  mint: '#A8D8B9', lavender: '#C4B3CA', peach: '#F0B89A',
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(): { label: string; dateStr: string; isToday: boolean }[] {
  const today = new Date();
  const dow   = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    const ds = d.toISOString().split('T')[0];
    return { label: DAYS[d.getDay()], dateStr: ds, isToday: ds === today.toISOString().split('T')[0] };
  });
}

// Per-habit row — fetches its own logs
function HabitRow({ habit, week, onDelete }: { habit: { id: string; name: string; colourId?: string | null; icon?: string | null }; week: { label: string; dateStr: string; isToday: boolean }[]; onDelete: (id: string) => void }) {
  const weekStr    = week[0].dateStr;
  const { logs }   = useHabitLogs(habit.id, weekStr);
  const toggleLog  = useToggleLog();

  const doneDates  = new Set(logs.filter((l) => l.state === 'DONE').map((l) => l.date));
  const streak     = computeStreak(doneDates);
  const weeklyRate = computeWeeklyRate(doneDates);
  const colour     = COLOUR_MAP[habit.colourId ?? 'mint'];

  return (
    <tr style={{ borderTop: '1px solid var(--border-0)' }}>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 18 }}>{habit.icon || '⭐'}</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{habit.name}</span>
        </div>
      </td>
      {week.map((d) => {
        const done = doneDates.has(d.dateStr);
        return (
          <td key={d.dateStr} style={{ textAlign: 'center' }}>
            <button
              className={`habit-cell ${done ? 'done' : ''}`}
              style={done ? { background: colour } : {}}
              onClick={() => toggleLog(habit.id, d.dateStr)}
              aria-label={`${habit.name} on ${d.label}: ${done ? 'done' : 'not done'}`}
              aria-pressed={done}
            >
              {done ? '✓' : ''}
            </button>
          </td>
        );
      })}
      <td style={{ textAlign: 'center' }}>
        <span className="chip chip-yellow" style={{ fontSize: 'var(--text-xs)' }}>🔥 {streak}</span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{weeklyRate}%</div>
        <div className="progress-bar" style={{ marginTop: 4 }}>
          <div className="progress-fill" style={{ width: `${weeklyRate}%`, background: colour }} />
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => onDelete(habit.id)} aria-label={`Delete ${habit.name}`} style={{ color: 'var(--text-2)' }}>
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function HabitsPage() {
  const { habits, isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();
  const week = getWeekDates();

  return (
    <div className="page-content">
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading habits…
        </div>
      )}

      {habits.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-2)', marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>⚡</div>
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 4 }}>No habits yet</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>Hit "Quick Add" → Habit to start tracking</div>
        </div>
      )}

      {habits.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)' }}>Weekly Tracker</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
              {new Date(week[0].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(week[6].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <table className="habit-grid-table" role="grid" aria-label="Habit tracker">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: 'var(--space-4)', minWidth: 160 }}>Habit</th>
                {week.map((d) => (
                  <th key={d.dateStr} style={{ textAlign: 'center' }}>
                    <div>{d.label}</div>
                    <div style={{ fontWeight: d.isToday ? 'var(--fw-semibold)' : 'normal', color: d.isToday ? 'var(--text-0)' : 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
                      {new Date(d.dateStr).getDate()}
                    </div>
                  </th>
                ))}
                <th>Streak</th>
                <th>This week</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} week={week} onDelete={deleteHabit} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
