import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
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
import { PenToolbar } from '../components/PenToolbar';
import { CanvasScopeBoundary } from '../components/CanvasScopeBoundary';
import { PeerCursor } from '../components/PeerCursor';
import { Toast } from '../components/Toast';
import { HintBar } from '../components/HintBar';
import { ZoomControls } from '../components/ZoomControls';
import { ExportModal } from '../components/ExportModal';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { usePresence } from '../hooks/usePresence';
import { useSyncInk } from '../hooks/useSyncInk';
import { useSyncCards } from '../hooks/useSyncCards';
import { useSavedRooms } from '../hooks/useSavedRooms';
import { apiRequest } from '../services/api';
import { captureCanvasRegion } from '../utils/snapshotUtils';

export const CanvasPage: React.FC = () => {
  const { roomCode = '8F2A' } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name') || 'You';

  const { savedRooms, addSavedRoom } = useSavedRooms();
  const [roomTitle, setRoomTitle] = useState<string>(() => {
    const uppercaseCode = (roomCode || '8F2A').toUpperCase();
    const match = savedRooms.find(r => r.code === uppercaseCode);
    return match?.title || '';
  });

  const { toastMessage, showToast } = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);

  // Socket Connection Hook
  const { socket, status: socketStatus } = useSocket(roomCode, userName);

  // Real Presence & Cursors Hook
  const { presenceUsers, remoteCursors, emitCursorMove } = usePresence(socket, roomCode, userName);

  const [mode, setMode] = useState<'idle' | 'pen' | 'lasso' | 'eraser'>('idle');
  const [penColor, setPenColor] = useState<string>('#22d3ee');
  const [penWidth, setPenWidth] = useState<number>(4);

  const [zTop, setZTop] = useState(40);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);

  // Cards state & Sync Hook
  const [cards, setCards] = useState<CodeCardData[]>([]);
  const { emitCardMove, emitCardAdd, emitCardUpdate, emitCardDelete } = useSyncCards(socket, setCards);

  // Ink Strokes state & Sync Hook
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<string | null>(null);

  // Stickies state
  const [stickies, setStickies] = useState<StickyData[]>([]);

  const { emitStrokeAdd, emitStrokeMove, emitStrokeDelete, emitClearCanvas } = useSyncInk(socket, setStrokes, setCards, setStickies);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Radial menu state in screen and canvas space
  const [radialState, setRadialState] = useState<{
    open: boolean;
    screenX: number;
    screenY: number;
    canvasX: number;
    canvasY: number;
  }>({
    open: false,
    screenX: 0,
    screenY: 0,
    canvasX: 0,
    canvasY: 0,
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

  const cancelSingleTouchPanRef = useRef<(() => void) | null>(null);

  // Touch gesture refs (Multi-Touch Pinch/Pan, Long-Press Timer, Palm Rejection)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1.0);
  const initialPinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // History stacks for Ctrl+Z Undo / Ctrl+Y Redo
  type CanvasSnapshot = { strokes: InkStroke[]; cards: CodeCardData[]; stickies: StickyData[] };
  const historyStackRef = useRef<CanvasSnapshot[]>([]);
  const redoStackRef = useRef<CanvasSnapshot[]>([]);
  const [, setHistoryVersion] = useState(0);

  const saveHistorySnapshot = useCallback(() => {
    historyStackRef.current.push({
      strokes: [...strokes],
      cards: [...cards],
      stickies: [...stickies],
    });
    redoStackRef.current = [];
    if (historyStackRef.current.length > 50) {
      historyStackRef.current.shift();
    }
    setHistoryVersion(v => v + 1);
  }, [strokes, cards, stickies]);

  const handleUndo = useCallback(() => {
    if (historyStackRef.current.length === 0) {
      showToast('Nothing to undo');
      return;
    }
    redoStackRef.current.push({
      strokes: [...strokes],
      cards: [...cards],
      stickies: [...stickies],
    });
    const prevSnapshot = historyStackRef.current.pop()!;
    setStrokes(prevSnapshot.strokes);
    setCards(prevSnapshot.cards);
    setStickies(prevSnapshot.stickies);
    setHistoryVersion(v => v + 1);
    showToast('Undo');
  }, [strokes, cards, stickies, showToast]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) {
      showToast('Nothing to redo');
      return;
    }
    historyStackRef.current.push({
      strokes: [...strokes],
      cards: [...cards],
      stickies: [...stickies],
    });
    const nextSnapshot = redoStackRef.current.pop()!;
    setStrokes(nextSnapshot.strokes);
    setCards(nextSnapshot.cards);
    setStickies(nextSnapshot.stickies);
    setHistoryVersion(v => v + 1);
    showToast('Redo');
  }, [strokes, cards, stickies, showToast]);

  // Individual stroke & card handlers
  const handleDeleteStroke = useCallback((strokeId: string) => {
    saveHistorySnapshot();
    setStrokes(prev => prev.filter(s => s.id !== strokeId));
    emitStrokeDelete(strokeId);
    showToast('Erased ink stroke');
  }, [emitStrokeDelete, showToast, saveHistorySnapshot]);

  const handleMoveStroke = useCallback((strokeId: string, x: number, y: number) => {
    setStrokes(prev => prev.map(s => (s.id === strokeId ? { ...s, x, y } : s)));
    emitStrokeMove(strokeId, x, y);
  }, [emitStrokeMove]);

  const handleDeleteCard = useCallback((cardId: string) => {
    saveHistorySnapshot();
    setCards(prev => prev.filter(c => c.id !== cardId));
    emitCardDelete(cardId);
    showToast('Deleted code card');
  }, [emitCardDelete, showToast, saveHistorySnapshot]);

  // Spacebar pan key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  // Visual Viewport API listener to handle mobile virtual keyboard shifts smoothly
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportResize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vv-height', `${vh}px`);
    };
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);
    handleViewportResize();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
    };
  }, []);

  // Restore spatial room snapshot from Cloud on mount
  useEffect(() => {
    let isMounted = true;
    const restoreRoomState = async () => {
      try {
        const res = await apiRequest<{ title?: string; snapshot?: { cards?: any[]; strokes?: any[]; stickies?: any[] } }>(`/api/rooms/${roomCode}`);
        if (isMounted && res.ok && res.data) {
          const title = res.data.title || roomTitle || `Workspace #${roomCode}`;
          setRoomTitle(title);
          addSavedRoom(roomCode, title);
          document.title = `${title} (#${roomCode}) | Orbit Canvas`;

          if (res.data.snapshot) {
            const snapshot = res.data.snapshot;
            if (snapshot.cards && snapshot.cards.length > 0) {
              setCards(snapshot.cards.map((c: any) => ({
                id: c.id,
                filename: c.filename || 'snippet.ts',
                rawText: c.rawText || c.content || '',
                x: c.x,
                y: c.y,
                zIndex: c.zIndex || 20,
                isExtra: c.id !== 'card-1' && c.id !== 'card1',
              })));
            }
            if (snapshot.strokes && snapshot.strokes.length > 0) {
              setStrokes(snapshot.strokes.map((s: any) => ({
                id: s.id,
                d: s.d,
                color: s.color || '#22d3ee',
                strokeWidth: s.strokeWidth || 4,
              })));
            }
            if (snapshot.stickies && snapshot.stickies.length > 0) {
              setStickies(snapshot.stickies.map((st: any) => ({
                id: st.id,
                x: st.x,
                y: st.y,
                zIndex: st.zIndex || 20,
                title: st.title || 'SMART TUTOR',
                bodyHtml: st.bodyHtml || '',
                tip: st.tip,
              })));
            }
          }
        }
      } catch (_err) {
        addSavedRoom(roomCode, roomTitle || `Workspace #${roomCode}`);
      }
    };
    restoreRoomState();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  // Spatial Element Snapshot Sync helper
  const syncSpatialSnapshot = useCallback(async () => {
    const snapshot = {
      cards: cards.map(c => ({ id: c.id, filename: c.filename, rawText: c.rawText, x: c.x, y: c.y, zIndex: c.zIndex })),
      strokes: strokes.map(s => ({ id: s.id, d: s.d, color: s.color, strokeWidth: s.strokeWidth })),
      stickies: stickies.map(st => ({ id: st.id, title: st.title, bodyHtml: st.bodyHtml, tip: st.tip, x: st.x, y: st.y, zIndex: st.zIndex })),
    };

    await apiRequest(`/api/rooms/${roomCode}/snapshot`, {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    });
  }, [roomCode, cards, strokes, stickies]);

  // Canvas Image Snapshot helper to upload real room thumbnail
  const saveCanvasPreview = useCallback(async () => {
    if (!viewportRef.current) return;
    try {
      // Save current user view state
      const prevZoom = zoom;
      const prevPan = { ...pan };

      // Reset to canonical view for clean capture
      setZoom(1);
      setPan({ x: 0, y: 0 });

      // Wait two frames for DOM transform update
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

      // Restore previous user view
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

  // Manual save handler
  const handleManualSave = async () => {
    showToast('Saving canvas to cloud...');
    await syncSpatialSnapshot();
    await saveCanvasPreview();
    showToast('Canvas saved to cloud');
  };

  // Manual PNG Export handler
  const handleExportPNG = () => {
    setIsExportModalOpen(true);
  };

  // Trigger background spatial vector snapshot & canvas image preview save
  useEffect(() => {
    const timer = setTimeout(() => {
      syncSpatialSnapshot();
      saveCanvasPreview();
    }, 3000);
    return () => clearTimeout(timer);
  }, [cards, strokes, stickies, syncSpatialSnapshot, saveCanvasPreview]);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // RAF animation refs for smooth panning & cursor movement throttling
  const panRafRef = useRef<number>(0);
  const moveRafRef = useRef<number>(0);
  const emitPendingRef = useRef<{ canvasX: number; canvasY: number } | null>(null);

  // Mouse Wheel (2D Pan) & Ctrl/Meta + Wheel Zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow native scroll for elements with overflow scroll/auto (e.g. code card <pre> blocks)
      const target = e.target as HTMLElement;
      const scrollable = target.closest('pre, .scrollable, [data-scrollable], textarea');
      if (scrollable && !e.ctrlKey && !e.metaKey) {
        return; // Let native element scroll work
      }

      e.preventDefault();
      const isZoom = e.ctrlKey || e.metaKey;
      if (isZoom) {
        let zoomDelta = -e.deltaY;
        if (e.deltaMode === 1) zoomDelta *= 20;
        else if (e.deltaMode === 2) zoomDelta *= 300;

        const factor = Math.pow(1.0015, zoomDelta);

        setZoom(currentZoom => {
          const rawNext = currentZoom * factor;
          const nextZoom = Math.min(2.5, Math.max(0.4, +rawNext.toFixed(3)));
          if (nextZoom !== currentZoom) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            setPan(currentPan => ({
              x: mouseX - (mouseX - currentPan.x) * (nextZoom / currentZoom),
              y: mouseY - (mouseY - currentPan.y) * (nextZoom / currentZoom),
            }));
          }
          return nextZoom;
        });
      } else {
        // Normalize delta values depending on deltaMode (Pixel vs Line vs Page)
        let scale = 1;
        if (e.deltaMode === 1) scale = 24; // DOM_DELTA_LINE
        else if (e.deltaMode === 2) scale = 400; // DOM_DELTA_PAGE

        const rawDx = e.deltaX * scale;
        const rawDy = e.deltaY * scale;

        let moveX = 0;
        let moveY = 0;

        if (e.shiftKey) {
          // Shift + Wheel converts vertical wheel spin to horizontal panning
          moveX = rawDx !== 0 ? rawDx : rawDy;
          moveY = 0;
        } else {
          moveX = rawDx;
          moveY = rawDy;
        }

        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = requestAnimationFrame(() => {
          setPan(currentPan => ({
            x: currentPan.x - moveX,
            y: currentPan.y - moveY,
          }));
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(panRafRef.current);
    };
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
    if (socket && socket.connected) {
      socket.emit('sticky-move', { stickyId: id, x, y });
    }
  };

  // Radial Menu Open / Close with Screen-Level Positioning
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const margin = 80;
    const screenX = Math.min(Math.max(e.clientX, margin), window.innerWidth - margin);
    const screenY = Math.min(Math.max(e.clientY, margin), window.innerHeight - margin);
    const canvasX = (screenX - pan.x) / zoom;
    const canvasY = (screenY - pan.y) / zoom;

    setRadialState({
      open: true,
      screenX,
      screenY,
      canvasX,
      canvasY,
    });
  };

  const closeRadial = () => {
    setRadialState(prev => ({ ...prev, open: false }));
  };

  // Radial tool action
  const handleSelectTool = (tool: RadialTool) => {
    closeRadial();
    if (tool === 'pen') {
      setMode('pen');
      showToast('Pen armed — drag to draw. Esc to stop.');
    } else if (tool === 'eraser') {
      setMode('eraser');
      showToast('Eraser armed — click ink or cards to delete. Esc to stop.');
    } else if (tool === 'lasso') {
      setMode('lasso');
      showToast('Lasso armed — drag a box around drawings or code.');
    } else if (tool === 'trash') {
      saveHistorySnapshot();
      setStrokes([]);
      setStickies([]);
      setCards([]);
      emitClearCanvas();
      showToast('Canvas cleared');
    } else if (tool === 'code') {
      saveHistorySnapshot();
      const newCardId = `card-extra-${Date.now()}`;
      const newZ = zTop + 1;
      setZTop(newZ);

      const targetX = radialState.canvasX;
      const targetY = radialState.canvasY;

      const newCard: CodeCardData = {
        id: newCardId,
        filename: 'snippet.ts',
        rawText: `// Double click to edit code!\nconst greeting = "Hello, Orbit Canvas!";`,
        x: targetX,
        y: targetY,
        zIndex: newZ,
        isExtra: true,
      };
      setCards(prev => [...prev, newCard]);
      emitCardAdd(newCard);
      showToast('Code card dropped — double click to edit!');
    }
  };

  // Keyboard shortcut listener (Escape, Ctrl+Z Undo, Ctrl+Y Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRadial();
        setMode('idle');
        setLassoRect({ x: 0, y: 0, w: 0, h: 0, visible: false, analyzing: false });
      }

      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );

      if ((e.ctrlKey || e.metaKey) && !isInputFocused) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Pointer move broadcast for local cursor
  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;
    
    emitPendingRef.current = { canvasX, canvasY };
    cancelAnimationFrame(moveRafRef.current);
    moveRafRef.current = requestAnimationFrame(() => {
      if (emitPendingRef.current) {
        emitCursorMove(emitPendingRef.current.canvasX, emitPendingRef.current.canvasY);
        emitPendingRef.current = null;
      }
    });

    // Cancel long-press timer if finger moves beyond 10px threshold
    if (touchStartPosRef.current && longPressTimerRef.current && e.pointerType === 'touch') {
      const moveDist = Math.hypot(e.clientX - touchStartPosRef.current.x, e.clientY - touchStartPosRef.current.y);
      if (moveDist > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  // Pointer Down handling for canvas interactions & Middle Click / Spacebar Panning / Touch Gestures
  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (radialState.open && !(e.target as HTMLElement).closest('#radial')) {
      closeRadial();
    }

    // Palm Rejection: Ignore large contact area touches (>25px)
    if (e.pointerType === 'touch' && (e.width > 25 || e.height > 25)) {
      return;
    }

    // Track active touch pointer
    if (e.pointerType === 'touch') {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Long-press timer for radial menu on single touch
      if (activePointersRef.current.size === 1) {
        touchStartPosRef.current = { x: e.clientX, y: e.clientY };
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(15);
          const cX = (e.clientX - pan.x) / zoom;
          const cY = (e.clientY - pan.y) / zoom;
          setRadialState({ open: true, screenX: e.clientX, screenY: e.clientY, canvasX: cX, canvasY: cY });
        }, 350);
      } else if (activePointersRef.current.size >= 2) {
        // Clear long-press timer & single touch pan listener when multi-touch pinch starts
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        if (cancelSingleTouchPanRef.current) {
          cancelSingleTouchPanRef.current();
          cancelSingleTouchPanRef.current = null;
        }

        // Initialize two-finger pinch baseline
        const pointers = Array.from(activePointersRef.current.values());
        const dist = Math.hypot(pointers[1].x - pointers[0].x, pointers[1].y - pointers[0].y);
        initialPinchDistRef.current = dist;
        initialPinchZoomRef.current = zoom;
        initialPinchMidRef.current = {
          x: (pointers[0].x + pointers[1].x) / 2,
          y: (pointers[0].y + pointers[1].y) / 2,
        };
        initialPanRef.current = { ...pan };

        const handleTouchMove = (ev: PointerEvent) => {
          if (activePointersRef.current.has(ev.pointerId)) {
            activePointersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
          }
          if (activePointersRef.current.size === 2 && initialPinchDistRef.current && initialPinchMidRef.current) {
            const pts = Array.from(activePointersRef.current.values());
            const curDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const scaleRatio = curDist / initialPinchDistRef.current;
            const newZoom = Math.min(Math.max(initialPinchZoomRef.current * scaleRatio, 0.4), 2.5);
            setZoom(newZoom);

            const curMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
            const dx = curMid.x - initialPinchMidRef.current.x;
            const dy = curMid.y - initialPinchMidRef.current.y;
            setPan({ x: initialPanRef.current.x + dx, y: initialPanRef.current.y + dy });
          }
        };

        const handleTouchUp = (ev: PointerEvent) => {
          activePointersRef.current.delete(ev.pointerId);
          if (activePointersRef.current.size < 2) {
            initialPinchDistRef.current = null;
            initialPinchMidRef.current = null;
          }
          window.removeEventListener('pointermove', handleTouchMove);
          window.removeEventListener('pointerup', handleTouchUp);
          window.removeEventListener('pointercancel', handleTouchUp);
        };

        window.addEventListener('pointermove', handleTouchMove);
        window.addEventListener('pointerup', handleTouchUp);
        window.addEventListener('pointercancel', handleTouchUp);
        return;
      }
    }

    // Touch single-finger canvas pan in idle mode
    if (e.pointerType === 'touch' && mode === 'idle' && !(e.target as HTMLElement).closest('button, input, textarea, .topbar, #radial, .code-card, .sticky, .zoom-controls, .pen-toolbar, svg#ink path')) {
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;

      const handleSingleTouchPanMove = (ev: PointerEvent) => {
        if (touchStartPosRef.current && longPressTimerRef.current) {
          const mDist = Math.hypot(ev.clientX - touchStartPosRef.current.x, ev.clientY - touchStartPosRef.current.y);
          if (mDist > 10) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
        setPan({ x: startPanX + dx, y: startPanY + dy });
      };

      const handleSingleTouchPanUp = (ev: PointerEvent) => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        activePointersRef.current.delete(ev.pointerId);
        window.removeEventListener('pointermove', handleSingleTouchPanMove);
        window.removeEventListener('pointerup', handleSingleTouchPanUp);
        window.removeEventListener('pointercancel', handleSingleTouchPanUp);
        cancelSingleTouchPanRef.current = null;
      };

      cancelSingleTouchPanRef.current = () => {
        window.removeEventListener('pointermove', handleSingleTouchPanMove);
        window.removeEventListener('pointerup', handleSingleTouchPanUp);
        window.removeEventListener('pointercancel', handleSingleTouchPanUp);
      };

      window.addEventListener('pointermove', handleSingleTouchPanMove);
      window.addEventListener('pointerup', handleSingleTouchPanUp);
      window.addEventListener('pointercancel', handleSingleTouchPanUp);
      return;
    }

    // Canvas Background Panning (Middle click, Spacebar + Left click, or Left click on Canvas BG in idle mode)
    const isInteractiveElement = !!(e.target as HTMLElement).closest('button, input, textarea, .topbar, #radial, .code-card, .sticky, .zoom-controls, .pen-toolbar');

    if (e.button === 1 || isSpacePressed || (e.button === 0 && mode === 'idle' && !isInteractiveElement)) {
      setIsDraggingPan(true);
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;

      const handlePanMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
        setPan({ x: startPanX + dx, y: startPanY + dy });
      };

      const handlePanUp = () => {
        setIsDraggingPan(false);
        window.removeEventListener('pointermove', handlePanMove);
        window.removeEventListener('pointerup', handlePanUp);
      };

      window.addEventListener('pointermove', handlePanMove);
      window.addEventListener('pointerup', handlePanUp);
      return;
    }

    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, .topbar, #radial, .code-card, .sticky, .zoom-controls, .pen-toolbar')) return;

    const startX = (e.clientX - pan.x) / zoom;
    const startY = (e.clientY - pan.y) / zoom;

    // Pen mode drawing with pointer capture & Bezier smoothing
    if (mode === 'pen') {
      const targetElem = e.target as HTMLElement;
      if (targetElem.setPointerCapture) {
        try {
          targetElem.setPointerCapture(e.pointerId);
        } catch (_err) {
          // ignore pointer capture error
        }
      }

      const strokePoints: { x: number; y: number }[] = [{ x: startX, y: startY }];

      const getSmoothPathStr = (pts: { x: number; y: number }[]) => {
        if (pts.length === 0) return '';
        if (pts.length < 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;
        if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
        let pathStr = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          pathStr += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
        }
        pathStr += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
        return pathStr;
      };

      setCurrentStroke(getSmoothPathStr(strokePoints));

      const handleMove = (ev: PointerEvent) => {
        const curX = (ev.clientX - pan.x) / zoom;
        const curY = (ev.clientY - pan.y) / zoom;
        const lastPt = strokePoints[strokePoints.length - 1];
        if (!lastPt || Math.abs(lastPt.x - curX) > 0.5 || Math.abs(lastPt.y - curY) > 0.5) {
          strokePoints.push({ x: curX, y: curY });
          setCurrentStroke(getSmoothPathStr(strokePoints));
        }
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);

        if (targetElem.releasePointerCapture) {
          try {
            targetElem.releasePointerCapture(e.pointerId);
          } catch (_err) {
            // ignore
          }
        }

        const finalD = getSmoothPathStr(strokePoints);
        if (strokePoints.length > 0) {
          saveHistorySnapshot();
          const newStroke: InkStroke = {
            id: `stroke-${Date.now()}`,
            d: finalD,
            color: penColor,
            strokeWidth: penWidth,
          };
          setStrokes(prev => [...prev, newStroke]);
          emitStrokeAdd(newStroke);
        }
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
        const moveX = (ev.clientX - pan.x) / zoom;
        const moveY = (ev.clientY - pan.y) / zoom;
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

        const endX = (ev.clientX - pan.x) / zoom;
        const endY = (ev.clientY - pan.y) / zoom;
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

    if (socket && socket.connected) {
      socket.emit('sticky-add', {
        stickyId: newSticky.id,
        x: newSticky.x,
        y: newSticky.y,
        zIndex: newSticky.zIndex,
        title: newSticky.title,
        bodyHtml: newSticky.bodyHtml,
        tip: newSticky.tip,
      });
    }
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
    if (socket && socket.connected) {
      socket.emit('sticky-delete', { stickyId: id });
    }
  };

  // Socket sticky sync listeners
  useEffect(() => {
    if (!socket) return;

    const handleStickyNew = (data: any) => {
      setStickies(prev => {
        if (prev.some(s => s.id === data.stickyId)) return prev;
        return [...prev, {
          id: data.stickyId,
          x: data.x,
          y: data.y,
          zIndex: data.zIndex || 20,
          title: data.title || 'SMART TUTOR',
          bodyHtml: data.bodyHtml || '',
          tip: data.tip,
        }];
      });
    };

    const handleStickyDeleted = (data: { stickyId: string }) => {
      setStickies(prev => prev.filter(s => s.id !== data.stickyId));
    };

    const handleStickyMoved = (data: { stickyId: string; x: number; y: number }) => {
      setStickies(prev => prev.map(s => s.id === data.stickyId ? { ...s, x: data.x, y: data.y } : s));
    };

    socket.on('sticky-new', handleStickyNew);
    socket.on('sticky-deleted', handleStickyDeleted);
    socket.on('sticky-moved', handleStickyMoved);

    return () => {
      socket.off('sticky-new', handleStickyNew);
      socket.off('sticky-deleted', handleStickyDeleted);
      socket.off('sticky-moved', handleStickyMoved);
    };
  }, [socket]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: isDraggingPan
          ? 'grabbing'
          : isSpacePressed || mode === 'idle'
          ? 'grab'
          : mode === 'pen' || mode === 'lasso'
          ? 'crosshair'
          : 'default',
      }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDownCanvas}
      onPointerMove={handlePointerMoveCanvas}
    >
      <CanvasBg />

      <TopBar
        roomCode={roomCode}
        roomTitle={roomTitle}
        onShare={handleShare}
        onSave={handleManualSave}
        onExport={handleExportPNG}
        users={presenceUsers}
        isLive={socketStatus === 'connected'}
        savedRooms={savedRooms}
        onSwitchRoom={(code) => navigate(`/canvas/${code}`)}
      />

      {/* Spatial Canvas Container with Mouse-Centered Zoom & Translation */}
      <div
        ref={viewportRef}
        className="canvas-spatial-viewport"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: `${100 / zoom}vw`,
          height: `${100 / zoom}vh`,
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto',
        }}
      >
        <CanvasScopeBoundary width={3600} height={2400} />

        <InkLayer
          strokes={strokes}
          currentStrokeD={currentStroke || undefined}
          currentColor={penColor}
          currentWidth={penWidth}
          mode={mode}
          zoom={zoom}
          onDeleteStroke={handleDeleteStroke}
          onMoveStrokeStart={saveHistorySnapshot}
          onMoveStroke={handleMoveStroke}
        />

        {cards.map(card => (
          <CodeCard
            key={card.id}
            card={card}
            onGrab={bringToFront}
            onMove={updateCardPosition}
            onCodeChange={updateCardText}
            onDelete={handleDeleteCard}
            onToast={showToast}
            zoom={zoom}
            pan={pan}
            mode={mode}
          />
        ))}

        {stickies.map(sticky => (
          <AISticky
            key={sticky.id}
            sticky={sticky}
            onDismiss={dismissSticky}
            onGrab={bringToFront}
            onMove={updateStickyPosition}
            zoom={zoom}
            pan={pan}
          />
        ))}

        <AILasso rect={lassoRect} />

        {remoteCursors.map(peer => (
          <PeerCursor key={peer.id} peer={peer} />
        ))}
      </div>

      {/* Screen-Overlay Level Context / Radial Menu (Scale Independent) */}
      <RadialMenu
        isOpen={radialState.open}
        x={radialState.screenX}
        y={radialState.screenY}
        onSelectTool={handleSelectTool}
        onClose={closeRadial}
      />

      {mode === 'pen' && (
        <PenToolbar
          color={penColor}
          width={penWidth}
          onColorChange={setPenColor}
          onWidthChange={setPenWidth}
          onClose={() => setMode('idle')}
        />
      )}

      <ZoomControls
        zoom={zoom}
        pan={pan}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyStackRef.current.length > 0}
        canRedo={redoStackRef.current.length > 0}
        mode={mode === 'idle' ? 'select' : (mode as any)}
        onSetMode={(m) => {
          if (m === 'select') setMode('idle');
          else setMode(m);
        }}
        onTriggerRadial={() => {
          setRadialState({
            open: true,
            screenX: window.innerWidth / 2,
            screenY: window.innerHeight / 2,
            canvasX: (window.innerWidth / 2 - pan.x) / zoom,
            canvasY: (window.innerHeight / 2 - pan.y) / zoom,
          });
        }}
      />

      <HintBar mode={mode} />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        roomCode={roomCode}
        roomTitle={roomTitle}
        viewportElem={viewportRef.current}
        cards={cards}
        strokes={strokes}
        stickies={stickies}
        onToast={showToast}
      />

      <Toast message={toastMessage} />
    </div>
  );
};
