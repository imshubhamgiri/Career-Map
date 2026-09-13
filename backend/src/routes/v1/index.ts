import { Router } from 'express';
import ingestRoutes from '../ingest.routes';

const router = Router();

router.use('/ingest', ingestRoutes);

export default router;