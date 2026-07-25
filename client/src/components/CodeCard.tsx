import React, { useRef, useState, useEffect } from 'react';
import { highlightCode } from '../utils/codeHighlighter';

export interface CodeCardData {
  id: string;
  filename: string;
  codeHtml?: React.ReactNode;
  rawText: string;
  x: number;
  y: number;
  zIndex: number;
  isExtra?: boolean;
}

interface CodeCardProps {
  card: CodeCardData;
  onGrab: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCodeChange?: (id: string, newText: string) => void;
  onDelete?: (id: string) => void;
  onToast: (msg: string) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  mode?: string;
}

export const CodeCard: React.FC<CodeCardProps> = ({
  card,
  onGrab,
  onMove,
  onCodeChange,
  onDelete,
  onToast,
  zoom = 1,
  pan = { x: 0, y: 0 },
  mode = 'idle',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Focus textarea when entering edit mode & auto-adjust height
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      const computedHeight = Math.max(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${computedHeight}px`;
    }
  }, [isEditing, card.rawText]);

  // Calculate dynamic card width based on longest line of text
  const lines = card.rawText.split('\n');
  const longestLineCharCount = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const calculatedWidth = Math.min(Math.max(longestLineCharCount * 8 + 48, 340), 680);

  // Universal pointer-down drag handler taking canvas zoom and pan into account
  const handlePointerDownCard = (e: React.PointerEvent<HTMLDivElement>) => {
    // If in eraser mode, clicking the card deletes it immediately
    if (mode === 'eraser' && onDelete) {
      onDelete(card.id);
      return;
    }

    // Prevent drag if clicking inside buttons or if currently editing
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    if (isEditing) return;
    if (!cardRef.current) return;

    onGrab(card.id);

    // Convert mouse screen coordinates to parent canvas coordinate space
    const startCanvasX = (e.clientX - pan.x) / zoom;
    const startCanvasY = (e.clientY - pan.y) / zoom;
    const offsetX = startCanvasX - card.x;
    const offsetY = startCanvasY - card.y;
    let isDragging = false;

    const handlePointerMove = (ev: PointerEvent) => {
      const curCanvasX = (ev.clientX - pan.x) / zoom;
      const curCanvasY = (ev.clientY - pan.y) / zoom;
      const dist = Math.hypot(curCanvasX - startCanvasX, curCanvasY - startCanvasY);
      if (!isDragging && dist > 2) {
        isDragging = true;
      }
      if (isDragging && cardRef.current) {
        const newX = curCanvasX - offsetX;
        const newY = curCanvasY - offsetY;
        cardRef.current.style.left = `${newX}px`;
        cardRef.current.style.top = `${newY}px`;
        onMove(card.id, newX, newY);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(card.rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } else {
        onToast('Copied code to clipboard');
      }
    } catch (_err) {
      onToast('Press Ctrl+C to copy code');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (onCodeChange) {
      onCodeChange(card.id, val);
    }
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsEditing(false);
      onToast('Code card saved to cloud');
    }
  };

  const toggleEditing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isEditing) {
      setIsEditing(false);
      onToast('Code card saved to cloud');
    } else {
      setIsEditing(true);
    }
  };

  const handleDeleteCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(card.id);
    }
  };

  const highlightedHtml = highlightCode(card.rawText);

  return (
    <div
      ref={cardRef}
      className={`code-card ${mode === 'eraser' ? 'eraser-hover-target' : ''}`}
      id={card.id}
      data-extra={card.isExtra ? '' : undefined}
      data-od-id={card.isExtra ? 'code-card-extra' : 'code-card-component'}
      onPointerDown={handlePointerDownCard}
      style={{
        left: `${card.x}px`,
        top: `${card.y}px`,
        zIndex: card.zIndex,
        width: `${calculatedWidth}px`,
        cursor: isEditing ? 'default' : mode === 'eraser' ? 'pointer' : 'grab',
      }}
      onClick={() => onGrab(card.id)}
    >
      {/* Card Header Bar */}
      <div className="card-head">
        <div className="dots">
          <i className="dr" />
          <i className="dy" />
          <i className="dg" />
        </div>
        <span className="fname">{card.filename}</span>
        <span
          title="Synced & saved to cloud"
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: 'rgba(255,255,255,0.04)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.06)',
            lineHeight: 1,
            marginLeft: '4px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          Cloud Saved
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="copybtn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleEditing}
            style={{
              borderColor: isEditing ? 'var(--accent-border)' : 'var(--border)',
              color: isEditing ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
          <button
            className="copybtn"
            data-copy
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onDelete && (
            <button
              className="card-delete-btn"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDeleteCard}
              title="Delete Code Snippet"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Card Body — Double-Click or Click Edit Button to Rewrite */}
      <div className="card-body-editor" style={{ position: 'relative' }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={card.rawText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDownTextarea}
            onBlur={() => setIsEditing(false)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Paste or type code here..."
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '120px',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              lineHeight: '1.6',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '12px 14px',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          />
        ) : (
          <pre
            onDoubleClick={toggleEditing}
            title="Double-click or click Edit in header to rewrite code"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            style={{
              margin: 0,
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              color: 'var(--ink)',
              minHeight: '120px',
              cursor: mode === 'eraser' ? 'pointer' : 'pointer',
              userSelect: 'text',
            }}
          />
        )}
      </div>
    </div>
  );
};
