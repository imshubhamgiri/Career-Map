import { Router } from 'express';
import { SubmissionController } from '../../controllers/submission.controller';
import { authenticate, verifyApiKey } from '../../middleware/auth.middleware';

const submissionController = new SubmissionController();

const router = Router();

// Extension ingestion endpoint (authenticated via x-api-key)
router.post('/', verifyApiKey, submissionController.handleSubmission);

// Platform endpoints (authenticated via JWT session)
router.get('/', authenticate, submissionController.listUserSubmissions);
router.post('/:problemId/retry-sync', authenticate, submissionController.retrySync);

export default router;