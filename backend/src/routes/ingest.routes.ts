import { Router } from 'express';
import { ingestUrl, ingestFile } from '../controllers/ingest.controller';
import { upload } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { IngestUrlSchema } from '../schemas/api.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/url',authenticate ,validateBody(IngestUrlSchema), ingestUrl);
router.post('/file', authenticate, upload.single('file'), ingestFile);

export default router;
