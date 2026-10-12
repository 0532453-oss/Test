import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

import { PrismaService } from '@/core/database/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-123';
  const mockEmail = 'test@example.com';

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    authProvider: 'email',
    refreshToken: 'hashed-refresh-token',
    lastLoginAt: new Date(),
    workspaces: [
      {
        workspaceId: mockWorkspaceId,
        role: 'OWNER',
        workspace: { id: mockWorkspaceId, name: 'Test Workspace' },
      },
    ],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('15m'),
    getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  describe('storeAuthCode / exchangeAuthCode', () => {
    it('should store and exchange an auth code', () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };

      const code = service.storeAuthCode(tokens);
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');

      const result = service.exchangeAuthCode(code);
      expect(result).toEqual(tokens);
    });

    it('should throw when code is used twice', () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      const code = service.storeAuthCode(tokens);

      service.exchangeAuthCode(code);

      expect(() => service.exchangeAuthCode(code)).toThrow(UnauthorizedException);
    });

    it('should throw when code does not exist', () => {
      expect(() => service.exchangeAuthCode('nonexistent')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findOrCreateGoogleUser', () => {
    const googleUser = {
      email: mockEmail,
      firstName: 'John',
      lastName: 'Doe',
      picture: 'https://example.com/avatar.jpg',
      accessToken: 'google-access-token',
    };

    it('should return existing user', async () => {
      const userWithAvatar = { ...mockUser, avatarUrl: 'https://existing.com/avatar.jpg' };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithAvatar);

      const result = await service.findOrCreateGoogleUser(googleUser);

      expect(result.email).toBe(mockEmail);
      expect(result.fullName).toBe('John Doe');
      expect(result.role).toBe('OWNER');
    });

    it('should create new user and workspace if not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.workspace.create.mockResolvedValue({
        id: mockWorkspaceId,
      });
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateGoogleUser(googleUser);

      expect(mockPrismaService.workspace.create).toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result.email).toBe(mockEmail);
    });

    it('should update avatar if not set', async () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: null };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutAvatar);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        avatarUrl: googleUser.picture,
      });

      await service.findOrCreateGoogleUser(googleUser);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { avatarUrl: googleUser.picture },
        }),
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      email: mockEmail,
      password: 'SecurePassword123!',
      name: 'John Doe',
    };

    it('should register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.workspace.create.mockResolvedValue({
        id: mockWorkspaceId,
      });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(mockEmail);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw ConflictException when email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockEmail, 'password');

      expect(result).toBeDefined();
      expect(result!.email).toBe(mockEmail);
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(mockEmail, 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockEmail, 'wrong-password');

      expect(result).toBeNull();
    });

    it('should lock account after 5 failed attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Fail 5 times
      for (let i = 0; i < 5; i++) {
        await service.validateUser(mockEmail, 'wrong');
      }

      // 6th attempt should be locked
      await expect(
        service.validateUser(mockEmail, 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');

      const authUser = {
        id: mockUserId,
        email: mockEmail,
        fullName: 'John Doe',
        role: 'OWNER',
        workspaceId: mockWorkspaceId,
      };

      const result = await service.generateTokens(authUser);

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshTokens', () => {
    it('should throw when token type is not refresh', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUserId, type: 'access' });

      await expect(
        service.refreshTokens('some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUserId, type: 'refresh' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when refresh token does not match stored hash', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUserId, type: 'refresh' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshTokens('some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens when refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUserId, type: 'refresh' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('invalidateRefreshToken', () => {
    it('should set refresh token to null', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.invalidateRefreshToken(mockUserId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { refreshToken: null },
      });
    });
  });

  describe('getUserInfo', () => {
    it('should return user info', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        email: mockEmail,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null,
      });

      const result = await service.getUserInfo(mockUserId);

      expect(result.id).toBe(mockUserId);
      expect(result.fullName).toBe('John Doe');
    });

    it('should throw when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserInfo('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
