import { Router } from 'express';
import { ProgressController } from '../../controllers/progress.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { UpdateProgressSchema } from '../../schemas/progress.schema';

const router = Router();
const progressController = new ProgressController();

// All progress endpoints require authentication
router.use(authenticate);

router.post('/:problemId', validateBody(UpdateProgressSchema), progressController.updateProgress);

export default router;
