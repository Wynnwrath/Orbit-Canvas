import { Router, Request, Response, NextFunction } from 'express';
import { createRoom, joinRoom, getRoomInfo } from '../services/roomService.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/rooms — Create a fresh room
router.post('/rooms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body || {};
    const room = await createRoom(code);
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
