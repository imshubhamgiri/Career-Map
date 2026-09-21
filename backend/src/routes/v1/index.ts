import { Router } from 'express';
import authRoutes from './auth.routes';
import ingestRoutes from './ingest.routes';
import roadmapRoutes from './roadmap.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ingest', ingestRoutes);
router.use('/roadmaps', roadmapRoutes);

export default router;
