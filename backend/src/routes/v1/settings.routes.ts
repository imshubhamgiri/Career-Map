import { Router } from 'express';
import { SettingsController } from '../../controllers/settings.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new SettingsController();

// All settings endpoints require active user session
router.use(authenticate);

// API Keys
router.post('/api-keys', controller.createApiKey);
router.get('/api-keys', controller.listApiKeys);
router.delete('/api-keys/:id', controller.revokeApiKey);

// GitHub Config
router.get('/github', controller.getGithubConfig);
router.put('/github', controller.updateGithubConfig);
router.post('/github/verify', controller.verifyGithubConfig);

export default router;
