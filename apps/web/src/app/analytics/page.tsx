'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';

type Range = 'daily' | 'weekly' | 'monthly';

const DONUT_COLOURS = ['#121210', '#F3D76A', '#ADC4EC'];
const CAT_COLOURS: Record<string, string> = {
  Work: '#ADC4EC', Health: '#A8D8B9', Learning: '#F3D76A', Personal: '#F7B6DA',
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('weekly');
  const { analytics, isLoading } = useAnalytics(range);

  if (isLoading || !analytics) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-2)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Crunching your data…</span>
        </div>
      </div>
    );
  }

  const { summary, dailyTrend, categoryData, habitStats, maxStreak, avgWeeklyRate } = analytics;

  const donutData = [
    { name: 'Done',        value: summary.doneTasks },
    { name: 'In Progress', value: summary.inProgressTasks },
    { name: 'To Do',       value: summary.todoTasks },
  ];

  return (
    <div className="page-content">
      {/* Range toggle */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="tabs">
          {(['daily', 'weekly', 'monthly'] as Range[]).map((r) => (
            <button key={r} className={`tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Task Completion Donut */}
        <div className="card">
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Task Completion</div>
          {summary.totalTasks === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-6)', textAlign: 'center' }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLOURS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--fw-semibold)', letterSpacing: -1 }}>
                  {summary.completionPct}%
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 'var(--space-4)' }}>completion rate</div>
                {donutData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLOURS[i] }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-1)' }}>{d.name}</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', marginLeft: 'auto' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily trend */}
        <div className="card">
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Tasks Completed — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="completed" stroke="var(--text-0)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--text-0)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
        {/* Category */}
        <div className="card">
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Tasks by Category</div>
          {categoryData.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-6)', textAlign: 'center' }}>Add tags to tasks to see distribution</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-1)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={CAT_COLOURS[entry.name] ?? '#ADC4EC'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Habit consistency */}
        <div className="card">
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Habit Consistency — This Week</div>
          {habitStats.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', padding: 'var(--space-6)', textAlign: 'center' }}>No habits tracked yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={habitStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-0)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Rate']} />
                <Bar dataKey="weeklyRate" radius={[6, 6, 0, 0]} fill="var(--accent-blue)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>Key Insights</div>
        <div className="grid-3">
          {[
            { label: '🏆 Best habit this week', value: habitStats.sort((a,b) => b.weeklyRate - a.weeklyRate)[0]?.name ?? '—' },
            { label: '📈 Task completion',       value: `${summary.completionPct}%` },
            { label: '🔥 Longest streak',        value: `${maxStreak} days` },
          ].map(({ label, value }) => (
            <div key={label} className="card-flat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: 'var(--space-2)' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
