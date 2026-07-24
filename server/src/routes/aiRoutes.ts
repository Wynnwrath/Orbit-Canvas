import { Router, Request, Response, NextFunction } from 'express';
import { analyzeCode } from '../services/aiService.js';

const router = Router();

// POST /api/ai/analyze — AI Tutor code analysis endpoint
router.post('/ai/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, context, roomCode } = req.body || {};
    const result = await analyzeCode({ content, context, roomCode });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
