import { useState } from 'react';

const NAME_KEY = 'orbit_canvas_user_name';
const ROOMS_KEY = 'orbit_canvas_saved_rooms';

export interface SavedRoom {
  code: string;
  name?: string;
  joinedAt: number;
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
      return raw ? JSON.parse(raw) : [];
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

  // Persist rooms
  const addSavedRoom = (code: string, isOwner: boolean = false) => {
    const uppercaseCode = code.toUpperCase().trim();
    setSavedRooms(prev => {
      const filtered = prev.filter(r => r.code !== uppercaseCode);
      const updated: SavedRoom[] = [
        {
          code: uppercaseCode,
          joinedAt: Date.now(),
          isOwner,
        },
        ...filtered,
      ].slice(0, 10); // Keep top 10 most recent

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

  return {
    savedName,
    updateSavedName,
    savedRooms,
    addSavedRoom,
    removeSavedRoom,
    clearSavedRooms,
  };
}
