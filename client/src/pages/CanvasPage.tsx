import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CanvasBg } from '../components/CanvasBg';
import { TopBar } from '../components/TopBar';
import { CodeCard } from '../components/CodeCard';
import type { CodeCardData } from '../components/CodeCard';
import { RadialMenu } from '../components/RadialMenu';
import type { RadialTool } from '../components/RadialMenu';
import { AILasso } from '../components/AILasso';
import type { LassoRect } from '../components/AILasso';
import { AISticky } from '../components/AISticky';
import type { StickyData } from '../components/AISticky';
import { InkLayer } from '../components/InkLayer';
import type { InkStroke } from '../components/InkLayer';
import { PeerCursor } from '../components/PeerCursor';
import { Toast } from '../components/Toast';
import { HintBar } from '../components/HintBar';
import { ZoomControls } from '../components/ZoomControls';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { usePresence } from '../hooks/usePresence';
import { useSyncInk } from '../hooks/useSyncInk';
import { useSyncCards } from '../hooks/useSyncCards';
import { apiRequest } from '../services/api';
import { captureCanvasRegion } from '../utils/snapshotUtils';

export const CanvasPage: React.FC = () => {
  const { roomCode = '8F2A' } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name') || 'You';

  const { toastMessage, showToast } = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);

  // Socket Connection Hook
  const { socket, status: socketStatus } = useSocket(roomCode, userName);

  // Real Presence & Cursors Hook (No fake mock users)
  const { presenceUsers, remoteCursors, emitCursorMove } = usePresence(socket, roomCode, userName);

  const [mode, setMode] = useState<'idle' | 'pen' | 'lasso'>('idle');
  const [zTop, setZTop] = useState(40);
  const [zoom, setZoom] = useState<number>(1.0);

  // Cards state — Clean start (no default starter cards)
  const [cards, setCards] = useState<CodeCardData[]>([]);

  // Sync Cards Hook
  const { emitCardMove, emitCardAdd, emitCardUpdate } = useSyncCards(socket, setCards);

  // Ink Strokes state & Sync Hook
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<string | null>(null);
  const { emitStrokeAdd, emitClearCanvas } = useSyncInk(socket, setStrokes);

  // Stickies state
  const [stickies, setStickies] = useState<StickyData[]>([]);

  // Radial menu state
  const [radialState, setRadialState] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });

  // AI Lasso rect
  const [lassoRect, setLassoRect] = useState<LassoRect>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    visible: false,
    analyzing: false,
  });

  // Welcome toast
  useEffect(() => {
    document.title = `Orbit Canvas — #${roomCode}`;
    if (userName) {
      setTimeout(() => showToast(`Joined #${roomCode} as ${userName}`), 450);
    }
  }, [roomCode, userName, showToast]);

  // Body dataset mode attribute
  useEffect(() => {
    document.body.dataset.mode = mode;
    return () => {
      delete document.body.dataset.mode;
    };
  }, [mode]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoom(1.0);

  // Wheel zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom(z => Math.min(2.5, Math.max(0.4, +(z + delta).toFixed(2))));
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Z-Index bring to front
  const bringToFront = useCallback((id: string) => {
    setZTop(prev => {
      const nextZ = prev + 1;
      setCards(prevCards =>
        prevCards.map(c => (c.id === id ? { ...c, zIndex: nextZ } : c))
      );
      setStickies(prevStickies =>
        prevStickies.map(s => (s.id === id ? { ...s, zIndex: nextZ } : s))
      );
      return nextZ;
    });
  }, []);

  const updateCardPosition = (id: string, x: number, y: number) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, x, y } : c)));
    emitCardMove(id, x, y);
  };

  const updateCardText = (id: string, newText: string) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, rawText: newText } : c)));
    emitCardUpdate(id, newText);
  };

  const updateStickyPosition = (id: string, x: number, y: number) => {
    setStickies(prev => prev.map(s => (s.id === id ? { ...s, x, y } : s)));
  };

  // Radial Menu Open / Close
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const m = 95;
    const clientX = e.clientX / zoom;
    const clientY = e.clientY / zoom;
    const x = Math.min(Math.max(clientX, m), window.innerWidth / zoom - m);
    const y = Math.min(Math.max(clientY, m), window.innerHeight / zoom - m);
    setRadialState({ open: true, x, y });
  };

  const closeRadial = () => {
    setRadialState(prev => ({ ...prev, open: false }));
  };

  // Radial tool action
  const handleSelectTool = (tool: RadialTool, x: number, y: number) => {
    closeRadial();
    if (tool === 'pen') {
      setMode('pen');
      showToast('Pen armed — drag to draw. Esc to stop.');
    } else if (tool === 'lasso') {
      setMode('lasso');
      showToast('Lasso armed — drag a box around drawings or code.');
    } else if (tool === 'trash') {
      setStrokes([]);
      setStickies([]);
      setCards([]);
      emitClearCanvas();
      showToast('Canvas cleared');
    } else if (tool === 'code') {
      const newCardId = `card-extra-${Date.now()}`;
      const newZ = zTop + 1;
      setZTop(newZ);
      const newCard: CodeCardData = {
        id: newCardId,
        filename: 'snippet.ts',
        rawText: `// Type or paste your code here\nconst greeting = "Hello, Orbit Canvas!";`,
        x: Math.min(Math.max(x + 40, 12), window.innerWidth / zoom - 380),
        y: Math.min(Math.max(y - 20, 80), window.innerHeight / zoom - 200),
        zIndex: newZ,
        isExtra: true,
      };
      setCards(prev => [...prev, newCard]);
      emitCardAdd(newCard);
      showToast('Code card dropped');
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRadial();
        setMode('idle');
        setLassoRect({ x: 0, y: 0, w: 0, h: 0, visible: false, analyzing: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pointer move broadcast for local cursor
  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    const canvasX = e.clientX / zoom;
    const canvasY = e.clientY / zoom;
    emitCursorMove(canvasX, canvasY);
  };

  // Pointer Down handling for canvas interactions
  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (radialState.open && !(e.target as HTMLElement).closest('#radial')) {
      closeRadial();
    }

    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, .topbar, #radial, .code-card, .sticky, .zoom-controls')) return;

    const startX = e.clientX / zoom;
    const startY = e.clientY / zoom;

    // Pen mode drawing
    if (mode === 'pen') {
      let d = `M ${startX} ${startY}`;
      setCurrentStroke(d);

      const handleMove = (ev: PointerEvent) => {
        const curX = ev.clientX / zoom;
        const curY = ev.clientY / zoom;
        d += ` L ${curX} ${curY}`;
        setCurrentStroke(d);
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);

        const newStroke: InkStroke = { id: `stroke-${Date.now()}`, d };
        setStrokes(prev => [...prev, newStroke]);
        emitStrokeAdd(newStroke);
        setCurrentStroke(null);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    }

    // Lasso mode selection
    if (mode === 'lasso') {
      const sx = startX;
      const sy = startY;
      setLassoRect({ x: sx, y: sy, w: 0, h: 0, visible: true, analyzing: false });

      const handleMove = (ev: PointerEvent) => {
        const moveX = ev.clientX / zoom;
        const moveY = ev.clientY / zoom;
        const curX = Math.min(sx, moveX);
        const curY = Math.min(sy, moveY);
        const w = Math.abs(moveX - sx);
        const h = Math.abs(moveY - sy);
        setLassoRect({ x: curX, y: curY, w, h, visible: true, analyzing: false });
      };

      const handleUp = async (ev: PointerEvent) => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);

        const endX = ev.clientX / zoom;
        const endY = ev.clientY / zoom;
        const finalW = Math.abs(endX - sx);
        const finalH = Math.abs(endY - sy);

        if (finalW > 30 && finalH > 30) {
          const lassoBounds = {
            x: Math.min(sx, endX),
            y: Math.min(sy, endY),
            w: finalW,
            h: finalH,
          };

          // Trigger analyzing animation
          setLassoRect(prev => ({ ...prev, analyzing: true }));

          // Capture region screenshot from spatial viewport
          let regionSnapshot: string | null = null;
          if (viewportRef.current) {
            regionSnapshot = await captureCanvasRegion(lassoBounds, viewportRef.current);
          }

          const finalLasso = {
            left: lassoBounds.x,
            top: lassoBounds.y,
            right: lassoBounds.x + lassoBounds.w,
            bottom: lassoBounds.y + lassoBounds.h,
          };

          let hitCard: CodeCardData | null = null;
          cards.forEach(card => {
            const cardRight = card.x + 380;
            const cardBottom = card.y + 240;
            const isOverlapping = !(
              finalLasso.right < card.x ||
              finalLasso.left > cardRight ||
              finalLasso.bottom < card.y ||
              finalLasso.top > cardBottom
            );
            if (isOverlapping) hitCard = card;
          });

          setLassoRect({ x: 0, y: 0, w: 0, h: 0, visible: false, analyzing: false });
          await spawnSticky(finalLasso.right, finalLasso.top, hitCard, regionSnapshot);
          setMode('idle');
        } else {
          setLassoRect({ x: 0, y: 0, w: 0, h: 0, visible: false, analyzing: false });
          setMode('idle');
        }
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    }
  };

  const spawnSticky = async (
    rRight: number,
    rTop: number,
    hitCard: CodeCardData | null,
    imageSnapshot?: string | null
  ) => {
    let spawnX = rRight + 18;
    if (spawnX + 352 > window.innerWidth / zoom - 12) {
      spawnX = Math.max(12, rRight - 370);
    }
    const spawnY = Math.min(Math.max(rTop, 86), window.innerHeight / zoom - 280);
    const newZ = zTop + 1;
    setZTop(newZ);

    showToast('Analyzing drawing & code with Gemini AI...');

    const res = await apiRequest<{ title: string; bodyHtml: string; tip?: string }>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        content: hitCard ? hitCard.rawText : '',
        context: hitCard ? hitCard.filename : 'drawing region',
        image: imageSnapshot || undefined,
        roomCode,
      })
    });

    const newSticky: StickyData = {
      id: `sticky-${Date.now()}`,
      x: spawnX,
      y: spawnY,
      zIndex: newZ,
      title: 'SMART TUTOR',
      bodyHtml: res.ok && res.data ? res.data.bodyHtml : `<b>AI Error</b><br />Failed to analyze content.`,
      tip: res.ok && res.data ? res.data.tip : undefined,
    };

    setStickies(prev => [...prev, newSticky]);
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/canvas/${roomCode}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        showToast('Room link copied');
      } else {
        showToast(link);
      }
    } catch (_err) {
      showToast(link);
    }
  };

  const dismissSticky = (id: string) => {
    setStickies(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDownCanvas}
      onPointerMove={handlePointerMoveCanvas}
    >
      <CanvasBg />

      <TopBar
        roomCode={roomCode}
        onShare={handleShare}
        users={presenceUsers}
        isLive={socketStatus === 'connected'}
      />

      {/* Spatial Canvas Container with Zoom Transform */}
      <div
        ref={viewportRef}
        className="canvas-spatial-viewport"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
          width: `${100 / zoom}vw`,
          height: `${100 / zoom}vh`,
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto',
        }}
      >
        <InkLayer strokes={strokes} currentStrokeD={currentStroke || undefined} />

        {cards.map(card => (
          <CodeCard
            key={card.id}
            card={card}
            onGrab={bringToFront}
            onMove={updateCardPosition}
            onCodeChange={updateCardText}
            onToast={showToast}
          />
        ))}

        {stickies.map(sticky => (
          <AISticky
            key={sticky.id}
            sticky={sticky}
            onDismiss={dismissSticky}
            onGrab={bringToFront}
            onMove={updateStickyPosition}
          />
        ))}

        <AILasso rect={lassoRect} />

        <RadialMenu
          isOpen={radialState.open}
          x={radialState.x}
          y={radialState.y}
          onSelectTool={handleSelectTool}
          onClose={closeRadial}
        />

        {remoteCursors.map(peer => (
          <PeerCursor key={peer.id} peer={peer} />
        ))}
      </div>

      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      <HintBar mode={mode} />
      <Toast message={toastMessage} />
    </div>
  );
};
