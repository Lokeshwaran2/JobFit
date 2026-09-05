import { prisma } from "@/lib/prisma";
import { normalizeSkill } from "../skill-normalization";
import {
  SkillLearningEngineInput,
  PersonalizedLearningPathDTO,
  CuratedResourceDTO,
  LearningPracticeDTO,
  LearningImplementationDTO,
  VerificationCheckpointDTO,
  StepProgressStatus,
  WeightedProgressBreakdown,
} from "./types";
import {
  getCurriculumDefinition,
  SkillCurriculumDefinition,
} from "./skill-curriculum-registry";
import { UserLevelDetector } from "./user-level-detector";
import { JdAwareCurriculumService } from "./jd-aware-curriculum-service";
import { ResourceDiscoveryService } from "./resource-discovery-service";
import { resourceRankingService } from "./resource-ranking-service";
import { resourceVerificationService } from "./resource-verification-service";

export interface ProgressWeightsConfig {
  foundations: number;
  core: number;
  intermediate: number;
  advanced: number;
  implementation: number;
  assessment: number;
}

export const DEFAULT_PROGRESS_WEIGHTS: ProgressWeightsConfig = {
  foundations: 0.10,
  core: 0.20,
  intermediate: 0.25,
  advanced: 0.20,
  implementation: 0.20,
  assessment: 0.05,
};

export class SkillLearningEngine {
  /**
   * Generates a fully personalized, skill-specific, role-aware, JD-aware,
   * user-level-aware, verified free learning path.
   */
  public static async generateLearningPath(
    input: SkillLearningEngineInput,
    weightsConfig: ProgressWeightsConfig = DEFAULT_PROGRESS_WEIGHTS
  ): Promise<PersonalizedLearningPathDTO> {
    const rawSkill = input.skill;
    const norm = normalizeSkill(rawSkill);
    const canonicalSkill = norm.canonicalSkill || rawSkill;

    // 1. Fetch or synthesize the skill-specific curriculum
    let curriculum = getCurriculumDefinition(canonicalSkill);
    let isAiGenerated = false;

    if (!curriculum) {
      curriculum = await ResourceDiscoveryService.discoverAndGenerateCurriculum(canonicalSkill);
      isAiGenerated = true;
    }

    // 2. Fetch User Missing Frequency & Priority from existing SkillGapTracker / DB
    let missingCount = 1;
    let priorityRank = 1;
    if (input.userId) {
      try {
        const userGap = await prisma.userSkillGap.findUnique({
          where: {
            userId_canonicalSkill: {
              userId: input.userId,
              canonicalSkill,
            },
          },
        });
        if (userGap) {
          missingCount = userGap.missingCount;
        }

        // Rank compared to other gaps for this user
        const allGaps = await prisma.userSkillGap.findMany({
          where: { userId: input.userId },
          orderBy: { missingCount: "desc" },
          select: { canonicalSkill: true, missingCount: true },
        });
        const foundIndex = allGaps.findIndex((g) => g.canonicalSkill === canonicalSkill);
        if (foundIndex !== -1) {
          priorityRank = foundIndex + 1;
        }
      } catch (err) {
        console.warn("[SkillLearningEngine] DB gap fetch warning:", err);
      }
    }

    // 3. User Level Detection (Respects previous evidence so intermediates don't start at beginner basics)
    const levelAssessment = await UserLevelDetector.assessUserLevel(
      { ...input, skill: canonicalSkill },
      curriculum
    );

    // 4. Adapt curriculum according to target JD (if JD context provided)
    const jdAdaptation = await JdAwareCurriculumService.adaptCurriculumForJd(
      curriculum,
      {
        jdId: input.jdId,
        jobDescription: input.jobDescription,
        targetRole: input.targetRole,
        company: input.company,
      }
    );

    // 5. Gather existing user progress map from DB
    const userProgressMap = new Map<string, StepProgressStatus>();
    if (input.userId) {
      try {
        const records = await prisma.learningProgress.findMany({
          where: {
            userId: input.userId,
            canonicalSkill,
          },
        });
        for (const r of records) {
          userProgressMap.set(r.stepId, r.status as StepProgressStatus);
        }
      } catch (e) {
        // Continue with empty map
      }
    }

    // 6. Assemble modules, verify resources & attach progress
    const allResources: CuratedResourceDTO[] = [];
    const allPracticeTasks: LearningPracticeDTO[] = [];
    const allCheckpoints: VerificationCheckpointDTO[] = [];

    // Map each module & topic
    const finalModules = await Promise.all(
      jdAdaptation.adaptedModules.map(async (mod) => {
        const updatedTopics = await Promise.all(
          mod.topics.map(async (topic) => {
            // Check status of topic
            const topicStatus: StepProgressStatus =
              userProgressMap.get(topic.id) || "not_started";

            // Verify resources and apply fallback if primary is unavailable
            let activePrimary = topic.primaryResource;
            let activeAlternative = topic.alternativeResource;

            if (activePrimary) {
              const verified = await resourceVerificationService.verifyAndApplyFallbacks(
                activePrimary,
                activeAlternative || null
              );
              activePrimary = verified.activePrimary;
              activeAlternative = verified.activeAlternative;
            }

            if (activePrimary) allResources.push(activePrimary);
            if (activeAlternative) allResources.push(activeAlternative);

            // Practice tasks progress
            const practiceTasksWithStatus = topic.practiceTasks.map((pt) => {
              const ptStatus = userProgressMap.get(pt.id) || "not_started";
              const item = { ...pt, status: ptStatus };
              allPracticeTasks.push(item);
              return item;
            });

            // Checkpoint progress
            let checkpointWithStatus = topic.checkpoint;
            if (checkpointWithStatus) {
              const chkStatus = userProgressMap.get(checkpointWithStatus.id) || "not_started";
              checkpointWithStatus = { ...checkpointWithStatus, status: chkStatus };
              allCheckpoints.push(checkpointWithStatus);
            }

            return {
              ...topic,
              status: topicStatus,
              primaryResource: activePrimary,
              alternativeResource: activeAlternative,
              practiceTasks: practiceTasksWithStatus,
              checkpoint: checkpointWithStatus,
            };
          })
        );

        // Compute module status
        const completedCount = updatedTopics.filter((t) => t.status === "completed").length;
        let modStatus: StepProgressStatus = "not_started";
        if (completedCount === updatedTopics.length && updatedTopics.length > 0) {
          modStatus = "completed";
        } else if (completedCount > 0) {
          modStatus = "in_progress";
        }

        return {
          ...mod,
          status: modStatus,
          topics: updatedTopics,
        };
      })
    );

    // Implementation tasks
    const finalImplementations: LearningImplementationDTO[] = curriculum.implementationTasks.map((it) => {
      const itStatus = userProgressMap.get(it.id) || "not_started";
      return {
        ...it,
        skillId: canonicalSkill,
        status: itStatus,
      };
    });

    // Capstone status
    const capstoneStatus: StepProgressStatus =
      userProgressMap.get(jdAdaptation.adaptedCapstone.id) || "not_started";
    const finalCapstone: typeof jdAdaptation.adaptedCapstone = {
      ...jdAdaptation.adaptedCapstone,
      status: capstoneStatus,
    };

    // 7. Calculate Weighted Progress according to Section 19:
    // Foundations = 10%, Core = 20%, Intermediate = 25%, Advanced = 20%, Implementation/Capstone = 20%, Assessment = 5%
    const beginnerTopics = finalModules
      .filter((m) => m.level === "beginner")
      .flatMap((m) => m.topics);
    const interTopics = finalModules
      .filter((m) => m.level === "intermediate")
      .flatMap((m) => m.topics);
    const advTopics = finalModules
      .filter((m) => m.level === "advanced")
      .flatMap((m) => m.topics);

    const foundationTopics = beginnerTopics.slice(0, 1);
    const coreTopics = beginnerTopics.slice(1);

    const calcCategory = (items: { status?: string }[], nominalWeight: number) => {
      if (items.length === 0) {
        return { count: 0, completed: 0, percentage: 0, weight: 0, nominalWeight };
      }
      const completed = items.filter((i) => i.status === "completed").length;
      const percentage = Math.round((completed / items.length) * 100);
      return { count: items.length, completed, percentage, weight: nominalWeight, nominalWeight };
    };

    const foundationCat = calcCategory(foundationTopics, weightsConfig.foundations);
    const coreCat = calcCategory(coreTopics, weightsConfig.core);
    const interCat = calcCategory(interTopics, weightsConfig.intermediate);
    const advCat = calcCategory(advTopics, weightsConfig.advanced);

    // Implementation includes both implementation tasks and capstone
    const allImpls = [...finalImplementations, { id: finalCapstone.id, status: finalCapstone.status }];
    const implCat = calcCategory(allImpls, weightsConfig.implementation);

    // Checkpoints percentage
    const assessmentCat = calcCategory(allCheckpoints, weightsConfig.assessment);

    const activeCategories = [foundationCat, coreCat, interCat, advCat, implCat, assessmentCat];
    const totalActiveWeight = activeCategories.reduce((sum, c) => sum + c.weight, 0);

    let overallScore = 0;
    if (totalActiveWeight > 0) {
      const weightedSum = activeCategories.reduce((sum, c) => sum + (c.percentage * c.weight), 0);
      overallScore = Math.round(weightedSum / totalActiveWeight);
    }

    const weightedProgress: WeightedProgressBreakdown = {
      foundations: { weight: foundationCat.nominalWeight, percentage: foundationCat.percentage },
      core: { weight: coreCat.nominalWeight, percentage: coreCat.percentage },
      intermediate: { weight: interCat.nominalWeight, percentage: interCat.percentage },
      advanced: { weight: advCat.nominalWeight, percentage: advCat.percentage },
      implementation: { weight: implCat.nominalWeight, percentage: implCat.percentage },
      assessment: { weight: assessmentCat.nominalWeight, percentage: assessmentCat.percentage },
      overallScore: Math.min(100, Math.max(0, overallScore)),
    };

    // If JD specific focus was detected, enrich the startHere reason
    let startHere = levelAssessment.startHere;
    if (jdAdaptation.recommendedFocusTopicId && jdAdaptation.recommendedFocusReason) {
      const matchTopic = finalModules
        .flatMap((m) => m.topics)
        .find((t) => t.id === jdAdaptation.recommendedFocusTopicId);
      if (matchTopic) {
        startHere = {
          ...startHere,
          topicId: matchTopic.id,
          topicTitle: matchTopic.title,
          reason: jdAdaptation.recommendedFocusReason,
          primaryResourceUrl: matchTopic.primaryResource?.url,
        };
      }
    }

    return {
      skill: canonicalSkill,
      canonicalSkill,
      priority: priorityRank,
      missingCount,
      currentLevel: levelAssessment.currentLevel,
      targetLevel: levelAssessment.targetLevel,
      whyItMatters: curriculum.whyItMatters,
      startHere,
      prerequisites: curriculum.prerequisites,
      modules: finalModules,
      resources: allResources,
      practiceTasks: allPracticeTasks,
      implementationTasks: finalImplementations,
      capstoneProject: finalCapstone,
      verificationTasks: allCheckpoints,
      estimatedEffort: {
        totalHours: curriculum.estimatedHours,
        estimatedWeeks: Math.ceil(curriculum.estimatedHours / 6),
      },
      progress: weightedProgress.overallScore,
      weightedProgress,
      curriculumVersion: curriculum.version,
      isAiGenerated,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates progress for any topic, practice task, implementation, or capstone step,
   * maintaining 100% backward compatibility with legacy LearningProgress records.
   */
  public static async updateStepProgress(
    userId: string,
    rawSkillName: string,
    stepId: string,
    status: StepProgressStatus
  ) {
    const canonicalSkill = normalizeSkill(rawSkillName).canonicalSkill || rawSkillName;

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

    // Recompute path progress
    const path = await SkillLearningEngine.generateLearningPath({
      userId,
      skill: canonicalSkill,
    });

    let isAcquired = false;
    if (path.progress >= 100) {
      try {
        const { SkillGapTracker } = await import("../skill-gap-tracker");
        await SkillGapTracker.resolveSkillGap(userId, canonicalSkill);
        isAcquired = true;
      } catch (err: any) {
        console.error("[SkillLearningEngine] Error auto-resolving skill gap:", err);
      }
    }

    return {
      canonicalSkill,
      stepId,
      status,
      progressPercentage: path.progress,
      overallProgress: path.progress,
      weightedProgress: path.weightedProgress,
      isAcquired,
    };
  }
}
