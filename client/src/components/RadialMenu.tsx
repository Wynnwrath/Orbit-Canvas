import React from 'react';
import { Pen, Eraser, Code, Sparkle, Trash } from '@phosphor-icons/react';

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
  const radius = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 105 : 85;
  const clampedX = typeof window !== 'undefined' ? Math.max(radius, Math.min(window.innerWidth - radius, x)) : x;
  const clampedY = typeof window !== 'undefined' ? Math.max(radius, Math.min(window.innerHeight - radius, y)) : y;

  return (
    <div
      id="radial"
      data-od-id="radial-menu"
      className={isOpen ? 'open' : ''}
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      data-x={clampedX}
      data-y={clampedY}
    >
      <div className="ring" />

      <button
        className="radial-btn"
        style={{ '--a': '-90deg', '--i': 0 } as React.CSSProperties}
        data-tool="pen"
        data-label="Draw"
        aria-label="Draw freehand ink"
        type="button"
        onClick={() => onSelectTool('pen', x, y)}
      >
        <Pen size={17} weight="regular" />
      </button>

      <button
        className="radial-btn"
        style={{ '--a': '-18deg', '--i': 1 } as React.CSSProperties}
        data-tool="eraser"
        data-label="Eraser mode"
        aria-label="Delete strokes and cards"
        type="button"
        onClick={() => onSelectTool('eraser', x, y)}
      >
        <Eraser size={17} weight="regular" />
      </button>

      <button
        className="radial-btn"
        style={{ '--a': '54deg', '--i': 2 } as React.CSSProperties}
        data-tool="code"
        data-label="Code card"
        aria-label="Drop Code Card"
        type="button"
        onClick={() => onSelectTool('code', x, y)}
      >
        <Code size={17} weight="regular" />
      </button>

      <button
        className="radial-btn"
        style={{ '--a': '126deg', '--i': 3 } as React.CSSProperties}
        data-tool="lasso"
        data-label="AI Tutor lasso"
        aria-label="AI Tutor Lasso Selection"
        type="button"
        onClick={() => onSelectTool('lasso', x, y)}
      >
        <Sparkle size={17} weight="regular" />
      </button>

      <button
        className="radial-btn"
        style={{ '--a': '198deg', '--i': 4 } as React.CSSProperties}
        data-tool="trash"
        data-label="Clear All"
        aria-label="Clear spatial canvas"
        type="button"
        onClick={() => onSelectTool('trash', x, y)}
      >
        <Trash size={17} weight="regular" />
      </button>
    </div>
  );
};
