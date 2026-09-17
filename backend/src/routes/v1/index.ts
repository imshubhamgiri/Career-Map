import { Router } from 'express';
import ingestRoutes from '../ingest.routes';
import userRoutes from '../user.routes';

const router = Router();

router.use('/auth', userRoutes);
router.use('/users', userRoutes);
router.use('/ingest', ingestRoutes);

export default router;
