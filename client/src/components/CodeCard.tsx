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
  onToast: (msg: string) => void;
}

export const CodeCard: React.FC<CodeCardProps> = ({ card, onGrab, onMove, onCodeChange, onToast }) => {
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

  // Universal pointer-down drag handler from anywhere on the card body
  const handlePointerDownCard = (e: React.PointerEvent<HTMLDivElement>) => {
    // Prevent drag if clicking inside buttons or if currently editing
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    if (isEditing) return;
    if (!cardRef.current) return;

    onGrab(card.id);

    const targetElem = e.currentTarget;
    const pointerId = e.pointerId;

    const rect = cardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handlePointerMove = (ev: PointerEvent) => {
      const newX = ev.clientX - offsetX;
      const newY = ev.clientY - offsetY;
      if (cardRef.current) {
        cardRef.current.style.left = `${newX}px`;
        cardRef.current.style.top = `${newY}px`;
      }
      onMove(card.id, newX, newY);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      try {
        if (targetElem && targetElem.hasPointerCapture(ev.pointerId)) {
          targetElem.releasePointerCapture(ev.pointerId);
        }
      } catch (_err) {
        // ignore
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    try {
      targetElem.setPointerCapture(pointerId);
    } catch (_err) {
      // ignore
    }

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
    }
  };

  const highlightedHtml = highlightCode(card.rawText);

  return (
    <div
      ref={cardRef}
      className="code-card"
      id={card.id}
      data-extra={card.isExtra ? '' : undefined}
      data-od-id={card.isExtra ? 'code-card-extra' : 'code-card-component'}
      onPointerDown={handlePointerDownCard}
      style={{
        left: `${card.x}px`,
        top: `${card.y}px`,
        zIndex: card.zIndex,
        width: `${calculatedWidth}px`,
        cursor: isEditing ? 'default' : 'grab',
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
        <button className="copybtn" data-copy type="button" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Card Body — Double-Click to Edit & Syntax Color Coded */}
      <div className="card-body-editor" style={{ position: 'relative' }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={card.rawText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDownTextarea}
            onBlur={() => setIsEditing(false)}
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
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit code"
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
              cursor: 'pointer',
              userSelect: 'text',
            }}
          />
        )}
      </div>
    </div>
  );
};
