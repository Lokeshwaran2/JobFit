import { CANONICAL_SKILL_MAP } from "../skills/skill-normalization";

export interface BulletValidationResult {
  isValid: boolean;
  reason?: string;
  detectedMetrics?: string[];
  introducedSkills?: string[];
}

/**
 * Extracts numeric metrics, percentages, currencies, multipliers, and quantities
 */
export function extractMetrics(text: string): string[] {
  if (!text) return [];

  const metrics: string[] = [];

  // 1. Percentages: 40%, 35.5%
  const percentMatches = text.match(/\b\d+(?:\.\d+)?%/g) || [];
  metrics.push(...percentMatches.map((m) => m.toLowerCase()));

  // 2. Currencies: $2.4M, $500k, €10k, ₹50L
  const currencyMatches = text.match(/[\$\€\£\₹]\s*\d+(?:\.\d+)?[kKmMbB]?/g) || [];
  metrics.push(...currencyMatches.map((m) => m.replace(/\s+/g, "").toLowerCase()));

  // 3. Multipliers / Pluses: 25+, 10x, 2x, +50%
  const multiplierMatches = text.match(/\b\d+(?:\.\d+)?[\+xX]\b|\b[xX]\d+(?:\.\d+)?\b/g) || [];
  metrics.push(...multiplierMatches.map((m) => m.toLowerCase()));

  // 4. Large quantities or k/M suffixes: 100k, 1M, 50,000
  const quantityMatches = text.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?[kKmMbB]\b/g) || [];
  metrics.push(...quantityMatches.map((m) => m.replace(/,/g, "").toLowerCase()));

  // 5. Raw integers (excluding 4-digit years like 2020, 2024)
  const rawNumberMatches = text.match(/\b\d+\b/g) || [];
  for (const raw of rawNumberMatches) {
    const num = parseInt(raw, 10);
    // Ignore standard years between 1970 and 2040
    if (num >= 1970 && num <= 2040) continue;
    // Add raw number if not already part of an extracted metric
    const alreadyCovered = metrics.some((m) => m.includes(raw));
    if (!alreadyCovered) {
      metrics.push(raw);
    }
  }

  return Array.from(new Set(metrics));
}

/**
 * Extracts canonical skills mentioned in text
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();

  for (const [alias, canonical] of Object.entries(CANONICAL_SKILL_MAP)) {
    // Single character C language protection
    if (canonical === "C") {
      const cRegex = /(?<![a-zA-Z0-9_])C(?![a-zA-Z0-9_+#])(?:\s+(?:programming|language|developer))?|(?<![a-zA-Z0-9_])C\/(?:C\+\+|Rust)/;
      if (cRegex.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    // Special languages with symbols
    if (alias === "c++" || alias === "cpp") {
      if (/(?<![a-zA-Z0-9_])(?:C\+\+|cpp)(?![a-zA-Z0-9_])/i.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    if (alias === "c#" || alias === "csharp") {
      if (/(?<![a-zA-Z0-9_])(?:C#|csharp)(?![a-zA-Z0-9_])/i.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    if (alias === ".net" || alias === ".net core") {
      if (/(?<![a-zA-Z0-9_])\.NET(?:\s+Core)?(?![a-zA-Z0-9_])/i.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    if (alias === "go" || alias === "golang") {
      if (/(?<![a-zA-Z0-9_])(?:Go(?:lang)?)(?![a-zA-Z0-9_])/i.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    if (alias === "js") {
      // Must not match inside "node.js" or "node js"
      if (/(?<!node[\.\s])\bjs\b/i.test(text)) {
        found.add(canonical);
      }
      continue;
    }

    // Standard word boundary
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      found.add(canonical);
    }
  }

  return Array.from(found);
}

/**
 * Deterministic Safety Validation Layer for Rewritten Bullets (Part 25 & 26)
 */
export class BulletValidator {
  /**
   * Validates that a rewritten bullet:
   * 1. Does not invent or alter numeric metrics, percentages, currencies, or multipliers
   * 2. Does not introduce unverified technical skills not found in candidate source resume
   * 3. Does not unnaturally stuff keywords
   */
  public static validateRewrite(
    originalBullet: string,
    rewrittenBullet: string,
    candidateKnownSkills: Set<string>,
    candidateKnownMetrics: Set<string> = new Set()
  ): BulletValidationResult {
    const origTrim = (originalBullet || "").trim();
    const rewTrim = (rewrittenBullet || "").trim();

    if (!rewTrim) {
      return { isValid: false, reason: "Rewritten bullet is empty." };
    }

    // 1. Check Metrics & Numbers Integrity (Test 1 & Test 2)
    const origMetrics = new Set([
      ...extractMetrics(origTrim),
      ...Array.from(candidateKnownMetrics).map((m) => m.toLowerCase()),
    ]);
    const rewMetrics = extractMetrics(rewTrim);

    const fabricatedMetrics: string[] = [];
    for (const metric of rewMetrics) {
      const lower = metric.toLowerCase();
      // Check exact match or normalized containment
      let foundInOriginal = false;
      for (const origM of origMetrics) {
        if (origM === lower || origM.replace(/[^0-9]/g, "") === lower.replace(/[^0-9]/g, "")) {
          foundInOriginal = true;
          break;
        }
      }

      if (!foundInOriginal) {
        fabricatedMetrics.push(metric);
      }
    }

    if (fabricatedMetrics.length > 0) {
      return {
        isValid: false,
        reason: `Unsupported metric detected: [${fabricatedMetrics.join(", ")}]. Candidate source did not contain this metric.`,
        detectedMetrics: fabricatedMetrics,
      };
    }

    // 2. Check Missing Skills Cannot Become Experience (Test 3 & Test 4)
    const origBulletSkills = extractSkillsFromText(origTrim).map((s) => s.toLowerCase());
    const rewSkills = extractSkillsFromText(rewTrim);

    const fabricatedSkills: string[] = [];
    for (const skill of rewSkills) {
      const lowerSkill = skill.toLowerCase();
      // Allowed if it was in the original bullet OR in candidate's known skills list
      const inOrigBullet = origBulletSkills.includes(lowerSkill);
      const inCandidateProfile = candidateKnownSkills.has(lowerSkill);

      if (!inOrigBullet && !inCandidateProfile) {
        fabricatedSkills.push(skill);
      }
    }

    if (fabricatedSkills.length > 0) {
      return {
        isValid: false,
        reason: `Unsupported skill/technology introduced: [${fabricatedSkills.join(", ")}]. This requirement was missing from candidate source.`,
        introducedSkills: fabricatedSkills,
      };
    }

    // 3. Strict Anti-Fabrication for Technical Techniques / Mechanisms
    // Forbids hallucinating specific implementation mechanisms (e.g., caching, query tuning, code refactoring, hot-fixes)
    const UNSUPPORTED_TECHNIQUES = [
      "query tuning",
      "caching",
      "cache",
      "code refactoring",
      "refactoring",
      "hot-fix",
      "hot-fixes",
      "hotfix",
      "hotfixes",
      "database indexing",
      "indexing",
      "database sharding",
      "sharding",
      "replication",
      "load balancing",
      "connection pooling",
      "multithreading",
      "concurrency",
      "rate limiting",
      "circuit breaker",
      "event sourcing",
      "zero-downtime",
    ];

    const origLower = origTrim.toLowerCase();
    const rewLower = rewTrim.toLowerCase();

    const fabricatedTechniques: string[] = [];
    for (const tech of UNSUPPORTED_TECHNIQUES) {
      const techRegex = new RegExp(`\\b${tech.replace(/[-]/g, "[- ]")}\\b`, "i");
      if (techRegex.test(rewLower) && !techRegex.test(origLower)) {
        // Only allowed if candidate profile/known skills explicitly mention this technique
        let inCandidateProfile = false;
        for (const skill of candidateKnownSkills) {
          if (skill.toLowerCase().includes(tech) || tech.includes(skill.toLowerCase())) {
            inCandidateProfile = true;
            break;
          }
        }
        if (!inCandidateProfile) {
          fabricatedTechniques.push(tech);
        }
      }
    }

    if (fabricatedTechniques.length > 0) {
      return {
        isValid: false,
        reason: `Unsupported technical mechanism introduced: [${fabricatedTechniques.join(", ")}]. Candidate source did not contain this technique.`,
      };
    }

    // 4. Source Evidence Preservation: Ensure valuable candidate technologies are not stripped
    const origSkills = extractSkillsFromText(origTrim);
    const rewSkillsLower = rewSkills.map((s) => s.toLowerCase());

    // If original bullet contained 2 or more distinct technologies (e.g. Angular, .NET, REST API)
    // the rewrite must not strip all of them away merely for conciseness
    if (origSkills.length >= 2) {
      const preservedCount = origSkills.filter((s) => rewSkillsLower.includes(s.toLowerCase())).length;
      if (preservedCount === 0) {
        return {
          isValid: false,
          reason: `Rewrite removed relevant source technologies without equivalent evidence: [${origSkills.join(", ")}].`,
        };
      }
    }

    // Specific key technology preservation guards
    if (/\bangular\b/i.test(origTrim) && !/\bangular\b/i.test(rewTrim)) {
      return {
        isValid: false,
        reason: "Rewrite removed key source technology 'Angular' present in original bullet.",
      };
    }
    if (/(?<![a-zA-Z0-9_])\.NET(?![a-zA-Z0-9_])/i.test(origTrim) && !/(?<![a-zA-Z0-9_])\.NET(?![a-zA-Z0-9_])/i.test(rewTrim)) {
      return {
        isValid: false,
        reason: "Rewrite removed key source technology '.NET' present in original bullet.",
      };
    }
    if (/\b(?:REST|RESTful)\s+APIs?\b/i.test(origTrim) && !/\b(?:REST|RESTful)\s+APIs?\b/i.test(rewTrim) && !/\bAPIs?\b/i.test(rewTrim)) {
      return {
        isValid: false,
        reason: "Rewrite removed key source technology 'REST APIs' present in original bullet.",
      };
    }

    // 5. Check for Keyword Stuffing (Test 12)
    // A single technical term should not repeat 3+ times in a single bullet
    for (const skill of rewSkills) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const occurrences = (rewTrim.match(new RegExp(`\\b${escaped}\\b`, "gi")) || []).length;
      if (occurrences >= 3) {
        return {
          isValid: false,
          reason: `Unnatural keyword repetition detected for '${skill}' (${occurrences} times in single bullet).`,
        };
      }
    }

    return { isValid: true };
  }
}
