import React, { useRef, useState, useEffect } from 'react';

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

  // Dynamic Height calculation based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const computedHeight = Math.max(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${computedHeight}px`;
    }
  }, [card.rawText]);

  // Calculate dynamic card width based on longest line of text
  const lines = card.rawText.split('\n');
  const longestLineCharCount = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const calculatedWidth = Math.min(Math.max(longestLineCharCount * 8 + 48, 360), 650);

  const handlePointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
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

  return (
    <div
      ref={cardRef}
      className="code-card"
      id={card.id}
      data-extra={card.isExtra ? '' : undefined}
      data-od-id={card.isExtra ? 'code-card-extra' : 'code-card-component'}
      style={{
        left: `${card.x}px`,
        top: `${card.y}px`,
        zIndex: card.zIndex,
        width: `${calculatedWidth}px`,
      }}
      onClick={() => onGrab(card.id)}
    >
      <div className="card-head" onPointerDown={handlePointerDownHeader}>
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
      <div className="card-body-editor" style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={card.rawText}
          onChange={handleTextChange}
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
      </div>
    </div>
  );
};
