'use client';

import { useState, useRef, useEffect } from 'react';
import { useAddInboxItem } from '@/hooks/useInbox';
import { Sparkles, Loader2 } from 'lucide-react';

export function BrainDumpModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addInboxItem = useAddInboxItem();

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    
    setLoading(true);
    try {
      await addInboxItem(content);
      onClose();
    } catch (err) {
      console.error('Failed to capture thought:', err);
      // Optional: Add a shake animation or simple error toast here
    } finally {
      setLoading(false);
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
        alignItems: 'flex-start',
        paddingTop: '15vh',
        zIndex: 9999
      }}
    >
      <form 
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-0)',
          borderRadius: 24,
          border: '4px solid #121210',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '24px 32px',
          gap: 16
        }}>
          {loading ? (
            <Loader2 size={32} className="lucide-spin" style={{ color: 'var(--accent-yellow)', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Sparkles size={32} style={{ color: 'var(--accent-yellow)' }} />
          )}
          <input
            ref={inputRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-sans)',
              caretColor: 'var(--accent-yellow)'
            }}
          />
        </div>
        
        <div style={{
          background: 'var(--bg-1)',
          padding: '12px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '2px solid var(--border-0)',
          fontSize: '0.8rem',
          color: 'var(--text-3)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          <span>Capture raw thoughts</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <span><kbd style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-2)' }}>ESC</kbd> dismiss</span>
            <span><kbd style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-2)' }}>ENTER</kbd> save</span>
          </div>
        </div>
      </form>
    </div>
  );
}
