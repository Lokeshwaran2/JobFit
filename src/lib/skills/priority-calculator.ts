/**
 * Skill Priority Calculator Service
 * Ranks missing skills by frequency and composite factors with deterministic tie-breaking.
 */

export interface SkillGapInput {
  canonicalSkill: string;
  missingCount: number;
  firstDetectedAt: Date | string;
  lastDetectedAt: Date | string;
  sourceCount?: number;
  status?: string;
  acquiredAt?: Date | string | null;
  // Extensible optional factors for future tuning
  importanceWeight?: number; // e.g. 1.0 default
  roleRelevance?: number;   // e.g. 1.0 default
  difficultyScore?: number; // 1-5
  currentProficiency?: number; // 0-100
  progressPercentage?: number;
}

export type PriorityTier = "High" | "Medium" | "Low";

export interface PrioritizedSkill {
  rank: number;
  canonicalSkill: string;
  frequency: number;
  priority: PriorityTier;
  priorityScore: number;
  status: "learning" | "acquired";
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  sourceCount: number;
  acquiredAt: Date | null;
  progressPercentage: number;
}

export interface PriorityCalculatorOptions {
  // Weights (default frequency is 1.0, others 0.0 for now as required by specs)
  frequencyWeight?: number;
  recencyWeight?: number;
  roleRelevanceWeight?: number;
}

/**
 * Calculates priority tiers based on missing frequency and score.
 */
export function determinePriorityTier(frequency: number, score: number): PriorityTier {
  if (frequency >= 4 || score >= 4) {
    return "High";
  }
  if (frequency >= 2 || score >= 2) {
    return "Medium";
  }
  return "Low";
}

/**
 * Computes composite priority score for a single skill.
 * Frequency is the primary factor.
 */
export function computeSkillScore(
  gap: SkillGapInput,
  options: PriorityCalculatorOptions = {}
): number {
  const freqWeight = options.frequencyWeight ?? 1.0;
  const rawFreq = Math.max(0, gap.missingCount);

  // Base score is primarily the frequency
  let score = rawFreq * freqWeight;

  // Additional extensible factor hooks (gracefully defaulted)
  if (gap.importanceWeight && options.roleRelevanceWeight) {
    score += gap.importanceWeight * options.roleRelevanceWeight;
  }

  return score;
}

/**
 * Takes a list of raw user skill gaps and produces a deterministically
 * ranked list of prioritized skills.
 * 
 * Deterministic tie-breaking rules:
 * 1. Missing frequency (or priorityScore) descending.
 * 2. Most recent detection date (lastDetectedAt) descending.
 * 3. Alphabetical canonical skill name ascending.
 */
export function calculateSkillPriorities(
  gaps: SkillGapInput[],
  options: PriorityCalculatorOptions = {}
): PrioritizedSkill[] {
  if (!gaps || gaps.length === 0) {
    return [];
  }

  // Pre-compute score and normalized dates for sorting
  const scoredItems = gaps.map((gap) => {
    const score = computeSkillScore(gap, options);
    const lastDetected = new Date(gap.lastDetectedAt || Date.now());
    const firstDetected = new Date(gap.firstDetectedAt || lastDetected);
    const acquiredAt = gap.acquiredAt ? new Date(gap.acquiredAt) : null;
    const status: "learning" | "acquired" = gap.status === "acquired" ? "acquired" : "learning";
    const progressPercentage = Math.min(100, Math.max(0, gap.progressPercentage ?? 0));

    return {
      gap,
      score,
      lastDetected,
      firstDetected,
      acquiredAt,
      status,
      progressPercentage,
    };
  });

  // Sort deterministically
  scoredItems.sort((a, b) => {
    // 1. Primary: Frequency (or score) DESC
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.gap.missingCount !== a.gap.missingCount) {
      return b.gap.missingCount - a.gap.missingCount;
    }

    // 2. Secondary: Last detected DESC (more recent is higher priority)
    const timeDiff = b.lastDetected.getTime() - a.lastDetected.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    // 3. Tertiary: Alphabetical ASC
    return a.gap.canonicalSkill.localeCompare(b.gap.canonicalSkill);
  });

  // Assign ranks
  return scoredItems.map((item, index) => {
    const frequency = item.gap.missingCount;
    return {
      rank: index + 1,
      canonicalSkill: item.gap.canonicalSkill,
      frequency,
      priority: determinePriorityTier(frequency, item.score),
      priorityScore: Number(item.score.toFixed(2)),
      status: item.status,
      firstDetectedAt: item.firstDetected,
      lastDetectedAt: item.lastDetected,
      sourceCount: item.gap.sourceCount ?? frequency,
      acquiredAt: item.acquiredAt,
      progressPercentage: item.progressPercentage,
    };
  });
}
