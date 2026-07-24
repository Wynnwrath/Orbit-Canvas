import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  cardId: string;
  roomCode: string;
  userId: string;
  type: 'code' | 'sticky';
  filename?: string;
  content: string;
  position: { x: number; y: number };
  zIndex: number;
  createdAt: Date;
}

const CardSchema = new Schema<ICard>({
  cardId: { type: String, required: true },
  roomCode: { type: String, required: true, uppercase: true, index: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['code', 'sticky'], required: true },
  filename: { type: String },
  content: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  zIndex: { type: Number, default: 20 },
  createdAt: { type: Date, default: Date.now }
});

export const Card = mongoose.model<ICard>('Card', CardSchema);
