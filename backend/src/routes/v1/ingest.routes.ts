import { Router } from 'express';
import { ingestUrl, ingestFile } from '../../controllers/ingest.controller';
import { upload } from '../../middleware/upload.middleware';
import { validateUrl } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { ingestRateLimit } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(ingestRateLimit);
router.post('/url', authenticate, validateUrl, ingestUrl);
router.post('/file', authenticate, upload.single('file'), ingestFile);

export default router;

