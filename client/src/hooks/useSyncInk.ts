import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { InkStroke } from '../components/InkLayer';
import type { CodeCardData } from '../components/CodeCard';
import type { StickyData } from '../components/AISticky';

export function useSyncInk(
  socket: Socket | null,
  setStrokes: React.Dispatch<React.SetStateAction<InkStroke[]>>,
  setCards: React.Dispatch<React.SetStateAction<CodeCardData[]>>,
  setStickies: React.Dispatch<React.SetStateAction<StickyData[]>>,
) {
  useEffect(() => {
    if (!socket) return;

    const handleRoomState = (data: { strokes: any[] }) => {
      if (data?.strokes && data.strokes.length > 0) {
        setStrokes(
          data.strokes.map((s: any) => ({
            id: s.strokeId,
            d: s.pathData,
            color: s.color,
            strokeWidth: s.width,
          }))
        );
      }
    };

    const handleStrokeNew = (s: any) => {
      setStrokes(prev => [
        ...prev,
        {
          id: s.strokeId,
          d: s.pathData,
          color: s.color,
          strokeWidth: s.width,
        },
      ]);
    };

    const handleStrokeDeleted = (data: { strokeId: string }) => {
      setStrokes(prev => prev.filter(s => s.id !== data.strokeId));
    };

    const handleCanvasCleared = () => {
      setStrokes([]);
      setCards([]);
      setStickies([]);
    };

    socket.on('room-state', handleRoomState);
    socket.on('stroke-new', handleStrokeNew);
    socket.on('stroke-deleted', handleStrokeDeleted);
    socket.on('canvas-cleared', handleCanvasCleared);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('stroke-new', handleStrokeNew);
      socket.off('stroke-deleted', handleStrokeDeleted);
      socket.off('canvas-cleared', handleCanvasCleared);
    };
  }, [socket, setStrokes, setCards, setStickies]);

  const emitStrokeAdd = (stroke: InkStroke) => {
    if (!socket || !socket.connected) return;
    socket.emit('stroke-add', {
      strokeId: stroke.id,
      pathData: stroke.d,
      color: stroke.color,
      width: stroke.strokeWidth,
    });
  };

  const emitStrokeDelete = (strokeId: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('stroke-delete', { strokeId });
  };

  const emitClearCanvas = () => {
    if (!socket || !socket.connected) return;
    socket.emit('canvas-clear');
  };

  return {
    emitStrokeAdd,
    emitStrokeDelete,
    emitClearCanvas,
  };
}
