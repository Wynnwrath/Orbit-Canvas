import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomUser {
  name: string;
  color: string;
  joinedAt: Date;
  socketId?: string;
}

export interface IRoomSnapshot {
  cards?: Array<{ id: string; filename: string; rawText: string; x: number; y: number }>;
  strokes?: Array<{ id: string; d: string }>;
  stickies?: Array<{ id: string; title: string; x: number; y: number }>;
}

export interface IRoom extends Document {
  code: string;
  title: string;
  previewUrl?: string;
  snapshot?: IRoomSnapshot;
  createdAt: Date;
  lastActive: Date;
  users: IRoomUser[];
}

const RoomUserSchema = new Schema<IRoomUser>({
  name: { type: String, required: true },
  color: { type: String, required: true, default: 'accent' },
  joinedAt: { type: Date, default: Date.now },
  socketId: { type: String }
});

const RoomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true, default: 'Untitled Workspace', trim: true },
  previewUrl: { type: String },
  snapshot: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  users: [RoomUserSchema]
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
