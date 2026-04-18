import { Router } from 'express';
import csvRoutes from './csv';
import jsonRoutes from './json';
import markdownRoutes from './markdown';

const router = Router();

router.use('/csv', csvRoutes);
router.use('/json', jsonRoutes);
router.use('/markdown', markdownRoutes);

export default router;
