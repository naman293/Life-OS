'use client';

import { useState, useRef, useCallback, useMemo, useEffect, Fragment } from 'react';
import { useEvents, useCreateEvent, useMoveEvent, useDeleteEvent, useUpdateEvent, CalendarEvent } from '@/hooks/useEvents';
import { ChevronLeft, ChevronRight, Loader2, X, Trash2, Clock, Edit3 } from 'lucide-react';

/* ── Constants ─────────────────────────────── */
const HOUR_H   = 56;
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS    = Array.from({ length: 24 }, (_, i) => i);
const COLOURS  = [
  { id: 'yellow',   bg: '#FBF0BA', border: '#B39200', dot: '#F3D76A' },
  { id: 'blue',     bg: '#D6E4F8', border: '#2B62B0', dot: '#ADC4EC' },
  { id: 'mint',     bg: '#D1EDD9', border: '#1E6B3C', dot: '#A8D8B9' },
  { id: 'pink',     bg: '#FCDFF1', border: '#A0306A', dot: '#F7B6DA' },
  { id: 'peach',    bg: '#F9D9CA', border: '#B04E20', dot: '#F0B89A' },
  { id: 'lavender', bg: '#E8E0F0', border: '#5A3F7F', dot: '#C4B3CA' },
];
const CMAP = Object.fromEntries(COLOURS.map(c => [c.id, c]));
const CLICK_THRESHOLD = 6; // px movement before it's considered a drag

/* ── Helpers ─────────────────────────────────── */
function weekStart(d: Date) {
  const s = new Date(d); s.setDate(d.getDate() - d.getDay()); s.setHours(0,0,0,0); return s;
}
function weekDays(ws: Date) {
  return Array.from({ length: 7 }, (_, i) => { const d=new Date(ws); d.setDate(ws.getDate()+i); return d; });
}
function toH(iso: string) {
  const d = new Date(iso); return d.getHours() + d.getMinutes() / 60;
}
function hourToIso(date: Date, h: number) {
  const d = new Date(date);
  d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
  return d.toISOString();
}
function snap(h: number)     { return Math.round(h * 4) / 4; }
function fmtH(h: number) {
  const hh = Math.floor(h), mm = Math.round((h % 1) * 60);
  return `${hh % 12 || 12}:${mm.toString().padStart(2, '0')}${hh < 12 ? 'am' : 'pm'}`;
}

/* ── Overlap layout ──────────────────────── */
interface LayoutBox { col: number; cols: number }
function computeLayout(evs: CalendarEvent[]): Map<string, LayoutBox> {
  const result = new Map<string, LayoutBox>();
  if (!evs.length) return result;
  const sorted = [...evs].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const colEnds: number[] = [];
  const colOf   = new Map<string, number>();
  for (const ev of sorted) {
    const s = toH(ev.startAt), e = toH(ev.endAt);
    let placed = false;
    for (let c = 0; c < colEnds.length; c++) {
      if (s >= colEnds[c] - 0.01) { colEnds[c] = e; colOf.set(ev.id, c); placed = true; break; }
    }
    if (!placed) { colOf.set(ev.id, colEnds.length); colEnds.push(e); }
  }
  const total = colEnds.length;
  for (const ev of sorted) result.set(ev.id, { col: colOf.get(ev.id) ?? 0, cols: total });
  return result;
}

/* ── Toast Notification ─────────────────── */
interface ToastData { id: string; msg: string; undo?: () => void }
function Toast({ data, onClose }: { data: ToastData; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
      display:'flex', alignItems:'center', gap:10,
      background:'#121210', color:'#F9F3E4',
      padding:'11px 16px', borderRadius:12,
      boxShadow:'0 8px 32px rgba(0,0,0,0.22)', zIndex:800,
      fontSize:13, fontWeight:500, fontFamily:'var(--font-sans)',
      animation:'toastSlideUp 200ms cubic-bezier(0.34,1.56,0.64,1)',
      whiteSpace:'nowrap',
    }}>
      <Trash2 size={13} style={{ opacity:0.7 }}/>
      <span>{data.msg}</span>
      {data.undo && (
        <button onClick={data.undo} style={{
          background:'rgba(243,215,106,0.15)', border:'1px solid rgba(243,215,106,0.3)',
          color:'#F3D76A', padding:'3px 10px', borderRadius:6,
          cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'var(--font-sans)',
        }}>
          Undo
        </button>
      )}
      <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 2px', marginLeft:2 }}>×</button>
    </div>
  );
}

/* ── Event Detail Panel ─────────────────── */
function EventDetail({ ev, onClose, onDelete, onUpdate }: {
  ev: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<CalendarEvent>) => Promise<void>;
}) {
  const [title,   setTitle]   = useState(ev.title);
  const [notes,   setNotes]   = useState(ev.notes ?? '');
  const [colour,  setColour]  = useState(ev.colourId ?? 'blue');
  const [saving,  setSaving]  = useState(false);
  const c = CMAP[colour] ?? CMAP.blue;
  const startH = toH(ev.startAt), endH = toH(ev.endAt);

  const save = async () => {
    setSaving(true);
    await onUpdate({ title: title.trim() || ev.title, notes, colourId: colour });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position:'fixed', top:'50%', right:24, transform:'translateY(-50%)',
      width:296, background:'var(--bg-2)', borderRadius:16,
      border:`1.5px solid ${c.border}40`,
      boxShadow:'0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      padding:20, zIndex:300, fontFamily:'var(--font-sans)',
      animation:'detailSlide 180ms cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Event</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', padding:2, display:'flex' }}>
          <X size={15}/>
        </button>
      </div>

      {/* Time */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, color:'var(--text-2)', fontSize:12 }}>
        <Clock size={12}/>
        <span>{fmtH(startH)} – {fmtH(endH)}</span>
        <span style={{ opacity:0.5 }}>·</span>
        <span>{new Date(ev.startAt).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</span>
      </div>

      {/* Title */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:5 }}>Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width:'100%', padding:'8px 10px', background:'var(--bg-1)', border:'1.5px solid var(--border-0)', borderRadius:8, fontSize:13, color:'var(--text-0)', fontFamily:'var(--font-sans)', outline:'none', boxSizing:'border-box' }}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
          <Edit3 size={10}/> Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          style={{ width:'100%', padding:'8px 10px', background:'var(--bg-1)', border:'1.5px solid var(--border-0)', borderRadius:8, fontSize:12, color:'var(--text-0)', fontFamily:'var(--font-sans)', outline:'none', boxSizing:'border-box', resize:'none', lineHeight:1.5 }}
        />
      </div>

      {/* Colour */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', display:'block', marginBottom:6 }}>Colour</label>
        <div style={{ display:'flex', gap:7 }}>
          {COLOURS.map(col => (
            <button
              key={col.id} onClick={() => setColour(col.id)}
              style={{ width:22, height:22, borderRadius:'50%', background:col.dot, border:colour===col.id?'2.5px solid var(--text-0)':'2.5px solid transparent', cursor:'pointer', outline:'none', transform:colour===col.id?'scale(1.2)':'scale(1)', transition:'all 100ms ease' }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={save} disabled={saving}
          style={{ flex:1, padding:'8px 0', background:'var(--sidebar-bg)', color:'var(--sidebar-text)', border:'none', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'var(--font-sans)' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onDelete}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', background:'#FDE8E8', color:'#A0302A', border:'none', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'var(--font-sans)' }}
          title="Delete (⌫ Delete key)"
        >
          <Trash2 size={12}/> Delete
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ marginTop:10, textAlign:'center', fontSize:10, color:'var(--text-2)', opacity:0.7 }}>
        Press <kbd style={{ background:'var(--bg-0)', border:'1px solid var(--border-0)', borderRadius:4, padding:'1px 5px', fontSize:10 }}>Delete</kbd> or <kbd style={{ background:'var(--bg-0)', border:'1px solid var(--border-0)', borderRadius:4, padding:'1px 5px', fontSize:10 }}>Backspace</kbd> to remove
      </div>
    </div>
  );
}

/* ── New Event Modal ─────────────────────── */
function CreateModal({ date, startH, endH, onSave, onClose }: {
  date: Date; startH: number; endH: number;
  onSave: (title: string, colour: string) => void;
  onClose: () => void;
}) {
  const [title,  setTitle]  = useState('');
  const [colour, setColour] = useState('blue');
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(18,18,16,0.35)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-2)', borderRadius:16, padding:24, width:340, boxShadow:'0 16px 48px rgba(0,0,0,0.12)', border:'1px solid var(--border-0)', animation:'detailSlide 150ms ease', fontFamily:'var(--font-sans)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--text-0)' }}>New Event</div>
            <div style={{ fontSize:11, color:'var(--text-2)', marginTop:3 }}>
              {date.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {fmtH(startH)} – {fmtH(endH)}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={16}/></button>
        </div>
        <input autoFocus placeholder="Event title…" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && title.trim()) onSave(title.trim(), colour); }}
          style={{ width:'100%', padding:'9px 12px', background:'var(--bg-1)', border:'1.5px solid var(--border-0)', borderRadius:8, fontSize:13, color:'var(--text-0)', fontFamily:'var(--font-sans)', marginBottom:14, outline:'none', boxSizing:'border-box' }}/>
        <div style={{ display:'flex', gap:7, marginBottom:18 }}>
          {COLOURS.map(c => (
            <button key={c.id} onClick={() => setColour(c.id)} style={{ width:22, height:22, borderRadius:'50%', background:c.dot, border:colour===c.id?'2.5px solid var(--text-0)':'2.5px solid transparent', cursor:'pointer', outline:'none', transform:colour===c.id?'scale(1.15)':'scale(1)', transition:'all 100ms ease' }}/>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => title.trim() && onSave(title.trim(), colour)} disabled={!title.trim()} style={{ flex:1, padding:'9px 0', background:title.trim()?'var(--sidebar-bg)':'var(--border-0)', color:title.trim()?'var(--sidebar-text)':'var(--text-2)', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:title.trim()?'pointer':'not-allowed', fontFamily:'var(--font-sans)' }}>Add Event</button>
          <button onClick={onClose} style={{ padding:'9px 14px', background:'transparent', border:'1px solid var(--border-0)', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text-1)', fontFamily:'var(--font-sans)' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Mini DatePicker ───────────────────────── */
function MiniDatePicker({ currentWeekStart, onSelect, onClose }: {
  currentWeekStart: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1));

  const changeMonth = (dir: -1|1) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + dir, 1));
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  return (
    <div style={{
      position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-1)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      border: '3px solid var(--text-0)',
      boxShadow: '6px 6px 0 var(--text-0)',
      zIndex: 1000,
      width: 260,
      animation: 'detailSlide 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-3)' }}>
        <button className="icon-btn" style={{ padding:4 }} onClick={() => changeMonth(-1)}><ChevronLeft size={20}/></button>
        <div style={{ fontWeight: 800, fontSize: 14 }}>
          {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button className="icon-btn" style={{ padding:4 }} onClick={() => changeMonth(1)}><ChevronRight size={20}/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
        {DAY_ABBR.map(d => <div key={d}>{d[0]}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const targetDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
          const endOfWeek = new Date(currentWeekStart);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          const inWeek = targetDate >= currentWeekStart && targetDate <= endOfWeek;
          return (
            <button
               key={d}
               onClick={() => { onSelect(targetDate); onClose(); }}
               style={{
                 background: inWeek ? 'var(--accent-mint)' : 'transparent',
                 color: 'var(--text-0)',
                 border: inWeek ? '2px solid var(--text-0)' : '2px solid transparent',
                 borderRadius: 6,
                 height: 28,
                 cursor: 'pointer',
                 fontWeight: 700,
                 fontSize: 12,
                 transition: 'all 0.1s'
               }}
               onMouseEnter={e => e.currentTarget.style.border = '2px solid var(--text-0)'}
               onMouseLeave={e => e.currentTarget.style.border = inWeek ? '2px solid var(--text-0)' : '2px solid transparent'}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Calendar Page ───────────────────────── */
export default function CalendarPage() {
  const [ws,  setWs]  = useState(weekStart(new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const days = useMemo(() => weekDays(ws), [ws]);
  const todayStr = new Date().toISOString().split('T')[0];

  const from = days[0].toISOString();
  const to   = new Date(days[6].getTime() + 86399999).toISOString();
  const { events, isLoading } = useEvents(from, to);
  const createEvent = useCreateEvent();
  const moveEvent   = useMoveEvent();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();

  /* ── State: UI only ── */
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draft,         setDraft]         = useState<{ dayIdx:number; startH:number; endH:number } | null>(null);
  const [toast,         setToast]         = useState<ToastData | null>(null);

  /* ── Refs: drag (NO state updates during mousemove = instant) ── */
  const gridRef    = useRef<HTMLDivElement>(null);
  // ghost divs: one per column, referenced directly for instant DOM updates
  const ghostRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const createPrevRefs  = useRef<(HTMLDivElement | null)[]>([]);

  // drag data stored in refs to avoid re-renders
  const moveDragRef = useRef<{
    ev: CalendarEvent; dayIdx: number; grabOffsetH: number;
    startX: number; startY: number; isDragging: boolean; currentStartH: number;
  } | null>(null);
  const createDragRef = useRef<{
    dayIdx: number; startH: number; currentStartH: number; currentEndH: number;
  } | null>(null);
  const resizeDragRef = useRef<{
    ev: CalendarEvent; dayIdx: number; edge: 'top' | 'bottom';
    startY: number; originalStartH: number; originalEndH: number;
    currentStartH: number; currentEndH: number;
  } | null>(null);

  /* ── Column helpers ── */
  const getColEl  = (dayIdx: number) => gridRef.current?.querySelectorAll('[data-day-col]')[dayIdx] as HTMLElement | null;
  const yToH = (col: HTMLElement, clientY: number) => {
    const rect = col.getBoundingClientRect();
    const scrollEl = col.closest('[data-scroll]') as HTMLElement;
    return Math.max(0, Math.min(24, (clientY - rect.top + (scrollEl?.scrollTop ?? 0)) / HOUR_H));
  };

  /* ── Event click vs drag detection ── */
  const onEventMouseDown = useCallback((ev: CalendarEvent, dayIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    e.preventDefault();
    moveDragRef.current = {
      ev, dayIdx,
      grabOffsetH: yToH(getColEl(dayIdx)!, e.clientY) - toH(ev.startAt),
      startX: e.clientX, startY: e.clientY,
      isDragging: false, currentStartH: toH(ev.startAt),
    };
  }, []);

  const onResizeMouseDown = useCallback((ev: CalendarEvent, dayIdx: number, edge: 'top' | 'bottom', e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    e.preventDefault();
    const startH = toH(ev.startAt);
    const endH = toH(ev.endAt);
    resizeDragRef.current = {
      ev, dayIdx, edge,
      startY: e.clientY, originalStartH: startH, originalEndH: endH,
      currentStartH: startH, currentEndH: endH,
    };
    if (ghostRefs.current[dayIdx]) ghostRefs.current[dayIdx]!.style.willChange = 'top, height';
  }, []);

  /* ── Create drag (empty space mousedown) ── */
  const onColMouseDown = useCallback((dayIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const h = snap(yToH(getColEl(dayIdx)!, e.clientY));
    createDragRef.current = { dayIdx, startH: h, currentStartH: h, currentEndH: h + 1 };
    // Show initial preview
    const prev = createPrevRefs.current[dayIdx];
    if (prev) {
      prev.style.display = 'block';
      prev.style.top    = `${h * HOUR_H}px`;
      prev.style.height = `${HOUR_H}px`;
      const timeEl = prev.querySelector('.prev-time') as HTMLElement;
      if (timeEl) timeEl.textContent = `${fmtH(h)} – ${fmtH(h + 1)}`;
    }
  }, []);

  /* ── Global mousemove: requestAnimationFrame for ultra-fast 120fps ── */
  useEffect(() => {
    let rafId: number;
    let pendingEvent: MouseEvent | null = null;
    
    const updatePhysics = () => {
      if (!pendingEvent) {
        rafId = requestAnimationFrame(updatePhysics);
        return;
      }
      const e = pendingEvent;
      pendingEvent = null;

      /* ─ Move existing event ─ */
      if (moveDragRef.current) {
        const { ev, dayIdx, grabOffsetH, startX, startY } = moveDragRef.current;
        const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
          moveDragRef.current.isDragging = true;
          // Set willChange on drag start to prevent jitter
          if (ghostRefs.current[dayIdx]) ghostRefs.current[dayIdx]!.style.willChange = 'top, height';
        }
        if (!moveDragRef.current.isDragging) {
          rafId = requestAnimationFrame(updatePhysics);
          return;
        }

        const col = getColEl(dayIdx); 
        if (!col) {
          rafId = requestAnimationFrame(updatePhysics);
          return;
        }
        const dur       = toH(ev.endAt) - toH(ev.startAt);
        const newStartH = Math.max(0, Math.min(24 - dur, snap(yToH(col, e.clientY) - grabOffsetH)));
        moveDragRef.current.currentStartH = newStartH;

        // Direct DOM Update via GPU hardware translation if possible, or top
        const c     = CMAP[ev.colourId ?? 'blue'] ?? CMAP.blue;
        const ghost = ghostRefs.current[dayIdx];
        if (ghost) {
          ghost.style.display    = 'block';
          ghost.style.top        = `${newStartH * HOUR_H}px`;
          ghost.style.height     = `${dur * HOUR_H}px`;
          ghost.style.background = c.bg;
          ghost.style.borderLeft = `3px solid ${c.border}`;
          const titleEl = ghost.querySelector('.g-title') as HTMLElement;
          const timeEl  = ghost.querySelector('.g-time')  as HTMLElement;
          if (titleEl) titleEl.textContent = ev.title;
          if (timeEl)  timeEl.textContent  = `${fmtH(newStartH)} – ${fmtH(newStartH + dur)}`;
        }
        const originalEl = col.querySelector(`[data-event-id="${ev.id}"]`) as HTMLElement;
        if (originalEl) originalEl.style.opacity = '0.3';
        
        rafId = requestAnimationFrame(updatePhysics);
        return;
      }

      /* ─ Create drag ─ */
      if (createDragRef.current) {
        const { dayIdx, startH } = createDragRef.current;
        const col = getColEl(dayIdx); 
        if (!col) {
          rafId = requestAnimationFrame(updatePhysics);
          return;
        }
        
        // Notion style drag constraint: Snap start and end respectively 
        const h = snap(yToH(col, e.clientY));
        const s = Math.min(startH, h);
        const endH = Math.max(startH, h) + (startH === h ? 1 : 0); // Default to 1 hour block if they just clicked without movement

        // Minimum limit 15-minute duration if they drag slowly
        const finalEndH = Math.max(s + 0.25, endH);

        createDragRef.current.currentStartH = s;
        createDragRef.current.currentEndH   = finalEndH;

        const prev = createPrevRefs.current[dayIdx];
        if (prev) {
          prev.style.top    = `${s * HOUR_H}px`;
          prev.style.height = `${(finalEndH - s) * HOUR_H}px`;
          const timeEl = prev.querySelector('.prev-time') as HTMLElement;
          if (timeEl) timeEl.textContent = `${fmtH(s)} – ${fmtH(finalEndH)}`;
        }
        rafId = requestAnimationFrame(updatePhysics);
        return;
      }

      /* ─ Resize drag ─ */
      if (resizeDragRef.current) {
        const { ev, dayIdx, edge, originalStartH, originalEndH } = resizeDragRef.current;
        const col = getColEl(dayIdx);
        if (!col) {
          rafId = requestAnimationFrame(updatePhysics);
          return;
        }

        const h = snap(yToH(col, e.clientY));
        let newS = originalStartH;
        let newE = originalEndH;

        if (edge === 'top') {
          newS = Math.min(h, originalEndH - 0.25);
        } else {
          newE = Math.max(h, originalStartH + 0.25);
        }

        resizeDragRef.current.currentStartH = newS;
        resizeDragRef.current.currentEndH = newE;

        const c     = CMAP[ev.colourId ?? 'blue'] ?? CMAP.blue;
        const ghost = ghostRefs.current[dayIdx];
        if (ghost) {
          ghost.style.display    = 'block';
          ghost.style.top        = `${newS * HOUR_H}px`;
          ghost.style.height     = `${(newE - newS) * HOUR_H}px`;
          ghost.style.background = c.bg;
          ghost.style.borderLeft = `3px solid ${c.border}`;
          const titleEl = ghost.querySelector('.g-title') as HTMLElement;
          const timeEl  = ghost.querySelector('.g-time')  as HTMLElement;
          if (titleEl) titleEl.textContent = ev.title;
          if (timeEl)  timeEl.textContent  = `${fmtH(newS)} – ${fmtH(newE)}`;
        }
        const originalEl = col.querySelector(`[data-event-id="${ev.id}"]`) as HTMLElement;
        if (originalEl) originalEl.style.opacity = '0.3';
      }
      rafId = requestAnimationFrame(updatePhysics);
    };

    const onMove = (e: MouseEvent) => {
      pendingEvent = e;
    };
    rafId = requestAnimationFrame(updatePhysics);

    const onUp = async () => {
      /* ─ Finish move ─ */
      if (moveDragRef.current) {
        const { ev, dayIdx, isDragging, currentStartH } = moveDragRef.current;
        moveDragRef.current = null;

        // Reset ghost + original
        const ghost = ghostRefs.current[dayIdx];
        if (ghost) ghost.style.display = 'none';
        const col = getColEl(dayIdx);
        const originalEl = col?.querySelector(`[data-event-id="${ev.id}"]`) as HTMLElement;
        if (originalEl) originalEl.style.opacity = '';

        if (!isDragging) {
          setSelectedEvent(ev);           // it was a click → open detail
        } else {
          const dur   = toH(ev.endAt) - toH(ev.startAt);
          const start = hourToIso(days[dayIdx], currentStartH);
          const end   = hourToIso(days[dayIdx], currentStartH + dur);
          try { await moveEvent(ev.id, start, end); } catch {}
        }
        return;
      }

      /* ─ Finish resize ─ */
      if (resizeDragRef.current) {
        const { ev, dayIdx, currentStartH, currentEndH, originalStartH, originalEndH } = resizeDragRef.current;
        resizeDragRef.current = null;

        const ghost = ghostRefs.current[dayIdx];
        if (ghost) ghost.style.display = 'none';
        const col = getColEl(dayIdx);
        const originalEl = col?.querySelector(`[data-event-id="${ev.id}"]`) as HTMLElement;
        if (originalEl) originalEl.style.opacity = '';

        if (currentStartH !== originalStartH || currentEndH !== originalEndH) {
          const start = hourToIso(days[dayIdx], currentStartH);
          const end   = hourToIso(days[dayIdx], currentEndH);
          try { await moveEvent(ev.id, start, end); } catch {}
        }
        return;
      }

      /* ─ Finish create ─ */
      if (createDragRef.current) {
        const { dayIdx, currentStartH, currentEndH } = createDragRef.current;
        createDragRef.current = null;
        const prev = createPrevRefs.current[dayIdx];
        if (prev) {
          prev.style.display = 'none';
          prev.style.willChange = 'auto';
        }
        if (currentEndH - currentStartH >= 0.25) {
          setDraft({ dayIdx, startH: currentStartH, endH: currentEndH });
        }
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup',   onUp);
    return () => { 
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove); 
      window.removeEventListener('mouseup', onUp); 
    };
  }, [days, moveEvent]);

  /* ── Keyboard: Delete/Backspace removes selected event ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedEvent) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete(selectedEvent);
      }
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const handleDelete = useCallback(async (ev: CalendarEvent) => {
    setSelectedEvent(null);
    await deleteEvent(ev.id);
    setToast({ id: ev.id, msg: `"${ev.title}" deleted` });
  }, [deleteEvent]);

  const handleUpdate = useCallback(async (updates: Partial<CalendarEvent>) => {
    if (!selectedEvent) return;
    await updateEvent(selectedEvent.id, updates);
  }, [selectedEvent, updateEvent]);

  const handleCreate = async (title: string, colour: string) => {
    if (!draft) return;
    await createEvent({
      title, colourId: colour, status: 'SCHEDULED', tags: [],
      startAt: hourToIso(days[draft.dayIdx], draft.startH),
      endAt:   hourToIso(days[draft.dayIdx], draft.endH),
    });
    setDraft(null);
  };

  const navigate = (dir: -1|1) => {
    const d = new Date(ws); d.setDate(d.getDate() + dir * 7); setWs(weekStart(d));
  };
  const fmtRange = () => {
    const o: Intl.DateTimeFormatOptions = { month:'short', day:'numeric' };
    return `${days[0].toLocaleDateString('en-US', o)} – ${days[6].toLocaleDateString('en-US', { ...o, year:'numeric' })}`;
  };

  /* ── Render ── */
  return (
    <>
      <style>{`
        @keyframes toastSlideUp  { from { transform: translateX(-50%) translateY(14px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
        @keyframes detailSlide   { from { transform: translateY(-50%) translateX(12px); opacity:0; } to { transform: translateY(-50%) translateX(0); opacity:1; } }
        @keyframes spin          { to { transform: rotate(360deg); } }
        [data-event-block] { transition: opacity 80ms ease; }
      `}</style>

      <div className="page-content" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - var(--topbar-height) - 48px)', paddingBottom:0 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, flexShrink:0 }}>
          <button className="icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18}/></button>

          <div style={{ position: 'relative', minWidth: 200, display: 'flex', justifyContent: 'center' }}>
            <button 
              className="neo-btn"
              onClick={() => setShowPicker(!showPicker)} 
              style={{ 
                fontWeight:700, fontSize:'var(--text-sm)', padding: '6px 12px', background: 'var(--bg-1)', 
                border: '2px solid var(--text-0)', borderRadius: 'var(--radius-md)', 
                boxShadow: '3px 3px 0 var(--text-0)', cursor: 'pointer',
                transition: 'all 0.1s'
              }}
            >
              {fmtRange()}
            </button>
            {showPicker && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowPicker(false)} />
                <MiniDatePicker 
                   currentWeekStart={ws} 
                   onSelect={(d) => setWs(weekStart(d))} 
                   onClose={() => setShowPicker(false)}
                />
              </>
            )}
          </div>

          <button className="icon-btn" onClick={() => navigate(1)}><ChevronRight size={18}/></button>
          <button className="btn btn-secondary" style={{ padding:'5px 14px', fontSize:12 }} onClick={() => setWs(weekStart(new Date()))}>Today</button>
          {isLoading && <Loader2 size={14} style={{ animation:'spin 1s linear infinite', color:'var(--text-2)' }}/>}
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-2)' }}>
            Drag empty → create · Drag event → move · Click event → details
          </span>
        </div>

        {/* Grid */}
        <div ref={gridRef} style={{ flex:1, overflow:'hidden', background:'var(--bg-2)', borderRadius:'var(--radius-card)', boxShadow:'var(--shadow-1)', border:'1px solid var(--border-0)', display:'flex', flexDirection:'column', userSelect:'none' }}>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7, 1fr)', borderBottom:'1px solid var(--border-0)', flexShrink:0, background:'var(--bg-1)' }}>
            <div/>
            {days.map(d => {
              const ds = d.toISOString().split('T')[0];
              const isToday = ds === todayStr;
              return (
                <div key={ds} style={{ padding:'8px 4px', textAlign:'center', borderLeft:'1px solid var(--border-0)' }}>
                  <div style={{ fontSize:10, fontWeight:500, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{DAY_ABBR[d.getDay()]}</div>
                  <div style={{ width:26, height:26, borderRadius:'50%', margin:'2px auto 0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:isToday?700:400, background:isToday?'var(--sidebar-bg)':'transparent', color:isToday?'var(--accent-yellow)':'var(--text-0)' }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Scrollable body */}
          <div data-scroll style={{ flex:1, overflowY:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7, 1fr)', height:`${24 * HOUR_H}px` }}>

              {/* Hour labels */}
              <div style={{ position:'relative', background:'var(--bg-1)', borderRight:'1px solid var(--border-0)' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ position:'absolute', top:h*HOUR_H-7, right:6, fontSize:9, color:'var(--text-2)', fontWeight:500, whiteSpace:'nowrap' }}>
                    {h === 0 ? '' : `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((d, dayIdx) => {
                const ds      = d.toISOString().split('T')[0];
                const isToday = ds === todayStr;
                const dayEvs  = events.filter(e => e.startAt.split('T')[0] === ds);
                const layout  = computeLayout(dayEvs);

                return (
                  <div
                    key={ds}
                    data-day-col
                    onMouseDown={e => onColMouseDown(dayIdx, e)}
                    style={{ height:`${24*HOUR_H}px`, position:'relative', borderLeft:'1px solid var(--border-0)', background:isToday?'rgba(243,215,106,0.04)':'transparent', cursor:'crosshair' }}
                  >
                    {/* Hour + half-hour lines — Fragment key fixes the React console error */}
                    {HOURS.map(h => (
                      <Fragment key={h}>
                        <div style={{ position:'absolute', top:h*HOUR_H,          left:0, right:0, height:1, background:'var(--border-0)', opacity:0.55, pointerEvents:'none' }}/>
                        <div style={{ position:'absolute', top:h*HOUR_H+HOUR_H/2, left:0, right:0, height:1, background:'var(--border-0)', opacity:0.25, pointerEvents:'none' }}/>
                      </Fragment>
                    ))}

                    {/* Create-drag preview (hidden until drag starts) */}
                    <div
                      ref={el => { createPrevRefs.current[dayIdx] = el; }}
                      style={{ display:'none', position:'absolute', left:2, right:2, background:'rgba(18,18,16,0.06)', border:'2px dashed #121210', borderRadius:6, zIndex:10, pointerEvents:'none', alignItems:'center', justifyContent:'center' }}
                    >
                      <span className="prev-time" style={{ fontSize:10, fontWeight:700, color:'#121210', opacity:0.7, padding:'2px 6px', display:'block', textAlign:'center' }}/>
                    </div>

                    {/* Move-drag ghost (hidden until drag starts) */}
                    <div
                      ref={el => { ghostRefs.current[dayIdx] = el; }}
                      style={{ display:'none', position:'absolute', left:2, right:2, borderRadius:6, padding:'3px 6px', zIndex:20, pointerEvents:'none', boxShadow:'0 6px 20px rgba(0,0,0,0.18)', opacity:0.9, borderLeftWidth:3, borderLeftStyle:'solid' }}
                    >
                      <div className="g-title" style={{ fontSize:10, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}/>
                      <div className="g-time"  style={{ fontSize:9, opacity:0.7 }}/>
                    </div>

                    {/* Actual events */}
                    {dayEvs.map(ev => {
                      const c       = CMAP[ev.colourId ?? 'blue'] ?? CMAP.blue;
                      const startH  = toH(ev.startAt);
                      const endH    = toH(ev.endAt);
                      const top     = startH * HOUR_H;
                      const height  = Math.max((endH - startH) * HOUR_H, 20);
                      const box     = layout.get(ev.id) ?? { col:0, cols:1 };
                      const pct     = 100 / box.cols;
                      const isSelected = selectedEvent?.id === ev.id;

                      return (
                        <div
                          key={ev.id}
                          data-event-id={ev.id}
                          data-event-block
                          onMouseDown={e => onEventMouseDown(ev, dayIdx, e)}
                          style={{
                            position:'absolute', top, height,
                            left:`calc(${box.col * pct}% + 2px)`,
                            width:`calc(${pct}% - 4px)`,
                            background:c.bg,
                            borderLeft:`3px solid ${c.border}`,
                            borderRadius:6, padding:'3px 6px',
                            cursor:'grab', zIndex:5,
                            outline: isSelected ? `2px solid ${c.border}` : 'none',
                            outlineOffset: 1,
                            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 3.5px ${c.border}` : box.cols > 1 && box.col > 0 ? '0 2px 8px rgba(0,0,0,0.10)' : undefined,
                            display: 'flex', flexDirection: 'column',
                          }}
                        >
                          <div style={{ fontSize:10, fontWeight:700, color:c.border, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>{ev.title}</div>
                          {height > 26 && <div style={{ fontSize:9, color:c.border, opacity:0.7 }}>{fmtH(startH)}</div>}
                          
                          {/* Top Resize Handle */}
                          <div
                            data-native-cursor="ns-resize"
                            onMouseDown={e => onResizeMouseDown(ev, dayIdx, 'top', e)}
                            style={{
                              position: 'absolute', top: 0, left: 0, right: 0, height: 6, zIndex: 6,
                            }}
                          />
                          {/* Bottom Resize Handle */}
                          <div
                            data-native-cursor="ns-resize"
                            onMouseDown={e => onResizeMouseDown(ev, dayIdx, 'bottom', e)}
                            style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, zIndex: 6,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Event detail panel */}
      {selectedEvent && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:299 }} onClick={() => setSelectedEvent(null)}/>
          <EventDetail
            ev={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={() => handleDelete(selectedEvent)}
            onUpdate={handleUpdate}
          />
        </>
      )}

      {/* Create modal */}
      {draft && (
        <CreateModal
          date={days[draft.dayIdx]}
          startH={draft.startH} endH={draft.endH}
          onSave={handleCreate}
          onClose={() => setDraft(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast data={toast} onClose={() => setToast(null)}/>}
    </>
  );
}
