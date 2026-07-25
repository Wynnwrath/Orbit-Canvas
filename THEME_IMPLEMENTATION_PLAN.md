# Theme System Implementation Plan — Light/Dark Mode + Mobile

## Current State

| Layer | Status |
|---|---|
| `styles.css` (new tokens, light+dark) | **Defined, zero consumers** |
| `tokens.css` (old tokens) | **Dark-only, extensively used by all CSS + components** |
| `theme.store.ts` | **Created, never imported by any component** |
| `data-theme` attribute on `<html>` | **Never set** |
| Theme toggle UI | **Does not exist** |
| Hardcoded dark values | **35+ locations** (CSS + inline styles) |

---

## Phase 1: Foundation (CSS tokens + store wiring)

### 1A. Add light theme overrides to `tokens.css`
**File**: `client/src/styles/tokens.css`

Add a `[data-theme='light']` block with inverted values for all old tokens:

```css
[data-theme='light'] {
  --bg: #fafafa;
  --fg: #0a0a0f;
  --ink: #1f1f2e;
  --muted: #64647a;
  --faint: #9494a6;
  --border: rgba(0, 0, 0, 0.06);
  --glass: rgba(255, 255, 255, 0.7);
  --card: rgba(255, 255, 255, 0.85);
  --accent-dim: rgba(34, 211, 238, 0.08);
  --accent-border: rgba(34, 211, 238, 0.4);
  --accent-ink: #05262c;
  --shadow-card: 0 10px 40px rgba(0,0,0,0.06), 0 0 20px rgba(34,211,238,0.04);
  --shadow-heavy: 0 20px 60px rgba(0,0,0,0.08);
  --shadow-topbar: 0 4px 20px rgba(0,0,0,0.05);
}
```

This **instantly** makes existing components themable without any component changes.

### 1B. Wire up theme store to DOM
**File**: `client/src/App.tsx`

```tsx
import { useEffect } from 'react';
import { useThemeStore } from './stores/theme.store';

// Inside App component, before the return:
const mode = useThemeStore(s => s.mode);
const accent = useThemeStore(s => s.accent);

useEffect(() => {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.style.setProperty('--color-accent', accent);
}, [mode, accent]);
```

---

## Phase 2: Fix hardcoded dark values

### 2A. CSS file hardcoded values → tokens

**File**: `client/src/styles/global.css`

| Line | Hardcoded | Replace with |
|---|---|---|
| 286 | `#101014` | `var(--bg)` |
| 291 | `#0b0b0d` | `var(--fg)` |
| 302 | `#27272a` | `var(--muted)` |
| 534 | `#0b0b0d` | `var(--fg)` |
| 566 | `rgba(12, 12, 15, 0.7)` | `var(--glass)` |
| 593 | `rgba(22, 22, 26, 0.85)` | `var(--card)` |
| 650 | `rgba(10, 10, 14, 0.85)` | `var(--card)` |
| 800 | `rgba(18, 18, 22, 0.6)` | `var(--glass)` |
| 819 | `rgba(18, 18, 22, 0.85)` | `var(--card)` |
| 895 | `rgba(18, 18, 22, 0.88)` | `var(--card)` |
| 1063 | `rgba(18, 18, 22, 0.7)` | `var(--glass)` |
| 1110 | `rgba(0, 0, 0, 0.65)` | Keep (overlay backdrop) |
| 1121 | `#101014` | `var(--bg)` |
| 1150 | `rgba(255, 255, 255, 0.035)` | `var(--glass)` |
| 1247 | `rgba(0, 0, 0, 0.75)` | Keep (overlay backdrop) |
| 1256 | `#121216` | `var(--bg)` |
| 1270 | `rgba(255, 255, 255, 0.03)` | `var(--glass)` |

### 2B. Component inline styles → tokens

| File | Line(s) | Hardcoded | Replace with |
|---|---|---|---|
| `ExportModal.tsx` | 176 | `rgba(0,0,0,0.85)...` | `var(--shadow-heavy)` |
| `ExportModal.tsx` | 187 | `rgba(15, 23, 42, 0.5)` | `var(--glass)` |
| `ExportModal.tsx` | 245 | `#09090b` | `var(--bg)` |
| `ExportModal.tsx` | 251 | `rgba(0,0,0,0.5)` | Keep (inset shadow, theme-neutral) |
| `CodeCard.tsx` | 188 | `rgba(255,255,255,0.04)` | `var(--glass)` |
| `CodeCard.tsx` | 191 | `rgba(255,255,255,0.06)` | `var(--border)` |
| `MiniCanvasPreview.tsx` | 127-128 | `rgba(0,0,0,0.6/0.5)` | `var(--shadow-heavy)` |
| `MiniCanvasPreview.tsx` | 163 | `rgba(18, 18, 22, 0.9)` | `var(--card)` |
| `MiniCanvasPreview.tsx` | 167 | `rgba(0,0,0,0.5)` | `var(--shadow-heavy)` |
| `DashboardPage.tsx` | 261 | `rgba(0,0,0,0.65)...` | `var(--shadow-heavy)` |
| `CanvasPage.tsx` | 345 | `#09090b` | `var(--bg)` |

### 2C. Snapshot/export utilities (keep dark as-is)
These are canvas export utilities — they should remain code-driven, not theme-reactive. Export settings already let users choose background presets.

---

## Phase 3: Visibility color tokens

### New tokens in `tokens.css`

Add these to support component-level "border/glass/avatar" variations that need theme-specific values:

```css
:root {
  --tool-glass: rgba(18, 18, 22, 0.85);   /* floating toolbars */
  --tool-bg: rgba(22, 22, 26, 0.85);      /* radial menu */
  --av-border: #101014;                     /* avatar ring */
  --av-more-bg: #27272a;                   /* avatar overflow */
  --drawer-bg: #101014;                     /* mobile drawer */
}

[data-theme='light'] {
  --tool-glass: rgba(255, 255, 255, 0.85);
  --tool-bg: rgba(255, 255, 255, 0.9);
  --av-border: #fafafa;
  --av-more-bg: #d4d4d8;
  --drawer-bg: #ffffff;
}
```

---

## Phase 4: Theme toggle UI

### TopBar button (sun/moon)

**File**: `client/src/components/TopBar.tsx`

Add a toggle button between the `live` badge and the actions:

```tsx
import { Sun, Moon } from '@phosphor-icons/react';
import { useThemeStore } from '../stores/theme.store';

// Inside TopBar component:
const { mode, setMode } = useThemeStore(s => ({
  mode: s.mode,
  setMode: s.setMode,
}));

// Render between live badge and actions:
<button
  type="button"
  onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
  title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
  style={{
    background: 'none',
    border: 'none',
    color: mode === 'dark' ? 'var(--amber)' : 'var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  }}
>
  {mode === 'dark' ? <Sun size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
</button>
```

---

## Phase 5: Theme-aware mobile responsiveness

### Mobile drawer background
Already uses `var(--drawer-bg)` after Phase 3 fix.

### Mobile overlays
Overlay backgrounds (`rgba(0, 0, 0, 0.65)`, `rgba(0, 0, 0, 0.75)`) should stay dark even in light mode — these are backdrop dimmers for modals, not theme surfaces.

### prefers-color-scheme initial detection

**File**: `client/src/App.tsx` — add before the theme useEffect:

```tsx
// Set initial theme from localStorage OR system preference
useEffect(() => {
  const stored = useThemeStore.getState();
  // Only auto-detect on first visit (no stored preference)
  if (!localStorage.getItem('theme-prefs')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    useThemeStore.getState().setMode(prefersDark ? 'dark' : 'light');
  }
}, []);
```

---

## Phase 6: Clean up orphaned files

- **Delete** `client/src/index.css` — legacy Vite starter, not imported, completely separate token system
- **Remove** `client/src/App.css` — if unused (check if imported)

---

## Complete File Manifest

### Files to MODIFY

| File | Changes |
|---|---|
| `styles/tokens.css` | Add `[data-theme='light']` block + light overrides for all tokens + visibility tokens |
| `App.tsx` | Import `useThemeStore`, wire `data-theme`, accent CSS var, system preference detection |
| `styles/global.css` | Replace 18 hardcoded dark values → CSS custom properties |
| `components/TopBar.tsx` | Add theme toggle button (Sun/Moon) |
| `components/ExportModal.tsx` | Replace 4 hardcoded dark inline values → CSS vars |
| `components/CodeCard.tsx` | Replace 2 hardcoded dark inline values → CSS vars |
| `components/MiniCanvasPreview.tsx` | Replace 5 hardcoded dark inline values → CSS vars |
| `pages/DashboardPage.tsx` | Replace 1 hardcoded shadow → CSS var |
| `pages/CanvasPage.tsx` | Replace 1 hardcoded bg color → CSS var |

### Files to DELETE

| File | Reason |
|---|---|
| `index.css` | Orphaned Vite starter CSS, not imported anywhere |
| `App.css` | Check if imported — likely orphaned Vite template |

### Files UNCHANGED

| File | Reason |
|---|---|
| `stores/theme.store.ts` | Already correctly structured per skill pattern |
| `styles/styles.css` | Already has light/dark glass tokens, correct as-is |
| `utils/snapshotUtils.ts` | Export utilities — keep theme-agnostic |
| All page/component files not listed above | Already use CSS vars, no hardcoded colors |
| `styles/reset.css` | Uses `--bg`, `--fg` — already tokenized |
| `styles/join-hero.css` | Uses `--accent`, `--fg`, `--muted` — already tokenized |

---

## Verification Checklist

- [ ] Theme toggle switches `data-theme` on `<html>`
- [ ] Light mode: background is light, text is dark, glass surfaces are translucent white
- [ ] Dark mode: unchanged from current appearance
- [ ] All modals, drawers, tooltips render correctly in both themes
- [ ] Theme persists across page reloads (localStorage)
- [ ] First visit respects `prefers-color-scheme`
- [ ] Mobile drawer renders correctly in light mode
- [ ] Box shadows appropriate for each theme (subtle for light, heavy for dark)
- [ ] Accent color (cyan) remains visible on both light/dark backgrounds
- [ ] Export modal preview background adjusts to theme
