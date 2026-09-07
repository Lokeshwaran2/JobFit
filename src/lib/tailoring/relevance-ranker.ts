import { JobMatchResult, StructuredJobDescription } from "../matching/types";
import { extractSkillsFromText } from "./bullet-validator";

export interface BulletWithRelevance<T = any> {
  bullet: T;
  text: string;
  relevanceScore: number;
  matchedRequirements: string[];
  originalIndex: number;
}

/**
 * Relevance-Ordered Resume Tailoring Engine (Task 8)
 */
export class RelevanceRanker {
  /**
   * Computes a relevance score for a given bullet text against JD and JobMatchResult.
   * Priority:
   * 1. Required skills supported by resume (+100)
   * 2. Core job responsibilities supported by resume (+50)
   * 3. Preferred skills supported by resume (+30)
   * 4. Keywords supported by resume (+10)
   */
  public static scoreBulletRelevance(
    bulletText: string,
    jd: StructuredJobDescription,
    jobMatch?: JobMatchResult
  ): { relevanceScore: number; matchedRequirements: string[] } {
    if (!bulletText) {
      return { relevanceScore: 0, matchedRequirements: [] };
    }

    let score = 0;
    const matchedRequirements: string[] = [];
    const textLower = bulletText.toLowerCase();

    // 1. Matched Required Skills
    const requiredSkills = (jobMatch?.matchedRequiredSkills || jd.requiredSkills || []).map((s) => s.toLowerCase());
    const bulletSkills = extractSkillsFromText(bulletText).map((s) => s.toLowerCase());

    for (const reqSkill of requiredSkills) {
      if (bulletSkills.includes(reqSkill) || textLower.includes(reqSkill)) {
        score += 100;
        matchedRequirements.push(`Required Skill: ${reqSkill}`);
      }
    }

    // 2. Core Job Responsibilities
    const coreResponsibilities = jd.coreResponsibilities || [];
    for (const resp of coreResponsibilities) {
      const respWords = resp
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !["with", "from", "that", "this", "team", "your"].includes(w));

      const overlap = respWords.filter((w) => textLower.includes(w));
      if (overlap.length >= 2) {
        score += 50;
        matchedRequirements.push(`Core Responsibility: ${resp.slice(0, 40)}...`);
      }
    }

    // 3. Matched Preferred Skills
    const preferredSkills = (jobMatch?.matchedPreferredSkills || jd.preferredSkills || []).map((s) => s.toLowerCase());
    for (const prefSkill of preferredSkills) {
      if (bulletSkills.includes(prefSkill) || textLower.includes(prefSkill)) {
        score += 30;
        matchedRequirements.push(`Preferred Skill: ${prefSkill}`);
      }
    }

    // 4. Keywords
    const keywords = (jobMatch?.matchedKeywords || jd.keywords || []).map((k) => k.toLowerCase());
    for (const kw of keywords) {
      if (textLower.includes(kw)) {
        score += 10;
        matchedRequirements.push(`Keyword: ${kw}`);
      }
    }

    return { relevanceScore: score, matchedRequirements };
  }

  /**
   * Sorts bullets within an experience entry by relevance order while preserving all items.
   * Uses stable sorting so bullets of equal relevance preserve their original chronology.
   */
  public static orderBulletsByRelevance<T extends string | { text: string; [key: string]: any }>(
    bullets: T[],
    jd: StructuredJobDescription,
    jobMatch?: JobMatchResult
  ): { orderedBullets: T[]; rankings: BulletWithRelevance<T>[] } {
    if (!Array.isArray(bullets) || bullets.length <= 1) {
      const rankings = (bullets || []).map((b, idx) => {
        const text = typeof b === "string" ? b : b?.text || "";
        const { relevanceScore, matchedRequirements } = this.scoreBulletRelevance(text, jd, jobMatch);
        return { bullet: b, text, relevanceScore, matchedRequirements, originalIndex: idx };
      });
      return { orderedBullets: bullets || [], rankings };
    }

    const scored: BulletWithRelevance<T>[] = bullets.map((bullet, idx) => {
      const text = typeof bullet === "string" ? bullet : bullet?.text || "";
      const { relevanceScore, matchedRequirements } = this.scoreBulletRelevance(text, jd, jobMatch);
      return {
        bullet,
        text,
        relevanceScore,
        matchedRequirements,
        originalIndex: idx,
      };
    });

    // Stable sort: higher relevance first; if equal, preserve original order
    const sorted = [...scored].sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.originalIndex - b.originalIndex;
    });

    return {
      orderedBullets: sorted.map((s) => s.bullet),
      rankings: sorted,
    };
  }
}
