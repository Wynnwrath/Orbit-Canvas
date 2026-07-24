import React from 'react';

export interface LassoRect {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  analyzing: boolean;
}

interface AILassoProps {
  rect: LassoRect;
}

export const AILasso: React.FC<AILassoProps> = ({ rect }) => {
  if (!rect.visible) return null;

  return (
    <div
      id="lasso"
      data-od-id="ai-lasso"
      className={rect.analyzing ? 'analyzing' : ''}
      style={{
        display: 'block',
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`,
      }}
    >
      <span className="ai-label">
        <span className="spin" />
        AI Analyzing…
      </span>
    </div>
  );
};
