import { Router } from 'express';
import ingestRoutes from '../ingest.routes';
import userRoutes from '../user.routes';
import roadmapRoutes from '../roadmap.routes';

const router = Router();

router.use('/auth', userRoutes);
router.use('/users', userRoutes);
router.use('/ingest', ingestRoutes);
router.use('/roadmaps', roadmapRoutes);

export default router;
