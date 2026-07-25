import React from 'react';
import {
  Minus,
  Plus,
  Crosshair,
  ArrowCounterClockwise,
  ArrowClockwise,
  HandPalm,
  PencilSimple,
  Eraser,
  Sparkle,
} from '@phosphor-icons/react';

interface ZoomControlsProps {
  zoom: number;
  pan?: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  mode?: 'select' | 'pen' | 'eraser' | 'lasso';
  onSetMode?: (mode: 'select' | 'pen' | 'eraser' | 'lasso') => void;
  onTriggerRadial?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  pan = { x: 0, y: 0 },
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  mode = 'select',
  onSetMode,
  onTriggerRadial,
}) => {
  const percentStr = `${Math.round(zoom * 100)}%`;

  return (
    <div
      className="zoom-controls-wrapper"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {/* Coordinate Badge (Hidden on Mobile via CSS) */}
      <div
        className="coord-badge glass-medium topbar-desktop-nav"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 10px',
          letterSpacing: '0.04em',
        }}
      >
        X: {Math.round(-pan.x)} Y: {Math.round(-pan.y)}
      </div>

      {/* Undo & Redo Quick Action Buttons */}
      {(onUndo || onRedo) && (
        <div
          className="glass-medium"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)',
          }}
        >
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo recent action (Ctrl+Z / ↶)"
              aria-label="Undo action"
              style={{
                background: 'transparent',
                border: 'none',
                color: canUndo ? 'var(--fg)' : 'var(--faint)',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease, opacity 0.15s ease',
                opacity: canUndo ? 1 : 0.4,
              }}
            >
              <ArrowCounterClockwise size={18} weight="bold" />
            </button>
          )}

          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo action (Ctrl+Y / ↷)"
              aria-label="Redo action"
              style={{
                background: 'transparent',
                border: 'none',
                color: canRedo ? 'var(--fg)' : 'var(--faint)',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease, opacity 0.15s ease',
                opacity: canRedo ? 1 : 0.4,
              }}
            >
              <ArrowClockwise size={18} weight="bold" />
            </button>
          )}
        </div>
      )}

      {/* Touch-friendly Mode Selector Buttons */}
      {onSetMode && (
        <div
          className="glass-medium"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)',
          }}
        >
          <button
            type="button"
            onClick={() => onSetMode('select')}
            title="Pan / Select Canvas Mode"
            aria-label="Pan / Select Mode"
            style={{
              background: mode === 'select' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: mode === 'select' ? '1px solid var(--accent)' : 'none',
              color: mode === 'select' ? 'var(--accent)' : 'var(--fg)',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <HandPalm size={18} weight={mode === 'select' ? 'fill' : 'regular'} />
          </button>

          <button
            type="button"
            onClick={() => onSetMode('pen')}
            title="Pen Freehand Drawing Mode"
            aria-label="Pen Mode"
            style={{
              background: mode === 'pen' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: mode === 'pen' ? '1px solid var(--accent)' : 'none',
              color: mode === 'pen' ? 'var(--accent)' : 'var(--fg)',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <PencilSimple size={18} weight={mode === 'pen' ? 'fill' : 'regular'} />
          </button>

          <button
            type="button"
            onClick={() => onSetMode('eraser')}
            title="Eraser Mode"
            aria-label="Eraser Mode"
            style={{
              background: mode === 'eraser' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              border: mode === 'eraser' ? '1px solid rgba(239, 68, 68, 0.6)' : 'none',
              color: mode === 'eraser' ? '#ef4444' : 'var(--fg)',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Eraser size={18} weight={mode === 'eraser' ? 'fill' : 'regular'} />
          </button>

          {onTriggerRadial && (
            <button
              type="button"
              onClick={onTriggerRadial}
              title="Open AI Radial Menu"
              aria-label="Radial Menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--live, #a855f7)',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkle size={18} weight="fill" />
            </button>
          )}
        </div>
      )}

      {/* Zoom Controls */}
      <div
        className="zoom-controls glass-medium"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36)',
        }}
      >
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            width: '32px',
            height: '36px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          <Minus size={14} weight="bold" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          title="Center & Reset View (100%)"
          aria-label="Reset Zoom and Center Canvas"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--faint)',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            padding: '0 6px',
            height: '36px',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Crosshair size={12} weight="regular" />
          {percentStr}
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            width: '32px',
            height: '36px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};
