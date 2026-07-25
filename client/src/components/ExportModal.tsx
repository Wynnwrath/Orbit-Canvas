import React, { useState, useEffect, useCallback } from 'react';
import {
  captureEnhancedSnapshot,
  calculateCanvasContentBounds
} from '../utils/snapshotUtils';
import type { ExportBgStyle } from '../utils/snapshotUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomTitle: string;
  viewportElem: HTMLElement | null;
  cards: any[];
  strokes: any[];
  stickies: any[];
  onToast: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomTitle,
  viewportElem,
  cards,
  strokes,
  stickies,
  onToast,
}) => {
  const [scope, setScope] = useState<'content' | 'viewport'>('content');
  const [scale, setScale] = useState<number>(2); // 1, 2, 4
  const [bgStyle, setBgStyle] = useState<ExportBgStyle>('dark-grid');
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generate preview image whenever options or visibility changes
  const generatePreview = useCallback(async () => {
    if (!isOpen || !viewportElem) return;
    setIsGenerating(true);

    let bounds;
    if (scope === 'content') {
      bounds = calculateCanvasContentBounds(cards, strokes, stickies, 60);
    }

    const dataUrl = await captureEnhancedSnapshot(viewportElem, {
      bounds,
      scale: Math.min(2, scale), // cap preview render scale at 2x for fast UI responsiveness
      bgStyle,
      includeWatermark,
      roomTitle,
      roomCode,
    });

    setPreviewUrl(dataUrl);
    setIsGenerating(false);
  }, [isOpen, viewportElem, scope, scale, bgStyle, includeWatermark, roomTitle, roomCode, cards, strokes, stickies]);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, generatePreview]);

  if (!isOpen) return null;

  // Helper to convert base64 DataURL to Blob for Clipboard & Download
  const renderFullResolutionBlob = async (): Promise<Blob | null> => {
    if (!viewportElem) return null;
    let bounds;
    if (scope === 'content') {
      bounds = calculateCanvasContentBounds(cards, strokes, stickies, 60);
    }

    const fullDataUrl = await captureEnhancedSnapshot(viewportElem, {
      bounds,
      scale, // full user-selected scale (1x, 2x, 4x)
      bgStyle,
      includeWatermark,
      roomTitle,
      roomCode,
    });

    if (!fullDataUrl) return null;
    const res = await fetch(fullDataUrl);
    return await res.blob();
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      onToast('Rendering high-resolution PNG...');
      const blob = await renderFullResolutionBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeTitle = (roomTitle || 'Canvas').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `Orbit-${safeTitle}-${roomCode}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        onToast('Export downloaded successfully!');
        onClose();
      } else {
        onToast('Failed to generate PNG image.');
      }
    } catch (_err) {
      onToast('Error exporting PNG image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      setIsGenerating(true);
      onToast('Rendering image for clipboard...');
      const blob = await renderFullResolutionBlob();
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        onToast('Image copied to clipboard!');
        onClose();
      } else {
        onToast('Clipboard API not supported in browser');
      }
    } catch (_err) {
      onToast('Failed to copy image to clipboard');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 13, 0.82)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 40px rgba(56, 189, 248, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Export Workspace PNG
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
              Studio-quality export with auto-framing, high-DPI scaling, and transparency options.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Split Controls & Live Preview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: '20px',
            padding: '24px',
            overflowY: 'auto',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Live Preview Frame */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              Export Preview
            </div>

            <div
              style={{
                minHeight: '260px',
                height: '320px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: bgStyle === 'light-grid' ? '#f8fafc' : '#09090b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
              }}
            >
              {isGenerating ? (
                <div style={{ fontSize: '13px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" /> Generating preview...
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    padding: '8px',
                  }}
                />
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Preview unavailable</div>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. Scope Option */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--fg)', marginBottom: '8px' }}>
                Framing Scope
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setScope('content')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: scope === 'content' ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: scope === 'content' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: scope === 'content' ? 'var(--accent)' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🎯 Auto-Fit Content
                </button>
                <button
                  type="button"
                  onClick={() => setScope('viewport')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: scope === 'viewport' ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: scope === 'viewport' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: scope === 'viewport' ? 'var(--accent)' : 'var(--muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🖥️ Current Viewport
                </button>
              </div>
            </div>

            {/* 2. Scale / Resolution Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--fg)', marginBottom: '8px' }}>
                Resolution Quality
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { value: 1, label: '1x Standard' },
                  { value: 2, label: '2x HD' },
                  { value: 4, label: '4x Ultra-HD' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setScale(item.value)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: scale === item.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: scale === item.value ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: scale === item.value ? 'var(--accent)' : 'var(--muted)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Background Preset */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--fg)', marginBottom: '8px' }}>
                Background Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'dark-grid', label: '🌌 Dark Grid' },
                  { id: 'dark-solid', label: '⬛ Solid Dark' },
                  { id: 'light-grid', label: '☀️ Light Grid' },
                  { id: 'transparent', label: '🔲 Transparent' },
                ].map(bg => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBgStyle(bg.id as ExportBgStyle)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: bgStyle === bg.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: bgStyle === bg.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: bgStyle === bg.id ? 'var(--accent)' : 'var(--muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Watermark Branding Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fg)' }}>Branded Watermark</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Include Room Code & Export Date Badge</div>
              </div>
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={e => setIncludeWatermark(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyToClipboard}
            disabled={isGenerating}
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            📋 Copy to Clipboard
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleDownload}
            disabled={isGenerating}
            style={{ padding: '9px 20px', fontSize: '13px' }}
          >
            ⬇️ Download PNG Image
          </button>
        </div>
      </div>
    </div>
  );
};
