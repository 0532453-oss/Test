import * as crypto from 'crypto';

import { Injectable, type OnModuleInit, type OnModuleDestroy, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../core/database/prisma.service';

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

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private authCodeStore = new Map<string, { tokens: TokenPair; expiresAt: number }>();
  private authCodeCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
  private loginAttemptsCleanupInterval: ReturnType<typeof setInterval> | null = null;

  onModuleInit() {
    // Periodically remove expired auth codes to prevent memory leaks
    this.authCodeCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [code, entry] of this.authCodeStore) {
        if (entry.expiresAt < now) {
          this.authCodeStore.delete(code);
        }
      }
    }, 60_000);

    // Periodically clean up expired lockout entries
    this.loginAttemptsCleanupInterval = setInterval(() => {
      for (const [k, v] of this.loginAttempts) {
        if (!v.lockedUntil || v.lockedUntil < Date.now()) this.loginAttempts.delete(k);
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Store tokens mapped to a one-time authorization code.
   * Code expires after 60 seconds.
   */
  storeAuthCode(tokens: TokenPair): string {
    const code = crypto.randomUUID();
    this.authCodeStore.set(code, {
      tokens,
      expiresAt: Date.now() + 60_000,
    });
    return code;
  }

  /**
   * Exchange a one-time authorization code for tokens.
   * Code is deleted after use (one-time only).
   */
  exchangeAuthCode(code: string): TokenPair {
    const entry = this.authCodeStore.get(code);
    this.authCodeStore.delete(code);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    return entry.tokens;
  }

  /**
   * Find or create a user from Google OAuth data
   */
  async findOrCreateGoogleUser(googleUser: GoogleUser): Promise<AuthenticatedUser> {
    const { email, firstName, lastName, picture } = googleUser;

    // Try to find existing user with their workspaces
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
      // Create new user with a default workspace
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
    } else if (!user.avatarUrl && picture) {
      // Update avatar if not set
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

  /**
   * Register a new user with email/password
   */
  async register(dto: RegisterDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Split name into first/last
    const nameParts = dto.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    // Create workspace (same pattern as findOrCreateGoogleUser)
    const workspace = await this.prisma.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
        subdomain: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
        subscriptionTier: dto.plan || 'free',
      },
    });

    // Create user with workspace membership
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

    const authenticatedUser: AuthenticatedUser = {
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

  /**
   * Validate user credentials for email/password login
   */
  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    // Check account lockout
    const attempt = this.loginAttempts.get(email);
    if (attempt && attempt.count >= 5 && attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
      throw new UnauthorizedException('Account temporarily locked. Please try again later.');
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

    // Successful login: clear lockout tracking
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

  private recordFailedLogin(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, lockedUntil: null };
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
    this.loginAttempts.set(email, attempt);
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user: AuthenticatedUser): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    // Optionally store refresh token hash in database for revocation
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
        lastLoginAt: new Date(),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
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
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token matches stored hash
      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
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
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Invalidate refresh token on logout
   */
  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Get user info by ID
   */
  async getUserInfo(userId: string): Promise<{
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }> {
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
      throw new UnauthorizedException('User not found');
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    return {
      id: user.id,
      email: user.email,
      fullName,
      avatarUrl: user.avatarUrl || undefined,
    };
  }
}
