import { Router } from 'express';
import { ankiConnect } from '../services/ankiConnect';
import { config } from '../config';
import { ok, sendProblem, PROBLEM_TYPES } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  ankiConnect: {
    connected: boolean;
    url: string;
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ankiConnected = await ankiConnect.ping();

    const healthData: HealthStatus = {
      status: ankiConnected ? 'healthy' : 'unhealthy',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      ankiConnect: {
        connected: ankiConnected,
        url: config.ankiConnect.url,
      },
    };

    if (ankiConnected) {
      res.status(200).json(ok(healthData, 'All services are healthy'));
    } else {
      sendProblem(res, 503, 'AnkiConnect is not available', {
        type: PROBLEM_TYPES.ANKI_CONNECT,
        instance: req.path,
        ankiConnect: healthData.ankiConnect,
      });
    }
  })
);

export default router;
