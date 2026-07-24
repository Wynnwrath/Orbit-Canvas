export interface ActiveUser {
  socketId: string;
  userId: string;
  name: string;
  color: string;
  roomCode: string;
  x: number;
  y: number;
}

export interface InMemoryStroke {
  strokeId: string;
  roomCode: string;
  userId: string;
  pathData: string;
  color: string;
  width: number;
}

export interface InMemoryCard {
  cardId: string;
  roomCode: string;
  userId: string;
  type: 'code' | 'sticky';
  filename?: string;
  content: string;
  position: { x: number; y: number };
  zIndex: number;
}

class RoomStore {
  private activeUsers: Map<string, ActiveUser> = new Map(); // socketId -> ActiveUser
  private strokesByRoom: Map<string, InMemoryStroke[]> = new Map();
  private cardsByRoom: Map<string, InMemoryCard[]> = new Map();

  constructor() {
    // Default initial card for #8F2A demo
    this.cardsByRoom.set('8F2A', [
      {
        cardId: 'card1',
        roomCode: '8F2A',
        userId: 'system',
        type: 'code',
        filename: 'Component.tsx',
        content: `export function Cursor({ name, color, x, y }: CursorProps) {\n  return (\n    <g transform={\`translate(\${x}, \${y})\`}>\n      <path d="M4 2 L20 12 L12.5 13.5 L9 21 Z" fill={color} />\n      <text x={16} y={14} className="tag">{name}</text>\n    </g>\n  );\n}\n// Presence renders one <Cursor> per peer, 60 fps.`,
        position: { x: windowWidthPercent(0.16), y: windowHeightPercent(0.26) },
        zIndex: 20
      }
    ]);
  }

  addUser(user: ActiveUser) {
    this.activeUsers.set(user.socketId, user);
  }

  removeUser(socketId: string): ActiveUser | undefined {
    const user = this.activeUsers.get(socketId);
    if (user) {
      this.activeUsers.delete(socketId);
    }
    return user;
  }

  getUser(socketId: string): ActiveUser | undefined {
    return this.activeUsers.get(socketId);
  }

  updateUserCursor(socketId: string, x: number, y: number) {
    const user = this.activeUsers.get(socketId);
    if (user) {
      user.x = x;
      user.y = y;
    }
  }

  getRoomUsers(roomCode: string): ActiveUser[] {
    return Array.from(this.activeUsers.values()).filter(u => u.roomCode === roomCode.toUpperCase());
  }

  addStroke(stroke: InMemoryStroke) {
    const code = stroke.roomCode.toUpperCase();
    if (!this.strokesByRoom.has(code)) {
      this.strokesByRoom.set(code, []);
    }
    this.strokesByRoom.get(code)!.push(stroke);
  }

  getStrokes(roomCode: string): InMemoryStroke[] {
    return this.strokesByRoom.get(roomCode.toUpperCase()) || [];
  }

  addCard(card: InMemoryCard) {
    const code = card.roomCode.toUpperCase();
    if (!this.cardsByRoom.has(code)) {
      this.cardsByRoom.set(code, []);
    }
    const cards = this.cardsByRoom.get(code)!;
    const existingIdx = cards.findIndex(c => c.cardId === card.cardId);
    if (existingIdx !== -1) {
      cards[existingIdx] = card;
    } else {
      cards.push(card);
    }
  }

  updateCardPosition(roomCode: string, cardId: string, x: number, y: number) {
    const cards = this.cardsByRoom.get(roomCode.toUpperCase()) || [];
    const card = cards.find(c => c.cardId === cardId);
    if (card) {
      card.position = { x, y };
    }
  }

  updateCardContent(roomCode: string, cardId: string, content: string) {
    const cards = this.cardsByRoom.get(roomCode.toUpperCase()) || [];
    const card = cards.find(c => c.cardId === cardId);
    if (card) {
      card.content = content;
    }
  }

  getCards(roomCode: string): InMemoryCard[] {
    return this.cardsByRoom.get(roomCode.toUpperCase()) || [];
  }

  clearRoom(roomCode: string) {
    const code = roomCode.toUpperCase();
    this.strokesByRoom.set(code, []);
    this.cardsByRoom.set(code, []);
  }
}

function windowWidthPercent(pct: number): number {
  return Math.round(1440 * pct);
}

function windowHeightPercent(pct: number): number {
  return Math.round(900 * pct);
}

export const roomStore = new RoomStore();
