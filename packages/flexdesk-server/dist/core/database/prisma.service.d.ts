import { type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
declare const extendedPrismaClient: import("@prisma/client/runtime/library").DynamicClientExtensionThis<import("@prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/library").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import("@prisma/client").Prisma.TypeMapCb<import("@prisma/client").Prisma.PrismaClientOptions>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
type ExtendedPrismaClient = typeof extendedPrismaClient;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private _extended;
    get extended(): ExtendedPrismaClient;
    private static readonly PRISMA_MODEL_PROPERTIES;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export {};
