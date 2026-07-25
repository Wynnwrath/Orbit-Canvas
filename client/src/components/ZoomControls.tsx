import React from 'react';

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
      {/* Position Coordinates Badge */}
      <div
        className="coord-badge"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          background: 'rgba(18, 20, 26, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          letterSpacing: '0.04em',
        }}
      >
        X: {Math.round(-pan.x)} Y: {Math.round(-pan.y)}
      </div>

      {/* Zoom Control Buttons */}
      <div
        className="zoom-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(18, 20, 26, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
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
            fontSize: '16px',
            fontWeight: 600,
            transition: 'background 0.15s ease',
          }}
        >
          −
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
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
            fontSize: '16px',
            fontWeight: 600,
            transition: 'background 0.15s ease',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};
