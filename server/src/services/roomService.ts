import { Room, IRoom, IRoomUser, IRoomSnapshot } from '../models/Room.js';
import { ApiError } from '../middleware/errorHandler.js';

// In-memory cache/store for zero-dependency local runs
const inMemoryRooms: Map<string, { code: string; title: string; previewUrl?: string; snapshot?: IRoomSnapshot; createdAt: Date; lastActive: Date; users: IRoomUser[] }> = new Map();

// Seed initial default room #8F2A
inMemoryRooms.set('8F2A', {
  code: '8F2A',
  title: 'Demo Whiteboard',
  snapshot: {
    cards: [{ id: 'card-1', filename: 'main.ts', rawText: 'const hello = "world";', x: 80, y: 60 }],
    strokes: [],
    stickies: [],
  },
  createdAt: new Date(),
  lastActive: new Date(),
  users: []
});

const UNAMBIGUOUS_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
    code += UNAMBIGUOUS_CHARS[idx];
  }
  return code;
}

export async function createRoom(customCode?: string, title?: string): Promise<{ code: string; title: string; users: IRoomUser[] }> {
  let code = (customCode || generateRoomCode()).toUpperCase();
  const roomTitle = (title || 'Untitled Workspace').trim();

  try {
    let existing = await Room.findOne({ code });
    if (existing) {
      if (!customCode) {
        code = generateRoomCode();
      }
    }
    const newRoom = await Room.create({ code, title: roomTitle, users: [] });
    return { code: newRoom.code, title: newRoom.title, users: newRoom.users };
  } catch (_dbErr) {
    // Fallback in-memory
    if (!inMemoryRooms.has(code)) {
      inMemoryRooms.set(code, {
        code,
        title: roomTitle,
        createdAt: new Date(),
        lastActive: new Date(),
        users: []
      });
    }
    const room = inMemoryRooms.get(code)!;
    return { code: room.code, title: room.title, users: room.users };
  }
}

export async function joinRoom(code: string, userName: string): Promise<{ code: string; title: string; users: IRoomUser[] }> {
  const formattedCode = code.toUpperCase().trim();
  if (formattedCode.length < 4 || formattedCode.length > 6) {
    throw new ApiError(400, 'Room code must be 4-6 characters', 'VALIDATION_ERROR');
  }

  const name = userName.trim() || 'You';

  try {
    let room = await Room.findOne({ code: formattedCode });
    if (!room) {
      // Auto-create room if it doesn't exist to allow instant joining
      room = await Room.create({ code: formattedCode, title: `Workspace #${formattedCode}`, users: [] });
    }

    if (room.users.length >= 12) {
      throw new ApiError(400, 'Room is full (max 12 users)', 'ROOM_FULL');
    }

    // Add user if not already in room
    const userColors = ['accent', 'live', 'violet'];
    const assignedColor = userColors[room.users.length % userColors.length];

    const existingUserIndex = room.users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUserIndex === -1) {
      room.users.push({
        name,
        color: assignedColor,
        joinedAt: new Date()
      });
      room.lastActive = new Date();
      await room.save();
    }

    return { code: room.code, title: room.title || `Workspace #${room.code}`, users: room.users };
  } catch (err) {
    if (err instanceof ApiError) throw err;

    // Fallback in-memory
    if (!inMemoryRooms.has(formattedCode)) {
      inMemoryRooms.set(formattedCode, {
        code: formattedCode,
        title: `Workspace #${formattedCode}`,
        createdAt: new Date(),
        lastActive: new Date(),
        users: []
      });
    }

    const memRoom = inMemoryRooms.get(formattedCode)!;
    if (memRoom.users.length >= 12) {
      throw new ApiError(400, 'Room is full (max 12 users)', 'ROOM_FULL');
    }

    const userColors = ['accent', 'live', 'violet'];
    const assignedColor = userColors[memRoom.users.length % userColors.length];

    if (!memRoom.users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      memRoom.users.push({ name, color: assignedColor, joinedAt: new Date() });
    }

    return { code: memRoom.code, title: memRoom.title, users: memRoom.users };
  }
}

export async function updateRoomPreview(code: string, previewUrl: string): Promise<boolean> {
  const formattedCode = code.toUpperCase().trim();
  try {
    const room = await Room.findOne({ code: formattedCode });
    if (room) {
      room.previewUrl = previewUrl;
      room.lastActive = new Date();
      await room.save();
      return true;
    }
  } catch (_err) {
    // ignore
  }

  if (inMemoryRooms.has(formattedCode)) {
    const mem = inMemoryRooms.get(formattedCode)!;
    mem.previewUrl = previewUrl;
    mem.lastActive = new Date();
    return true;
  }
  return false;
}

export async function updateRoomSnapshot(code: string, snapshot: IRoomSnapshot): Promise<boolean> {
  const formattedCode = code.toUpperCase().trim();
  try {
    const room = await Room.findOne({ code: formattedCode });
    if (room) {
      room.snapshot = snapshot;
      room.lastActive = new Date();
      await room.save();
      return true;
    }
  } catch (_err) {
    // ignore
  }

  if (inMemoryRooms.has(formattedCode)) {
    const mem = inMemoryRooms.get(formattedCode)!;
    mem.snapshot = snapshot;
    mem.lastActive = new Date();
    return true;
  }
  return false;
}

export async function getRoomInfo(code: string): Promise<{ code: string; title: string; previewUrl?: string; snapshot?: IRoomSnapshot; users: IRoomUser[]; activeCount: number }> {
  const formattedCode = code.toUpperCase().trim();

  try {
    const room = await Room.findOne({ code: formattedCode });
    if (room) {
      return { code: room.code, title: room.title || `Workspace #${room.code}`, previewUrl: room.previewUrl, snapshot: room.snapshot, users: room.users, activeCount: room.users.length };
    }
  } catch (_err) {
    // ignore
  }

  if (inMemoryRooms.has(formattedCode)) {
    const mem = inMemoryRooms.get(formattedCode)!;
    return { code: mem.code, title: mem.title, previewUrl: mem.previewUrl, snapshot: mem.snapshot, users: mem.users, activeCount: mem.users.length };
  }

  throw new ApiError(404, `Room #${formattedCode} not found`, 'ROOM_NOT_FOUND');
}

export async function getRoomsBatch(codes: string[]): Promise<{ code: string; title: string; previewUrl?: string; snapshot?: IRoomSnapshot; exists: boolean; activeCount: number }[]> {
  const results = [];
  for (const c of codes) {
    const formatted = c.toUpperCase().trim();
    try {
      const room = await getRoomInfo(formatted);
      results.push({ code: formatted, title: room.title, previewUrl: room.previewUrl, snapshot: room.snapshot, exists: true, activeCount: room.activeCount });
    } catch (_err) {
      results.push({ code: formatted, title: `Workspace #${formatted}`, exists: false, activeCount: 0 });
    }
  }
  return results;
}
