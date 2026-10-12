"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto = require("crypto");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    onModuleInit() {
        this.authCodeCleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [code, entry] of this.authCodeStore) {
                if (entry.expiresAt < now) {
                    this.authCodeStore.delete(code);
                }
            }
        }, 60_000);
        this.loginAttemptsCleanupInterval = setInterval(() => {
            for (const [k, v] of this.loginAttempts) {
                if (!v.lockedUntil || v.lockedUntil < Date.now())
                    this.loginAttempts.delete(k);
            }
        }, 5 * 60 * 1000);
    }
    onModuleDestroy() {
        if (this.authCodeCleanupInterval) {
            clearInterval(this.authCodeCleanupInterval);
            this.authCodeCleanupInterval = null;
        }
        if (this.loginAttemptsCleanupInterval) {
            clearInterval(this.loginAttemptsCleanupInterval);
            this.loginAttemptsCleanupInterval = null;
        }
    }
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.authCodeStore = new Map();
        this.authCodeCleanupInterval = null;
        this.loginAttempts = new Map();
        this.loginAttemptsCleanupInterval = null;
    }
    storeAuthCode(tokens) {
        const code = crypto.randomUUID();
        this.authCodeStore.set(code, {
            tokens,
            expiresAt: Date.now() + 60_000,
        });
        return code;
    }
    exchangeAuthCode(code) {
        const entry = this.authCodeStore.get(code);
        this.authCodeStore.delete(code);
        if (!entry || entry.expiresAt < Date.now()) {
            throw new common_1.UnauthorizedException('Invalid or expired authorization code');
        }
        return entry.tokens;
    }
    async findOrCreateGoogleUser(googleUser) {
        const { email, firstName, lastName, picture } = googleUser;
        let user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                workspaces: {
                    include: { workspace: true },
                    take: 1,
                },
            },
        });
        if (!user) {
            const workspace = await this.prisma.workspace.create({
                data: {
                    name: `${firstName}'s Workspace`,
                    subdomain: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
                },
            });
            user = await this.prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    avatarUrl: picture,
                    authProvider: 'google',
                    workspaces: {
                        create: {
                            workspaceId: workspace.id,
                            role: 'OWNER',
                        },
                    },
                },
                include: {
                    workspaces: {
                        include: { workspace: true },
                        take: 1,
                    },
                },
            });
        }
        else if (!user.avatarUrl && picture) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl: picture },
                include: {
                    workspaces: {
                        include: { workspace: true },
                        take: 1,
                    },
                },
            });
        }
        const workspaceMember = user.workspaces[0];
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;
        return {
            id: user.id,
            email: user.email,
            fullName,
            role: workspaceMember?.role || 'MEMBER',
            workspaceId: workspaceMember?.workspaceId,
            avatarUrl: user.avatarUrl || undefined,
        };
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const nameParts = dto.name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        const workspace = await this.prisma.workspace.create({
            data: {
                name: `${firstName}'s Workspace`,
                subdomain: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
                subscriptionTier: dto.plan || 'free',
            },
        });
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName,
                lastName,
                passwordHash,
                authProvider: 'email',
                workspaces: {
                    create: {
                        workspaceId: workspace.id,
                        role: 'OWNER',
                    },
                },
            },
            include: {
                workspaces: {
                    include: { workspace: true },
                    take: 1,
                },
            },
        });
        const workspaceMember = user.workspaces[0];
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        const authenticatedUser = {
            id: user.id,
            email: user.email,
            fullName,
            role: workspaceMember?.role || 'MEMBER',
            workspaceId: workspaceMember?.workspaceId,
            avatarUrl: user.avatarUrl || undefined,
        };
        const tokens = await this.generateTokens(authenticatedUser);
        return { user: authenticatedUser, tokens };
    }
    async validateUser(email, password) {
        const attempt = this.loginAttempts.get(email);
        if (attempt && attempt.count >= 5 && attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
            throw new common_1.UnauthorizedException('Account temporarily locked. Please try again later.');
        }
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                workspaces: {
                    include: { workspace: true },
                    take: 1,
                },
            },
        });
        if (!user || !user.passwordHash) {
            this.recordFailedLogin(email);
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            this.recordFailedLogin(email);
            return null;
        }
        this.loginAttempts.delete(email);
        const workspaceMember = user.workspaces[0];
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;
        return {
            id: user.id,
            email: user.email,
            fullName,
            role: workspaceMember?.role || 'MEMBER',
            workspaceId: workspaceMember?.workspaceId,
            avatarUrl: user.avatarUrl || undefined,
        };
    }
    recordFailedLogin(email) {
        const attempt = this.loginAttempts.get(email) || { count: 0, lockedUntil: null };
        attempt.count += 1;
        if (attempt.count >= 5) {
            attempt.lockedUntil = Date.now() + 15 * 60 * 1000;
        }
        this.loginAttempts.set(email, attempt);
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            workspaceId: user.workspaceId,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: await bcrypt.hash(refreshToken, 10),
                lastLoginAt: new Date(),
            },
        });
        return { accessToken, refreshToken };
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: {
                    workspaces: {
                        include: { workspace: true },
                        take: 1,
                    },
                },
            });
            if (!user || !user.refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isValid) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const workspaceMember = user.workspaces[0];
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
            return this.generateTokens({
                id: user.id,
                email: user.email,
                fullName,
                role: workspaceMember?.role || 'MEMBER',
                workspaceId: workspaceMember?.workspaceId,
                avatarUrl: user.avatarUrl || undefined,
            });
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async invalidateRefreshToken(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    async getUserInfo(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        return {
            id: user.id,
            email: user.email,
            fullName,
            avatarUrl: user.avatarUrl || undefined,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function, Function])
], AuthService);
