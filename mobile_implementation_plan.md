# Mobile-Friendly Implementation Plan — Orbit Canvas

> **Critique & Refinements Incorporated:**
> 1. **Viewport Zooming**: Keep `user-scalable=no` in `<meta name="viewport">` to prevent the browser from zooming fixed UI overlays (TopBar, toolbars, radial menu). Instead, drive spatial zooming purely via JS canvas transform (`zoom` & `pan`).
> 2. **PointerEvents Unified Model**: Use HTML5 `PointerEvents` with active pointer tracking (`PointerEvent.pointerId`) rather than duplicating separate `touchstart`/`touchmove` handlers.
> 3. **Virtual Keyboard (`visualViewport` API)**: Added explicit handling for iOS Safari / Android Chrome virtual keyboard layout shifts.
> 4. **Mobile Code Editor Modal**: Added a dedicated full-screen/sheet code editor modal when editing code cards on mobile devices (<768px).
> 5. **Long-press Haptics & Movement Threshold**: Added movement threshold cancellation (10px) for long-press timer and haptic vibration (`navigator.vibrate`).

---

## Phase 1: Foundation (Viewport & Touch Primitives)

| # | Task | Files | Details |
|---|------|-------|---------|
| 1.1 | **Viewport meta tag configuration** | `client/index.html:6` | Maintain `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`. Prevents outer webpage browser zoom while keeping canvas scaling JS-controlled. |
| 1.2 | **Add `touch-action: none` on spatial canvas** | `client/src/styles/global.css` | Apply `touch-action: none` specifically to `.canvas-spatial-viewport` to disable default browser scroll/pull-to-refresh, while setting `touch-action: manipulation` on normal UI buttons. |
| 1.3 | **OS-safe area padding** | `client/src/styles/global.css` | Support iPhone notch and Android gesture navigation bars using CSS `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)`. |
| 1.4 | **Responsive font-size scaling** | `client/src/styles/global.css` | Use `clamp()` for headings and body text so typography scales smoothly on mobile screens without breaking layouts. |
| 1.5 | **Disable tap highlight overlay** | `client/src/styles/global.css` | Set `-webkit-tap-highlight-color: transparent;` and `user-select: none;` on canvas container to prevent unwanted gray boxes on touch. |

---

## Phase 2: Join Page (Landing)

| # | Task | Details |
|---|------|---------|
| 2.1 | **Reduce card padding on small screens** | `.card` padding: `30px 28px` → `24px 16px` at `max-width: 480px`. |
| 2.2 | **Shrink brand header on mobile** | Reduce `h1` font-size (`32px` → `24px`) and logo gap on screens `<480px`. |
| 2.3 | **Adjust PresenceBar avatars** | Truncate avatar stack to max 2 visible avatars + overflow badge on small screens. |
| 2.4 | **Touch target compliance** | Ensure all input fields, buttons, and tab choices are at least `44px × 44px` (WCAG mobile accessibility guideline). |

---

## Phase 3: Dashboard Page

| # | Task | Details |
|---|------|---------|
| 3.1 | **Mobile header navigation** | Replace wide fixed top navigation bar on mobile with a compact header containing logo, room count badge, and a `+` FAB or action button. |
| 3.2 | **Responsive grid layout** | Adjust grid `minmax(320px, 1fr)` → `minmax(260px, 1fr)` below `480px` screen width. |
| 3.3 | **Touch card states** | Replace mouse hover effects (`:hover`) with `:active` and `:focus-visible` styles so card tapping feels responsive on touchscreens. |
| 3.4 | **Container padding reduction** | Adjust page container padding from `100px 24px` to `80px 14px 24px` on mobile. |

---

## Phase 4: Canvas Page — Navigation & UI (TopBar & Virtual Keyboard)

| # | Task | Details |
|---|------|---------|
| 4.1 | **TopBar mobile collapse** | On screens `<768px`, hide Save, Export, and Share buttons behind a compact "..." overflow menu button. Show only `#RoomCode`, live status dot, and overflow toggle. |
| 4.2 | **Slide-up mobile menu drawer** | Tapping "..." opens a clean bottom drawer/modal with Save, Export PNG, Share Room, and Dashboard navigation. |
| 4.3 | **Visual Viewport API listener** | Listen to `window.visualViewport.onresize` to prevent virtual keyboard from pushing fixed TopBar and toolbars off-screen on iOS/Android. |

---

## Phase 5: Canvas Page — Touch Interactions & Pointer Events

| # | Task | Details |
|---|------|---------|
| 5.1 | **Multi-Touch Pointer Map** | Maintain an `activePointers` Map (`pointerId -> {x, y}`) in `CanvasPage.tsx`. When active pointers count === 2, calculate multi-touch distance delta to drive pinch-zoom (`setZoom`). |
| 5.2 | **Two-finger pan** | When 2 pointers are active, compute the midpoint `(x1+x2)/2, (y1+y2)/2` move delta to seamlessly translate pan position simultaneously with zoom. |
| 5.3 | **Single-finger canvas pan** | In `idle` mode, single-finger drag on empty canvas background directly translates `pan` coordinates. In `pen` or `lasso` mode, single-finger draws while two-finger gesture pans. |
| 5.4 | **Long-press for Radial Menu** | Replace right-click `onContextMenu` on touch devices with a long-press timer (`350ms`). Cancel timer if finger moves >`10px`. Trigger haptic feedback (`navigator.vibrate?.(15)`) when radial menu opens. |
| 5.5 | **Pen mode palm rejection** | Ignore touch events with large contact areas (`e.width > 25` or `e.height > 25`) or secondary touches when in active drawing mode. |

---

## Phase 6: Canvas Page — Floating Controls & Safe Areas

| # | Task | Details |
|---|------|---------|
| 6.1 | **PenToolbar touch adaptation** | Make color swatches `32px` touch targets. On screens `<480px`, display color palette in a horizontal scrolling row. |
| 6.2 | **ZoomControls repositioning** | On mobile (`<768px`), position ZoomControls in top-right below TopBar (`top: 60px; right: 12px`) to avoid overlap with bottom navigation bars or virtual keyboards. |
| 6.3 | **HintBar mobile styling** | `bottom: calc(12px + env(safe-area-inset-bottom)); left: 12px; max-width: calc(100vw - 24px); font-size: 11px`. Hide on very small screens (`<360px`). |
| 6.4 | **Toast repositioning** | Center toast at `top: calc(64px + env(safe-area-inset-top))` on mobile to avoid obscuring bottom canvas controls. |

---

## Phase 7: Canvas Page — Code Cards & Sticky Notes

| # | Task | Details |
|---|------|---------|
| 7.1 | **Mobile Code Card sizing** | Set `min-width: clamp(260px, 85vw, 420px)` on mobile screens so code cards fit within portrait phone viewports. |
| 7.2 | **Full-Screen Mobile Code Editor Modal** | When double-tapping or editing a code card on mobile (`<768px`), open a full-screen sheet/modal editor with syntax highlighting preview, monospace textarea, and a prominent "Done" button. This solves mobile virtual keyboard obstruction. |
| 7.3 | **Sticky Note touch bounds** | Clamp sticky note width to `calc(100vw - 32px)` on mobile, and enlarge drag handle header for easy repositioning. |

---

## Phase 8: Radial Menu (Touch Adaptation & Long-Press)

| # | Task | Details |
|---|------|---------|
| 8.1 | **Enlarge radial action buttons** | Increase `.radial-btn` size from `36px` to `46px` on coarse pointer (touch) devices. |
| 8.2 | **Expand radial ring radius** | Expand button orbit radius from `62px` to `82px` on touch to prevent mis-taps between adjacent tools. |
| 8.3 | **Permanent text labels on touch** | Since `:hover` is unavailable on touch, show tool labels (`Pen`, `Lasso`, `Code`, `Eraser`, `Clear`) permanently below icons on touch screens. |
| 8.4 | **Screen boundary clamping** | Clamp radial menu center position `(screenX, screenY)` so the expanded 82px menu circle never overflows off the phone screen edges. |

---

## Phase 9: Modals & Forms (Virtual Keyboard & Focus)

| # | Task | Details |
|---|------|---------|
| 9.1 | **Full-screen mobile modals** | On screens `<480px`, expand `CreateRoomModal` and dialogs to full screen (`position: fixed; inset: 0; border-radius: 0;`). |
| 9.2 | **Prevent iOS auto-zoom on input focus** | Ensure all text `<input>` and `<textarea>` elements have `font-size: 16px` (iOS Safari zooms page automatically on focus if font-size is <16px). |
| 9.3 | **Modal focus trap & scroll lock** | Lock `document.body` scroll when modals are open to prevent background canvas shifting. |

---

## Phase 10: Performance, Virtual Viewport & Polish

| # | Task | Details |
|---|------|---------|
| 10.1 | **Touch event throttling** | Use `requestAnimationFrame` for pointer/touch movement updates to maintain 60 FPS rendering on mobile devices. |
| 10.2 | **Hardware acceleration** | Apply `will-change: transform; transform: translate3d(...)` to spatial canvas viewport for GPU acceleration on mobile WebKit/Blink engines. |
| 10.3 | **Media Query Touch Detection** | Use CSS `@media (hover: none) and (pointer: coarse)` for all touch-specific styling rules. |
| 10.4 | **Cross-device testing matrix** | Verify on iPhone (Safari), Android (Chrome), and iPad/Tablet touch interfaces. |

---

## Recommended Implementation Order

```
Phase 1 (Foundation & Viewport) 
  → Phase 5 (PointerEvents & Multi-touch Pinch/Pan) 
  → Phase 8 (Touch Radial Menu & Long-press) 
  → Phase 4 (TopBar Mobile Collapse & Overflow Menu) 
  → Phase 7 (Mobile Code Editor Modal) 
  → Phase 6 (Floating Controls & Safe Areas) 
  → Phase 2 & 3 (Join Page & Dashboard Mobile Refinements) 
  → Phase 9 & 10 (Modals, iOS Input Zoom Fix, Performance)
```

> [!TIP]
> **Key Takeaway**: Start with **Phase 1** (meta tag + safe areas) and **Phase 5** (Unified PointerEvents multi-touch pinch/pan). Handling touch via `PointerEvent.pointerId` map guarantees smooth desktop-and-mobile parity without breaking existing mouse/pen workflows.
