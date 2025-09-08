import { Router, Response } from 'express';
import { ApiResponse } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import { config } from '../config';

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

  res.status(ankiConnected ? 200 : 503).json({
    success: ankiConnected,
    data: healthData,
    message: ankiConnected
      ? 'All services are healthy'
      : 'AnkiConnect is not available',
  });
});

export default router;
