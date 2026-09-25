import {Router} from 'express';
import { SubmissionController } from '../../controllers/submission.controller';
import { verifyApiKey } from '../../middleware/auth.middleware';

const submissionController = new SubmissionController();

const router = Router();

router.post('/',verifyApiKey,submissionController.handleSubmission)

export default router;