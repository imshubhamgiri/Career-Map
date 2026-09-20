import { Router } from 'express';
import {
  oAuthRegisterBody,
  validateRegisterBody,
  validateLoginBody,
  validateVerifyEmailBody,
  validateResendVerificationBody,
} from '../middleware/validate.middleware';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post('/register', validateRegisterBody, userController.registerUser);
router.post('/verify-email', validateVerifyEmailBody, userController.verifyEmail);
router.post('/resend-verification', validateResendVerificationBody, userController.resendVerification);
router.post('/login', validateLoginBody, userController.loginUser);
router.post('/logout', userController.logoutUser);
router.post('/refresh', userController.rotateRefreshToken);
router.get('/me', authenticate, userController.getMe);
router.post('/oAuth/register', oAuthRegisterBody);
router.post('/oAuth/login', validateLoginBody);

export default router;
