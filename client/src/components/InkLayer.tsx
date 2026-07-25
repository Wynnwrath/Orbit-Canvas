import React from 'react';

export interface InkStroke {
  id: string;
  d: string;
  color?: string;
  strokeWidth?: number;
  x?: number;
  y?: number;
}

interface InkLayerProps {
  strokes: InkStroke[];
  currentStrokeD?: string;
  currentColor?: string;
  currentWidth?: number;
  mode?: string;
  zoom?: number;
  onDeleteStroke?: (strokeId: string) => void;
  onMoveStrokeStart?: () => void;
  onMoveStroke?: (strokeId: string, x: number, y: number) => void;
}

export const InkLayer: React.FC<InkLayerProps> = ({
  strokes,
  currentStrokeD,
  currentColor = '#f4f4f5',
  currentWidth = 2.5,
  mode = 'idle',
  zoom = 1,
  onDeleteStroke,
  onMoveStrokeStart,
  onMoveStroke,
}) => {
  const isEraser = mode === 'eraser';
  const isSelectOrIdle = mode === 'idle' || mode === 'select';

  const handleStrokePointerDown = (e: React.PointerEvent<SVGPathElement>, stroke: InkStroke) => {
    if (isEraser && onDeleteStroke) {
      e.stopPropagation();
      onDeleteStroke(stroke.id);
      return;
    }

    if (isSelectOrIdle && onMoveStroke) {
      e.stopPropagation();
      onMoveStrokeStart?.();

      const targetElem = e.currentTarget;
      if (targetElem.setPointerCapture) {
        try {
          targetElem.setPointerCapture(e.pointerId);
        } catch (_err) {
          // ignore
        }
      }

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const initialX = stroke.x || 0;
      const initialY = stroke.y || 0;

      const handleMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startClientX) / zoom;
        const dy = (ev.clientY - startClientY) / zoom;
        onMoveStroke(stroke.id, initialX + dx, initialY + dy);
      };

      const handleUp = (ev: PointerEvent) => {
        if (targetElem.releasePointerCapture) {
          try {
            targetElem.releasePointerCapture(ev.pointerId);
          } catch (_err) {
            // ignore
          }
        }
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
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
        pointerEvents: isEraser || isSelectOrIdle ? 'auto' : 'none',
      }}
    >
      {strokes.map((s) => (
        <path
          key={s.id}
          d={s.d}
          transform={`translate(${s.x || 0}, ${s.y || 0})`}
          fill="none"
          stroke={s.color || 'rgba(244,244,245,.9)'}
          strokeWidth={s.strokeWidth || 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            pointerEvents: isEraser || isSelectOrIdle ? 'stroke' : 'none',
            cursor: isEraser ? 'pointer' : isSelectOrIdle ? 'grab' : 'default',
          }}
          className={isEraser ? 'ink-stroke-eraser-target' : undefined}
          onPointerDown={(e) => handleStrokePointerDown(e, s)}
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
