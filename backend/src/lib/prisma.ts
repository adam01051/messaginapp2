import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

export const serializableTransaction = async <T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 3) throw error;
    }
  }
  throw new Error("Serializable transaction retry exhausted");
};

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
