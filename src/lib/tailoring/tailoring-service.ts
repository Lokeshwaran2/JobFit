import { AiService } from "../ai-service";
import { JobMatcher } from "../matching/job-matcher";
import { JobMatchResult, StructuredJobDescription } from "../matching/types";
import { BulletValidator, extractMetrics, extractSkillsFromText } from "./bullet-validator";
import { RelevanceRanker } from "./relevance-ranker";
import { RewrittenBulletEvidence, TailoringDiffResult } from "./types";
import { normalizeSkill } from "../skills/skill-normalization";

export class TailoringService {
  /**
   * Tailors an authentic resume against a structured Job Description with strict
   * evidence-based validation, relevance ordering, and zero fabrication.
   *
   * Rules:
   * 1. The original resume is the authoritative source of truth.
   * 2. Any bullet that introduces unsupported metrics or missing skills is rejected and falls back to original.
   * 3. Employment job titles, company names, and dates are strictly preserved.
   * 4. Relevance ordering prioritizes verified evidence without dropping any candidate bullets.
   * 5. Match scores before and after are calculated 100% deterministically.
   */
  public static async tailorResume(
    originalResume: any,
    jd: StructuredJobDescription,
    beforeMatchInput?: JobMatchResult,
    rawAiTailoredResult?: any // Optional: for testing or precomputed AI response
  ): Promise<{
    tailoredData: any;
    tailoringDiff: TailoringDiffResult;
    afterMatch: JobMatchResult;
  }> {
    // 1. Establish deterministic baseline score if not provided
    const beforeMatch = beforeMatchInput || JobMatcher.match(originalResume, jd);

    // 2. Gather candidate's authoritative known skills and metrics
    const candidateKnownSkills = new Set<string>();
    const candidateSkillsRaw: string[] = [];

    if (Array.isArray(originalResume?.skills?.hard)) candidateSkillsRaw.push(...originalResume.skills.hard);
    if (Array.isArray(originalResume?.skills?.soft)) candidateSkillsRaw.push(...originalResume.skills.soft);
    if (Array.isArray(originalResume?.skills?.tools)) candidateSkillsRaw.push(...originalResume.skills.tools);

    for (const raw of candidateSkillsRaw) {
      if (typeof raw === "string" && raw.trim()) {
        const norm = normalizeSkill(raw);
        if (norm.canonicalSkill) {
          candidateKnownSkills.add(norm.canonicalSkill.toLowerCase());
        }
      }
    }

    // Also extract skills and metrics from original experience bullets and projects
    const candidateKnownMetrics = new Set<string>();

    if (Array.isArray(originalResume?.experience)) {
      for (const exp of originalResume.experience) {
        if (Array.isArray(exp?.description)) {
          for (const item of exp.description) {
            const text = typeof item === "string" ? item : item?.text || "";
            for (const skill of extractSkillsFromText(text)) {
              candidateKnownSkills.add(skill.toLowerCase());
            }
            for (const m of extractMetrics(text)) {
              candidateKnownMetrics.add(m.toLowerCase());
            }
          }
        }
      }
    }

    if (Array.isArray(originalResume?.projects)) {
      for (const proj of originalResume.projects) {
        const text = proj?.description || "";
        for (const skill of extractSkillsFromText(text)) {
          candidateKnownSkills.add(skill.toLowerCase());
        }
        for (const m of extractMetrics(text)) {
          candidateKnownMetrics.add(m.toLowerCase());
        }
      }
    }

    // 3. Obtain AI-tailored candidate draft
    let rawTailored: any;
    if (rawAiTailoredResult) {
      rawTailored = rawAiTailoredResult;
    } else {
      rawTailored = await AiService.rewriteResume(originalResume, jd);
    }


    // 4. Start from Authoritative Original Resume
    // The original resume is the authoritative factual source of truth.
    // Every section (personalInfo, summary, skills, experience, projects, education, certifications)
    // is preserved from originalResume.
    const verifiedTailoredData = JSON.parse(JSON.stringify(originalResume));

    const bulletDiffs: RewrittenBulletEvidence[] = [];
    const preservedJobTitles: string[] = [];
    const preservedCompanies: string[] = [];
    const preservedDates: string[] = [];

    // Enforce Candidate Job Title Preservation on personalInfo (Part 9, Test 5)
    if (originalResume?.personalInfo?.title) {
      verifiedTailoredData.personalInfo = {
        ...(originalResume.personalInfo || {}),
        title: originalResume.personalInfo.title,
      };
      preservedJobTitles.push(originalResume.personalInfo.title);
    }

    // 5. Validate and Ground Experience Bullets (Task 7, Task 8)
    const originalExperience = Array.isArray(originalResume?.experience) ? originalResume.experience : [];
    const draftExperience = Array.isArray(rawTailored?.structuredData?.experience)
      ? rawTailored.structuredData.experience
      : [];
    const tailoredExperience: any[] = [];

    for (let expIdx = 0; expIdx < originalExperience.length; expIdx++) {
      const origExp = originalExperience[expIdx];
      const draftExp = draftExperience[expIdx] || origExp;
      const tailoredExpEntry = {
        ...JSON.parse(JSON.stringify(origExp)),
        company: origExp.company,
        role: origExp.role,
        startDate: origExp.startDate,
        endDate: origExp.endDate,
        location: origExp.location,
      };

      preservedCompanies.push(origExp.company);
      preservedJobTitles.push(origExp.role);
      preservedDates.push(`${origExp.startDate || ""} - ${origExp.endDate || ""}`);

      // Process experience bullets
      const origBullets: string[] = (origExp.description || []).map((b: any) =>
        typeof b === "string" ? b : b?.text || ""
      );
      const draftBullets: string[] = (draftExp.description || []).map((b: any) =>
        typeof b === "string" ? b : b?.text || ""
      );

      const validatedBullets: Array<{ text: string; isOptimized: boolean }> = [];

      for (let bIdx = 0; bIdx < origBullets.length; bIdx++) {
        const originalBullet = origBullets[bIdx];
        const rawRewrittenBullet = draftBullets[bIdx] || originalBullet;

        // Run Deterministic Safety Validator (Part 26)
        const validation = BulletValidator.validateRewrite(
          originalBullet,
          rawRewrittenBullet,
          candidateKnownSkills,
          candidateKnownMetrics
        );

        if (validation.isValid && rawRewrittenBullet !== originalBullet) {
          // ACCEPTED REWRITE
          const changes: string[] = [];

          // Explain why the change occurred (Part 17)
          const origSkills = extractSkillsFromText(originalBullet);
          const rewSkills = extractSkillsFromText(rawRewrittenBullet);
          const emphasizedSkills = rewSkills.filter((s) => !origSkills.includes(s));

          if (emphasizedSkills.length > 0) {
            changes.push(`Highlighted candidate's verified skill '${emphasizedSkills.join(", ")}' for role alignment.`);
          }

          const jdRequiredMatches = (jd.requiredSkills || []).filter((r) =>
            rawRewrittenBullet.toLowerCase().includes(r.toLowerCase())
          );
          if (jdRequiredMatches.length > 0) {
            changes.push(`Aligned wording with target role requirement '${jdRequiredMatches[0]}'.`);
          } else {
            changes.push("Strengthened action verbs, clarity, and conciseness.");
          }

          bulletDiffs.push({
            originalBullet,
            rewrittenBullet: rawRewrittenBullet,
            sourceSection: "experience",
            sourceIndex: expIdx,
            bulletIndex: bIdx,
            companyOrProjectName: origExp.company,
            relevantRequirements: jdRequiredMatches,
            evidenceUsed: [`Original bullet #${bIdx + 1} from ${origExp.role} at ${origExp.company}`],
            changes,
            confidence: "high",
            status: "accepted",
          });

          validatedBullets.push({ text: rawRewrittenBullet, isOptimized: true });
        } else {
          // REJECTED REWRITE or UNCHANGED: Fall back to original bullet!
          if (!validation.isValid) {
            bulletDiffs.push({
              originalBullet,
              rewrittenBullet: rawRewrittenBullet,
              sourceSection: "experience",
              sourceIndex: expIdx,
              bulletIndex: bIdx,
              companyOrProjectName: origExp.company,
              relevantRequirements: [],
              evidenceUsed: [`Original bullet #${bIdx + 1} from ${origExp.role} at ${origExp.company}`],
              changes: [`Rewrite rejected: ${validation.reason}. Safely reverted to original bullet.`],
              confidence: "high",
              status: "rejected",
              rejectionReason: validation.reason,
            });
          }

          validatedBullets.push({ text: originalBullet, isOptimized: false });
        }
      }

      // 6. Apply Relevance-Ordering (Task 8)
      const { orderedBullets } = RelevanceRanker.orderBulletsByRelevance(validatedBullets, jd, beforeMatch);
      tailoredExpEntry.description = orderedBullets;
      tailoredExperience.push(tailoredExpEntry);
    }

    verifiedTailoredData.experience = tailoredExperience;

    // 7. Skills: Preserve all candidate skills from originalResume, with optional reordering to highlight JD matches
    if (originalResume?.skills) {
      verifiedTailoredData.skills = JSON.parse(JSON.stringify(originalResume.skills));
      if (Array.isArray(verifiedTailoredData.skills.hard)) {
        const jdKeywordsLower = new Set([
          ...(jd.requiredSkills || []).map((s) => s.toLowerCase()),
          ...(jd.preferredSkills || []).map((s) => s.toLowerCase()),
          ...(jd.keywords || []).map((s) => s.toLowerCase()),
        ]);
        verifiedTailoredData.skills.hard.sort((a: string, b: string) => {
          const aMatch = jdKeywordsLower.has(a.toLowerCase());
          const bMatch = jdKeywordsLower.has(b.toLowerCase());
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }
    }

    // Preserve non-experience sections from originalResume completely
    if (originalResume?.education) {
      verifiedTailoredData.education = JSON.parse(JSON.stringify(originalResume.education));
    }
    if (originalResume?.projects) {
      verifiedTailoredData.projects = JSON.parse(JSON.stringify(originalResume.projects));
    }
    if (originalResume?.certifications) {
      verifiedTailoredData.certifications = JSON.parse(JSON.stringify(originalResume.certifications));
    }

    // 8. Calculate Deterministic Post-Tailoring Match Score (Part 23 & 24)
    // The deterministic matcher is authoritative. No Math.max overrides, score floors, or artificial bonuses.
    const afterMatch = JobMatcher.match(verifiedTailoredData, jd);

    const scoreGain = Math.max(0, afterMatch.score - beforeMatch.score);
    const percentageGain =
      beforeMatch.score > 0 ? Math.round((scoreGain / beforeMatch.score) * 100) : 0;

    const tailoringDiff: TailoringDiffResult = {
      beforeScore: beforeMatch.score,
      afterScore: afterMatch.score,
      scoreGain,
      percentageGain,
      bulletDiffs,
      relevanceOrderApplied: true,
      preservedJobTitles: Array.from(new Set(preservedJobTitles)),
      preservedCompanies: Array.from(new Set(preservedCompanies)),
      preservedDates: Array.from(new Set(preservedDates)),
    };

    return {
      tailoredData: verifiedTailoredData,
      tailoringDiff,
      afterMatch,
    };
  }
}
