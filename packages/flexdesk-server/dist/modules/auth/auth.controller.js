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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("./decorators/public.decorator");
let AuthController = class AuthController {
    constructor(authService, jwtService, configService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async googleAuth() {
    }
    async googleAuthCallback(req, res) {
        const googleUser = req.user;
        if (!googleUser) {
            throw new common_1.UnauthorizedException('No user from Google');
        }
        const user = await this.authService.findOrCreateGoogleUser(googleUser);
        const tokens = await this.authService.generateTokens(user);
        const code = this.authService.storeAuthCode(tokens);
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        const redirectUrl = new URL('/auth/callback', frontendUrl);
        redirectUrl.searchParams.set('code', code);
        return res.redirect(redirectUrl.toString());
    }
    async exchangeCode(body, res) {
        const tokens = this.authService.exchangeAuthCode(body.code);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        };
    }
    async register(registerDto, res) {
        const { user, tokens } = await this.authService.register(registerDto);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return {
            accessToken: tokens.accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                workspaceId: user.workspaceId,
            },
        };
    }
    async login(credentials, res) {
        const user = await this.authService.validateUser(credentials.email, credentials.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.authService.generateTokens(user);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                workspaceId: user.workspaceId,
            },
        };
    }
    async refresh(body, req, res) {
        const refreshToken = req.cookies?.refresh_token || body.refresh_token;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is required');
        }
        const tokens = await this.authService.refreshTokens(refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        };
    }
    async getMe(req) {
        const jwtUser = req['user'];
        const userInfo = await this.authService.getUserInfo(jwtUser.id);
        return {
            id: userInfo.id,
            email: userInfo.email,
            fullName: userInfo.fullName,
            role: jwtUser.role,
            workspaceId: jwtUser.workspaceId,
            avatarUrl: userInfo.avatarUrl,
        };
    }
    async logout(req, res) {
        const user = req['user'];
        const userId = user?.id;
        if (userId) {
            await this.authService.invalidateRefreshToken(userId);
        }
        res.clearCookie('refresh_token', { path: '/api/v1/auth' });
        return { message: 'Logged out successfully' };
    }
    setRefreshTokenCookie(res, refreshToken) {
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth',
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('google'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate Google OAuth login' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback' }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirects to frontend with tokens' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('exchange-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Exchange OAuth authorization code for tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tokens returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired code' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "exchangeCode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Registration successful' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user info' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User info retrieved' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logged out successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [Function, Function, Function])
], AuthController);
