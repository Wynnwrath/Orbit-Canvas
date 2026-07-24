import React, { useRef } from 'react';

interface DragPosition {
  x: number;
  y: number;
}

export function useDraggable(
  initialPos: DragPosition,
  onPosChange?: (pos: DragPosition) => void,
  onGrab?: () => void
) {
  const positionRef = useRef<DragPosition>(initialPos);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLElement>,
    cardElement: HTMLElement | null
  ) => {
    if (!cardElement) return;

    // Don't drag if clicking buttons or inputs
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;

    onGrab?.();

    const targetElem = e.currentTarget;
    const pointerId = e.pointerId;

    const rect = cardElement.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handlePointerMove = (ev: PointerEvent) => {
      const newX = ev.clientX - offsetX;
      const newY = ev.clientY - offsetY;
      positionRef.current = { x: newX, y: newY };
      cardElement.style.left = `${newX}px`;
      cardElement.style.top = `${newY}px`;
      onPosChange?.({ x: newX, y: newY });
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

  return {
    positionRef,
    handlePointerDown,
  };
}
