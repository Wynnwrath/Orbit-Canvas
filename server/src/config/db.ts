import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orbit-canvas';
  try {
    await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected to ${mongoUri}`);
  } catch (error) {
    console.warn(`[MongoDB] Connection failed: ${(error as Error).message}. Operating in in-memory fallback mode.`);
  }
}
