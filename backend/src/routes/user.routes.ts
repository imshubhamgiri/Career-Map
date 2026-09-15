import Route from 'express';
import { oAuthRegisterBody, validateRegisterBody } from '../middleware/validate.middleware';

const router = Route();

router.post('/register', validateRegisterBody );
router.post('/oAuth/register', oAuthRegisterBody );
    
router.post('/oAuth/login', validateRegisterBody );
router.post('/login', validateRegisterBody );