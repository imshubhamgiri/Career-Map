import { UserRepository } from '../repositories/user.repository';
import { IUserInput, RegisterUserInput } from '../types';
import { ConflictError, NotFoundError } from '../errors/appError';

interface UserResponse{
    name?:string,
    email:string,
}

export class UserService {
     userRepository: UserRepository = new UserRepository();

     async registerUser(data: RegisterUserInput): Promise<IUserInput> {
        const existingUser = await this.userRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new ConflictError('User with this email already exists.');
        }
        return await this.userRepository.createUser(data);
    }

    async loginUser(email: string, password: string): Promise<IUserInput> {
        const user = await this.userRepository.findUserByEmail(email);
        if (!user) {
            throw new NotFoundError('User not found.');
        }
        // Add password verification logic here
        return user;
    }
}