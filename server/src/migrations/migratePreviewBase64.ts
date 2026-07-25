import { Room } from '../models/Room.js';
import { savePreview } from '../services/previewStorage.js';

export async function migrateBase64Previews(): Promise<void> {
  try {
    const rooms = await Room.find({
      previewUrl: { $regex: /^data:image\// }
    });
    if (rooms.length > 0) {
      console.log(`[Migration] Found ${rooms.length} room(s) with base64 previews`);
      for (const room of rooms) {
        if (room.previewUrl) {
          const storedPath = savePreview(room.code, room.previewUrl);
          if (storedPath) {
            room.previewUrl = storedPath;
            await room.save();
            console.log(`[Migration] Migrated preview image for room #${room.code}`);
          }
        }
      }
      console.log('[Migration] Base64 preview migration completed successfully');
    }
  } catch (err) {
    console.error('[Migration] Preview migration error:', err);
  }
}
