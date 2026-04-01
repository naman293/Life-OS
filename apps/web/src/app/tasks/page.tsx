'use client';

import { useState } from 'react';
import { useTasks, useUpdateTask, useDeleteTask, useMoveTask, Task } from '@/hooks/useTasks';
import { List, LayoutGrid, Trash2, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const STATUS_COLS: { id: Task['status']; label: string; colour: string }[] = [
  { id: 'TODO',        label: 'To Do',      colour: '#A8D8B9' },
  { id: 'IN_PROGRESS', label: 'In Progress', colour: '#F3D76A' },
  { id: 'DONE',        label: 'Done',        colour: '#ADC4EC' },
];

const PRIORITY_COLOUR: Record<string, string> = { HIGH: '#F5A6A6', MEDIUM: '#F3D76A', LOW: '#A8D8B9' };

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

  const fmt = (dateStr?: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—';

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
                <tr key={task.id} className={task.status === 'DONE' ? 'task-row-done' : ''}>
                  <td>
                    <button
                      className={`task-checkbox ${task.status === 'DONE' ? 'done' : ''}`}
                      onClick={() => updateTask(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
                      aria-label={task.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
                    />
                  </td>
                  <td>
                    <span className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>{task.title}</span>
                  </td>
                  <td>
                    {task.tags.length > 0 ? (
                      <span className="chip chip-blue" style={{ fontSize: 'var(--text-xs)' }}>{task.tags[0]}</span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{fmt(task.dueAt)}</td>
                  <td>
                    {task.priority ? (
                      <span className="chip" style={{ background: PRIORITY_COLOUR[task.priority] + '55', fontSize: 'var(--text-xs)' }}>
                        {task.priority.toLowerCase()}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', width: 'auto' }}
                      value={task.status}
                      onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                      aria-label={`Status for ${task.title}`}
                    >
                      <option value="TODO">todo</option>
                      <option value="IN_PROGRESS">in progress</option>
                      <option value="DONE">done</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      style={{ color: 'var(--text-2)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
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
