import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { clearTokenCookies, setTokenCookies } from '../utils/tokens';
import {
  ApiResponse,
  UserResponse,
  RegisterUserInput,
  VerifyEmailInput,
  ResendVerificationInput,
  LoginInput,
} from '../types';

export class AuthController {
  constructor(private authService: AuthService) {}

  registerUser = async (
    req: Request<{}, ApiResponse<UserResponse>, RegisterUserInput>,
    res: Response<ApiResponse<UserResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.authService.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email with the 6-digit code sent.',
        user,
      });
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (
    req: Request<{}, ApiResponse<UserResponse>, VerifyEmailInput>,
    res: Response<ApiResponse<UserResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user, accessToken, refreshToken } = await this.authService.verifyEmail({
        email: req.body.email,
        code: req.body.code,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Zero-Friction: Set dual-token cookies immediately on verification
      setTokenCookies(res, accessToken, refreshToken);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        user,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (
    req: Request<{}, ApiResponse<{ message: string }>, ResendVerificationInput>,
    res: Response<ApiResponse<{ message: string }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.authService.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };

  loginUser = async (
    req: Request<{}, ApiResponse<UserResponse>, LoginInput>,
    res: Response<ApiResponse<UserResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user, accessToken, refreshToken } = await this.authService.loginUser({
        email: req.body.email,
        password: req.body.password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      setTokenCookies(res, accessToken, refreshToken);
      res.status(200).json({
        success: true,
        user,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  };

  logoutUser = async (
    req: Request<{}, ApiResponse<{ message: string }>, never>,
    res: Response<ApiResponse<{ message: string }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const oldRefreshToken = req.signedCookies?.['refresh_token'];
      if (oldRefreshToken) {
        await this.authService.logoutUser(oldRefreshToken, req.user?.userId);
      }
      clearTokenCookies(res);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };

  rotateRefreshToken = async (
    req: Request<{}, ApiResponse<{ accessToken: string }>, never>,
    res: Response<ApiResponse<{ accessToken: string }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rawRefreshToken = req.signedCookies?.['refresh_token'];
      if (!rawRefreshToken) {
        clearTokenCookies(res);
        res.status(401).json({ success: false, message: 'Refresh token missing' });
        return;
      }
      const { accessToken, refreshToken } = await this.authService.rotateRefreshToken(
        rawRefreshToken,
        req.ip,
        req.headers['user-agent']
      );
      setTokenCookies(res, accessToken, refreshToken);
      res.status(200).json({
        success: true,
        message: 'Tokens rotated successfully',
        accessToken,
      });
    } catch (err) {
      clearTokenCookies(res);
      next(err);
    }
  };

  getMe = async (
    req: Request<{}, ApiResponse<UserResponse>, never>,
    res: Response<ApiResponse<UserResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const user = await this.authService.getMe(req.user.userId);
      res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  };
}

