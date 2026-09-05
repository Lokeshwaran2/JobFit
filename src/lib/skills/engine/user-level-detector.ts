import { prisma } from "@/lib/prisma";
import { SkillLevel, StartHereRecommendation, SkillLearningEngineInput } from "./types";
import { SkillCurriculumDefinition } from "./skill-curriculum-registry";

export interface UserLevelAssessmentResult {
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  confidence: number;
  evidence: {
    alreadyKnownSkills: string[];
    resumeEvidence: string[];
    assessmentScores: number[];
    progressSignals: string[];
  };
  startHere: StartHereRecommendation;
}

export class UserLevelDetector {
  /**
   * Assesses the user's current level for a skill based on all available evidence:
   * 1. Resume skills & profile skills
   * 2. Resume project bullets and experience text
   * 3. Prior completed learning progress
   * 4. Prior skill assessment checkpoints
   * 5. JD context
   */
  public static async assessUserLevel(
    input: SkillLearningEngineInput,
    curriculum: SkillCurriculumDefinition
  ): Promise<UserLevelAssessmentResult> {
    const { userId, skill, targetRole, existingEvidence } = input;

    // 1. Gather existing evidence from Database if userId is provided
    let dbProfileSkills: string[] = [];
    let dbAssessments: any[] = [];
    let dbCompletedSteps: string[] = [];
    let existingLevelRecord: any = null;

    if (userId) {
      try {
        const [profileSkills, assessments, progress, levelRec] = await Promise.all([
          prisma.userSkill.findMany({
            where: { userId },
            select: { canonicalSkill: true },
          }),
          prisma.skillAssessment.findMany({
            where: { userId, skillId: skill },
            select: { score: true, level: true },
          }),
          prisma.learningProgress.findMany({
            where: { userId, canonicalSkill: skill, status: "completed" },
            select: { stepId: true },
          }),
          prisma.userSkillLevel.findUnique({
            where: {
              userId_skillId: { userId, skillId: skill },
            },
          }),
        ]);

        dbProfileSkills = profileSkills.map((s) => s.canonicalSkill);
        dbAssessments = assessments;
        dbCompletedSteps = progress.map((p) => p.stepId);
        existingLevelRecord = levelRec;
      } catch (err) {
        console.warn("[UserLevelDetector] Database check soft warning:", err);
      }
    }

    // 2. Aggregate evidence
    const resumeSkills = existingEvidence?.resumeSkills || [];
    const allKnownSkills = Array.from(
      new Set([
        ...dbProfileSkills,
        ...resumeSkills,
        ...(input.currentSkills || []),
      ])
    );

    const projectBullets = existingEvidence?.projectBullets || [];
    const experienceSnippets = existingEvidence?.experienceSnippets || [];
    const combinedText = [
      ...projectBullets,
      ...experienceSnippets,
      ...(existingEvidence?.matchedKeywords || []),
    ].join(" ").toLowerCase();

    // 3. Score evidence to determine Level
    let score = 0; // 0-10: beginner, 11-25: elementary, 26-50: intermediate, 51+: advanced
    const alreadyKnown: string[] = [];

    // Check if skill is already in profile or candidate skills
    const hasBaseSkill = allKnownSkills.some(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );
    if (hasBaseSkill) {
      score += 20;
      alreadyKnown.push(`${skill} listed in candidate profile/resume`);
    }

    // Check for advanced and intermediate indicator terms in projects
    const intermediateTerms = [
      "api", "schema", "crud", "query", "database", "dockerfile", "container",
      "component", "hook", "state", "table", "join", "migration", "rest", "backend"
    ];
    const advancedTerms = [
      "explain analyze", "indexing", "b-tree", "performance tuning", "concurrency",
      "acid", "deadlock", "multi-stage", "kubernetes", "vpc", "partitioning",
      "cluster", "distributed", "caching", "pub/sub", "high throughput", "streaming"
    ];

    for (const term of intermediateTerms) {
      if (combinedText.includes(term)) {
        score += 4;
        if (alreadyKnown.length < 4) {
          alreadyKnown.push(`Hands-on experience with ${term}`);
        }
      }
    }

    for (const term of advancedTerms) {
      if (combinedText.includes(term)) {
        score += 8;
        if (alreadyKnown.length < 5) {
          alreadyKnown.push(`Advanced usage of ${term}`);
        }
      }
    }

    // Include completed learning steps
    if (dbCompletedSteps.length > 0) {
      score += dbCompletedSteps.length * 6;
      alreadyKnown.push(`${dbCompletedSteps.length} learning modules completed`);
    }

    // Include assessment scores
    if (dbAssessments.length > 0) {
      const avgScore =
        dbAssessments.reduce((sum, a) => sum + (a.score || 0), 0) /
        dbAssessments.length;
      if (avgScore >= 75) {
        score += 15;
      }
    }

    // 4. Determine Level
    let level: SkillLevel = "beginner";
    if (score >= 45) {
      level = "advanced";
    } else if (score >= 20) {
      level = "intermediate";
    } else if (score >= 10) {
      level = "elementary";
    }

    // Target Level is generally one or two tiers above current
    let targetLevel: SkillLevel = "advanced";
    if (level === "beginner") targetLevel = "intermediate";
    if (level === "elementary") targetLevel = "advanced";

    // 5. Compute personalized "Start Here" topic
    // If intermediate, start at intermediate module instead of SQL basics!
    let recommendedTopic = curriculum.modules[0]?.topics[0];
    let recommendedModule = curriculum.modules[0];
    let startReason = `Beginning foundational topics for ${skill}.`;

    if (level === "intermediate" || level === "advanced") {
      // Find the first uncompleted intermediate module/topic
      const interModule =
        curriculum.modules.find((m) => m.level === "intermediate") ||
        curriculum.modules[1] ||
        curriculum.modules[0];

      if (interModule && interModule.topics.length > 0) {
        recommendedModule = interModule;
        recommendedTopic = interModule.topics[0];
        startReason = `You already have demonstrated fundamentals in ${skill}. Skipping initial basics to focus on ${interModule.title}.`;
      }
    } else if (level === "elementary") {
      // Start at topic 2 of beginner module or first intermediate
      if (curriculum.modules[0]?.topics[1]) {
        recommendedTopic = curriculum.modules[0].topics[1];
        recommendedModule = curriculum.modules[0];
        startReason = `Based on your existing exposure, you are ready to tackle ${recommendedTopic.title}.`;
      }
    }

    // If already known list is empty, supply default friendly starting point
    if (alreadyKnown.length === 0) {
      alreadyKnown.push("Ready to build first practical project");
    }

    // 6. Save or update UserSkillLevel in DB if user is authenticated and exists
    if (userId) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (userExists) {
          await prisma.userSkillLevel.upsert({
            where: {
              userId_skillId: { userId, skillId: skill },
            },
            update: {
              level,
              confidence: 0.85,
              evidence: {
                score,
                alreadyKnown,
              },
              assessedAt: new Date(),
            },
            create: {
              userId,
              skillId: skill,
              level,
              confidence: 0.85,
              evidence: {
                score,
                alreadyKnown,
              },
              assessedAt: new Date(),
            },
          });
        }
      } catch (upsertErr) {
        // Soft warning for non-existent mock users
      }
    }

    return {
      currentLevel: level,
      targetLevel,
      confidence: 0.85,
      evidence: {
        alreadyKnownSkills: alreadyKnown,
        resumeEvidence: projectBullets.slice(0, 3),
        assessmentScores: dbAssessments.map((a) => a.score),
        progressSignals: dbCompletedSteps,
      },
      startHere: {
        topicId: recommendedTopic?.id || "default-topic",
        topicTitle: recommendedTopic?.title || "Foundations",
        moduleId: recommendedModule?.id || "default-module",
        moduleTitle: recommendedModule?.title || "Getting Started",
        level: recommendedModule?.level || "beginner",
        reason: startReason,
        alreadyKnownSkills: alreadyKnown,
        primaryResourceUrl: recommendedTopic?.primaryResource?.url,
      },
    };
  }
}
