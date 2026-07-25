import React from 'react';

export type RadialTool = 'pen' | 'eraser' | 'code' | 'lasso' | 'trash';

interface RadialMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onSelectTool: (tool: RadialTool, x: number, y: number) => void;
  onClose: () => void;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({
  isOpen,
  x,
  y,
  onSelectTool,
}) => {
  return (
    <div
      id="radial"
      data-od-id="radial-menu"
      className={isOpen ? 'open' : ''}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      data-x={x}
      data-y={y}
    >
      <div className="ring" />

      {/* Pen / Draw */}
      <button
        className="radial-btn"
        style={{ '--a': '-90deg', '--i': 0 } as React.CSSProperties}
        data-tool="pen"
        data-label="Draw"
        aria-label="Draw freehand ink"
        type="button"
        onClick={() => onSelectTool('pen', x, y)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {/* Eraser / Delete */}
      <button
        className="radial-btn"
        style={{ '--a': '-18deg', '--i': 1 } as React.CSSProperties}
        data-tool="eraser"
        data-label="Eraser mode"
        aria-label="Delete strokes and cards"
        type="button"
        onClick={() => onSelectTool('eraser', x, y)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
          <path d="M22 21H7" />
          <path d="m5 11 9 9" />
        </svg>
      </button>

      {/* Code Card */}
      <button
        className="radial-btn"
        style={{ '--a': '54deg', '--i': 2 } as React.CSSProperties}
        data-tool="code"
        data-label="Code card"
        aria-label="Drop Code Card"
        type="button"
        onClick={() => onSelectTool('code', x, y)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </button>

      {/* AI Tutor Lasso */}
      <button
        className="radial-btn"
        style={{ '--a': '126deg', '--i': 3 } as React.CSSProperties}
        data-tool="lasso"
        data-label="AI Tutor lasso"
        aria-label="AI Tutor Lasso Selection"
        type="button"
        onClick={() => onSelectTool('lasso', x, y)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
        </svg>
      </button>

      {/* Clear Canvas */}
      <button
        className="radial-btn"
        style={{ '--a': '198deg', '--i': 4 } as React.CSSProperties}
        data-tool="trash"
        data-label="Clear All"
        aria-label="Clear spatial canvas"
        type="button"
        onClick={() => onSelectTool('trash', x, y)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
};
