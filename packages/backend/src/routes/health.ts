import { Router, Response } from 'express';
import { ApiResponse } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import { config } from '../config';
import { ok, fail } from '../utils/response';

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

router.get('/', async (req, res: Response<ApiResponse<HealthStatus>>) => {
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
    res.status(503).json(fail('AnkiConnect is not available', healthData));
  }
});

export default router;
