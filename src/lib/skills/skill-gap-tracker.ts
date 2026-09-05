/**
 * Skill Gap Tracker Service
 * Manages missing skills identification, frequency tracking, occurrence history,
 * priority computation, progress updates, and skill acquisition.
 */

import { prisma } from "@/lib/prisma";
import { computeMissingSkills, normalizeSkill, isValidSkill } from "./skill-normalization";
import { calculateSkillPriorities, PrioritizedSkill } from "./priority-calculator";
import { getLearningPath, StructuredLearningPath } from "./learning-path-service";

export interface RecordSkillGapsParams {
  userId: string;
  resumeId?: string;
  jobTitle?: string;
  targetJobDesc?: string;
  jdSkills: (string | null | undefined)[];
  candidateSkills: (string | null | undefined)[];
}

export interface SkillGapSummary {
  missingSkills: string[];
  newGapsCount: number;
  totalGapsCount: number;
}

export class SkillGapTracker {
  /**
   * Helper check to verify that newly generated Prisma models are loaded in the active Node process.
   * If the dev server was started before 'prisma db push', Node's module cache may still have
   * the pre-migration client until the dev server is restarted.
   */
  public static isReady(): boolean {
    return typeof (prisma as any)?.userSkillGap?.findMany === "function";
  }

  /**
   * Tracks missing skills from a resume vs JD analysis.
   * Ensures:
   * 1. Reusable canonical normalization.
   * 2. Multiple mentions in one JD count only ONCE (+1).
   * 3. Skills in candidate resume or user profile are excluded.
   * 4. Re-analyzing the same resume does not duplicate count.
   * 5. Never throws an uncaught error to protect primary resume flow.
   */
  static async recordSkillGaps(params: RecordSkillGapsParams): Promise<SkillGapSummary> {
    const { userId, resumeId, jobTitle, targetJobDesc, jdSkills, candidateSkills } = params;

    if (!userId) {
      return { missingSkills: [], newGapsCount: 0, totalGapsCount: 0 };
    }

    if (!SkillGapTracker.isReady()) {
      console.warn(
        "[SkillGapTracker] userSkillGap model is not yet loaded in this Node.js process. " +
        "Please restart your dev server (Ctrl+C and npm run dev) to load newly migrated database models."
      );
      return { missingSkills: [], newGapsCount: 0, totalGapsCount: 0 };
    }

    try {
      // 1. Fetch user profile skills to include in candidate skills
      const userProfileSkills = await prisma.userSkill.findMany({
        where: { userId },
        select: { canonicalSkill: true }
      });
      const profileSkillNames = userProfileSkills.map(s => s.canonicalSkill);

      const combinedCandidateSkills = [
        ...candidateSkills,
        ...profileSkillNames,
      ];

      // 2. Compute canonical missing skills (deduplicated per JD)
      const missingNormalized = computeMissingSkills(jdSkills, combinedCandidateSkills);

      if (missingNormalized.length === 0) {
        const total = await prisma.userSkillGap.count({ where: { userId } });
        return { missingSkills: [], newGapsCount: 0, totalGapsCount: total };
      }

      const now = new Date();
      let newGapsCount = 0;

      // 3. Process each missing skill transactionally or sequentially
      for (const item of missingNormalized) {
        const { canonicalSkill, originalSkill } = item;

        // Check if this resume was already analyzed for this skill (Duplicate prevention)
        if (resumeId) {
          const existingOccurrence = await prisma.skillGapOccurrence.findUnique({
            where: {
              userId_canonicalSkill_resumeId: {
                userId,
                canonicalSkill,
                resumeId,
              },
            },
          });

          if (existingOccurrence) {
            // Already counted for this specific resume analysis!
            continue;
          }
        }

        // Record the historical occurrence
        await prisma.skillGapOccurrence.create({
          data: {
            userId,
            canonicalSkill,
            originalSkill,
            resumeId: resumeId || null,
            jobTitle: jobTitle || "Target Job Application",
            targetJobDesc: targetJobDesc ? targetJobDesc.slice(0, 1000) : null,
            detectedAt: now,
          },
        });

        // Upsert UserSkillGap
        const existingGap = await prisma.userSkillGap.findUnique({
          where: {
            userId_canonicalSkill: {
              userId,
              canonicalSkill,
            },
          },
        });

        if (existingGap) {
          // Increment frequency count by exactly 1
          await prisma.userSkillGap.update({
            where: { id: existingGap.id },
            data: {
              missingCount: { increment: 1 },
              sourceCount: { increment: 1 },
              lastDetectedAt: now,
              // If previously acquired, but again found missing in a new JD,
              // requirements state: "If a future JD still considers it missing,
              // it should continue contributing to missing frequency."
            },
          });
        } else {
          // First time this skill is missing for this user
          await prisma.userSkillGap.create({
            data: {
              userId,
              canonicalSkill,
              missingCount: 1,
              sourceCount: 1,
              firstDetectedAt: now,
              lastDetectedAt: now,
              status: "learning",
            },
          });
          newGapsCount++;
        }
      }

      const totalCount = await prisma.userSkillGap.count({ where: { userId } });

      return {
        missingSkills: missingNormalized.map(m => m.canonicalSkill),
        newGapsCount,
        totalGapsCount: totalCount,
      };
    } catch (error) {
      console.error("[SkillGapTracker] Error recording skill gaps:", error);
      // Soft-fail: return empty summary without interrupting the caller
      return { missingSkills: [], newGapsCount: 0, totalGapsCount: 0 };
    }
  }

  /**
   * Backfills skill gaps from previous resumes if user has none recorded yet.
   */
  static async syncResumesIfEmpty(userId: string): Promise<void> {
    if (!userId || !SkillGapTracker.isReady()) return;

    try {
      // Check if user already has gaps
      const existingGapsCount = await prisma.userSkillGap.count({
        where: { userId }
      });
      if (existingGapsCount > 0) return;

      // Backfill from existing resumes
      const resumes = await prisma.resume.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          targetJobDesc: true,
          missingSkills: true,
          structuredData: true,
        },
        orderBy: { createdAt: "asc" }
      });

      for (const resume of resumes) {
        if (resume.missingSkills && resume.missingSkills.length > 0) {
          const candidateSkills = (resume.structuredData as any)?.skills?.hard || [];
          await SkillGapTracker.recordSkillGaps({
            userId,
            resumeId: resume.id,
            jobTitle: resume.title,
            targetJobDesc: resume.targetJobDesc || undefined,
            jdSkills: resume.missingSkills,
            candidateSkills: Array.isArray(candidateSkills) ? candidateSkills : [],
          });
        }
      }
    } catch (err) {
      console.error("[SkillGapTracker] Sync error:", err);
    }
  }

  /**
   * Retrieves user's skill gaps ordered by priority with progress stats.
   */
  static async getUserSkillGaps(
    userId: string,
    filter: { status?: string } = {}
  ): Promise<PrioritizedSkill[]> {
    if (!SkillGapTracker.isReady()) {
      console.warn(
        "[SkillGapTracker] userSkillGap model is not yet loaded in this Node.js process. " +
        "Please restart your dev server (Ctrl+C and npm run dev) to load newly migrated database models."
      );
      return [];
    }

    const whereClause: any = { userId };
    if (filter.status && filter.status !== "all") {
      whereClause.status = filter.status;
    }

    let gaps = await prisma.userSkillGap.findMany({
      where: whereClause,
    });

    if (gaps.length === 0 && (!filter.status || filter.status === "learning" || filter.status === "all")) {
      await SkillGapTracker.syncResumesIfEmpty(userId);
      gaps = await prisma.userSkillGap.findMany({
        where: whereClause,
      });
    }

    // Quality Gate: Exclude any non-skills (e.g. locations, boilerplate, benefits)
    gaps = gaps.filter((g) => isValidSkill(g.canonicalSkill));

    const progressRecords = await prisma.learningProgress.findMany({
      where: { userId },
    });

    // Group progress by canonicalSkill to compute percentages
    const progressMapBySkill = new Map<string, Map<string, "not_started" | "in_progress" | "completed">>();
    for (const rec of progressRecords) {
      if (!progressMapBySkill.has(rec.canonicalSkill)) {
        progressMapBySkill.set(rec.canonicalSkill, new Map());
      }
      progressMapBySkill
        .get(rec.canonicalSkill)!
        .set(rec.stepId, rec.status as "not_started" | "in_progress" | "completed");
    }

    // Attach computed progressPercentage to each gap
    const gapsWithProgress = gaps.map((gap) => {
      const stepMap = progressMapBySkill.get(gap.canonicalSkill) || new Map();
      const path = getLearningPath(gap.canonicalSkill, stepMap);
      return {
        ...gap,
        progressPercentage: path.progressPercentage,
      };
    });

    return calculateSkillPriorities(gapsWithProgress);
  }

  /**
   * Retrieves full details for a specific skill gap:
   * history occurrences, learning path, and step progress.
   */
  static async getSkillGapDetails(userId: string, rawSkillName: string) {
    const norm = normalizeSkill(rawSkillName);
    const canonicalSkill = norm.canonicalSkill;

    if (!canonicalSkill || !SkillGapTracker.isReady()) {
      return null;
    }

    const [gap, occurrences, progressList] = await Promise.all([
      prisma.userSkillGap.findUnique({
        where: {
          userId_canonicalSkill: {
            userId,
            canonicalSkill,
          },
        },
      }),
      prisma.skillGapOccurrence.findMany({
        where: {
          userId,
          canonicalSkill,
        },
        include: {
          resume: {
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          detectedAt: "desc",
        },
      }),
      prisma.learningProgress.findMany({
        where: {
          userId,
          canonicalSkill,
        },
      }),
    ]);

    const progressMap = new Map<string, "not_started" | "in_progress" | "completed">();
    for (const p of progressList) {
      progressMap.set(p.stepId, p.status as "not_started" | "in_progress" | "completed");
    }

    const learningPath = getLearningPath(canonicalSkill, progressMap);

    return {
      canonicalSkill,
      gap,
      occurrences,
      learningPath,
    };
  }

  /**
   * Updates progress on an individual learning step.
   */
  static async updateStepProgress(
    userId: string,
    rawSkillName: string,
    stepId: string,
    status: "not_started" | "in_progress" | "completed"
  ): Promise<{ canonicalSkill: string; progressPercentage: number; status: string }> {
    const canonicalSkill = normalizeSkill(rawSkillName).canonicalSkill;

    if (!SkillGapTracker.isReady() || !canonicalSkill) {
      return { canonicalSkill, progressPercentage: 0, status };
    }

    await prisma.learningProgress.upsert({
      where: {
        userId_canonicalSkill_stepId: {
          userId,
          canonicalSkill,
          stepId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        userId,
        canonicalSkill,
        stepId,
        status,
      },
    });

    // Recompute skill progress percentage
    const allProgress = await prisma.learningProgress.findMany({
      where: { userId, canonicalSkill },
    });

    const progressMap = new Map<string, "not_started" | "in_progress" | "completed">();
    for (const p of allProgress) {
      progressMap.set(p.stepId, p.status as any);
    }

    const path = getLearningPath(canonicalSkill, progressMap);

    return {
      canonicalSkill,
      progressPercentage: path.progressPercentage || 0,
      status,
    };
  }

  /**
   * Resolves a skill gap by marking it acquired in the user profile.
   * Strictly preserves historical missingCount and occurrence records.
   */
  static async resolveSkillGap(userId: string, rawSkillName: string) {
    const canonicalSkill = normalizeSkill(rawSkillName).canonicalSkill;
    const now = new Date();

    if (!SkillGapTracker.isReady() || !canonicalSkill) {
      return {
        success: false,
        canonicalSkill,
        status: "learning",
        acquiredAt: null,
        missingCount: 0,
      };
    }

    // 1. Add to user profile skills
    await prisma.userSkill.upsert({
      where: {
        userId_canonicalSkill: {
          userId,
          canonicalSkill,
        },
      },
      update: {},
      create: {
        userId,
        canonicalSkill,
        createdAt: now,
      },
    });

    // 2. Mark UserSkillGap status as acquired, preserving missingCount!
    const updatedGap = await prisma.userSkillGap.upsert({
      where: {
        userId_canonicalSkill: {
          userId,
          canonicalSkill,
        },
      },
      update: {
        status: "acquired",
        acquiredAt: now,
      },
      create: {
        userId,
        canonicalSkill,
        missingCount: 0,
        sourceCount: 0,
        status: "acquired",
        acquiredAt: now,
      },
    });

    return {
      success: true,
      canonicalSkill,
      status: updatedGap.status,
      acquiredAt: updatedGap.acquiredAt,
      missingCount: updatedGap.missingCount,
    };
  }

  /**
   * Purges non-skills (e.g. locations, business terms, corporate boilerplate)
   * from existing UserSkillGap and SkillGapOccurrence records.
   */
  static async purgeInvalidSkillGaps(): Promise<{ deletedGaps: number; deletedOccurrences: number }> {
    if (!SkillGapTracker.isReady()) return { deletedGaps: 0, deletedOccurrences: 0 };

    try {
      const allGaps = await prisma.userSkillGap.findMany({
        select: { id: true, canonicalSkill: true },
      });

      const invalidIds: string[] = [];
      const invalidSkills: string[] = [];
      for (const gap of allGaps) {
        if (!isValidSkill(gap.canonicalSkill)) {
          invalidIds.push(gap.id);
          invalidSkills.push(gap.canonicalSkill);
        }
      }

      if (invalidIds.length === 0) {
        return { deletedGaps: 0, deletedOccurrences: 0 };
      }

      const [deletedOcc, deletedGaps] = await prisma.$transaction([
        prisma.skillGapOccurrence.deleteMany({
          where: { canonicalSkill: { in: invalidSkills } },
        }),
        prisma.userSkillGap.deleteMany({
          where: { id: { in: invalidIds } },
        }),
      ]);

      console.log(
        `[SkillGapTracker] Purged ${deletedGaps.count} invalid skill gaps and ${deletedOcc.count} occurrences.`
      );

      return {
        deletedGaps: deletedGaps.count,
        deletedOccurrences: deletedOcc.count,
      };
    } catch (err) {
      console.error("[SkillGapTracker] Error purging invalid gaps:", err);
      return { deletedGaps: 0, deletedOccurrences: 0 };
    }
  }
}
