import html2canvas from 'html2canvas';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
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

    // Hide UI elements that shouldn't be in the snapshot (like lasso rect or cursors)
    const canvas = await html2canvas(containerElem, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      ignoreElements: (element) => {
        // Ignore lasso rect overlay, remote cursors, or radial menu
        return (
          element.classList.contains('ai-lasso-rect') ||
          element.classList.contains('peer-cursor') ||
          element.id === 'radial' ||
          element.classList.contains('topbar') ||
          element.classList.contains('zoom-controls')
        );
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    // Create offscreen canvas for cropping to rect
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(1, Math.round(rect.w));
    cropCanvas.height = Math.max(1, Math.round(rect.h));

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return null;

    // Draw the cropped region from the full html2canvas output
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
