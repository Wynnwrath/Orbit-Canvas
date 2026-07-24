import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// In production behind nginx, Socket.IO connects to same origin (nginx proxies /socket.io/).
// In dev, fall back to localhost:5000.
const WS_URL = import.meta.env.VITE_WS_URL || '';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

export function useSocket(roomCode: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('connecting');

  useEffect(() => {
    const socket = io(WS_URL || window.location.origin, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('join-room', {
        roomCode,
        name: userName || 'You',
      });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, userName]);

  return {
    socket: socketRef.current,
    status,
  };
}
