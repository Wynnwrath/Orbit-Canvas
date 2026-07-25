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
  currentColor?: string;
  currentWidth?: number;
  mode?: string;
  onDeleteStroke?: (strokeId: string) => void;
}

export const InkLayer: React.FC<InkLayerProps> = ({
  strokes,
  currentStrokeD,
  currentColor = '#f4f4f5',
  currentWidth = 2.5,
  mode = 'idle',
  onDeleteStroke,
}) => {
  const isEraser = mode === 'eraser';

  const handleStrokeClick = (e: React.PointerEvent, strokeId: string) => {
    if (isEraser && onDeleteStroke) {
      e.stopPropagation();
      onDeleteStroke(strokeId);
    }
  };

  const handleStrokePointerOver = (e: React.PointerEvent, strokeId: string) => {
    // If dragging with pointer down in eraser mode
    if (isEraser && onDeleteStroke && e.buttons === 1) {
      e.stopPropagation();
      onDeleteStroke(strokeId);
    }
  };

  return (
    <svg
      id="ink"
      data-od-id="ink-layer"
      style={{
        pointerEvents: isEraser ? 'auto' : 'none',
      }}
    >
      {strokes.map((s) => (
        <path
          key={s.id}
          d={s.d}
          fill="none"
          stroke={s.color || 'rgba(244,244,245,.9)'}
          strokeWidth={s.strokeWidth || 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            pointerEvents: isEraser ? 'stroke' : 'none',
            cursor: isEraser ? 'pointer' : 'default',
          }}
          className={isEraser ? 'ink-stroke-eraser-target' : undefined}
          onPointerDown={(e) => handleStrokeClick(e, s.id)}
          onPointerOver={(e) => handleStrokePointerOver(e, s.id)}
        />
      ))}

      {currentStrokeD && (
        <path
          d={currentStrokeD}
          fill="none"
          stroke={currentColor}
          strokeWidth={currentWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={currentWidth > 12 ? 0.45 : 1}
        />
      )}
    </svg>
  );
};
