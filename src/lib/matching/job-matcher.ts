import {
  StructuredJobDescription,
  JobMatchResult,
  RequirementEvidence,
} from "./types";
import { normalizeSkill, CANONICAL_SKILL_MAP } from "../skills/skill-normalization";

/**
 * Weights for the deterministic Job Match Score model.
 * Total = 100%
 *
 * Rationale:
 * - requiredSkills (35%): Fundamental technical prerequisites for the position.
 * - preferredSkills (15%): Nice-to-have capabilities; absence shouldn't heavily penalize.
 * - experience (20%): Verifiable professional seniority and duration fit.
 * - responsibilities (15%): Demonstrates relevant functional role responsibilities.
 * - keywords (10%): Domain and industry terminology coverage.
 * - education (5%): Academic credentials and certifications where requested.
 */
export const MATCH_WEIGHTS = {
  requiredSkills: 35,
  preferredSkills: 15,
  experience: 20,
  responsibilities: 15,
  keywords: 10,
  education: 5,
} as const;

// Cache map of canonical skill names to all known lowercase aliases
const CANONICAL_TO_ALIASES: Map<string, string[]> = new Map();
for (const [alias, canonical] of Object.entries(CANONICAL_SKILL_MAP)) {
  const existing = CANONICAL_TO_ALIASES.get(canonical) || [];
  if (!existing.includes(alias)) {
    existing.push(alias);
  }
  CANONICAL_TO_ALIASES.set(canonical, existing);
}

/**
 * Escapes regex special characters safely
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds token-aware regex for a given skill and its aliases.
 * Prevents false positives:
 * - "Java" will NOT match "JavaScript"
 * - "C" will NOT match arbitrary words containing "c" (e.g. "React", "Docker")
 * - "Go" will NOT match "Google" or "going"
 * - "Rust" will NOT match "trust" or "frustrated"
 */
function buildSkillRegex(canonicalName: string, aliases: string[]): RegExp | null {
  // Special case: Single-letter C language
  if (canonicalName === "C") {
    // Match 'C' as standalone word token or 'C/C++', 'C programming', 'C language'
    return /(?<![a-zA-Z0-9_])C(?![a-zA-Z0-9_+#])(?:\s+(?:programming|language|developer))?|(?<![a-zA-Z0-9_])C\/(?:C\+\+|Rust)/;
  }

  // Collect all forms to match
  const forms = new Set<string>();
  forms.add(canonicalName);
  for (const alias of aliases) {
    forms.add(alias);
  }

  const patterns: string[] = [];

  for (const form of forms) {
    const trimmed = form.trim();
    if (!trimmed) continue;

    // Special languages with symbols like C++, C#, .NET
    if (trimmed === "C++" || trimmed.toLowerCase() === "cpp") {
      patterns.push("(?<![a-zA-Z0-9_])(?:C\\+\\+|cpp)(?![a-zA-Z0-9_])");
    } else if (trimmed === "C#" || trimmed.toLowerCase() === "csharp") {
      patterns.push("(?<![a-zA-Z0-9_])(?:C#|csharp)(?![a-zA-Z0-9_])");
    } else if (trimmed === ".NET" || trimmed === ".NET Core") {
      patterns.push("(?<![a-zA-Z0-9_])\\.NET(?:\\s+Core)?(?![a-zA-Z0-9_])");
    } else if (trimmed.toLowerCase() === "go" || trimmed.toLowerCase() === "golang") {
      // Avoid matching 'go' in regular prose like 'go to' or 'let go'
      patterns.push("(?<![a-zA-Z0-9_])(?:Go(?:lang)?)(?![a-zA-Z0-9_])");
    } else {
      // Standard alphanumeric word token: use strict word boundaries
      patterns.push(`\\b${escapeRegex(trimmed)}\\b`);
    }
  }

  if (patterns.length === 0) return null;
  return new RegExp(`(?:${patterns.join("|")})`, "i");
}

/**
 * Extracts year from a date string (e.g. "2020", "Jan 2019", "03/2018", "2021-04")
 */
function extractYear(dateStr: string): number | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extracts month (1-12) from date string
 */
function extractMonth(dateStr: string): number | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const monthMap: Record<string, number> = {
    jan: 1, january: 1, "01": 1, "1": 1,
    feb: 2, february: 2, "02": 2, "2": 2,
    mar: 3, march: 3, "03": 3, "3": 3,
    apr: 4, april: 4, "04": 4, "4": 4,
    may: 5, "05": 5, "5": 5,
    jun: 6, june: 6, "06": 6, "6": 6,
    jul: 7, july: 7, "07": 7, "7": 7,
    aug: 8, august: 8, "08": 8, "8": 8,
    sep: 9, sept: 9, september: 9, "09": 9, "9": 9,
    oct: 10, october: 10, "10": 10,
    nov: 11, november: 11, "11": 11,
    dec: 12, december: 12, "12": 12,
  };
  const parts = dateStr.toLowerCase().split(/[\s\/\-\.]+/);
  for (const part of parts) {
    if (monthMap[part] !== undefined) {
      return monthMap[part];
    }
  }
  return null;
}

interface BulletEvidence {
  source: string;
  text: string;
}

/**
 * Deterministic Job Match Engine (Task 4)
 */
export class JobMatcher {
  /**
   * Evaluates candidate resume against structured job description.
   * Produces 100% deterministic, explainable, evidence-based results.
   */
  public static match(resume: any, jd: StructuredJobDescription | any): JobMatchResult {
    // 1. Collect candidate structured information
    const candidateSkillsRaw: string[] = [];
    if (Array.isArray(resume?.skills?.hard)) candidateSkillsRaw.push(...resume.skills.hard);
    if (Array.isArray(resume?.skills?.soft)) candidateSkillsRaw.push(...resume.skills.soft);
    if (Array.isArray(resume?.skills?.tools)) candidateSkillsRaw.push(...resume.skills.tools);

    // Canonical set of candidate declared skills
    const candidateCanonicalSkills = new Set<string>();
    for (const raw of candidateSkillsRaw) {
      if (typeof raw === "string" && raw.trim()) {
        const norm = normalizeSkill(raw);
        if (norm.canonicalSkill) {
          candidateCanonicalSkills.add(norm.canonicalSkill.toLowerCase());
        }
      }
    }

    // Collect textual bullets from experience and projects
    const candidateBullets: BulletEvidence[] = [];

    if (Array.isArray(resume?.experience)) {
      for (const exp of resume.experience) {
        const role = exp?.role || "Role";
        const company = exp?.company || "Company";
        const prefix = `${role} at ${company}`;

        if (Array.isArray(exp?.description)) {
          for (const item of exp.description) {
            const text = typeof item === "string" ? item : item?.text || "";
            if (text.trim()) {
              candidateBullets.push({ source: prefix, text: text.trim() });
            }
          }
        }
      }
    }

    if (Array.isArray(resume?.projects)) {
      for (const proj of resume.projects) {
        const name = proj?.name || "Project";
        if (proj?.description && typeof proj.description === "string") {
          candidateBullets.push({ source: `Project (${name})`, text: proj.description.trim() });
        }
      }
    }

    if (resume?.summary && typeof resume.summary === "string") {
      candidateBullets.push({ source: "Summary", text: resume.summary.trim() });
    }

    const allEvidence: RequirementEvidence[] = [];

    // Helper: test a skill against candidate resume and collect concrete evidence
    const testSkillMatch = (
      skill: string,
      category: "requiredSkill" | "preferredSkill"
    ): { matched: boolean; evidenceList: string[]; confidence: "high" | "medium" | "low" } => {
      const norm = normalizeSkill(skill);
      const canonical = norm.canonicalSkill;
      const lowerCanon = canonical.toLowerCase();
      const evidenceList: string[] = [];

      // Check 1: Declared in candidate skills list
      if (candidateCanonicalSkills.has(lowerCanon)) {
        evidenceList.push(`Technical Skills: ${canonical}`);
      }

      // Check 2: Found in bullet points
      const aliases = CANONICAL_TO_ALIASES.get(canonical) || [norm.originalSkill.toLowerCase()];
      const regex = buildSkillRegex(canonical, aliases);

      if (regex) {
        for (const bullet of candidateBullets) {
          if (regex.test(bullet.text)) {
            evidenceList.push(`${bullet.source}: "${bullet.text}"`);
          }
        }
      }

      const matched = evidenceList.length > 0;
      const confidence = evidenceList.length >= 2 ? "high" : evidenceList.length === 1 ? "medium" : "low";

      allEvidence.push({
        requirement: canonical,
        category,
        status: matched ? "matched" : "missing",
        evidence: evidenceList,
        confidence,
      });

      return { matched, evidenceList, confidence };
    };

    // 2. Score Required Skills (35%)
    const jdRequired = Array.isArray(jd.requiredSkills) ? jd.requiredSkills : [];
    // Deduplicate required skills canonically (strictly ignoring empty or invalid skills)
    const uniqueRequiredMap = new Map<string, string>();
    for (const r of jdRequired) {
      if (typeof r === "string" && r.trim()) {
        const canon = normalizeSkill(r).canonicalSkill?.trim();
        if (canon && !uniqueRequiredMap.has(canon.toLowerCase())) {
          uniqueRequiredMap.set(canon.toLowerCase(), canon);
        }
      }
    }

    const matchedRequiredSkills: string[] = [];
    const missingRequiredSkills: string[] = [];

    for (const [, canonical] of uniqueRequiredMap.entries()) {
      if (!canonical || !canonical.trim()) continue;
      const { matched } = testSkillMatch(canonical, "requiredSkill");
      if (matched) {
        matchedRequiredSkills.push(canonical);
      } else {
        missingRequiredSkills.push(canonical);
      }
    }

    matchedRequiredSkills.sort();
    missingRequiredSkills.sort();

    const requiredSkillsScore =
      uniqueRequiredMap.size === 0
        ? 100
        : Math.round((matchedRequiredSkills.length / uniqueRequiredMap.size) * 100);

    // 3. Score Preferred Skills (15%)
    const jdPreferred = Array.isArray(jd.preferredSkills) ? jd.preferredSkills : [];
    const uniquePreferredMap = new Map<string, string>();
    for (const p of jdPreferred) {
      if (typeof p === "string" && p.trim()) {
        const canon = normalizeSkill(p).canonicalSkill?.trim();
        // Don't duplicate if empty or already in required/preferred
        if (
          canon &&
          !uniqueRequiredMap.has(canon.toLowerCase()) &&
          !uniquePreferredMap.has(canon.toLowerCase())
        ) {
          uniquePreferredMap.set(canon.toLowerCase(), canon);
        }
      }
    }

    const matchedPreferredSkills: string[] = [];
    const missingPreferredSkills: string[] = [];

    for (const [, canonical] of uniquePreferredMap.entries()) {
      const { matched } = testSkillMatch(canonical, "preferredSkill");
      if (matched) {
        matchedPreferredSkills.push(canonical);
      } else {
        missingPreferredSkills.push(canonical);
      }
    }

    matchedPreferredSkills.sort();
    missingPreferredSkills.sort();

    const preferredSkillsScore =
      uniquePreferredMap.size === 0
        ? 100
        : Math.round((matchedPreferredSkills.length / uniquePreferredMap.size) * 100);

    // 4. Score Experience (20%)
    const minYears = typeof jd.minYearsExperience === "number" ? jd.minYearsExperience : null;
    let candidateYears: number | null = null;
    let meetsMinimum: boolean | null = null;
    let experienceScore = 100;
    let expSummary = "";

    // Compute candidate total professional experience
    if (Array.isArray(resume?.experience) && resume.experience.length > 0) {
      let totalMonths = 0;
      let dateFound = false;

      for (const exp of resume.experience) {
        const startStr = exp?.startDate || "";
        const endStr = exp?.endDate || "";
        const startYear = extractYear(startStr);
        let endYear = extractYear(endStr);
        const isPresent = /present|current|now/i.test(endStr);
        if (isPresent) {
          endYear = new Date().getFullYear();
        }

        if (startYear !== null && endYear !== null && endYear >= startYear) {
          const startMonth = extractMonth(startStr) ?? 1;
          const endMonth = isPresent ? new Date().getMonth() + 1 : extractMonth(endStr) ?? 12;
          const months = (endYear - startYear) * 12 + (endMonth - startMonth);
          if (months > 0) {
            totalMonths += months;
            dateFound = true;
          }
        }
      }

      if (dateFound) {
        candidateYears = Math.round((totalMonths / 12) * 10) / 10;
      }
    }

    if (minYears === null) {
      // Role does not require a specific duration
      meetsMinimum = null;
      experienceScore = 100;
      expSummary = "The role does not specify a minimum years of experience requirement.";
    } else if (candidateYears === null) {
      // Experience could not be reliably determined from dates
      meetsMinimum = null;
      experienceScore = 50; // Neutral baseline when years can't be computed
      expSummary = `The role requires ${minYears}+ years of experience. Resume dates could not be confidently determined.`;
    } else {
      meetsMinimum = candidateYears >= minYears;
      if (meetsMinimum) {
        experienceScore = 100;
        expSummary = `The role asks for ${minYears}+ years of experience. Your resume provides evidence consistent with approximately ${candidateYears} years.`;
      } else {
        experienceScore = Math.max(0, Math.round((candidateYears / minYears) * 100));
        expSummary = `The role asks for ${minYears}+ years of experience. Your resume demonstrates approximately ${candidateYears} years.`;
      }
    }

    // 5. Score Responsibilities (15%)
    const jdResponsibilities = Array.isArray(jd.coreResponsibilities) ? jd.coreResponsibilities : [];
    let matchedRespCount = 0;

    for (const resp of jdResponsibilities) {
      if (typeof resp !== "string" || !resp.trim()) continue;
      const respEvidence: string[] = [];

      // Extract significant concepts from the responsibility (ignore small stop words)
      const words = resp
        .toLowerCase()
        .replace(/[^a-z0-9\s\+\#\.]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !["with", "from", "that", "this", "have", "will", "your", "their", "into", "over", "such", "team"].includes(w));

      // Check if candidate bullets demonstrate these key concepts
      for (const bullet of candidateBullets) {
        const bulletLower = bullet.text.toLowerCase();
        // Count how many significant terms overlap
        const matchingTerms = words.filter((w) => bulletLower.includes(w));
        // Need meaningful overlap (at least 2 terms or 40% of words)
        if (matchingTerms.length >= 2 || (words.length > 0 && matchingTerms.length / words.length >= 0.4)) {
          respEvidence.push(`${bullet.source}: "${bullet.text}"`);
        }
      }

      const isMatched = respEvidence.length > 0;
      if (isMatched) {
        matchedRespCount++;
      }

      allEvidence.push({
        requirement: resp,
        category: "responsibility",
        status: isMatched ? "matched" : "missing",
        evidence: respEvidence,
        confidence: respEvidence.length >= 2 ? "high" : respEvidence.length === 1 ? "medium" : "low",
      });
    }

    const responsibilitiesScore =
      jdResponsibilities.length === 0
        ? 100
        : Math.round((matchedRespCount / jdResponsibilities.length) * 100);

    // 6. Score Keywords (10%)
    const jdKeywords = Array.isArray(jd.keywords) ? jd.keywords : [];
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of jdKeywords) {
      if (typeof kw !== "string" || !kw.trim()) continue;
      const cleanKw = kw.trim();
      const kwRegex = new RegExp(`\\b${escapeRegex(cleanKw)}\\b`, "i");

      let kwMatched = false;
      const kwEvidence: string[] = [];

      for (const bullet of candidateBullets) {
        if (kwRegex.test(bullet.text)) {
          kwMatched = true;
          kwEvidence.push(`${bullet.source}: "${bullet.text}"`);
        }
      }

      // Also check candidate skills
      if (!kwMatched) {
        const lowerKw = cleanKw.toLowerCase();
        if (candidateCanonicalSkills.has(lowerKw)) {
          kwMatched = true;
          kwEvidence.push(`Skills list: ${cleanKw}`);
        }
      }

      if (kwMatched) {
        matchedKeywords.push(cleanKw);
      } else {
        missingKeywords.push(cleanKw);
      }

      allEvidence.push({
        requirement: cleanKw,
        category: "keyword",
        status: kwMatched ? "matched" : "missing",
        evidence: kwEvidence,
        confidence: kwEvidence.length > 0 ? "high" : "low",
      });
    }

    matchedKeywords.sort();
    missingKeywords.sort();

    const keywordsScore =
      jdKeywords.length === 0
        ? 100
        : Math.round((matchedKeywords.length / jdKeywords.length) * 100);

    // 7. Score Education & Certifications (5%)
    const jdEdu = Array.isArray(jd.educationRequirements) ? jd.educationRequirements : [];
    let educationScore = 100;

    if (jdEdu.length > 0) {
      const candidateEdu = Array.isArray(resume?.education) ? resume.education : [];
      if (candidateEdu.length === 0) {
        educationScore = 0;
      } else {
        // Degree degree match check
        const eduPatterns = /(bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|b\.?tech|b\.?e\.?|computer science|engineering)/i;
        const hasMatchingDegree = candidateEdu.some((e: any) =>
          eduPatterns.test(e?.degree || "") || eduPatterns.test(e?.institution || "")
        );
        educationScore = hasMatchingDegree ? 100 : 50;

        for (const req of jdEdu) {
          const matchingEd = candidateEdu.find((e: any) =>
            eduPatterns.test(e?.degree || "")
          );
          allEvidence.push({
            requirement: req,
            category: "education",
            status: hasMatchingDegree ? "matched" : "missing",
            evidence: matchingEd ? [`${matchingEd.degree} from ${matchingEd.institution || "Institution"}`] : [],
            confidence: hasMatchingDegree ? "high" : "low",
          });
        }
      }
    }

    // 8. Composite Deterministic Score Calculation
    const breakdown = {
      requiredSkills: Math.min(100, Math.max(0, requiredSkillsScore)),
      preferredSkills: Math.min(100, Math.max(0, preferredSkillsScore)),
      experience: Math.min(100, Math.max(0, experienceScore)),
      responsibilities: Math.min(100, Math.max(0, responsibilitiesScore)),
      keywords: Math.min(100, Math.max(0, keywordsScore)),
      education: Math.min(100, Math.max(0, educationScore)),
    };

    // Calculate active weights based on what the JD actually specifies.
    // Unspecified categories do not award unearned points or inflate the score.
    const activeWeights = {
      requiredSkills: uniqueRequiredMap.size > 0 ? MATCH_WEIGHTS.requiredSkills : 0,
      preferredSkills: uniquePreferredMap.size > 0 ? MATCH_WEIGHTS.preferredSkills : 0,
      experience: minYears !== null ? MATCH_WEIGHTS.experience : 0,
      responsibilities: jdResponsibilities.length > 0 ? MATCH_WEIGHTS.responsibilities : 0,
      keywords: jdKeywords.length > 0 ? MATCH_WEIGHTS.keywords : 0,
      education: jdEdu.length > 0 ? MATCH_WEIGHTS.education : 0,
    };

    const totalActiveWeight =
      activeWeights.requiredSkills +
      activeWeights.preferredSkills +
      activeWeights.experience +
      activeWeights.responsibilities +
      activeWeights.keywords +
      activeWeights.education;

    let finalScore: number;
    if (totalActiveWeight === 0) {
      finalScore = 100;
    } else {
      const weightedSum =
        breakdown.requiredSkills * activeWeights.requiredSkills +
        breakdown.preferredSkills * activeWeights.preferredSkills +
        breakdown.experience * activeWeights.experience +
        breakdown.responsibilities * activeWeights.responsibilities +
        breakdown.keywords * activeWeights.keywords +
        breakdown.education * activeWeights.education;

      finalScore = Math.min(100, Math.max(0, Math.round(weightedSum / totalActiveWeight)));
    }

    // 9. Strengths & Gaps
    const strengths: string[] = [];
    if (matchedRequiredSkills.length > 0) {
      strengths.push(`Matches ${matchedRequiredSkills.length} required technical skills: ${matchedRequiredSkills.slice(0, 4).join(", ")}`);
    }
    if (matchedPreferredSkills.length > 0) {
      strengths.push(`Matches ${matchedPreferredSkills.length} preferred bonus skills: ${matchedPreferredSkills.slice(0, 3).join(", ")}`);
    }
    if (meetsMinimum === true) {
      strengths.push(`Demonstrates sufficient verified professional experience (${candidateYears} yrs vs ${minYears}+ yrs required)`);
    }
    if (responsibilitiesScore >= 70) {
      strengths.push(`Strong responsibility alignment (${responsibilitiesScore}% core functional coverage)`);
    }

    const gaps: string[] = [];
    if (missingRequiredSkills.length > 0) {
      gaps.push(`Missing required skills: ${missingRequiredSkills.join(", ")}`);
    }
    if (missingPreferredSkills.length > 0) {
      gaps.push(`Missing preferred skills: ${missingPreferredSkills.join(", ")}`);
    }
    if (meetsMinimum === false) {
      gaps.push(`Experience shortage: ${candidateYears} years demonstrated vs ${minYears}+ years required`);
    }

    // 10. Actionable Recommendations
    const recommendations: string[] = [];

    for (const missing of missingRequiredSkills.filter((s) => s && s.trim()).slice(0, 3)) {
      recommendations.push(
        `Your resume is missing required skill '${missing.trim()}'. If you have relevant hands-on background, add it with quantifiable context to your experience section.`
      );
    }

    // Check for skills present in skills list but missing from experience bullets
    for (const matched of matchedRequiredSkills.slice(0, 2)) {
      const hasBulletCitation = candidateBullets.some((b) =>
        b.text.toLowerCase().includes(matched.toLowerCase())
      );
      if (!hasBulletCitation) {
        recommendations.push(
          `You listed '${matched}' in your skills list, but it does not appear in your work experience bullet points. Add specific project impact demonstrating '${matched}'.`
        );
      }
    }

    if (missingPreferredSkills.length > 0) {
      recommendations.push(
        `Consider incorporating preferred skill '${missingPreferredSkills[0]}' if you have experience with it to strengthen your competitive edge.`
      );
    }

    if (meetsMinimum === false && minYears !== null && candidateYears !== null) {
      recommendations.push(
        `The role asks for ${minYears}+ years. Emphasize senior scope, system architecture ownership, and leadership metrics in your bullet points to compensate for the duration gap.`
      );
    }

    return {
      score: finalScore,
      breakdown,
      weights: MATCH_WEIGHTS,
      matchedRequiredSkills,
      missingRequiredSkills,
      matchedPreferredSkills,
      missingPreferredSkills,
      matchedKeywords,
      missingKeywords,
      experienceAssessment: {
        meetsMinimum,
        candidateYears,
        requiredYears: minYears,
        summary: expSummary,
      },
      evidence: allEvidence,
      strengths,
      gaps,
      recommendations,
    };
  }
}
