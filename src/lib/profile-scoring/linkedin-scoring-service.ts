import { DEFAULT_LINKEDIN_WEIGHTS } from "./config";
import { EvidenceLevel, LinkedInAnalysisResult, LinkedInProfileData, LinkedInScoringWeights, SkillEvidence } from "./types";
import { normalizeSkill } from "@/lib/skills/skill-normalization";

export class LinkedInScoringService {
  private weights: LinkedInScoringWeights;

  constructor(customWeights?: Partial<LinkedInScoringWeights>) {
    this.weights = { ...DEFAULT_LINKEDIN_WEIGHTS, ...customWeights };
  }

  /**
   * Deterministically analyze LinkedIn profile data against target role and JD requirements.
   * Operates strictly on user-provided profile data (safe, compliant, no unauthorized scraping).
   */
  public analyze({
    profileData,
    targetRole,
    requiredSkills,
    resumeData,
  }: {
    profileData: LinkedInProfileData | null;
    targetRole: string;
    requiredSkills: string[];
    resumeData?: any;
  }): LinkedInAnalysisResult {
    const roleLower = targetRole.toLowerCase();
    const data: LinkedInProfileData = profileData || {};

    // 1. Normalize JD required skills
    const normalizedRequired = requiredSkills
      .map((s) => normalizeSkill(s))
      .filter((s) => s.canonicalSkill);

    const uniqueRequiredMap = new Map<string, string>();
    for (const item of normalizedRequired) {
      const lower = item.canonicalSkill.toLowerCase();
      if (!uniqueRequiredMap.has(lower)) {
        uniqueRequiredMap.set(lower, item.canonicalSkill);
      }
    }
    const uniqueSkills = Array.from(uniqueRequiredMap.values());

    // 2. Extract profile texts
    const headline = (data.headline || "").trim();
    const about = (data.about || "").trim();
    const rawSkills = data.skills || [];
    const experiences = data.experience || [];

    // Combine all textual profile content for comprehensive search
    const allProfileText = [
      headline,
      about,
      rawSkills.join(" "),
      experiences.map((e) => `${e.title} ${e.company} ${e.description}`).join(" "),
      (data.projects || []).map((p) => `${p.name} ${p.description || ""} ${(p.skills || []).join(" ")}`).join(" "),
      (data.certifications || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    // 3. Match each required skill against LinkedIn data
    const skillEvidences: SkillEvidence[] = [];
    for (const skill of uniqueSkills) {
      const sLower = skill.toLowerCase();
      const inExplicitSkills = rawSkills.some((s) => s.toLowerCase() === sLower || s.toLowerCase().includes(sLower));
      
      const matchingExps = experiences.filter((e) => {
        const expText = `${e.title} ${e.description}`.toLowerCase();
        return expText.includes(sLower);
      });

      let level: EvidenceLevel = "None";
      const sources: string[] = [];

      if (inExplicitSkills && matchingExps.length > 0) {
        level = "Strong";
        sources.push("Skills list", ...matchingExps.map((e) => e.title));
      } else if (matchingExps.length > 0) {
        level = matchingExps.length >= 2 ? "Strong" : "Moderate";
        sources.push(...matchingExps.map((e) => e.title));
      } else if (inExplicitSkills) {
        level = "Moderate";
        sources.push("Skills list");
      } else if (allProfileText.includes(sLower)) {
        level = "Weak";
        sources.push("Profile text / About");
      }

      skillEvidences.push({
        skill,
        level,
        sources,
        notes:
          level === "Strong"
            ? `Listed in profile skills with matching work experience.`
            : level === "Moderate"
            ? `Demonstrated in work experience or listed in skills.`
            : level === "Weak"
            ? `Mentioned in profile summary or projects.`
            : `Missing from LinkedIn profile and experience.`,
      });
    }

    // 4. Calculate Sub-Scores (Deterministic based on weights)
    // -------------------------------------------------------------
    // A. Role Alignment (0 - weights.roleAlignment)
    // Measures how well headline, title, and about match the target role
    let roleTokens = roleLower.split(/\s+/).filter((t) => t.length > 3);
    if (roleTokens.length === 0) roleTokens = [roleLower];

    let headlineMatches = 0;
    let expTitleMatches = 0;

    for (const token of roleTokens) {
      if (headline.toLowerCase().includes(token)) headlineMatches++;
      if (experiences.some((e) => e.title.toLowerCase().includes(token))) expTitleMatches++;
    }

    let roleAlignmentRatio = 0.2; // Baseline
    if (headline.length > 0) {
      if (headlineMatches >= Math.min(2, roleTokens.length)) roleAlignmentRatio += 0.5;
      else if (headlineMatches > 0) roleAlignmentRatio += 0.3;
    }
    if (expTitleMatches > 0) roleAlignmentRatio += 0.3;
    const roleAlignmentScore = Math.round(Math.min(1, roleAlignmentRatio) * this.weights.roleAlignment);

    // B. Skill Coverage (0 - weights.skillCoverage)
    let coverageSum = 0;
    if (uniqueSkills.length > 0) {
      for (const ev of skillEvidences) {
        if (ev.level === "Strong") coverageSum += 1.0;
        else if (ev.level === "Moderate") coverageSum += 0.7;
        else if (ev.level === "Weak") coverageSum += 0.35;
      }
      coverageSum = coverageSum / uniqueSkills.length;
    } else {
      coverageSum = 0.75;
    }
    const skillCoverageScore = Math.round(Math.min(1, coverageSum) * this.weights.skillCoverage);

    // C. Experience Relevance (0 - weights.experienceRelevance)
    const matchedExperiencesSummary = experiences.map((exp) => {
      const expText = `${exp.title} ${exp.description}`.toLowerCase();
      const matched = uniqueSkills.filter((s) => expText.includes(s.toLowerCase()));
      let expScore = 0;
      if (roleTokens.some((t) => exp.title.toLowerCase().includes(t))) expScore += 40;
      expScore += Math.min(60, matched.length * 15);
      return {
        title: exp.title,
        company: exp.company,
        relevanceScore: Math.min(100, expScore),
        matchedRoleSkills: matched,
      };
    });

    const relevantExps = matchedExperiencesSummary.filter((e) => e.relevanceScore >= 30);
    let expRatio = 0.2;
    if (experiences.length > 0) {
      expRatio = Math.min(1, 0.2 + (relevantExps.length / Math.max(1, experiences.length)) * 0.8);
    }
    const experienceRelevanceScore = Math.round(expRatio * this.weights.experienceRelevance);

    // D. Achievement Quality / Measurable Metrics (0 - weights.achievementQuality)
    // Looks for metrics (% or numbers or metrics words in experience descriptions)
    let metricsFoundCount = 0;
    const metricRegex = /(\d+[%$kMB+]|\b\d+\s*(?:users|clients|projects|percent|seconds|ms|queries|engineers)\b)/i;
    for (const exp of experiences) {
      if (metricRegex.test(exp.description)) {
        metricsFoundCount++;
      }
    }
    let achievementRatio = 0.25;
    if (metricsFoundCount >= 3) achievementRatio = 1.0;
    else if (metricsFoundCount >= 1) achievementRatio = 0.65;
    const achievementQualityScore = Math.round(achievementRatio * this.weights.achievementQuality);

    // E. Profile Completeness (0 - weights.profileCompleteness)
    let completenessPoints = 0;
    if (headline.length >= 10) completenessPoints += 0.25;
    if (about.length >= 40) completenessPoints += 0.25;
    if (experiences.length >= 1) completenessPoints += 0.25;
    if (rawSkills.length >= 3) completenessPoints += 0.25;
    const profileCompletenessScore = Math.round(completenessPoints * this.weights.profileCompleteness);

    // 5. Total LinkedIn Score (0 - 100)
    const totalScore = Math.min(
      100,
      Math.max(
        0,
        roleAlignmentScore +
          skillCoverageScore +
          experienceRelevanceScore +
          achievementQualityScore +
          profileCompletenessScore
      )
    );

    // 6. Strengths ("Why") and Improvements ("Needs Improvement")
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Strengths
    if (roleAlignmentScore >= Math.round(this.weights.roleAlignment * 0.7)) {
      strengths.push(`Strong headline & role alignment with ${targetRole}.`);
    }
    const strongSkills = skillEvidences.filter((e) => e.level === "Strong" || e.level === "Moderate");
    if (strongSkills.length > 0) {
      strengths.push(`Relevant skill coverage for: ${strongSkills.slice(0, 3).map((s) => s.skill).join(", ")}.`);
    }
    if (relevantExps.length >= 1) {
      strengths.push(`Proven background in ${relevantExps[0].title} matching target responsibilities.`);
    }
    if (metricsFoundCount >= 1) {
      strengths.push("Experience highlights quantifiable achievements and business outcomes.");
    }
    if (strengths.length === 0) {
      strengths.push("LinkedIn profile structured and ready for role optimization.");
    }

    // Improvements
    if (roleAlignmentScore < Math.round(this.weights.roleAlignment * 0.6)) {
      improvements.push(`Refine your headline to explicitly highlight "${targetRole}" and core domain terms.`);
    }
    const missingSkills = skillEvidences.filter((e) => e.level === "None");
    if (missingSkills.length > 0) {
      improvements.push(
        `Add missing target skills to profile: ${missingSkills.slice(0, 4).map((s) => s.skill).join(", ")}.`
      );
    }
    if (metricsFoundCount === 0) {
      improvements.push("Add measurable achievements (e.g., % improvement, scale handled) to your experience bullets.");
    }
    if (about.length < 40) {
      improvements.push("Expand your 'About' section with a summary tailored to your target engineering domain.");
    }
    if (improvements.length === 0) {
      improvements.push("Request endorsements from colleagues for your top role-specific skills.");
    }

    return {
      platform: "linkedin",
      score: totalScore,
      targetRole,
      breakdown: {
        roleAlignment: roleAlignmentScore,
        skillCoverage: skillCoverageScore,
        experienceRelevance: experienceRelevanceScore,
        achievementQuality: achievementQualityScore,
        profileCompleteness: profileCompletenessScore,
        maxPossible: this.weights,
      },
      evidence: {
        matchedSkills: skillEvidences,
        matchedExperiences: matchedExperiencesSummary,
        hasHeadline: headline.length > 0,
        hasAbout: about.length > 0,
        experienceCount: experiences.length,
        skillCount: rawSkills.length,
      },
      strengths,
      improvements,
    };
  }
}
