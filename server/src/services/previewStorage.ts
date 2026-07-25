import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = path.resolve(__dirname, '../../uploads/previews');

// Ensure directory exists
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

export function savePreview(code: string, base64DataUri: string): string | null {
  try {
    const match = base64DataUri.match(/^data:image\/\w+;base64,(.+)$/);
    if (!match) return null;
    const buffer = Buffer.from(match[1], 'base64');
    const filePath = path.join(PREVIEW_DIR, `${code.toUpperCase()}.jpg`);
    fs.writeFileSync(filePath, buffer);
    return `/api/rooms/${code.toUpperCase()}/preview`;
  } catch (_err) {
    return null;
  }
}

export function getPreviewPath(code: string): string | null {
  const filePath = path.join(PREVIEW_DIR, `${code.toUpperCase()}.jpg`);
  return fs.existsSync(filePath) ? filePath : null;
}

export function deletePreview(code: string): void {
  const filePath = path.join(PREVIEW_DIR, `${code.toUpperCase()}.jpg`);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    /* ignore */
  }
}
