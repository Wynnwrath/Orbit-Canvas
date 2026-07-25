import React, { useRef } from 'react';

export interface StickyData {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  title: string;
  bodyHtml: React.ReactNode;
  tip?: string;
}

interface AIStickyProps {
  sticky: StickyData;
  onDismiss: (id: string) => void;
  onGrab: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  zoom?: number;
  pan?: { x: number; y: number };
}

export const AISticky: React.FC<AIStickyProps> = ({
  sticky,
  onDismiss,
  onGrab,
  onMove,
  zoom = 1,
  pan = { x: 0, y: 0 },
}) => {
  const stickyRef = useRef<HTMLDivElement>(null);

  const handlePointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!stickyRef.current) return;

    onGrab(sticky.id);

    const targetElem = e.currentTarget;
    const pointerId = e.pointerId;

    const startCanvasX = (e.clientX - pan.x) / zoom;
    const startCanvasY = (e.clientY - pan.y) / zoom;
    const offsetX = startCanvasX - sticky.x;
    const offsetY = startCanvasY - sticky.y;

    const handlePointerMove = (ev: PointerEvent) => {
      const curCanvasX = (ev.clientX - pan.x) / zoom;
      const curCanvasY = (ev.clientY - pan.y) / zoom;
      const newX = curCanvasX - offsetX;
      const newY = curCanvasY - offsetY;

      if (stickyRef.current) {
        stickyRef.current.style.left = `${newX}px`;
        stickyRef.current.style.top = `${newY}px`;
      }
      onMove(sticky.id, newX, newY);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      try {
        if (targetElem && targetElem.hasPointerCapture(ev.pointerId)) {
          targetElem.releasePointerCapture(ev.pointerId);
        }
      } catch (_err) {
        // ignore
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    try {
      targetElem.setPointerCapture(pointerId);
    } catch (_err) {
      // ignore
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div
      ref={stickyRef}
      className="sticky"
      data-od-id="ai-sticky"
      style={{
        left: `${sticky.x}px`,
        top: `${sticky.y}px`,
        zIndex: sticky.zIndex,
      }}
    >
      <div className="sticky-head" onPointerDown={handlePointerDownHeader}>
        <span className="badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8L12 2Z" />
          </svg>
          SMART TUTOR
        </span>
        <button
          className="close"
          aria-label="Dismiss"
          type="button"
          onClick={() => onDismiss(sticky.id)}
        >
          ×
        </button>
      </div>
      <div className="sticky-body">
        {typeof sticky.bodyHtml === 'string' ? (
          <div dangerouslySetInnerHTML={{ __html: sticky.bodyHtml }} />
        ) : (
          sticky.bodyHtml
        )}
        {sticky.tip && <span className="tip">Tip: {sticky.tip}</span>}
      </div>
    </div>
  );
};
