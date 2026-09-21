import { Router } from 'express';
import {
  oAuthRegisterBody,
  validateRegisterBody,
  validateLoginBody,
  validateVerifyEmailBody,
  validateResendVerificationBody,
} from '../../middleware/validate.middleware';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/register', validateRegisterBody, authController.registerUser);
router.post('/verify-email', validateVerifyEmailBody, authController.verifyEmail);
router.post('/resend-verification', validateResendVerificationBody, authController.resendVerification);
router.post('/login', validateLoginBody, authController.loginUser);
router.post('/logout', authController.logoutUser);
router.post('/refresh', authController.rotateRefreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/oAuth/register', oAuthRegisterBody);
router.post('/oAuth/login', validateLoginBody);

export default router;

