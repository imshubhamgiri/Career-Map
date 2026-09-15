import {Request , Response, NextFunction} from 'express';
import { UserService } from '../services/user.service';



export class UserController {
    userService: UserService = new UserService();

    async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
         // Implementation for registering a user
    }

    async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Implementation for logging in a user
    }
}