import { Server, Socket } from 'socket.io';
import { roomStore } from './roomStore.js';
import { Stroke } from '../models/Stroke.js';
import { Card } from '../models/Card.js';
import { Room } from '../models/Room.js';

const RATE_LIMIT_MS = 16; // ~60 messages/sec max per socket

function createRateLimiter() {
  const lastEmit = new Map<string, number>();

  return (socketId: string): boolean => {
    const now = Date.now();
    const last = lastEmit.get(socketId) || 0;
    if (now - last < RATE_LIMIT_MS) return false;
    lastEmit.set(socketId, now);
    return true;
  };
}

export function setupSocketHandlers(io: Server) {
  const rateLimit = createRateLimiter();

  io.on('connection', (socket: Socket) => {
    // Clean up stale entries from previous connections with same socketId
    const ghostUser = roomStore.removeUser(socket.id);

    socket.on('join-room', async (data: { roomCode: string; name: string; userId?: string }) => {
      const roomCode = (data.roomCode || '8F2A').toUpperCase();
      const name = data.name || 'Anonymous';
      const userId = data.userId || `user-${socket.id.slice(0, 5)}`;

      socket.join(roomCode);

      const userColors = ['accent', 'live', 'violet'];
      const currentUsers = roomStore.getRoomUsers(roomCode);
      const color = userColors[currentUsers.length % userColors.length];

      const activeUser = {
        socketId: socket.id,
        userId,
        name,
        color,
        roomCode,
        x: 0,
        y: 0,
      };

      roomStore.addUser(activeUser);

      try {
        await Room.updateOne(
          { code: roomCode },
          { $addToSet: { users: { name, color, socketId: socket.id } } },
          { upsert: true }
        );
      } catch (_dbErr) {
        // ignore fallback
      }

      const roomUsers = roomStore.getRoomUsers(roomCode);
      const roomStrokes = roomStore.getStrokes(roomCode);
      let roomCards = roomStore.getCards(roomCode);

      if (roomCards.length === 0) {
        try {
          const dbCards = await Card.find({ roomCode });
          if (dbCards && dbCards.length > 0) {
            const mappedCards = dbCards.map(c => ({
              cardId: c.cardId,
              roomCode: c.roomCode,
              userId: c.userId,
              type: c.type,
              filename: c.filename,
              content: c.content,
              position: c.position,
              zIndex: c.zIndex,
            }));
            mappedCards.forEach(c => roomStore.addCard(c));
            roomCards = roomStore.getCards(roomCode);
          } else {
            const roomDoc = await Room.findOne({ code: roomCode });
            if (roomDoc?.snapshot?.cards && roomDoc.snapshot.cards.length > 0) {
              const mappedCards = roomDoc.snapshot.cards.map((c: any) => ({
                cardId: c.id,
                roomCode,
                userId: 'cloud-save',
                type: 'code' as const,
                filename: c.filename,
                content: c.rawText || c.content || '',
                position: { x: c.x, y: c.y },
                zIndex: c.zIndex || 20,
              }));
              mappedCards.forEach(c => roomStore.addCard(c));
              roomCards = roomStore.getCards(roomCode);
            }
          }
        } catch (_err) {
          // ignore
        }
      }

      socket.emit('room-state', {
        roomCode,
        users: roomUsers,
        strokes: roomStrokes,
        cards: roomCards,
      });

      socket.to(roomCode).emit('user-joined', {
        socketId: socket.id,
        userId,
        name,
        color,
      });
    });

    // Cursor movement broadcasting
    socket.on('cursor-move', (pos: { x: number; y: number }) => {
      if (!rateLimit(socket.id)) return;
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.updateUserCursor(socket.id, pos.x, pos.y);

      socket.to(user.roomCode).emit('cursor-update', {
        socketId: socket.id,
        userId: user.userId,
        name: user.name,
        color: user.color,
        x: pos.x,
        y: pos.y,
      });
    });

    // Ink stroke additions
    socket.on('stroke-add', async (strokeData: { strokeId: string; pathData: string; color?: string; width?: number; x?: number; y?: number }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      const strokeObj = {
        strokeId: strokeData.strokeId || `stroke-${Date.now()}`,
        roomCode: user.roomCode,
        userId: user.userId,
        pathData: strokeData.pathData,
        color: strokeData.color || 'rgba(244,244,245,.9)',
        width: strokeData.width || 2.5,
        x: strokeData.x || 0,
        y: strokeData.y || 0,
      };

      roomStore.addStroke(strokeObj);

      try {
        await Stroke.create(strokeObj);
      } catch (_err) {
        // ignore DB error
      }

      socket.to(user.roomCode).emit('stroke-new', strokeObj);
    });

    // Ink stroke move sync
    socket.on('stroke-move', async (data: { strokeId: string; x: number; y: number }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.updateStrokePosition(user.roomCode, data.strokeId, data.x, data.y);

      try {
        await Stroke.updateOne(
          { strokeId: data.strokeId, roomCode: user.roomCode },
          { x: data.x, y: data.y }
        );
      } catch (_err) {
        // ignore DB error
      }

      socket.to(user.roomCode).emit('stroke-moved', {
        strokeId: data.strokeId,
        x: data.x,
        y: data.y,
      });
    });

    // Card additions
    socket.on('card-add', async (cardData: any) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      const cardObj = {
        cardId: cardData.cardId || `card-${Date.now()}`,
        roomCode: user.roomCode,
        userId: user.userId,
        type: cardData.type || 'code',
        filename: cardData.filename,
        content: cardData.content || '',
        position: cardData.position || { x: 100, y: 100 },
        zIndex: cardData.zIndex || 20,
      };

      roomStore.addCard(cardObj);

      try {
        await Card.create(cardObj);
      } catch (_err) {
        // ignore DB error
      }

      socket.to(user.roomCode).emit('card-new', cardObj);
    });

    // Card move sync
    socket.on('card-move', async (data: { cardId: string; x: number; y: number }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.updateCardPosition(user.roomCode, data.cardId, data.x, data.y);

      try {
        await Card.updateOne(
          { cardId: data.cardId, roomCode: user.roomCode },
          { position: { x: data.x, y: data.y } }
        );
      } catch (_err) {
        // ignore
      }

      socket.to(user.roomCode).emit('card-moved', {
        cardId: data.cardId,
        x: data.x,
        y: data.y,
      });
    });

    // Card content update sync
    socket.on('card-update', async (data: { cardId: string; content: string }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.updateCardContent(user.roomCode, data.cardId, data.content);

      try {
        await Card.updateOne(
          { cardId: data.cardId, roomCode: user.roomCode },
          { content: data.content }
        );
      } catch (_err) {
        // ignore
      }

      socket.to(user.roomCode).emit('card-updated', {
        cardId: data.cardId,
        content: data.content,
      });
    });

    // Individual stroke deletion
    socket.on('stroke-delete', async (data: { strokeId: string }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.removeStroke(user.roomCode, data.strokeId);

      try {
        await Stroke.deleteOne({ strokeId: data.strokeId, roomCode: user.roomCode });
      } catch (_err) {
        // ignore DB error
      }

      socket.to(user.roomCode).emit('stroke-deleted', { strokeId: data.strokeId });
    });

    // Individual card deletion
    socket.on('card-delete', async (data: { cardId: string }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.removeCard(user.roomCode, data.cardId);

      try {
        await Card.deleteOne({ cardId: data.cardId, roomCode: user.roomCode });
      } catch (_err) {
        // ignore DB error
      }

      socket.to(user.roomCode).emit('card-deleted', { cardId: data.cardId });
    });

    // Sticky add
    socket.on('sticky-add', async (data: { stickyId: string; x: number; y: number; zIndex: number; title: string; bodyHtml: string; tip?: string }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      socket.to(user.roomCode).emit('sticky-new', data);
    });

    // Sticky delete
    socket.on('sticky-delete', async (data: { stickyId: string }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      socket.to(user.roomCode).emit('sticky-deleted', { stickyId: data.stickyId });
    });

    // Sticky move
    socket.on('sticky-move', async (data: { stickyId: string; x: number; y: number }) => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      socket.to(user.roomCode).emit('sticky-moved', data);
    });

    // Canvas clear
    socket.on('canvas-clear', async () => {
      const user = roomStore.getUser(socket.id);
      if (!user) return;

      roomStore.clearRoom(user.roomCode);

      try {
        await Stroke.deleteMany({ roomCode: user.roomCode });
        await Card.deleteMany({ roomCode: user.roomCode });
      } catch (_err) {
        // ignore
      }

      socket.to(user.roomCode).emit('canvas-cleared');
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const user = roomStore.removeUser(socket.id);
      if (user) {
        socket.to(user.roomCode).emit('user-left', {
          socketId: socket.id,
          userId: user.userId,
          name: user.name,
        });

        try {
          await Room.updateOne(
            { code: user.roomCode },
            { $pull: { users: { socketId: socket.id } } }
          );
        } catch (_err) {
          // ignore
        }
      }
    });

  });
}
