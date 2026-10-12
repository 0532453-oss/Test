import { type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import { type PrismaService } from '../../core/database/prisma.service';
import { type RegisterDto } from './dto/register.dto';
import { type GoogleUser } from './strategies/google.strategy';
export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
    workspaceId?: string;
    avatarUrl?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private authCodeStore;
    private authCodeCleanupInterval;
    private loginAttempts;
    private loginAttemptsCleanupInterval;
    onModuleInit(): void;
    onModuleDestroy(): void;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    storeAuthCode(tokens: TokenPair): string;
    exchangeAuthCode(code: string): TokenPair;
    findOrCreateGoogleUser(googleUser: GoogleUser): Promise<AuthenticatedUser>;
    register(dto: RegisterDto): Promise<{
        user: AuthenticatedUser;
        tokens: TokenPair;
    }>;
    validateUser(email: string, password: string): Promise<AuthenticatedUser | null>;
    private recordFailedLogin;
    generateTokens(user: AuthenticatedUser): Promise<TokenPair>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    invalidateRefreshToken(userId: string): Promise<void>;
    getUserInfo(userId: string): Promise<{
        id: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }>;
}
