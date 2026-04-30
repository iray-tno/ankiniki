import { Router } from 'express';
import healthRoutes from './health';
import deckRoutes from './decks';
import cardRoutes from './cards';
import mlRoutes from './ml';
import importRoutes from './import';
import exportRoutes from './export';
import studyRoutes from './study';

const router = Router();

// Health check
router.use('/health', healthRoutes);

// API routes
router.use('/api/decks', deckRoutes);
router.use('/api/cards', cardRoutes);
router.use('/api/ml', mlRoutes);
router.use('/api/import', importRoutes);
router.use('/api/export', exportRoutes);
router.use('/api/study', studyRoutes);

export default router;
