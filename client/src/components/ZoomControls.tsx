import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const percentStr = `${Math.round(zoom * 100)}%`;

  return (
    <div
      className="zoom-controls"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999,
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
        title="Reset Zoom (100%)"
        aria-label="Reset Zoom"
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
        }}
      >
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
  );
};
