import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { clearTokenCookies, setTokenCookies } from '../utils/tokens';

export class UserController {
    constructor(private userService: UserService) {}

    registerUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const user = await this.userService.registerUser(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user,
            });
        } catch (err) {
            next(err);
        }
    };

    loginUser = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { user, accessToken, refreshToken } = await this.userService.loginUser({
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
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const oldRefreshToken = req.signedCookies?.['refresh_token'];
            if (oldRefreshToken) {
                await this.userService.logoutUser(oldRefreshToken, req.user?.userId);
            }
            clearTokenCookies(res);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            next(err);
        }
    };

    rotateRefreshToken = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const rawRefreshToken = req.signedCookies?.['refresh_token'];
            if (!rawRefreshToken) {
                clearTokenCookies(res);
                res.status(401).json({ success: false, message: 'Refresh token missing' });
                return;
            }
            const { accessToken, refreshToken } = await this.userService.rotateRefreshToken(
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
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await this.userService.getMe(req.user.userId);
            res.status(200).json({ success: true, user });
        } catch (err) {
            next(err);
        }
    };
}
