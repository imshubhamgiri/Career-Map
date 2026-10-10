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
import {
  deleteAccountRateLimit,
  loginRateLimit,
  refreshTokenRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
  verifyEmailRateLimit,
} from '../../middleware/rateLimit.middleware';

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/register', registerRateLimit, validateRegisterBody, authController.registerUser);
router.post('/verify-email', verifyEmailRateLimit, validateVerifyEmailBody, authController.verifyEmail);
router.post(
  '/resend-verification',
  resendVerificationRateLimit,
  validateResendVerificationBody,
  authController.resendVerification
);
router.post('/login', loginRateLimit, validateLoginBody, authController.loginUser);
router.post('/logout', refreshTokenRateLimit, authController.logoutUser);
router.post('/refresh', refreshTokenRateLimit, authController.rotateRefreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/oAuth/register', registerRateLimit, oAuthRegisterBody);
router.post('/oAuth/login', loginRateLimit, validateLoginBody);
router.patch('/delete-account', deleteAccountRateLimit, authenticate, authController.deleteAccount);
router.delete('/delete-account', deleteAccountRateLimit, authenticate, authController.deleteAccount);

export default router;

