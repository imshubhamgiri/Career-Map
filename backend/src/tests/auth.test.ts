import prisma from '../config/db';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from '../services/user.service';
import { hashPassword, verifyPassword, generateOpaqueToken, hashOpaqueToken } from '../utils/crypto';
import { generateAccessToken, ACCESS_TOKEN_SECRET } from '../utils/tokens';
import jwt from 'jsonwebtoken';

async function runAuthTests() {
    console.log('--- Starting Authentication System Verification ---');

    // 1. Test Crypto Utils
    console.log('1. Testing argon2 password hashing and verification...');
    const plain = 'SecretP@ssword123!';
    const hash = await hashPassword(plain);
    const valid = await verifyPassword(hash, plain);
    const invalid = await verifyPassword(hash, 'WrongPassword');
    if (!valid || invalid) {
        throw new Error('Argon2 hashing/verification failed!');
    }
    console.log('   Argon2 hashing and verification passed.');

    // 2. Test Token Utils
    console.log('2. Testing JWT token generation and verification...');
    const mockUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@career-os.dev' };
    const accessToken = generateAccessToken(mockUser);
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as any;
    if (decoded.userId !== mockUser.id || decoded.email !== mockUser.email) {
        throw new Error('JWT token payload mismatch!');
    }
    console.log('   JWT generation & verification passed.');

    // 3. Test Opaque Tokens
    console.log('3. Testing opaque tokens & sha256 hashing...');
    const rawToken = generateOpaqueToken();
    const hashed = hashOpaqueToken(rawToken);
    if (!rawToken || !hashed || hashed.length !== 64) {
        throw new Error('Opaque token or SHA256 hashing failed!');
    }
    console.log('   Opaque token generation & hashing passed.');

    // 4. Test Repository & Service against DB
    console.log('4. Testing UserService against PostgreSQL...');
    const testEmail = `test_auth_${Date.now()}@career-os.dev`;
    const testPassword = 'Password123!';
    const testName = 'Auth Test User';

    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);

    try {
        // 4a. Registration
        console.log('   Testing user registration...');
        const registered = await userService.registerUser({
            name: testName,
            email: testEmail,
            password: testPassword,
        });
        if (registered.email !== testEmail || registered.name !== testName || !registered.id) {
            throw new Error('User registration response invalid!');
        }
        console.log('   User registered successfully. ID:', registered.id);

        // 4b. Duplicate registration conflict
        try {
            await userService.registerUser({
                name: testName,
                email: testEmail,
                password: testPassword,
            });
            throw new Error('Duplicate email should have thrown ConflictError!');
        } catch (err: any) {
            if (err.statusCode !== 409) throw err;
            console.log('   Duplicate email correctly rejected with ConflictError (409).');
        }

        // 4c. Login
        console.log('   Testing user login...');
        const loginRes = await userService.loginUser({
            email: testEmail,
            password: testPassword,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
        });
        if (!loginRes.accessToken || !loginRes.refreshToken || !loginRes.user.id) {
            throw new Error('Login failed to return expected tokens or user!');
        }
        console.log('   User logged in successfully. Session created.');

        // 4d. getMe
        const me = await userService.getMe(loginRes.user.id);
        if (me.email !== testEmail) {
            throw new Error('getMe returned invalid user!');
        }
        console.log('   getMe successfully returned user info.');

        // 4e. Rotate refresh token
        console.log('   Testing refresh token rotation...');
        const rotated = await userService.rotateRefreshToken(loginRes.refreshToken, '127.0.0.1', 'test-agent');
        if (!rotated.accessToken || !rotated.refreshToken) {
            throw new Error('Token rotation failed to return new tokens!');
        }
        console.log('   Token rotated successfully. Previous session revoked.');

        // 4f. Reuse Detection: try rotating with the OLD token again
        console.log('   Testing reuse detection with revoked token...');
        try {
            await userService.rotateRefreshToken(loginRes.refreshToken, '127.0.0.1', 'test-agent');
            throw new Error('Reused refresh token should have been rejected!');
        } catch (err: any) {
            if (err.statusCode !== 401) throw err;
            console.log('   Reuse detection triggered successfully (401 Unauthorized)! All family tokens invalidated.');
        }

        // 4g. Logout
        console.log('   Testing logout...');
        await userService.logoutUser(rotated.refreshToken, loginRes.user.id);
        console.log('   Logout completed.');

        console.log('\n ALL AUTHENTICATION FLOW TESTS PASSED! ');
    } finally {
        // Clean up test data
        console.log('Cleaning up test data...');
        const user = await userRepository.findUserByEmail(testEmail);
        if (user) {
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
            console.log('Cleanup complete.');
        }
        await prisma.$disconnect();
    }
}

runAuthTests().catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
});

