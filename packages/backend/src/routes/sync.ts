import { Router, Response } from 'express';
import { ApiResponse } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import { ok } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (_req, res: Response<ApiResponse>) => {
    await ankiConnect.sync();
    res.json(ok(null, 'Sync complete'));
  })
);

export default router;
