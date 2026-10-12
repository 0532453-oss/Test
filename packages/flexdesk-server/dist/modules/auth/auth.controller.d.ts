import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import { type Response, type Request } from 'express';
import { type AuthService } from './auth.service';
import { type ExchangeCodeDto } from './dto/exchange-code.dto';
import { type LoginDto } from './dto/login.dto';
import { type RefreshTokenDto } from './dto/refresh-token.dto';
import { type RegisterDto } from './dto/register.dto';
import { type GoogleUser } from './strategies/google.strategy';
interface RequestWithUser extends Request {
    user: GoogleUser;
}
export declare class AuthController {
    private readonly authService;
    private readonly jwtService;
    private readonly configService;
    constructor(authService: AuthService, jwtService: JwtService, configService: ConfigService);
    googleAuth(): Promise<void>;
    googleAuthCallback(req: RequestWithUser, res: Response): Promise<void>;
    exchangeCode(body: ExchangeCodeDto, res: Response): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    register(registerDto: RegisterDto, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            workspaceId: string | undefined;
        };
    }>;
    login(credentials: LoginDto, res: Response): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            workspaceId: string | undefined;
        };
    }>;
    refresh(body: RefreshTokenDto, req: Request, res: Response): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getMe(req: Request): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: string;
        workspaceId: string;
        avatarUrl: string | undefined;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    private setRefreshTokenCookie;
}
export {};
