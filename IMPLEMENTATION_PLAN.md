# Canvas Scrolling Fix + Preview System Overhaul

## System 1: Canvas Scrolling Fixes

### Root Cause
Window-level `wheel` event listener with blanket `e.preventDefault()` (CanvasPage.tsx:336) kills native scroll inside `<pre>` blocks in code cards. Also missing `will-change: transform` on the spatial viewport causes GPU compositing issues on mobile.

---

### 1A. Wheel Event Scroll Guard

**File**: `client/src/pages/CanvasPage.tsx` (lines 333–380)

**Change**: Check if the wheel event originated from inside a scrollable element before calling `preventDefault()`.

```tsx
const handleWheel = (e: WheelEvent) => {
  // Allow native scroll for elements with overflow scroll/auto
  const target = e.target as HTMLElement;
  const scrollable = target.closest('pre, .scrollable, [data-scrollable]');
  if (scrollable && !e.ctrlKey && !e.metaKey) {
    return; // let native scroll work
  }
  e.preventDefault();
  // ... rest of zoom/pan logic unchanged
};
```

Also add `requestAnimationFrame` throttle for scroll-based pan:

```tsx
// At top with other refs:
const panRafRef = useRef<number>(0);

// In the non-zoom else-branch:
cancelAnimationFrame(panRafRef.current);
panRafRef.current = requestAnimationFrame(() => {
  setPan(currentPan => ({
    x: currentPan.x - moveX,
    y: currentPan.y - moveY,
  }));
});

// Cleanup in useEffect return:
cancelAnimationFrame(panRafRef.current);
```

---

### 1B. GPU Layer Promotion

**File**: `client/src/styles/reset.css` (lines 29–33)

```css
.canvas-spatial-viewport {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform; /* ADD THIS */
}
```

---

### 1C. Pointer-Move RAF Throttle

**File**: `client/src/pages/CanvasPage.tsx` (line 503)

Wrap cursor broadcast in `requestAnimationFrame` to reduce per-pixel work:

```tsx
const moveRafRef = useRef<number>(0);
const emitPendingRef = useRef<{ canvasX: number; canvasY: number } | null>(null);

// In handlePointerMoveCanvas, replace direct emitCursorMove:
emitPendingRef.current = { canvasX, canvasY };
cancelAnimationFrame(moveRafRef.current);
moveRafRef.current = requestAnimationFrame(() => {
  if (emitPendingRef.current) {
    emitCursorMove(
      emitPendingRef.current.canvasX,
      emitPendingRef.current.canvasY
    );
    emitPendingRef.current = null;
  }
});

// Cleanup: cancelAnimationFrame(moveRafRef.current);
```

---

## System 2: Preview System Overhaul

### Root Cause
Full base64 JPEG data URLs (100KB–1MB+) stored in MongoDB. Returned in batch API responses, causing payload bloat. Preview screenshots also capture UI overlays (TopBar, ZoomControls) and random user pan/zoom.

---

### 2A. Server: File-Based Thumbnail Storage

#### New file: `server/src/services/previewStorage.ts`

```ts
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
  } catch {
    return null;
  }
}

export function getPreviewPath(code: string): string | null {
  const filePath = path.join(PREVIEW_DIR, `${code.toUpperCase()}.jpg`);
  return fs.existsSync(filePath) ? filePath : null;
}

export function deletePreview(code: string): void {
  const filePath = path.join(PREVIEW_DIR, `${code.toUpperCase()}.jpg`);
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}
```

---

### 2B. Server: GET Preview Route

#### File: `server/src/routes/roomRoutes.ts`

Add GET route **before** the existing POST `/rooms/:code/preview`:

```ts
import { getPreviewPath } from '../services/previewStorage.js';

// GET /api/rooms/:code/preview — Serve thumbnail image from disk
router.get('/rooms/:code/preview', (req, res) => {
  const codeParam = req.params.code;
  const roomCode = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const filePath = getPreviewPath(roomCode);
  if (!filePath) {
    return res.status(404).json({ error: 'No preview available' });
  }
  res.sendFile(filePath);
});
```

---

### 2C. Server: Update `updateRoomPreview`

#### File: `server/src/services/roomService.ts` (lines 128–149)

Replace base64 storage with file-based:

```ts
import { savePreview } from './previewStorage.js';

export async function updateRoomPreview(code: string, previewUrl: string): Promise<boolean> {
  const formattedCode = code.toUpperCase().trim();
  const storedPath = savePreview(formattedCode, previewUrl);
  const newUrl = storedPath || null;

  try {
    const room = await Room.findOne({ code: formattedCode });
    if (room) {
      room.previewUrl = newUrl;
      room.lastActive = new Date();
      await room.save();
      return true;
    }
  } catch { /* ignore */ }

  if (inMemoryRooms.has(formattedCode)) {
    const mem = inMemoryRooms.get(formattedCode)!;
    mem.previewUrl = newUrl;
    mem.lastActive = new Date();
    return true;
  }
  return false;
}
```

---

### 2D. Server: Slim Down Batch Response

#### File: `server/src/services/roomService.ts` — `getRoomsBatch()` (lines 223–235)

Replace `previewUrl: room.previewUrl` with boolean flag:

```ts
results.push({
  code: formatted,
  title: room.title,
  hasPreview: !!room.previewUrl, // boolean instead of full URL
  snapshot: room.snapshot,
  exists: true,
  activeCount: room.activeCount,
});
```

---

### 2E. Client: Canonical View Capture

#### File: `client/src/pages/CanvasPage.tsx` — `saveCanvasPreview()` (lines 274–301)

Reset zoom/pan to canonical view before capture, expand `ignoreElements`:

```tsx
const saveCanvasPreview = useCallback(async () => {
  if (!viewportRef.current) return;
  try {
    // Save current state
    const prevZoom = zoom;
    const prevPan = { ...pan };

    // Reset to canonical view for capture
    setZoom(1);
    setPan({ x: 0, y: 0 });

    // Wait two frames for React to apply transform
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(viewportRef.current, {
      backgroundColor: '#09090b',
      useCORS: true,
      logging: false,
      scale: 0.5,
      ignoreElements: (element) => {
        return (
          element.classList.contains('ai-lasso-rect') ||
          element.classList.contains('peer-cursor') ||
          element.id === 'radial' ||
          element.closest('.topbar') !== null ||
          element.closest('.zoom-controls-wrapper') !== null ||
          element.closest('.toast') !== null ||
          element.closest('.hint') !== null ||
          element.classList.contains('pen-toolbar') ||
          element.classList.contains('mobile-drawer-overlay') ||
          element.classList.contains('canvas-bg')
        );
      },
    });

    // Restore previous view
    setZoom(prevZoom);
    setPan(prevPan);

    if (canvas) {
      const previewUrl = canvas.toDataURL('image/jpeg', 0.5);
      await apiRequest(`/api/rooms/${roomCode}/preview`, {
        method: 'POST',
        body: JSON.stringify({ previewUrl }),
      });
    }
  } catch (_err) {
    // ignore preview errors
  }
}, [roomCode, zoom, pan]);
```

---

### 2F. Client: Dashboard Preview Caching

#### File: `client/src/pages/DashboardPage.tsx` (lines 35–52, 196–227)

**1. Update batch response type** to use `hasPreview: boolean`:

```tsx
const [liveBatch, setLiveBatch] = useState<Record<string, {
  title?: string;
  hasPreview?: boolean;
  snapshot?: MiniCanvasSnapshot;
  activeCount?: number;
}>>({});
```

**2. Add localStorage preview cache**:

```tsx
const PREVIEW_CACHE_KEY = 'orbit_canvas_preview_cache';

const [previewCache, setPreviewCache] = useState<Record<string, string>>(() => {
  try {
    return JSON.parse(localStorage.getItem(PREVIEW_CACHE_KEY) || '{}');
  } catch { return {}; }
});
```

**3. Fetch and cache images after batch response**:

```tsx
// Inside useEffect after batch fetch
for (const code of Object.keys(map)) {
  if (map[code].hasPreview && !previewCache[code]) {
    try {
      const imgRes = await fetch(`/api/rooms/${code}/preview`);
      if (imgRes.ok) {
        const blob = await imgRes.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setPreviewCache(prev => {
            const next = { ...prev, [code]: dataUrl };
            // Cap at 20 entries to limit localStorage
            const keys = Object.keys(next);
            if (keys.length > 20) {
              delete next[keys.sort((a, b) =>
                prev[a] ? 1 : -1  // remove oldest
              )[0]];
            }
            try { localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(next)); } catch {}
            return next;
          });
        };
        reader.readAsDataURL(blob);
      }
    } catch { /* ignore */ }
  }
}
```

**4. Pass cached preview to `MiniCanvasPreview`**:

```tsx
const cachedPreview = previewCache[room.code];
const previewImage = liveData?.hasPreview
  ? (cachedPreview || `/api/rooms/${room.code}/preview`)
  : undefined;

<MiniCanvasPreview
  previewUrl={previewImage}
  snapshot={snapshotData}
  roomCode={room.code}
  isHovered={isHovered}
/>
```

---

### 2G. Migration: Existing Base64 → File Storage

#### New file: `server/src/migrations/migratePreviewBase64.ts`

```ts
import { Room } from '../models/Room.js';
import { savePreview } from '../services/previewStorage.js';

export async function migrateBase64Previews(): Promise<void> {
  try {
    const rooms = await Room.find({
      previewUrl: { $regex: /^data:image\// }
    });
    console.log(`[Migration] Found ${rooms.length} rooms with base64 previews`);

    for (const room of rooms) {
      const storedPath = savePreview(room.code, room.previewUrl!);
      if (storedPath) {
        room.previewUrl = storedPath;
        await room.save();
        console.log(`[Migration] Migrated preview for room ${room.code}`);
      }
    }

    console.log('[Migration] Base64 preview migration complete');
  } catch (err) {
    console.error('[Migration] Preview migration failed:', err);
  }
}
```

#### File: `server/src/index.ts` — call after DB connect

```ts
import { migrateBase64Previews } from './migrations/migratePreviewBase64.js';

async function startServer() {
  await connectDB();
  await migrateBase64Previews(); // one-time migration
  server.listen(PORT, () => {
    console.log(`[Server] Orbit Canvas backend listening on port ${PORT}`);
  });
}
```

---

## 3. Complete File Manifest

### Files to CREATE

| File | Purpose |
|---|---|
| `server/src/services/previewStorage.ts` | File-based thumbnail save/read/delete to `server/uploads/previews/` |
| `server/src/migrations/migratePreviewBase64.ts` | One-time migration extracting existing base64 data → JPG files |
| `server/uploads/previews/` | Directory for stored thumbnails (auto-created by `previewStorage.ts`) |

### Files to MODIFY

| File | Changes |
|---|---|
| `client/src/pages/CanvasPage.tsx` | Wheel scroll guard (line 335), RAF throttle refs + cleanup (top + 372 + 380), pointer-move RAF throttle (line 503), `saveCanvasPreview` canonical view + expand `ignoreElements` (lines 274–301) |
| `client/src/styles/reset.css` | Add `will-change: transform` to `.canvas-spatial-viewport` (line 31) |
| `client/src/pages/DashboardPage.tsx` | localStorage preview cache, fetch+cache images, batch response type update to `hasPreview`, pass cached preview to `MiniCanvasPreview` |
| `server/src/routes/roomRoutes.ts` | Add `GET /rooms/:code/preview` route + update POST to use `previewStorage` |
| `server/src/services/roomService.ts` | `updateRoomPreview` → use `savePreview()`, `getRoomsBatch` → return `hasPreview: boolean` |
| `server/src/index.ts` | Import and call `migrateBase64Previews()` after DB connect |

### Files UNCHANGED

| File | Reason |
|---|---|
| `server/src/models/Room.ts` | Schema field `previewUrl: String` stays — now stores relative path |
| `client/src/hooks/useSavedRooms.ts` | localStorage room data doesn't include preview URLs |
| `client/src/components/MiniCanvasPreview.tsx` | Already handles image/vector/fallback correctly |
| `client/src/styles/global.css` | `.code-card` and `pre` overflow rules are already correct |

---

## 4. Execution Order

| Step | Systems | Risk | Depends On |
|---|---|---|---|
| **1** | Scrolling fixes (1A, 1B, 1C) | Low | None — pure client |
| **2** | Create `previewStorage.ts` + migration script | Medium | None — server-only |
| **3** | Modify `roomService.ts` + `roomRoutes.ts` + `index.ts` | Medium | Step 2 |
| **4** | Deploy server, verify migration ran | Medium | Step 3 |
| **5** | Update `CanvasPage.tsx` capture + `DashboardPage.tsx` cache | Low | Step 4 |
| **6** | Smoke test: save canvas → verify JPG on disk, not base64 in DB | — | Step 5 |

---

## 5. Verification Checklist

- [ ] Scroll inside code card `<pre>` blocks works with wheel/touch
- [ ] Canvas panning still works on background (wheel, middle-click, spacebar+drag, touch)
- [ ] Zoom still works (Ctrl+wheel, pinch)
- [ ] Server migration ran without errors at startup
- [ ] New canvas saves produce JPG files in `server/uploads/previews/`
- [ ] `GET /api/rooms/{CODE}/preview` returns the thumbnail image
- [ ] Batch API response uses `hasPreview: boolean` (not base64)
- [ ] Dashboard loads instantly on repeat visit (localStorage cache)
- [ ] Dashboard preview shows real thumbnail, not sparkle fallback
- [ ] Previews exclude TopBar, ZoomControls, Toast UI overlays
- [ ] Previews are consistent regardless of user's pan/zoom state
