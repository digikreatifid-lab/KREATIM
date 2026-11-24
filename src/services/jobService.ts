import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export class JobNotFoundError extends Error {
  constructor() {
    super("Hasil tidak ditemukan.");
    this.name = "JobNotFoundError";
  }
}

/** Owner-scoped lookup (anti-IDOR). */
export async function getOwnedJob(userId: string, jobId: string, agentType?: string, db: PrismaClient = defaultPrisma) {
  const job = await db.generationJob.findFirst({ where: { id: jobId, userId, ...(agentType ? { agentType } : {}) } });
  if (!job) throw new JobNotFoundError();
  return job;
}

export async function setFavorite(userId: string, jobId: string, isFavorite: boolean, db: PrismaClient = defaultPrisma) {
  const res = await db.generationJob.updateMany({ where: { id: jobId, userId }, data: { isFavorite } });
  if (res.count === 0) throw new JobNotFoundError();
}

export async function listRecentJobs(userId: string, agentType: string, take = 10, db: PrismaClient = defaultPrisma) {
  return db.generationJob.findMany({
    where: { userId, agentType, status: "COMPLETED" },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    take,
    include: { brand: { select: { name: true } } },
  });
}
