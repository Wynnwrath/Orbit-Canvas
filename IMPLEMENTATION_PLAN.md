# Implementation Plan - Fix Random Zooming Bug & Add Moveable Pen Ink Strokes

Fix the random zoom-in/zoom-out jitter caused by wheel delta thresholding and touch pinch listener conflicts, and enable interactive drag-and-drop moving of freehand pen strokes on the spatial canvas.

## User Review Required

> [!IMPORTANT]
> **Zoom Threshold & Smoothness**: We will replace the current hardcoded `deltaY > 15` threshold in `handleWheel` with smooth proportional logarithmic zoom scaling. This ensures trackpad pinches, smooth touchpads, and mouse wheel Ctrl-scroll perform smoothly without flickering between pan and zoom.

> [!NOTE]
> **Stroke Interaction**: In `select` or `idle` mode, hovering over any drawn ink stroke will show a `grab` cursor. Dragging an ink stroke will move it smoothly across the spatial canvas, save a snapshot to the Undo stack (`Ctrl+Z`), and broadcast real-time movement to all connected peers.

---

## Proposed Changes

### Client Component - Ink Layer & Stroke Movement

#### [MODIFY] [InkLayer.tsx](file:///f:/Orbit%20Canvas/client/src/components/InkLayer.tsx)
- Update `InkStroke` interface to support optional translation offsets: `x?: number; y?: number`.
- Render `<path>` wrapped with `transform="translate(${s.x || 0}, ${s.y || 0})"` or `transform` attribute on SVG paths.
- Update `pointerEvents` styling:
  - `isEraser`: `pointerEvents: 'stroke'`, cursor `pointer` for erasure.
  - `isSelectOrIdle`: `pointerEvents: 'stroke'`, cursor `grab` for dragging.
- Add `onMoveStroke` callback property to `InkLayerProps` and attach pointer drag listeners (`setPointerCapture`, delta calculation, and pointer release).

---

### Client Main Canvas Page & Real-Time Sync

#### [MODIFY] [CanvasPage.tsx](file:///f:/Orbit%20Canvas/client/src/pages/CanvasPage.tsx)
1. **Fix Wheel & Trackpad Zooming**:
   - Refactor `handleWheel` zoom calculation: remove the `deltaY > 15` threshold causing jitter.
   - Use proportional scale factor `Math.pow(0.998, e.deltaY)` clamped between 0.4 and 2.5 to provide ultra-smooth zooming for trackpads and high-res scroll wheels.
2. **Fix Touch Pinch Race Condition**:
   - When 2-finger touch pinch begins (`activePointersRef.current.size >= 2`), immediately unbind single-touch pan move listeners to prevent double-translation jitter.
3. **Move Stroke Integration**:
   - Implement `handleMoveStroke(strokeId, x, y)` in `CanvasPage.tsx`.
   - Call `saveHistorySnapshot()` when starting to drag a stroke so stroke moves support `Ctrl+Z` / Undo.
   - Call `emitStrokeMove(strokeId, x, y)` to broadcast to peers.

#### [MODIFY] [useSyncInk.ts](file:///f:/Orbit%20Canvas/client/src/hooks/useSyncInk.ts)
- Add `stroke-moved` socket event listener to update local stroke positions when room peers move an ink stroke.
- Add `emitStrokeMove(strokeId: string, x: number, y: number)` helper function.

---

### Server Real-Time Socket Store & Handlers

#### [MODIFY] [roomStore.ts](file:///f:/Orbit%20Canvas/server/src/sockets/roomStore.ts)
- Update `Stroke` state in `roomStore` to store `x` and `y` offsets for each stroke.
- Add `updateStrokePosition(roomCode, strokeId, x, y)` method.

#### [MODIFY] [socketHandlers.ts](file:///f:/Orbit%20Canvas/server/src/sockets/socketHandlers.ts)
- Add `stroke-move` socket event handler:
  - Update `roomStore` with new `x, y` for the stroke.
  - Broadcast `stroke-moved` to other room sockets via `socket.to(user.roomCode).emit('stroke-moved', { strokeId, x, y })`.

---

## Verification Plan

### Automated Tests
- Run `npm run build` in `client/` and `server/` to verify clean TypeScript compilation.

### Manual Verification
1. **Zoom Bug Verification**:
   - Test wheel scrolling, Ctrl + wheel, and trackpad pinch-to-zoom. Verify zero sudden random zooming or back-and-forth canvas flickering.
   - Test 2-finger pinch zoom on touch device / browser dev tools mobile simulator. Verify clean, smooth zooming.
2. **Move Pen Stroke Verification**:
   - Draw an ink stroke using the Pen tool (✏️).
   - Switch to Select / Pan mode (🖐️).
   - Hover over the drawn stroke (cursor changes to `grab`).
   - Click/tap and drag the stroke. Verify it moves smoothly.
   - Press `Ctrl+Z` or tap the on-screen **Undo (`↶`)** button. Verify the stroke moves back to its original location.
