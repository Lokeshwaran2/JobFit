import { CuratedResourceDTO } from "./types";

export interface ResourceRankingWeights {
  authority: number;
  topicRelevance: number;
  skillRelevance: number;
  practicalValue: number;
  freshness: number;
  interactiveValue: number;
}

export const DEFAULT_RANKING_WEIGHTS: ResourceRankingWeights = {
  authority: 0.25,
  topicRelevance: 0.25,
  skillRelevance: 0.20,
  practicalValue: 0.15,
  freshness: 0.10,
  interactiveValue: 0.05,
};

export class ResourceRankingService {
  private weights: ResourceRankingWeights;

  constructor(weights: Partial<ResourceRankingWeights> = {}) {
    this.weights = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  }

  /**
   * Computes a deterministic score for a resource on a scale of 0 to 100.
   */
  public computeScore(
    resource: CuratedResourceDTO,
    context?: {
      targetTopic?: string;
      targetSkill?: string;
    }
  ): number {
    // 1. Authority (0-100)
    let authorityScore = 50;
    if (resource.isOfficial) {
      authorityScore = 100;
    } else if (
      resource.provider.toLowerCase().includes("mdn") ||
      resource.provider.toLowerCase().includes("freecodecamp") ||
      resource.provider.toLowerCase().includes("roadmap.sh") ||
      resource.provider.toLowerCase().includes("w3c") ||
      resource.provider.toLowerCase().includes("exercism")
    ) {
      authorityScore = 85;
    } else if (resource.resourceType === "structured_course") {
      authorityScore = 80;
    } else {
      authorityScore = Math.max(40, Math.min(75, resource.qualityScore));
    }

    // 2. Topic Relevance (0-100)
    let topicRelevance = 80;
    if (context?.targetTopic) {
      const topicKeywords = context.targetTopic.toLowerCase().split(/\s+/);
      const titleLower = resource.title.toLowerCase();
      const urlLower = resource.url.toLowerCase();
      const matches = topicKeywords.filter(
        (kw) => kw.length > 2 && (titleLower.includes(kw) || urlLower.includes(kw))
      );
      if (matches.length >= 2 || titleLower.includes(context.targetTopic.toLowerCase())) {
        topicRelevance = 100;
      } else if (matches.length >= 1) {
        topicRelevance = 90;
      }
    }

    // 3. Skill Relevance (0-100)
    let skillRelevance = 85;
    if (context?.targetSkill) {
      const skillLower = context.targetSkill.toLowerCase();
      if (resource.title.toLowerCase().includes(skillLower) || resource.url.toLowerCase().includes(skillLower)) {
        skillRelevance = 100;
      }
    }

    // 4. Practical Value (0-100)
    let practicalValue = 60;
    if (resource.projectBased) {
      practicalValue = 100;
    } else if (resource.resourceType === "practice" || resource.resourceType === "interactive") {
      practicalValue = 95;
    } else if (resource.resourceType === "tutorial" || resource.resourceType === "structured_course") {
      practicalValue = 85;
    } else if (resource.isOfficial) {
      practicalValue = 80;
    }

    // 5. Freshness (0-100)
    let freshness = 80;
    if (resource.lastVerifiedAt) {
      const verifiedTime = new Date(resource.lastVerifiedAt).getTime();
      const ageInDays = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) freshness = 100;
      else if (ageInDays < 90) freshness = 85;
      else freshness = 70;
    }

    // 6. Interactive Value (0-100)
    let interactiveValue = resource.interactive ? 100 : 40;

    const weightedScore =
      authorityScore * this.weights.authority +
      topicRelevance * this.weights.topicRelevance +
      skillRelevance * this.weights.skillRelevance +
      practicalValue * this.weights.practicalValue +
      freshness * this.weights.freshness +
      interactiveValue * this.weights.interactiveValue;

    return Math.round(weightedScore * 10) / 10;
  }

  /**
   * Filters and ranks candidate resources:
   * 1. Strictly filters out paid resources (`isFree !== true`).
   * 2. Strictly filters out inactive or broken resources.
   * 3. Sorts by composite score descending.
   */
  public rankResources(
    resources: CuratedResourceDTO[],
    context?: {
      targetTopic?: string;
      targetSkill?: string;
      allowPaid?: boolean;
    }
  ): CuratedResourceDTO[] {
    const candidates = resources.filter((r) => {
      // Must be free unless explicitly requested otherwise
      if (!context?.allowPaid && !r.isFree) return false;
      // Must not be inactive
      if (r.status === "inactive") return false;
      return true;
    });

    const scored = candidates.map((res) => ({
      resource: res,
      score: this.computeScore(res, context),
    }));

    // Sort descending by score, tie-breaking by official docs, then title
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.resource.isOfficial !== a.resource.isOfficial) {
        return b.resource.isOfficial ? 1 : -1;
      }
      return a.resource.title.localeCompare(b.resource.title);
    });

    return scored.map((s) => s.resource);
  }

  /**
   * Selects the single best Primary Resource and optional Alternative Resource.
   * Avoids overwhelming the user with 10 random links.
   */
  public selectPrimaryAndAlternative(
    resources: CuratedResourceDTO[],
    context?: {
      targetTopic?: string;
      targetSkill?: string;
    }
  ): {
    primary: CuratedResourceDTO | null;
    alternative: CuratedResourceDTO | null;
  } {
    const ranked = this.rankResources(resources, context);

    if (ranked.length === 0) {
      return { primary: null, alternative: null };
    }

    const primary = { ...ranked[0], isPrimary: true };
    const alternative = ranked.length > 1 ? { ...ranked[1], isPrimary: false } : null;

    return { primary, alternative };
  }
}

export const resourceRankingService = new ResourceRankingService();
