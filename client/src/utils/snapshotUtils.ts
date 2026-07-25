import html2canvas from 'html2canvas';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ExportBgStyle = 'dark-grid' | 'dark-solid' | 'light-grid' | 'transparent';

export interface EnhancedSnapshotOptions {
  bounds?: BoundingBox;
  scale?: number; // 1, 2, 4
  bgStyle?: ExportBgStyle;
  includeWatermark?: boolean;
  roomTitle?: string;
  roomCode?: string;
}

/**
 * Calculates the bounding box of all active spatial elements (cards, ink strokes, stickies)
 * with a generous margin padding.
 */
export function calculateCanvasContentBounds(
  cards: Array<{ x: number; y: number }>,
  strokes: Array<{ d: string }>,
  stickies: Array<{ x: number; y: number }>,
  padding = 60
): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let hasElements = false;

  // 1. Process Code Cards (assumed size ~380x240)
  cards.forEach(c => {
    hasElements = true;
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + 380);
    maxY = Math.max(maxY, c.y + 240);
  });

  // 2. Process AI Stickies (assumed size ~320x220)
  stickies.forEach(s => {
    hasElements = true;
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + 320);
    maxY = Math.max(maxY, s.y + 220);
  });

  // 3. Process Ink Strokes (extract numbers from SVG path string 'd')
  strokes.forEach(st => {
    if (!st.d) return;
    const nums = st.d.match(/[-+]?\d*\.?\d+/g);
    if (nums) {
      for (let i = 0; i < nums.length - 1; i += 2) {
        const px = parseFloat(nums[i]);
        const py = parseFloat(nums[i + 1]);
        if (!isNaN(px) && !isNaN(py)) {
          hasElements = true;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      }
    }
  });

  // Fallback if canvas is empty
  if (!hasElements) {
    return { x: 0, y: 0, w: 1200, h: 800 };
  }

  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const right = maxX + padding;
  const bottom = maxY + padding;

  return {
    x: left,
    y: top,
    w: Math.max(400, right - left),
    h: Math.max(300, bottom - top),
  };
}

/**
 * Captures a cropped snapshot of the spatial canvas within the specified bounding box.
 * Returns a base64 PNG data URL (or null if capture fails).
 */
export async function captureCanvasRegion(
  rect: BoundingBox,
  containerElem: HTMLElement
): Promise<string | null> {
  try {
    if (!containerElem || rect.w <= 0 || rect.h <= 0) return null;

    const canvas = await html2canvas(containerElem, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      ignoreElements: (element) => {
        return (
          element.classList.contains('ai-lasso-rect') ||
          element.classList.contains('peer-cursor') ||
          element.id === 'radial' ||
          element.classList.contains('topbar') ||
          element.classList.contains('zoom-controls') ||
          element.classList.contains('mobile-drawer-overlay')
        );
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(1, Math.round(rect.w));
    cropCanvas.height = Math.max(1, Math.round(rect.h));

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      canvas,
      Math.max(0, rect.x),
      Math.max(0, rect.y),
      rect.w,
      rect.h,
      0,
      0,
      rect.w,
      rect.h
    );

    return cropCanvas.toDataURL('image/png');
  } catch (err) {
    console.error('[SnapshotUtils] Failed to capture canvas region:', err);
    return null;
  }
}

/**
 * High-resolution canvas snapshot engine supporting 1x/2x/4x scaling,
 * background style presets (dark, light, grid, transparent), and optional branding watermark.
 */
export async function captureEnhancedSnapshot(
  containerElem: HTMLElement,
  options: EnhancedSnapshotOptions = {}
): Promise<string | null> {
  try {
    if (!containerElem) return null;

    const scale = options.scale || 2;
    const bgStyle = options.bgStyle || 'dark-grid';
    const includeWatermark = options.includeWatermark ?? true;
    const roomTitle = options.roomTitle || 'Orbit Workspace';
    const roomCode = options.roomCode || '8F2A';

    // 1. Render base html2canvas snapshot
    const rawCanvas = await html2canvas(containerElem, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: scale,
      ignoreElements: (element) => {
        return (
          element.classList.contains('ai-lasso-rect') ||
          element.classList.contains('peer-cursor') ||
          element.id === 'radial' ||
          element.classList.contains('topbar') ||
          element.classList.contains('zoom-controls') ||
          element.classList.contains('mobile-drawer-overlay')
        );
      },
    });

    if (!rawCanvas || rawCanvas.width === 0 || rawCanvas.height === 0) return null;

    const targetBounds = options.bounds || {
      x: 0,
      y: 0,
      w: rawCanvas.width / scale,
      h: rawCanvas.height / scale,
    };

    const cropW = Math.round(targetBounds.w * scale);
    const cropH = Math.round(targetBounds.h * scale);
    const watermarkHeight = includeWatermark ? 52 * scale : 0;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropW;
    finalCanvas.height = cropH + watermarkHeight;

    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return null;

    // 2. Draw Background Preset
    if (bgStyle === 'dark-solid') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    } else if (bgStyle === 'dark-grid') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const step = 24 * scale;
      for (let x = 12 * scale; x < finalCanvas.width; x += step) {
        for (let y = 12 * scale; y < finalCanvas.height - watermarkHeight; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (bgStyle === 'light-grid') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      const step = 24 * scale;
      for (let x = 12 * scale; x < finalCanvas.width; x += step) {
        for (let y = 12 * scale; y < finalCanvas.height - watermarkHeight; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // transparent style requires no background fill

    // 3. Draw Cropped Spatial Canvas Content
    ctx.drawImage(
      rawCanvas,
      targetBounds.x * scale,
      targetBounds.y * scale,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    // 4. Draw Branding Watermark Footer Badge
    if (includeWatermark) {
      const footerY = cropH;

      // Draw footer separator & background banner
      ctx.fillStyle = bgStyle === 'light-grid' ? '#e2e8f0' : 'rgba(24, 28, 43, 0.9)';
      ctx.fillRect(0, footerY, finalCanvas.width, watermarkHeight);

      ctx.strokeStyle = bgStyle === 'light-grid' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(0, footerY);
      ctx.lineTo(finalCanvas.width, footerY);
      ctx.stroke();

      // Text styling
      const textColor = bgStyle === 'light-grid' ? '#0f172a' : '#f8fafc';
      const accentColor = '#38bdf8';

      ctx.font = `600 ${14 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = textColor;

      // Left side: Orbit Logo + Room Title + Room Code
      const leftMargin = 20 * scale;
      const textY = footerY + 31 * scale;

      ctx.fillText(`Orbit Canvas • ${roomTitle}`, leftMargin, textY);

      const titleWidth = ctx.measureText(`Orbit Canvas • ${roomTitle}`).width;
      ctx.font = `600 ${12 * scale}px monospace`;
      ctx.fillStyle = accentColor;
      ctx.fillText(` #${roomCode}`, leftMargin + titleWidth, textY);

      // Right side: Date stamp
      const dateStr = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      ctx.font = `500 ${11 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = bgStyle === 'light-grid' ? '#64748b' : '#94a3b8';
      const rightText = `Exported: ${dateStr}`;
      const rightWidth = ctx.measureText(rightText).width;
      ctx.fillText(rightText, finalCanvas.width - rightWidth - (20 * scale), textY);
    }

    return finalCanvas.toDataURL('image/png');
  } catch (err) {
    console.error('[SnapshotUtils] Failed to capture enhanced snapshot:', err);
    return null;
  }
}
