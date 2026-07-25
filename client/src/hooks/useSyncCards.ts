import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import type { CodeCardData } from '../components/CodeCard';

export function useSyncCards(
  socket: Socket | null,
  setCards: React.Dispatch<React.SetStateAction<CodeCardData[]>>
) {
  const moveThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (!socket) return;

    const handleCardMoved = (data: { cardId: string; x: number; y: number }) => {
      setCards(prev =>
        prev.map(c => (c.id === data.cardId ? { ...c, x: data.x, y: data.y } : c))
      );
    };

    const handleCardUpdated = (data: { cardId: string; content: string }) => {
      setCards(prev =>
        prev.map(c => (c.id === data.cardId ? { ...c, rawText: data.content } : c))
      );
    };

    const handleCardNew = (cardObj: any) => {
      setCards(prev => {
        if (prev.some(c => c.id === cardObj.cardId)) return prev;
        return [
          ...prev,
          {
            id: cardObj.cardId,
            filename: cardObj.filename || 'card.ts',
            codeHtml: cardObj.content,
            rawText: cardObj.content,
            x: cardObj.position?.x || 100,
            y: cardObj.position?.y || 100,
            zIndex: cardObj.zIndex || 20,
            isExtra: true,
          },
        ];
      });
    };

    const handleCardDeleted = (data: { cardId: string }) => {
      setCards(prev => prev.filter(c => c.id !== data.cardId));
    };

    socket.on('card-moved', handleCardMoved);
    socket.on('card-updated', handleCardUpdated);
    socket.on('card-new', handleCardNew);
    socket.on('card-deleted', handleCardDeleted);

    return () => {
      socket.off('card-moved', handleCardMoved);
      socket.off('card-updated', handleCardUpdated);
      socket.off('card-new', handleCardNew);
      socket.off('card-deleted', handleCardDeleted);
    };
  }, [socket, setCards]);

  const emitCardMove = (cardId: string, x: number, y: number) => {
    if (!socket || !socket.connected) return;
    const now = performance.now();
    if (now - moveThrottleRef.current > 33) {
      moveThrottleRef.current = now;
      socket.emit('card-move', { cardId, x, y });
    }
  };

  const emitCardAdd = (card: CodeCardData) => {
    if (!socket || !socket.connected) return;
    socket.emit('card-add', {
      cardId: card.id,
      filename: card.filename,
      content: card.rawText,
      position: { x: card.x, y: card.y },
      zIndex: card.zIndex,
    });
  };

  const emitCardUpdate = (cardId: string, content: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('card-update', { cardId, content });
  };

  const emitCardDelete = (cardId: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('card-delete', { cardId });
  };

  return {
    emitCardMove,
    emitCardAdd,
    emitCardUpdate,
    emitCardDelete,
  };
}
