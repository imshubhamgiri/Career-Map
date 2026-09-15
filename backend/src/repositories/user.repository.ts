import prisma from '../config/db';
import { User } from '@prisma/client';
import {RegisterUserInput} from '../types/index';


export class UserRepository {
     createUser(data: RegisterUserInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

     findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findFirst({
            where: {
                email,
            },
        });
    }

     findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: {
                id,
            },
        });
    }

};
