import { Router } from 'express';
import { ingestUrl, ingestFile } from '../controllers/ingest.controller';
import { upload } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { IngestUrlSchema } from '../schemas/api.schema';

const router = Router();

router.post('/url', validateBody(IngestUrlSchema), ingestUrl);
router.post('/file', upload.single('file'), ingestFile);

export default router;
