'use client';

import { useState } from 'react';
import { useInbox, useDeleteInboxItem } from '@/hooks/useInbox';
import { useSWRConfig } from 'swr';
import { Loader2, Trash2, ArrowRight, Tag, Calendar, Edit3 } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { useCreateTask } from '@/hooks/useTasks';

export function ProcessInboxModal({ onClose }: { onClose: () => void }) {
  const { inboxItems, isLoading } = useInbox();
  const deleteItem = useDeleteInboxItem();
  const createTask = useCreateTask();
  const { mutate } = useSWRConfig();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [itemMetadata, setItemMetadata] = useState<Record<string, { tags: string; dueAt: string | null }>>({});

  const updateMetadata = (id: string, updates: Partial<{ tags: string; dueAt: string | null }>) => {
    setItemMetadata(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { tags: '', dueAt: null }), ...updates }
    }));
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await deleteItem(id);
    } catch {
      // Ignored for now
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvertToTask = async (id: string, content: string) => {
    setProcessingId(id);
    const meta = itemMetadata[id] || { tags: '', dueAt: null };
    try {
      // Create a task
      await createTask({
        title: content,
        priority: 'MEDIUM',
        tags: meta.tags ? [meta.tags.trim()] : [],
        dueAt: meta.dueAt ? new Date(`${meta.dueAt}T00:00:00`).toISOString() : undefined,
        status: 'TODO'
      });

      // Delete the inbox item after converting
      await deleteItem(id);
      
      // Mutate tasks so it updates live
      mutate((key: unknown) => Array.isArray(key) && typeof key[0] === 'string' && key[0].startsWith('/api/tasks'), undefined, { revalidate: true });
    } catch {
      // Ignored for now
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(18, 18, 16, 0.7)',
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        zIndex: 9999
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-0)',
          borderRadius: 24,
          border: '4px solid #121210',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{
          padding: '24px 32px',
          borderBottom: '2px solid var(--border-0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-1)'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Process Inbox</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--bg-2)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              color: 'var(--text-1)'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-0)' }}>
          {isLoading && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 48, color: 'var(--text-1)', fontWeight: 600 }}>
              <Loader2 className="lucide-spin" /> Retrieving your raw thoughts...
            </div>
          )}

          {!isLoading && inboxItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-1)', fontSize: '1.2rem', fontWeight: 700 }}>
              Inbox zero! 🎉<br />
              <span style={{ fontSize: '1rem', color: 'var(--text-2)', fontWeight: 500 }}>Your mind is clear.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {inboxItems.map(item => {
              const meta = itemMetadata[item.id] || { tags: '', dueAt: null };
              return (
                <div 
                  key={item.id} 
                  style={{
                    background: '#f4f4f0',
                    color: '#121210',
                    border: '3px solid #121210',
                    boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '24px',
                    opacity: processingId === item.id ? 0.5 : 1,
                    pointerEvents: processingId === item.id ? 'none' : 'auto',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3 }}>
                    {item.content}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
                    {/* Tag Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-2)', border: '2px solid #121210', borderRadius: 10, padding: '6px 10px', flex: 1 }}>
                      <Tag size={14} style={{ opacity: 0.5 }} />
                      <input 
                        placeholder="Add Category..." 
                        value={meta.tags}
                        onChange={(e) => updateMetadata(item.id, { tags: e.target.value })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          width: '100%',
                          color: '#121210'
                        }}
                      />
                    </div>

                    {/* Date Picker */}
                    <DatePicker 
                      value={meta.dueAt || undefined} 
                      onChange={(date) => updateMetadata(item.id, { dueAt: date })}
                      placeholder="No due date"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: 'transparent',
                        border: '2px dashed #121210',
                        color: '#121210',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Delete Idea"
                    >
                      <Trash2 size={20} />
                    </button>

                    <button
                      onClick={() => handleConvertToTask(item.id, item.content)}
                      style={{
                        background: 'var(--accent-blue)',
                        color: '#121210',
                        border: '2px solid #121210',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '4px 4px 0 #121210',
                        transition: 'transform 0.1s, box-shadow 0.1s'
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translate(2px, 2px)';
                        e.currentTarget.style.boxShadow = '2px 2px 0 #121210';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translate(0px, 0px)';
                        e.currentTarget.style.boxShadow = '4px 4px 0 #121210';
                      }}
                      title="Convert to Task"
                    >
                      Make Task <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
