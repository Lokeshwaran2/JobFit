import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Recreate singleton if cached instance from dev server memory lacks newly migrated models or fields
if (globalForPrisma.prisma && (!(globalForPrisma.prisma as any).profileScoreCheck || !(globalForPrisma.prisma as any).profileScore || !(globalForPrisma.prisma as any).userSkillGap)) {
    console.log("[Prisma] Refreshing cached PrismaClient instance with newly migrated models...");
    globalForPrisma.prisma = undefined;
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
