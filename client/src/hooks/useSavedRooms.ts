import { useState } from 'react';

const NAME_KEY = 'orbit_canvas_user_name';
const ROOMS_KEY = 'orbit_canvas_saved_rooms';

export interface SavedRoom {
  code: string;
  title: string;
  joinedAt: number;
  createdAt?: number;
  lastOpenedAt?: number;
  isOwner?: boolean;
  activeCount?: number;
}

export function useSavedRooms() {
  const [savedName, setSavedName] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_KEY) || '';
    } catch (_e) {
      return '';
    }
  });

  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>(() => {
    try {
      const raw = localStorage.getItem(ROOMS_KEY);
      if (!raw) return [];
      const parsed: SavedRoom[] = JSON.parse(raw);
      // Migrate legacy rooms to ensure lastOpenedAt and createdAt are populated
      return parsed.map(r => ({
        ...r,
        createdAt: r.createdAt || r.joinedAt || Date.now(),
        lastOpenedAt: r.lastOpenedAt || r.joinedAt || Date.now(),
      })).sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
    } catch (_e) {
      return [];
    }
  });

  // Persist name
  const updateSavedName = (name: string) => {
    setSavedName(name);
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch (_e) {
      // ignore
    }
  };

  // Persist rooms with title and lastOpenedAt timestamp
  const addSavedRoom = (code: string, title?: string, isOwner?: boolean) => {
    const uppercaseCode = code.toUpperCase().trim();
    if (!uppercaseCode) return;

    setSavedRooms(prev => {
      const now = Date.now();
      const existing = prev.find(r => r.code === uppercaseCode);
      const filtered = prev.filter(r => r.code !== uppercaseCode);

      const roomTitle = title && title.trim() ? title.trim() : (existing?.title || `Workspace #${uppercaseCode}`);
      const roomIsOwner = isOwner !== undefined ? isOwner : (existing?.isOwner ?? false);
      const createdAt = existing?.createdAt || existing?.joinedAt || now;

      const updatedRoom: SavedRoom = {
        code: uppercaseCode,
        title: roomTitle,
        joinedAt: existing?.joinedAt || now,
        createdAt,
        lastOpenedAt: now,
        isOwner: roomIsOwner,
      };

      const updated: SavedRoom[] = [updatedRoom, ...filtered].slice(0, 20);

      try {
        localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
      } catch (_e) {
        // ignore
      }
      return updated;
    });
  };

  const removeSavedRoom = (code: string) => {
    const uppercaseCode = code.toUpperCase().trim();
    setSavedRooms(prev => {
      const updated = prev.filter(r => r.code !== uppercaseCode);
      try {
        localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
      } catch (_e) {
        // ignore
      }
      return updated;
    });
  };

  const clearSavedRooms = () => {
    setSavedRooms([]);
    try {
      localStorage.removeItem(ROOMS_KEY);
    } catch (_e) {
      // ignore
    }
  };

  const getMostRecentRoom = (): SavedRoom | null => {
    if (savedRooms.length === 0) return null;
    return savedRooms[0];
  };

  return {
    savedName,
    updateSavedName,
    savedRooms,
    addSavedRoom,
    removeSavedRoom,
    clearSavedRooms,
    getMostRecentRoom,
  };
}
