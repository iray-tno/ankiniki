import { Router } from 'express';
import healthRoutes from './health';
import deckRoutes from './decks';
import cardRoutes from './cards';

const router = Router();

// Health check
router.use('/health', healthRoutes);

// API routes
router.use('/api/decks', deckRoutes);
router.use('/api/cards', cardRoutes);

export default router;