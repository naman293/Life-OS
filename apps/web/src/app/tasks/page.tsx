'use client';

import { useState, useRef } from 'react';
import { useTasks, useUpdateTask, useDeleteTask, useMoveTask, Task } from '@/hooks/useTasks';
import { List, LayoutGrid, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { DatePicker } from '@/components/DatePicker';

const STATUS_COLS: { id: Task['status']; label: string; colour: string }[] = [
  { id: 'TODO',        label: 'To Do',      colour: '#A8D8B9' },
  { id: 'IN_PROGRESS', label: 'In Progress', colour: '#F3D76A' },
  { id: 'DONE',        label: 'Done',        colour: '#ADC4EC' },
];

const PRIORITY_COLOUR: Record<string, string> = { HIGH: '#F5A6A6', MEDIUM: '#F3D76A', LOW: '#A8D8B9' };

const fmt = (dateStr?: string | null) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—';

const toLocalYYYYMMDD = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ── Inline-editable cell ──────────────────────────────────────────
function EditableCell({ value, placeholder, onSave, type = 'text', displayValue }: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
  type?: 'text' | 'date';
  displayValue?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          onBlur={save}
          style={{
            border: '2px solid var(--text-0)',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            background: 'var(--bg-2)',
            color: 'var(--text-0)',
            outline: 'none',
            width: type === 'date' ? 130 : 100,
          }}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); save(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: 2 }}
        >
          <Check size={12} />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); cancel(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 2 }}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 4px',
        borderRadius: 4,
        color: value ? 'var(--text-0)' : 'var(--text-2)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.15s',
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-1)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
      title={`Edit ${placeholder}`}
    >
      {(displayValue ?? value) || <span style={{ fontStyle: 'italic' }}>{placeholder}</span>}
      <Pencil size={10} style={{ opacity: 0.4 }} />
    </button>
  );
}

// ── Single task row ───────────────────────────────────────────────
function TaskRow({ task, onUpdate, onDelete }: {
  task: Task;
  onUpdate: (id: string, patch: Partial<Task>) => Promise<Task>;
  onDelete: (id: string) => Promise<void>;
}) {
  const categoryValue = task.tags[0] ?? '';
  const dueDateValue = toLocalYYYYMMDD(task.dueAt);

  const saveCategory = (val: string) => {
    const tags = val.trim() ? [val.trim()] : [];
    onUpdate(task.id, { tags });
  };

  const saveDueDate = (val: string | null) => {
    const dueAt = val ? new Date(`${val}T00:00:00`).toISOString() : null;
    onUpdate(task.id, { dueAt });
  };

  return (
    <tr className={task.status === 'DONE' ? 'task-row-done' : ''}>
      <td>
        <button
          className={`task-checkbox ${task.status === 'DONE' ? 'done' : ''}`}
          onClick={() => onUpdate(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
          aria-label={task.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
        />
      </td>
      <td>
        <span className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>{task.title}</span>
      </td>
      <td>
        <EditableCell
          value={categoryValue}
          placeholder="add tag"
          onSave={saveCategory}
        />
      </td>
      <td>
        <DatePicker
          value={dueDateValue}
          onChange={saveDueDate}
          placeholder="Set date"
        />
      </td>
      <td>
        <select
          style={{
            padding: '6px 10px',
            fontSize: 'var(--text-xs)',
            width: '100%',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            background: task.priority ? PRIORITY_COLOUR[task.priority] : 'var(--bg-2)',
            border: '2px solid var(--text-0)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-0)',
            boxShadow: '2px 2px 0 var(--text-0)',
            transition: 'all 0.1s',
            appearance: 'none',
            textAlign: 'center'
          }}
          value={task.priority ?? ''}
          onChange={(e) => onUpdate(task.id, { priority: (e.target.value as Task['priority']) || null })}
          aria-label={`Priority for ${task.title}`}
        >
          <option value="">NONE</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
      </td>
      <td>
        <select
          style={{
            padding: '6px 10px',
            fontSize: 'var(--text-xs)',
            width: '100%',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            background: 'var(--bg-2)',
            border: '2px solid var(--text-0)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-0)',
            boxShadow: '2px 2px 0 var(--text-0)',
            transition: 'all 0.1s',
            appearance: 'none',
            textAlign: 'center'
          }}
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value as Task['status'] })}
          aria-label={`Status for ${task.title}`}
        >
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN WORK</option>
          <option value="DONE">DONE</option>
        </select>
      </td>
      <td>
        <button
          className="icon-btn"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete "${task.title}"`}
          style={{ color: 'var(--text-2)' }}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

type Filter = 'all' | 'today' | 'upcoming' | 'done';

export default function TasksPage() {
  const [view, setView]       = useState<'table' | 'kanban'>('table');
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');

  const { tasks, isLoading } = useTasks({
    status: filter === 'done' ? 'DONE' : undefined,
    due:    filter === 'today' ? 'today' : filter === 'upcoming' ? 'upcoming' : undefined,
    search: search || undefined,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const moveTask   = useMoveTask();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as Task['status'];
    const taskId    = result.draggableId;
    const task      = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      await moveTask(taskId, newStatus);
    }
  };


  return (
    <div className="page-content">
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div className="tabs">
          {(['all', 'today', 'upcoming', 'done'] as Filter[]).map((f) => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <input
          className="form-input"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
          aria-label="Search tasks"
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={`icon-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')} aria-label="Table view" aria-pressed={view === 'table'}>
            <List size={18} />
          </button>
          <button className={`icon-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')} aria-label="Kanban view" aria-pressed={view === 'kanban'}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        </div>
      )}

      {tasks.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-2)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>📋</div>
          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 4 }}>No tasks yet</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>Hit "Quick Add" in the top bar to create your first task</div>
        </div>
      )}

      {view === 'table' && tasks.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="task-table" aria-label="Tasks list">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Title</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}


      {view === 'kanban' && tasks.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {STATUS_COLS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="kanban-col-header">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.colour, flexShrink: 0 }} />
                    <span>{col.label}</span>
                    <span className="chip" style={{ background: col.colour + '44', fontSize: 'var(--text-xs)', marginLeft: 'auto' }}>{colTasks.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-drop-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      >
                        {colTasks.map((task, idx) => (
                          <Draggable key={task.id} draggableId={task.id} index={idx}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`kanban-card ${snap.isDragging ? 'dragging' : ''}`}
                              >
                                <div className="kanban-card-title">{task.title}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                                  {task.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="chip chip-blue" style={{ fontSize: 10 }}>{tag}</span>
                                  ))}
                                  {task.priority && (
                                    <span className="chip" style={{ background: PRIORITY_COLOUR[task.priority] + '55', fontSize: 10 }}>
                                      {task.priority.toLowerCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
