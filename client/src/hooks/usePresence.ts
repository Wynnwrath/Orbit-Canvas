import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import type { PeerData } from '../components/PeerCursor';

export interface PresenceUser {
  socketId: string;
  name: string;
  color: string;
}

export function usePresence(socket: Socket | null, roomCode: string, userName: string) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<PeerData[]>([]);
  const lastEmitRef = useRef<number>(0);

  useEffect(() => {
    if (!socket) return;

    // Room initial state listener
    const handleRoomState = (data: { users: any[] }) => {
      if (data?.users) {
        setPresenceUsers(
          data.users.map(u => ({
            socketId: u.socketId,
            name: u.name,
            color: u.color || 'accent',
          }))
        );
      }
    };

    const handleUserJoined = (user: { socketId: string; name: string; color: string }) => {
      setPresenceUsers(prev => {
        if (prev.some(u => u.socketId === user.socketId)) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (data: { socketId: string }) => {
      setPresenceUsers(prev => prev.filter(u => u.socketId !== data.socketId));
      setRemoteCursors(prev => prev.filter(c => c.id !== data.socketId));
    };

    const handleCursorUpdate = (data: { socketId: string; name: string; color: string; x: number; y: number }) => {
      if (data.socketId === socket.id) return; // Skip self

      const colorClsMap: Record<string, 'peer-a' | 'peer-b' | 'peer-c'> = {
        accent: 'peer-a',
        live: 'peer-b',
        violet: 'peer-c',
      };

      setRemoteCursors(prev => {
        const existingIdx = prev.findIndex(c => c.id === data.socketId);
        const cls = colorClsMap[data.color] || 'peer-a';
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            id: data.socketId,
            name: data.name,
            cls,
            x: data.x,
            y: data.y,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: data.socketId,
              name: data.name,
              cls,
              x: data.x,
              y: data.y,
            },
          ];
        }
      });
    };

    socket.on('room-state', handleRoomState);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('cursor-update', handleCursorUpdate);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('cursor-update', handleCursorUpdate);
    };
  }, [socket, roomCode, userName]);

  // Pointer move throttling for local cursor broadcast
  const emitCursorMove = (x: number, y: number) => {
    if (!socket || !socket.connected) return;
    const now = performance.now();
    if (now - lastEmitRef.current > 33) { // ~30 fps update rate
      lastEmitRef.current = now;
      socket.emit('cursor-move', { x, y });
    }
  };

  return {
    presenceUsers,
    remoteCursors,
    emitCursorMove,
  };
}
