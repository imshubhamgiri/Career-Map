import Route from 'express';
import { validateRegisterBody } from '../middleware/validate.middleware';

const router = Route();

router.post('/register', validateRegisterBody );
router.post('/login', validateRegisterBody );