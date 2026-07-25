import { Router, Request, Response, NextFunction } from 'express';
import { createRoom, joinRoom, getRoomInfo, getRoomsBatch, updateRoomPreview, updateRoomSnapshot } from '../services/roomService.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/rooms — Create a fresh room with mandatory title
router.post('/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, title } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Room title is required', 'VALIDATION_ERROR');
    }
    const room = await createRoom(code, title);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/join — Join a room by code & name
router.post('/rooms/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name } = req.body || {};
    if (!code) {
      throw new ApiError(400, 'Room code is required', 'VALIDATION_ERROR');
    }
    const room = await joinRoom(code, name || 'You');
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/batch — Get details for a list of room codes
router.post('/rooms/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { codes } = req.body || {};
    if (!Array.isArray(codes)) {
      throw new ApiError(400, 'Codes array is required', 'VALIDATION_ERROR');
    }
    const batch = await getRoomsBatch(codes);
    res.json({ rooms: batch });
  } catch (err) {
    next(err);
  }
});

import { getPreviewPath } from '../services/previewStorage.js';

// GET /api/rooms/:code/preview — Serve thumbnail image from disk
router.get('/rooms/:code/preview', (req: Request, res: Response) => {
  const codeParam = req.params.code;
  const roomCode = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const filePath = getPreviewPath(roomCode);
  if (!filePath) {
    return res.status(404).json({ error: 'No preview available' });
  }
  res.sendFile(filePath);
});

// POST /api/rooms/:code/preview — Save real thumbnail snapshot preview URL
router.post('/rooms/:code/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codeParam = req.params.code;
    const roomCode = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    const { previewUrl } = req.body || {};
    if (!previewUrl) {
      throw new ApiError(400, 'previewUrl is required', 'VALIDATION_ERROR');
    }
    const updated = await updateRoomPreview(roomCode, previewUrl);
    res.json({ success: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:code/snapshot — Save spatial elements snapshot data
router.post('/rooms/:code/snapshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codeParam = req.params.code;
    const roomCode = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    const { snapshot } = req.body || {};
    if (!snapshot) {
      throw new ApiError(400, 'snapshot object is required', 'VALIDATION_ERROR');
    }
    const updated = await updateRoomSnapshot(roomCode, snapshot);
    res.json({ success: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:code — Get room details & presence
router.get('/rooms/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codeParam = req.params.code;
    const roomCode = Array.isArray(codeParam) ? codeParam[0] : codeParam;
    const roomInfo = await getRoomInfo(roomCode);
    res.json(roomInfo);
  } catch (err) {
    next(err);
  }
});

export default router;
