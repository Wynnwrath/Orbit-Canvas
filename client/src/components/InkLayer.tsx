import React from 'react';

export interface InkStroke {
  id: string;
  d: string;
  color?: string;
  strokeWidth?: number;
}

interface InkLayerProps {
  strokes: InkStroke[];
  currentStrokeD?: string;
}

export const InkLayer: React.FC<InkLayerProps> = ({ strokes, currentStrokeD }) => {
  return (
    <svg id="ink" data-od-id="ink-layer">
      {strokes.map(s => (
        <path
          key={s.id}
          d={s.d}
          fill="none"
          stroke={s.color || 'rgba(244,244,245,.9)'}
          strokeWidth={s.strokeWidth || 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {currentStrokeD && (
        <path
          d={currentStrokeD}
          fill="none"
          stroke="rgba(244,244,245,.9)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
