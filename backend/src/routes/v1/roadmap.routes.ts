import { Router } from 'express';
import { RoadmapController } from '../../controllers/roadmap.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { CreateRoadmapSchema } from '../../schemas/roadmap.schema';
import { RoadmapService } from '../../services/roadmap.service';

const router = Router();
const roadmapService = new RoadmapService();
const roadmapController = new RoadmapController(roadmapService);

// All roadmap endpoints require authentication
router.use(authenticate);

router.post('/', validateBody(CreateRoadmapSchema), roadmapController.createRoadmap);
router.get('/', roadmapController.getUserRoadmaps);
router.get('/:id', roadmapController.getRoadmapById);
router.delete('/:id', roadmapController.deleteRoadmap);

export default router;

