import { Router } from 'express';
import authRoutes from './auth.routes';
import ingestRoutes from './ingest.routes';
import roadmapRoutes from './roadmap.routes';
import submissionRoutes from './submission.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ingest', ingestRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/submissions', submissionRoutes);

export default router;
