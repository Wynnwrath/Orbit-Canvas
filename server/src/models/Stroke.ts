import mongoose, { Schema, Document } from 'mongoose';

export interface IStroke extends Document {
  strokeId: string;
  roomCode: string;
  userId: string;
  pathData: string;
  color: string;
  width: number;
  createdAt: Date;
}

const StrokeSchema = new Schema<IStroke>({
  strokeId: { type: String, required: true },
  roomCode: { type: String, required: true, uppercase: true, index: true },
  userId: { type: String, required: true },
  pathData: { type: String, required: true },
  color: { type: String, default: 'rgba(244,244,245,.9)' },
  width: { type: Number, default: 2.5 },
  createdAt: { type: Date, default: Date.now }
});

export const Stroke = mongoose.model<IStroke>('Stroke', StrokeSchema);
