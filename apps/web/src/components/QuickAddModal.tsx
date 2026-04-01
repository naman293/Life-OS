'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { useCreateEvent } from '@/hooks/useEvents';
import { useCreateHabit } from '@/hooks/useHabits';

const COLOUR_OPTIONS = [
  { id: 'yellow',   label: 'Yellow',   bg: '#F3D76A' },
  { id: 'pink',     label: 'Pink',     bg: '#F7B6DA' },
  { id: 'blue',     label: 'Blue',     bg: '#ADC4EC' },
  { id: 'mint',     label: 'Mint',     bg: '#A8D8B9' },
  { id: 'lavender', label: 'Lavender', bg: '#C4B3CA' },
  { id: 'peach',    label: 'Peach',    bg: '#F0B89A' },
];

export function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab]           = useState<'task' | 'event' | 'habit'>('task');
  const [title, setTitle]       = useState('');
  const [notes, setNotes]       = useState('');
  const [dueAt, setDueAt]       = useState('');
  const [startAt, setStartAt]   = useState('');
  const [endAt, setEndAt]       = useState('');
  const [colour, setColour]     = useState('blue');
  const [frequency, setFreq]    = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | ''>('');
  const [tags, setTags]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const overlayRef              = useRef<HTMLDivElement>(null);
  const firstInputRef           = useRef<HTMLInputElement>(null);

  const createTask  = useCreateTask();
  const createEvent = useCreateEvent();
  const createHabit = useCreateHabit();

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');

    try {
      const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

      if (tab === 'task') {
        await createTask({
          title: title.trim(),
          notes: notes || undefined,
          status: 'TODO',
          priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH') || undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          tags: parsedTags,
          colourId: colour,
        });
      } else if (tab === 'event') {
        await createEvent({
          title: title.trim(),
          notes: notes || undefined,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          status: 'SCHEDULED',
          tags: parsedTags,
          colourId: colour,
        });
      } else {
        await createHabit({
          name: title.trim(),
          frequency,
          daysOfWeek: [],
          colourId: colour,
          icon: '',
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <h2 id="quick-add-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)' }}>
            Quick Add
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="tabs" style={{ marginBottom: 'var(--space-5)' }} role="tablist">
          {(['task', 'event', 'habit'] as const).map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="qa-title">
              {tab === 'habit' ? 'Habit name' : 'Title'} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              ref={firstInputRef}
              id="qa-title"
              className="form-input"
              placeholder={tab === 'task' ? 'e.g. Review design specs' : tab === 'event' ? 'e.g. Team standup' : 'e.g. Morning run'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {(tab === 'task' || tab === 'event') && (
            <div className="form-group">
              <label className="form-label" htmlFor="qa-notes">Notes (optional)</label>
              <input id="qa-notes" className="form-input" placeholder="Add details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}

          {tab === 'task' && (
            <>
              <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="qa-due">Due date</label>
                  <input id="qa-due" type="datetime-local" className="form-input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="qa-priority">Priority</label>
                  <select id="qa-priority" className="form-input" value={priority} onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | '')}>
                    <option value="">None</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="qa-tags">Tags (comma separated)</label>
                <input id="qa-tags" className="form-input" placeholder="Work, Health, Learning" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </>
          )}

          {tab === 'event' && (
            <>
              <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="qa-start">Start <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input id="qa-start" type="datetime-local" className="form-input" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="qa-end">End <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input id="qa-end" type="datetime-local" className="form-input" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="qa-tags-event">Tags (optional)</label>
                <input id="qa-tags-event" className="form-input" placeholder="Work, Personal" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </>
          )}

          {tab === 'habit' && (
            <div className="form-group">
              <label className="form-label" htmlFor="qa-freq">Frequency</label>
              <select id="qa-freq" className="form-input" value={frequency} onChange={(e) => setFreq(e.target.value as 'daily' | 'weekdays' | 'custom')}>
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays only</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Colour</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {COLOUR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Select ${c.label}`}
                  onClick={() => setColour(c.id)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c.bg,
                    border: colour === c.id ? '3px solid var(--text-0)' : '3px solid transparent',
                    cursor: 'pointer', transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', background: '#FDDEDE', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="qa-submit-btn" disabled={loading}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
              Add {tab}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
