import { type PrismaService } from '@/core/database/prisma.service';
export declare abstract class BaseService<TDelegate> {
    protected readonly prisma: PrismaService;
    protected readonly delegate: TDelegate;
    private readonly modelName;
    protected constructor(prisma: PrismaService, delegate: TDelegate, modelName: string);
    protected getWorkspaceIdOrThrow(): string;
    protected withWorkspaceWhere<T extends {
        where?: Record<string, unknown>;
    }>(args: T): T;
    findMany(args?: any): Promise<any[]>;
    findUniqueOrThrow(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
}
