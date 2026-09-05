import { DEFAULT_GITHUB_WEIGHTS } from "./config";
import { EvidenceLevel, GitHubAnalysisResult, GitHubScoringWeights, SkillEvidence } from "./types";
import { normalizeSkill } from "@/lib/skills/skill-normalization";

interface GitHubRepoData {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count?: number;
  fork?: boolean;
  updated_at?: string;
  pushed_at?: string;
  has_wiki?: boolean;
  has_pages?: boolean;
  open_issues_count?: number;
}

interface GitHubUserResponse {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
  blog: string | null;
}

export class GitHubScoringService {
  private weights: GitHubScoringWeights;

  constructor(customWeights?: Partial<GitHubScoringWeights>) {
    this.weights = { ...DEFAULT_GITHUB_WEIGHTS, ...customWeights };
  }

  /**
   * Safe fetch GitHub public profile and repositories
   */
  public async fetchGitHubData(username: string): Promise<{
    user: GitHubUserResponse | null;
    repos: GitHubRepoData[];
    error?: string;
  }> {
    const headers: Record<string, string> = {
      "User-Agent": "JobFit-Profile-Analyzer",
      Accept: "application/vnd.github.v3+json",
    };

    // If GitHub token is present in env, use it to avoid strict public IP rate limit (60 req/hr)
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
        next: { revalidate: 3600 }, // Cache 1 hour
      });

      if (!userRes.ok) {
        if (userRes.status === 404) {
          return { user: null, repos: [], error: `GitHub user "${username}" was not found.` };
        }
        if (userRes.status === 403) {
          return {
            user: null,
            repos: [],
            error: "GitHub API rate limit exceeded. Analysis will use cached or fallback signals.",
          };
        }
        return { user: null, repos: [], error: `GitHub API error: ${userRes.statusText}` };
      }

      const user: GitHubUserResponse = await userRes.json();

      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=30&type=owner`,
        {
          headers,
          next: { revalidate: 3600 },
        }
      );

      let repos: GitHubRepoData[] = [];
      if (reposRes.ok) {
        repos = await reposRes.json();
      }

      return { user, repos };
    } catch (err: any) {
      return {
        user: null,
        repos: [],
        error: err?.message || "Failed to reach GitHub API.",
      };
    }
  }

  /**
   * Deterministically analyze GitHub profile & repositories against target role and JD skills
   */
  public analyze({
    username,
    user,
    repos,
    targetRole,
    requiredSkills,
  }: {
    username: string;
    user: GitHubUserResponse | null;
    repos: GitHubRepoData[];
    targetRole: string;
    requiredSkills: string[];
  }): GitHubAnalysisResult {
    // 1. Canonicalize required skills
    const normalizedRequired = requiredSkills
      .map((s) => normalizeSkill(s))
      .filter((s) => s.canonicalSkill);

    // Deduplicate required canonical skills
    const uniqueRequiredMap = new Map<string, string>();
    for (const item of normalizedRequired) {
      const lower = item.canonicalSkill.toLowerCase();
      if (!uniqueRequiredMap.has(lower)) {
        uniqueRequiredMap.set(lower, item.canonicalSkill);
      }
    }

    const uniqueSkills = Array.from(uniqueRequiredMap.values());
    const roleLower = targetRole.toLowerCase();

    // 2. Filter non-forked / original projects or prioritize original projects
    const ownRepos = repos.filter((r) => !r.fork);
    const reposToAnalyze = ownRepos.length > 0 ? ownRepos : repos;

    // 3. Match each skill against repositories
    const skillEvidences: SkillEvidence[] = [];
    const analyzedReposSummary: GitHubAnalysisResult["evidence"]["analyzedRepos"] = [];

    // Helper to test if skill is found in repo
    const checkRepoForSkill = (repo: GitHubRepoData, skill: string) => {
      const sLower = skill.toLowerCase();
      const textToSearch = [
        repo.name,
        repo.description || "",
        repo.language || "",
        ...(repo.topics || []),
      ]
        .join(" ")
        .toLowerCase();

      // Check direct inclusion or regex boundary
      if (textToSearch.includes(sLower)) return true;

      // Handle common aliases (e.g. node.js -> node, react.js -> react)
      const parts = sLower.split(/[\s.-]+/);
      if (parts[0].length >= 3 && textToSearch.includes(parts[0])) {
        return true;
      }
      return false;
    };

    // Calculate repository relevance and matched skills
    for (const repo of reposToAnalyze) {
      const matchedInThisRepo: string[] = [];
      for (const skill of uniqueSkills) {
        if (checkRepoForSkill(repo, skill)) {
          matchedInThisRepo.push(skill);
        }
      }

      // Check role relevance (e.g. "backend", "frontend", "fullstack", "mobile")
      let roleKeywordsMatched = 0;
      const roleTokens = roleLower.split(/\s+/).filter((t) => t.length > 3);
      const repoText = `${repo.name} ${repo.description || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
      for (const token of roleTokens) {
        if (repoText.includes(token)) roleKeywordsMatched++;
      }

      const hasReadme = !!(repo.description && repo.description.length > 15);
      const stars = repo.stargazers_count || 0;
      
      // Calculate repo relevance score (0 - 100)
      let repoScore = 0;
      if (matchedInThisRepo.length > 0) repoScore += Math.min(50, matchedInThisRepo.length * 20);
      if (roleKeywordsMatched > 0) repoScore += 20;
      if (stars > 0) repoScore += Math.min(15, stars * 3);
      if (hasReadme) repoScore += 15;

      analyzedReposSummary.push({
        name: repo.name,
        description: repo.description || undefined,
        language: repo.language || undefined,
        topics: repo.topics || [],
        stars,
        relevanceScore: Math.min(100, repoScore),
        matchedRoleSkills: matchedInThisRepo,
        hasReadme,
        updatedAt: repo.pushed_at || repo.updated_at,
      });
    }

    // Classify each required skill into Strong, Moderate, Weak, None
    for (const skill of uniqueSkills) {
      const matchingRepos = analyzedReposSummary.filter((r) =>
        r.matchedRoleSkills.includes(skill)
      );

      let level: EvidenceLevel = "None";
      if (matchingRepos.length >= 2 || matchingRepos.some((r) => r.relevanceScore >= 60)) {
        level = "Strong";
      } else if (matchingRepos.length === 1) {
        level = "Moderate";
      } else {
        // Check if bio or username contains it
        const bioText = (user?.bio || "").toLowerCase();
        if (bioText.includes(skill.toLowerCase())) {
          level = "Weak";
        }
      }

      skillEvidences.push({
        skill,
        level,
        sources: matchingRepos.map((r) => r.name),
        notes:
          level === "Strong"
            ? `Multiple projects or high-relevance repository demonstrate ${skill}.`
            : level === "Moderate"
            ? `Found in project repository (${matchingRepos.map((r) => r.name).join(", ")}).`
            : level === "Weak"
            ? `Referenced in profile bio.`
            : `No direct project or code evidence found for ${skill}.`,
      });
    }

    // 4. Calculate Sub-Scores (Deterministic based on weights)
    // -------------------------------------------------------------
    // A. Role Relevance (0 - weights.roleRelevance)
    // Measures how well repositories match the target role domain
    const relevantReposCount = analyzedReposSummary.filter((r) => r.relevanceScore >= 30).length;
    let roleRelevanceRatio = 0;
    if (reposToAnalyze.length > 0) {
      roleRelevanceRatio = Math.min(1, relevantReposCount / Math.min(3, Math.max(1, reposToAnalyze.length)));
    }
    const roleRelevanceScore = Math.round(roleRelevanceRatio * this.weights.roleRelevance);

    // B. Required Skill Evidence (0 - weights.skillEvidence)
    // Strong = 1.0, Moderate = 0.65, Weak = 0.3, None = 0
    let skillScoreSum = 0;
    if (uniqueSkills.length > 0) {
      for (const ev of skillEvidences) {
        if (ev.level === "Strong") skillScoreSum += 1.0;
        else if (ev.level === "Moderate") skillScoreSum += 0.65;
        else if (ev.level === "Weak") skillScoreSum += 0.3;
      }
      skillScoreSum = skillScoreSum / uniqueSkills.length;
    } else {
      skillScoreSum = 0.7; // Default baseline if role has no specific skills listed
    }
    const skillEvidenceScore = Math.round(Math.min(1, skillScoreSum) * this.weights.skillEvidence);

    // C. Project Quality (0 - weights.projectQuality)
    // Evaluates project depth: non-empty descriptions, stars, multiple languages, substantive repos
    let qualityPoints = 0;
    const meaningfulProjects = reposToAnalyze.filter(
      (r) => (r.description && r.description.length > 10) || (r.stargazers_count || 0) > 0 || (r.topics && r.topics.length > 0)
    );
    if (meaningfulProjects.length >= 3) qualityPoints += 0.6;
    else if (meaningfulProjects.length >= 1) qualityPoints += 0.35;

    const hasStarsOrTopics = reposToAnalyze.some(
      (r) => (r.stargazers_count || 0) > 0 || (r.topics && r.topics.length > 0)
    );
    if (hasStarsOrTopics) qualityPoints += 0.4;
    const projectQualityScore = Math.round(Math.min(1, qualityPoints) * this.weights.projectQuality);

    // D. Activity / Recency (0 - weights.activity)
    // Active within last 6 months = 1.0, last 12 months = 0.7, older = 0.3
    let activityRatio = 0.3;
    const now = new Date().getTime();
    const hasRecentPush = reposToAnalyze.some((r) => {
      const pushDate = r.pushed_at || r.updated_at;
      if (!pushDate) return false;
      const ageInDays = (now - new Date(pushDate).getTime()) / (1000 * 3600 * 24);
      return ageInDays <= 180;
    });
    const hasYearPush = reposToAnalyze.some((r) => {
      const pushDate = r.pushed_at || r.updated_at;
      if (!pushDate) return false;
      const ageInDays = (now - new Date(pushDate).getTime()) / (1000 * 3600 * 24);
      return ageInDays <= 365;
    });
    if (hasRecentPush) activityRatio = 1.0;
    else if (hasYearPush) activityRatio = 0.7;
    const activityScore = Math.round(activityRatio * this.weights.activity);

    // E. Profile Quality / Documentation (0 - weights.profileQuality)
    let profileQualityRatio = 0.2;
    if (user?.bio && user.bio.trim().length > 5) profileQualityRatio += 0.4;
    if (user?.blog || user?.name) profileQualityRatio += 0.2;
    const documentedRepos = reposToAnalyze.filter((r) => r.description && r.description.length > 15);
    if (documentedRepos.length >= 2) profileQualityRatio += 0.2;
    const profileQualityScore = Math.round(Math.min(1, profileQualityRatio) * this.weights.profileQuality);

    // 5. Total GitHub Score (0 - 100)
    const totalScore = Math.min(
      100,
      Math.max(0, roleRelevanceScore + skillEvidenceScore + projectQualityScore + activityScore + profileQualityScore)
    );

    // 6. Strengths ("Why") and Improvements ("Needs Improvement")
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Strengths
    const strongSkills = skillEvidences.filter((e) => e.level === "Strong");
    const moderateSkills = skillEvidences.filter((e) => e.level === "Moderate");
    const missingSkills = skillEvidences.filter((e) => e.level === "None");

    if (strongSkills.length > 0) {
      strengths.push(`Strong evidence for key role skills: ${strongSkills.slice(0, 3).map((s) => s.skill).join(", ")}.`);
    }
    if (moderateSkills.length > 0) {
      strengths.push(`Demonstrated hands-on experience in ${moderateSkills.slice(0, 2).map((s) => s.skill).join(", ")}.`);
    }
    if (relevantReposCount >= 2) {
      strengths.push(`Multiple projects directly aligned with ${targetRole} requirements.`);
    }
    if (hasRecentPush) {
      strengths.push(`Recent active development within the past 6 months.`);
    }
    if (meaningfulProjects.length >= 3) {
      strengths.push(`Portfolio features substantive, well-structured repositories.`);
    }
    if (strengths.length === 0) {
      strengths.push("Public GitHub profile connected and accessible.");
    }

    // Improvements
    if (missingSkills.length > 0) {
      improvements.push(
        `Limited or no repository evidence for: ${missingSkills.slice(0, 4).map((s) => s.skill).join(", ")}.`
      );
    }
    if (!hasRecentPush) {
      improvements.push("Few recent contributions; commit or update relevant projects to show current activity.");
    }
    if (documentedRepos.length < 2) {
      improvements.push("Enhance repository READMEs and project descriptions to showcase architecture and results.");
    }
    if (!user?.bio || user.bio.trim().length < 5) {
      improvements.push(`Tailor your GitHub bio toward ${targetRole} to improve profile targeting.`);
    }
    if (improvements.length === 0) {
      improvements.push("Pin top role-relevant projects to the top of your GitHub profile.");
    }

    return {
      platform: "github",
      score: totalScore,
      targetRole,
      breakdown: {
        roleRelevance: roleRelevanceScore,
        skillEvidence: skillEvidenceScore,
        projectQuality: projectQualityScore,
        activity: activityScore,
        profileQuality: profileQualityScore,
        maxPossible: this.weights,
      },
      evidence: {
        matchedSkills: skillEvidences,
        analyzedRepos: analyzedReposSummary.slice(0, 10),
        username,
        repoCount: reposToAnalyze.length,
      },
      strengths,
      improvements,
    };
  }
}
