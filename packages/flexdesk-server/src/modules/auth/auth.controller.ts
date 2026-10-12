import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { type Response, type Request } from 'express';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { type ExchangeCodeDto } from './dto/exchange-code.dto';
import { type LoginDto } from './dto/login.dto';
import { type RefreshTokenDto } from './dto/refresh-token.dto';
import { type RegisterDto } from './dto/register.dto';
import { type GoogleUser } from './strategies/google.strategy';

interface RequestWithUser extends Request {
  user: GoogleUser;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initiates Google OAuth flow
   * Redirects user to Google's consent screen
   */
  @Public()
  @Get('google')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth callback
   * Handles the response from Google after user grants permission
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const googleUser = req.user;

    if (!googleUser) {
      throw new UnauthorizedException('No user from Google');
    }

    // Find or create user in database
    const user = await this.authService.findOrCreateGoogleUser(googleUser);

    // Generate JWT tokens
    const tokens = await this.authService.generateTokens(user);

    // Store tokens and generate one-time authorization code
    const code = this.authService.storeAuthCode(tokens);

    // Redirect to frontend with short-lived code (not tokens)
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('code', code);

    return res.redirect(redirectUrl.toString());
  }

  /**
   * Exchange a one-time authorization code for tokens
   */
  @Public()
  @Post('exchange-code')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Exchange OAuth authorization code for tokens' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code' })
  async exchangeCode(
    @Body() body: ExchangeCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = this.authService.exchangeAuthCode(body.code);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  /**
   * Register a new user with email/password
   */
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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

  /**
   * Email/Password login endpoint
   */
  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      credentials.email,
      credentials.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || body.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  /**
   * Get current user info
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async getMe(@Req() req: Request) {
    const jwtUser = req['user'] as { id: string; email: string; workspaceId: string; role: string };

    // Fetch full user data from database
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

  /**
   * Logout endpoint
   */
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Invalidate refresh token if stored server-side
    const user = req['user'] as { id: string } | undefined;
    const userId = user?.id;
    if (userId) {
      await this.authService.invalidateRefreshToken(userId);
    }
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { message: 'Logged out successfully' };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }
}
