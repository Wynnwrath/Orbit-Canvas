import React from 'react';

interface CanvasScopeBoundaryProps {
  width?: number;
  height?: number;
}

export const CanvasScopeBoundary: React.FC<CanvasScopeBoundaryProps> = ({
  width = 3600,
  height = 2400,
}) => {
  const minX = -400;
  const minY = -200;

  return (
    <div
      className="canvas-scope-boundary"
      data-od-id="canvas-scope-boundary"
      style={{
        position: 'absolute',
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
      }}
    >
      {/* Outer subtle glowing boundary line */}
      <div className="scope-frame-border" />

      {/* Scope corner accents */}
      <div className="scope-corner top-left" />
      <div className="scope-corner top-right" />
      <div className="scope-corner bottom-left" />
      <div className="scope-corner bottom-right" />

      {/* Scope Domain Label Header */}
      <div className="scope-label-badge" style={{ left: '16px', top: '16px' }}>
        <span className="scope-dot-indicator" />
        SPATIAL WORKSPACE · {width} × {height} PX
      </div>
    </div>
  );
};
