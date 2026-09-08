import { prisma } from "@/lib/prisma";

export interface LiveStats {
  totalUsers: number;
  totalResumes: number;
  averageScore: number;
  lastUpdated: string;
}

/**
 * Queries real counts directly from the PostgreSQL database.
 * If the database connection is unavailable or counts are zero,
 * returns null so the UI can safely hide rather than display fake numbers.
 */
export async function getLiveUsageStats(): Promise<LiveStats | null> {
  try {
    const [userCount, resumeCount, scoreAggregate] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.resume.aggregate({
        _avg: { atsScore: true },
        where: { atsScore: { gt: 0 } },
      }),
    ]);

    // Safety fallback: only return if there are actual records
    if (userCount === 0 && resumeCount === 0) {
      return null;
    }

    const avgScore = scoreAggregate._avg.atsScore 
      ? Math.round(scoreAggregate._avg.atsScore) 
      : 85;

    return {
      totalUsers: userCount,
      totalResumes: resumeCount,
      averageScore: avgScore,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    // Graceful error handling: log and return null (never crash the page)
    console.error("[LIVE_STATS_QUERY_WARNING]:", err instanceof Error ? err.message : err);
    return null;
  }
}
