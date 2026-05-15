'use client';

import { useState } from 'react';

import { useTasks, useToggleTask } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useInbox } from '@/hooks/useInbox';
import { ProcessInboxModal } from '@/components/ProcessInboxModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Zap, CheckCircle, Clock, Loader2 } from 'lucide-react';

const DONUT_COLOURS = ['#1a1a18', '#F3D76A', '#ADC4EC'];
const COLOUR_MAP: Record<string, string> = {
  yellow: '#F3D76A', pink: '#F7B6DA', blue: '#ADC4EC',
  mint: '#A8D8B9', lavender: '#C4B3CA', peach: '#F0B89A',
};

const PRIORITY_COLOUR: Record<string, string> = { HIGH: '#F5A6A6', MEDIUM: '#F3D76A', LOW: '#A8D8B9' };

export default function DashboardPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const toggleTask = useToggleTask();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { events } = useEvents(
    new Date(today.setHours(0, 0, 0, 0)).toISOString(),
    new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()
  );

  const { analytics, isLoading: analyticsLoading } = useAnalytics('weekly');
  const { inboxItems, isLoading: inboxLoading } = useInbox();

  const done        = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress  = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const total       = tasks.length;
  const pct         = total > 0 ? Math.round((done / total) * 100) : 0;

  const donutData = [
    { name: 'Done',        value: done },
    { name: 'In Progress', value: inProgress },
    { name: 'Pending',     value: total - done - inProgress },
  ];

  const focusTasks = tasks
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => {
      const p = { HIGH: 0, MEDIUM: 1, LOW: 2 } as Record<string, number>;
      return (p[a.priority ?? 'LOW'] ?? 2) - (p[b.priority ?? 'LOW'] ?? 2);
    })
    .slice(0, 3);

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const isLoading = tasksLoading || analyticsLoading || inboxLoading;

  return (
    <div className="page-content">
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading your data…
        </div>
      )}

      {inboxItems && inboxItems.length > 0 && (
        <div className="card" style={{ 
          marginBottom: 'var(--space-5)', 
          background: 'var(--accent-yellow)', 
          color: '#121210',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'slideUp 0.3s ease-out',
          border: '4px solid #121210'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Brain Dump: {inboxItems.length} Unprocessed Thoughts</h3>
            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem', fontWeight: 600 }}>Zero inbox helps clarity. Categorize them into tasks or notes.</p>
          </div>
          <button 
            onClick={() => setProcessModalOpen(true)}
            style={{
              background: '#121210',
              color: 'var(--accent-yellow)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'
            }}
          >
            Process Now
          </button>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Overall progress donut */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: 'var(--space-4)' }}>Overall progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={total > 0 ? donutData : [{ name: 'empty', value: 1 }]} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                    {(total > 0 ? donutData : [{ name: 'empty', value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={total > 0 ? DONUT_COLOURS[i] : '#eee'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{pct}%</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{done}/{total} done</div>
                </div>
              </div>
            </div>
            <div>
              {[['Completed', done], ['In progress', inProgress], ['Pending', total - done - inProgress]].map(([label, val], i) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-6)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLOURS[i] }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="card">
          <div className="card-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-4)' }}>
            <TrendingUp size={14} /> Today's Focus
          </div>
          {focusTasks.length === 0 && !isLoading && (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
              🎉 All caught up — add a task to get started
            </div>
          )}
          {focusTasks.map((task, i) => (
            <div key={task.id} className="task-focus-item" style={{ background: i === 0 ? COLOUR_MAP[task.colourId ?? 'yellow'] + '55' : 'var(--bg-1)' }}>
              <div className="task-focus-num">{i + 1}</div>
              <button
                onClick={() => toggleTask(task)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', flex: 1, textAlign: 'left', fontSize: 'var(--text-sm)', color: 'var(--text-0)', padding: 0 }}
              >
                {task.title}
              </button>
              {task.priority && (
                <span className="chip" style={{ background: PRIORITY_COLOUR[task.priority] + '55', fontSize: 'var(--text-xs)' }}>
                  {task.priority.toLowerCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Completed today', value: done, colour: 'mint', icon: <CheckCircle size={18} /> },
          { label: 'Remaining',        value: total - done, colour: 'yellow', icon: <Clock size={18} /> },
          { label: 'Active streak',    value: analytics ? `${analytics.maxStreak}d` : '—', colour: 'blue', icon: <Zap size={18} /> },
          { label: 'Weekly rate',      value: analytics ? `${analytics.avgWeeklyRate}%` : '—', colour: 'pink', icon: <TrendingUp size={18} /> },
        ].map(({ label, value, colour, icon }) => (
          <div key={label} className={`stat-card stat-card-${colour}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div className="stat-card-label">{label}</div>
              <div style={{ opacity: 0.5 }}>{icon}</div>
            </div>
            <div className="stat-card-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Lower row */}
      <div className="grid-2">
        {/* All Tasks list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)' }}>All Tasks</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{total} items</span>
          </div>
          {tasks.length === 0 && !isLoading && (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
              No tasks yet — click Quick Add to create one
            </div>
          )}
          {tasks.slice(0, 8).map((task) => (
            <div key={task.id} className="task-list-row">
              <button
                className={`task-checkbox ${task.status === 'DONE' ? 'done' : ''}`}
                onClick={() => toggleTask(task)}
                aria-label={`Mark "${task.title}" as ${task.status === 'DONE' ? 'incomplete' : 'complete'}`}
              />
              <span className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>{task.title}</span>
              {task.tags[0] && <span className="chip chip-blue" style={{ fontSize: 'var(--text-xs)' }}>{task.tags[0]}</span>}
              {task.priority && <span className="chip" style={{ background: PRIORITY_COLOUR[task.priority] + '55', fontSize: 'var(--text-xs)' }}>{task.priority.toLowerCase()}</span>}
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)' }}>Today's Schedule</span>
          </div>
          {events.length === 0 && !isLoading && (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
              No events today — add one via Quick Add
            </div>
          )}
          {events.map((ev) => (
            <div key={ev.id} className="event-list-row">
              <div className="event-list-dot" style={{ background: COLOUR_MAP[ev.colourId ?? 'blue'] }} />
              <div>
                <div style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--text-sm)' }}>{ev.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
                  {new Date(ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(ev.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {processModalOpen && <ProcessInboxModal onClose={() => setProcessModalOpen(false)} />}
    </div>
  );
}
