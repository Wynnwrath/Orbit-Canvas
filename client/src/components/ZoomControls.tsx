import React from 'react';
import { Minus, Plus, Crosshair } from '@phosphor-icons/react';

interface ZoomControlsProps {
  zoom: number;
  pan?: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  pan = { x: 0, y: 0 },
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const percentStr = `${Math.round(zoom * 100)}%`;

  return (
    <div
      className="zoom-controls-wrapper"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        className="coord-badge glass-medium"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          letterSpacing: '0.04em',
        }}
      >
        X: {Math.round(-pan.x)} Y: {Math.round(-pan.y)}
      </div>

      <div
        className="zoom-controls glass-medium"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderRadius: 'var(--radius-md)',
          padding: '4px 6px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)',
        }}
      >
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          <Minus size={14} weight="bold" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          title="Center & Reset View (100%)"
          aria-label="Reset Zoom and Center Canvas"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--faint)',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            padding: '0 6px',
            height: '28px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Crosshair size={11} weight="regular" />
          {percentStr}
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};
