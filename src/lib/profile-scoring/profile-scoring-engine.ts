import { prisma } from "@/lib/prisma";
import { GitHubScoringService } from "./github-scoring-service";
import { LinkedInScoringService } from "./linkedin-scoring-service";
import { OVERALL_WEIGHTS } from "./config";
import {
  GitHubAnalysisResult,
  LinkedInAnalysisResult,
  LinkedInProfileData,
  OverallProfileScoreResult,
  ProfileCheckResult,
  SkillMatrixRow,
  ActionableRecommendation,
  EvidenceLevel,
} from "./types";
import { validateAndNormalizeGithubUrl, validateAndNormalizeLinkedinUrl } from "./url-validator";
import { normalizeSkill } from "@/lib/skills/skill-normalization";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";

export class ProfileScoringEngine {
  private githubService: GitHubScoringService;
  private linkedinService: LinkedInScoringService;

  constructor() {
    this.githubService = new GitHubScoringService();
    this.linkedinService = new LinkedInScoringService();
  }

  /**
   * Extract skills and target role title from job description or structured resume
   */
  public extractTargetContext({
    targetJobDesc,
    resumeData,
    fallbackRole,
  }: {
    targetJobDesc?: string | null;
    resumeData?: any;
    fallbackRole?: string | null;
  }): { role: string; requiredSkills: string[] } {
    let role = fallbackRole || "Software Engineer";
    const requiredSkills: string[] = [];

    // 1. Try to extract from targetJobDesc
    if (targetJobDesc && targetJobDesc.trim()) {
      const jd = targetJobDesc;
      // Look for title patterns
      const titleMatch = jd.match(
        /(?:looking for|seeking|position of|role of|job title:|title:)\s*([A-Za-z0-9\s/.-]{3,40})(?:\n|,|\.)/i
      );
      if (titleMatch && titleMatch[1]) {
        role = titleMatch[1].trim();
      }

      // Extract skills mentioned in JD by scanning common technologies
      const commonTechKeywords = [
        "Node.js", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Next.js",
        "Python", "Django", "FastAPI", "Flask", "Java", "Spring Boot", "Kotlin", "Go", "Golang",
        "C++", "C#", ".NET", "Rust", "PHP", "Ruby", "Rails",
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Elasticsearch", "SQL",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub Actions",
        "REST API", "GraphQL", "gRPC", "Microservices", "Kafka", "RabbitMQ", "Linux",
        "Tailwind CSS", "HTML5", "CSS3", "Redux", "Jest", "Cypress"
      ];

      for (const tech of commonTechKeywords) {
        // Word boundary regex
        const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i");
        if (re.test(jd)) {
          requiredSkills.push(tech);
        }
      }
    }

    // 2. Also incorporate missingSkills or existing resume hard skills if JD had few
    if (resumeData?.skills?.hard && Array.isArray(resumeData.skills.hard)) {
      for (const s of resumeData.skills.hard) {
        if (typeof s === "string" && !requiredSkills.includes(s)) {
          requiredSkills.push(s);
        }
      }
    }

    // Fallback role from resume if still generic
    if (role === "Software Engineer" && resumeData?.personalInfo?.title) {
      role = resumeData.personalInfo.title;
    }

    return {
      role: role.trim() || "Software Engineer",
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : ["Node.js", "PostgreSQL", "REST API", "Git"],
    };
  }

  /**
   * Run full role-specific scoring for a user and resume, and persist to database.
   */
  public async analyzeAndPersist({
    userId,
    resumeId,
    targetJobDesc,
    roleOverride,
    persist = true,
  }: {
    userId: string;
    resumeId?: string;
    targetJobDesc?: string | null;
    roleOverride?: string | null;
    persist?: boolean;
  }): Promise<{
    githubResult: GitHubAnalysisResult | null;
    linkedinResult: LinkedInAnalysisResult | null;
    overallResult: OverallProfileScoreResult;
    errors?: string[];
  }> {
    // 1. Fetch user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        githubUrl: true,
        linkedinUrl: true,
        linkedinData: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // 2. Fetch resume if provided
    let resume = null;
    if (resumeId) {
      resume = await prisma.resume.findUnique({
        where: { id: resumeId, userId },
      });
    }

    const effectiveJD = targetJobDesc || resume?.targetJobDesc || "";
    const resumeData = (resume?.structuredData as any) || {};

    const { role, requiredSkills } = this.extractTargetContext({
      targetJobDesc: effectiveJD,
      resumeData,
      fallbackRole: roleOverride || resume?.title,
    });

    const errors: string[] = [];

    // 3. GitHub Analysis
    let githubResult: GitHubAnalysisResult | null = null;
    const githubVal = validateAndNormalizeGithubUrl(user.githubUrl);

    if (githubVal.isValid && githubVal.identifier) {
      try {
        const ghData = await this.githubService.fetchGitHubData(githubVal.identifier);
        if (ghData.error) {
          errors.push(ghData.error);
        }
        githubResult = this.githubService.analyze({
          username: githubVal.identifier,
          user: ghData.user,
          repos: ghData.repos,
          targetRole: role,
          requiredSkills,
        });
      } catch (err: any) {
        errors.push(`GitHub analysis failed: ${err.message}`);
      }
    }

    // 4. LinkedIn Analysis
    let linkedinResult: LinkedInAnalysisResult | null = null;
    const linkedinVal = validateAndNormalizeLinkedinUrl(user.linkedinUrl);

    if (linkedinVal.isValid && (linkedinVal.normalizedUrl || user.linkedinData)) {
      try {
        // Use user.linkedinData (safely provided by user) or derive minimal baseline from resume
        let profileData: LinkedInProfileData = (user.linkedinData as any) || {};

        // If user hasn't explicitly entered detailed LinkedIn data yet, seed safely from resume
        if (!profileData.headline && resumeData.personalInfo?.title) {
          profileData = {
            headline: `${resumeData.personalInfo.title} | ${resumeData.personalInfo.name || "Professional"}`,
            about: resumeData.summary || "",
            skills: Array.isArray(resumeData.skills?.hard) ? resumeData.skills.hard : [],
            experience: Array.isArray(resumeData.experience)
              ? resumeData.experience.map((e: any) => ({
                  title: e.role || "",
                  company: e.company || "",
                  description: Array.isArray(e.description)
                    ? e.description.map((d: any) => (typeof d === "string" ? d : d.text)).join(" ")
                    : e.description || "",
                }))
              : [],
            ...profileData,
          };
        }

        linkedinResult = this.linkedinService.analyze({
          profileData,
          targetRole: role,
          requiredSkills,
          resumeData,
        });
      } catch (err: any) {
        errors.push(`LinkedIn analysis failed: ${err.message}`);
      }
    }

    // 5. Calculate Overall Profile Score
    const resumeScore = resume?.atsScore || 75;
    const githubScore = githubResult ? githubResult.score : null;
    const linkedinScore = linkedinResult ? linkedinResult.score : null;

    let totalWeight = OVERALL_WEIGHTS.resume;
    let weightedSum = resumeScore * OVERALL_WEIGHTS.resume;

    if (githubScore !== null) {
      weightedSum += githubScore * OVERALL_WEIGHTS.github;
      totalWeight += OVERALL_WEIGHTS.github;
    }
    if (linkedinScore !== null) {
      weightedSum += linkedinScore * OVERALL_WEIGHTS.linkedin;
      totalWeight += OVERALL_WEIGHTS.linkedin;
    }

    const overallScore = Math.round(weightedSum / totalWeight);

    const overallStrengths: string[] = [
      `Resume match score contributes ${resumeScore}/100 based on verified experience.`,
    ];
    if (githubScore !== null) {
      overallStrengths.push(`GitHub portfolio demonstrates hands-on code capability (${githubScore}/100).`);
    }
    if (linkedinScore !== null) {
      overallStrengths.push(`LinkedIn presence aligns with ${role} career path (${linkedinScore}/100).`);
    }

    const overallImprovements: string[] = [];
    if (githubScore === null) {
      overallImprovements.push("Connect your GitHub profile to showcase code evidence for technical skills.");
    }
    if (linkedinScore === null) {
      overallImprovements.push("Add your LinkedIn profile to enhance professional credibility and role alignment.");
    }
    if (githubResult?.improvements?.[0]) {
      overallImprovements.push(githubResult.improvements[0]);
    }
    if (linkedinResult?.improvements?.[0]) {
      overallImprovements.push(linkedinResult.improvements[0]);
    }

    const overallResult: OverallProfileScoreResult = {
      platform: "overall",
      score: overallScore,
      targetRole: role,
      resumeScore,
      githubScore,
      linkedinScore,
      breakdown: {
        resumeContribution: Math.round((resumeScore * OVERALL_WEIGHTS.resume) / totalWeight),
        githubContribution: githubScore !== null ? Math.round((githubScore * OVERALL_WEIGHTS.github) / totalWeight) : 0,
        linkedinContribution: linkedinScore !== null ? Math.round((linkedinScore * OVERALL_WEIGHTS.linkedin) / totalWeight) : 0,
      },
      strengths: overallStrengths,
      improvements: overallImprovements,
    };

    // 6. Persist to Database if requested
    if (persist) {
      try {
        const persistOperations = [];

        // Overall
        persistOperations.push(
          prisma.profileScore.create({
            data: {
              userId,
              resumeId: resumeId || null,
              platform: "overall",
              score: overallResult.score,
              targetRole: role,
              breakdown: overallResult.breakdown as any,
              strengths: overallResult.strengths,
              improvements: overallResult.improvements,
            },
          })
        );

        // GitHub
        if (githubResult) {
          persistOperations.push(
            prisma.profileScore.create({
              data: {
                userId,
                resumeId: resumeId || null,
                platform: "github",
                score: githubResult.score,
                targetRole: role,
                breakdown: githubResult.breakdown as any,
                evidence: githubResult.evidence as any,
                strengths: githubResult.strengths,
                improvements: githubResult.improvements,
              },
            })
          );
        }

        // LinkedIn
        if (linkedinResult) {
          persistOperations.push(
            prisma.profileScore.create({
              data: {
                userId,
                resumeId: resumeId || null,
                platform: "linkedin",
                score: linkedinResult.score,
                targetRole: role,
                breakdown: linkedinResult.breakdown as any,
                evidence: linkedinResult.evidence as any,
                strengths: linkedinResult.strengths,
                improvements: linkedinResult.improvements,
              },
            })
          );
        }

        await Promise.all(persistOperations);
      } catch (dbErr: any) {
        console.error("Failed to persist ProfileScores:", dbErr);
      }
    }

    return {
      githubResult,
      linkedinResult,
      overallResult,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Prominent Dashboard check tool:
   * Analyzes user's GitHub + LinkedIn against either a Job Description OR Role + Company.
   * Generates:
   * - GitHub Score & LinkedIn Score
   * - Overall Score (50/50 without penalizing unlinked accounts)
   * - Skill Match Matrix (Skill | Requirement | GitHub | LinkedIn | Status)
   * - Contextual Actionable Recommendations (High/Medium/Low priority)
   * - Updates user's SkillGap occurrences in the learning tracker
   * - Persists check to ProfileScoreCheck for history
   */
  public async checkProfileScore({
    userId,
    inputType,
    jobDescription,
    role,
    company,
  }: {
    userId: string;
    inputType: "jd" | "role";
    jobDescription?: string;
    role?: string;
    company?: string;
  }): Promise<ProfileCheckResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        githubUrl: true,
        linkedinUrl: true,
        linkedinData: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let targetRole = (role || "").trim();
    let requiredSkills: string[] = [];
    let preferredSkills: string[] = [];

    if (inputType === "jd" && jobDescription && jobDescription.trim()) {
      const extracted = this.extractTargetContext({
        targetJobDesc: jobDescription,
        fallbackRole: role || "Software Engineer",
      });
      targetRole = extracted.role;
      requiredSkills = extracted.requiredSkills;

      // Extract preferred skills if any
      const prefMatch = jobDescription.match(/(?:preferred|nice to have|plus|bonus|optional)[:\s]([^\n.]+)/i);
      if (prefMatch && prefMatch[1]) {
        const words = prefMatch[1].split(/[,/]+/).map((w) => w.trim()).filter((w) => w.length > 1);
        for (const w of words) {
          const norm = normalizeSkill(w);
          if (norm.canonicalSkill && !requiredSkills.includes(norm.canonicalSkill)) {
            preferredSkills.push(norm.canonicalSkill);
          }
        }
      }
    } else {
      // Role + Company input flow (no JD provided)
      if (!targetRole) {
        targetRole = "Software Engineer";
      }

      // Domain-informed skill baseline based on target role
      const lowerRole = targetRole.toLowerCase();
      if (lowerRole.includes("backend")) {
        requiredSkills = ["Node.js", "PostgreSQL", "REST API", "Docker"];
        preferredSkills = ["AWS", "Redis", "Microservices"];
      } else if (lowerRole.includes("frontend") || lowerRole.includes("ui") || lowerRole.includes("web")) {
        requiredSkills = ["React", "TypeScript", "JavaScript", "HTML5", "CSS3"];
        preferredSkills = ["Next.js", "Tailwind CSS", "Redux", "Jest"];
      } else if (lowerRole.includes("full") || lowerRole.includes("fullstack") || lowerRole.includes("full stack")) {
        requiredSkills = ["React", "Node.js", "TypeScript", "PostgreSQL"];
        preferredSkills = ["Docker", "AWS", "GraphQL", "Tailwind CSS"];
      } else if (lowerRole.includes("devops") || lowerRole.includes("cloud") || lowerRole.includes("sre") || lowerRole.includes("infra")) {
        requiredSkills = ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"];
        preferredSkills = ["Terraform", "Python", "Prometheus", "Ansible"];
      } else if (lowerRole.includes("data") || lowerRole.includes("machine") || lowerRole.includes("ai")) {
        requiredSkills = ["Python", "SQL", "PostgreSQL", "Pandas"];
        preferredSkills = ["Spark", "Docker", "AWS", "Kafka"];
      } else if (lowerRole.includes("mobile") || lowerRole.includes("ios") || lowerRole.includes("android")) {
        requiredSkills = ["React Native", "TypeScript", "JavaScript", "REST API"];
        preferredSkills = ["GraphQL", "iOS", "Android"];
      } else {
        requiredSkills = ["JavaScript", "TypeScript", "Git", "REST API"];
        preferredSkills = ["Docker", "SQL", "CI/CD"];
      }
    }

    const allSkillsToEvaluate = Array.from(new Set([...requiredSkills, ...preferredSkills]));

    // 1. Run GitHub Scoring
    let githubResult: GitHubAnalysisResult | null = null;
    const githubVal = validateAndNormalizeGithubUrl(user.githubUrl);

    if (githubVal.isValid && githubVal.identifier) {
      try {
        const ghData = await this.githubService.fetchGitHubData(githubVal.identifier);
        githubResult = this.githubService.analyze({
          username: githubVal.identifier,
          user: ghData.user,
          repos: ghData.repos,
          targetRole,
          requiredSkills: allSkillsToEvaluate,
        });
      } catch (err: any) {
        console.error("GitHub check error:", err);
      }
    }

    // 2. Run LinkedIn Scoring
    let linkedinResult: LinkedInAnalysisResult | null = null;
    const linkedinVal = validateAndNormalizeLinkedinUrl(user.linkedinUrl);

    if (linkedinVal.isValid && (linkedinVal.normalizedUrl || user.linkedinData)) {
      try {
        const profileData: LinkedInProfileData = (user.linkedinData as any) || {};
        linkedinResult = this.linkedinService.analyze({
          profileData,
          targetRole,
          requiredSkills: allSkillsToEvaluate,
        });
      } catch (err: any) {
        console.error("LinkedIn check error:", err);
      }
    }

    // 3. Compute Overall Profile Score (without penalizing unlinked accounts)
    let overallScore = 0;
    const ghScore = githubResult ? githubResult.score : null;
    const liScore = linkedinResult ? linkedinResult.score : null;

    if (ghScore !== null && liScore !== null) {
      overallScore = Math.round((ghScore + liScore) / 2);
    } else if (ghScore !== null) {
      overallScore = ghScore;
    } else if (liScore !== null) {
      overallScore = liScore;
    } else {
      overallScore = 0;
    }

    // 4. Build Skill Match Matrix (Skill | Requirement | GitHub | LinkedIn | Status)
    const skillMatrix: SkillMatrixRow[] = [];
    const missingSkillsForGapTracker: string[] = [];

    for (const skill of allSkillsToEvaluate) {
      const isReq = requiredSkills.includes(skill);
      const ghEvidence = githubResult?.evidence.matchedSkills.find(
        (s) => s.skill.toLowerCase() === skill.toLowerCase()
      );
      const liEvidence = linkedinResult?.evidence.matchedSkills.find(
        (s) => s.skill.toLowerCase() === skill.toLowerCase()
      );

      const ghLevel = ghEvidence ? ghEvidence.level : ("None" as EvidenceLevel);
      const liLevel = liEvidence ? liEvidence.level : ("None" as EvidenceLevel);

      let status: "match" | "partial" | "gap" = "gap";
      if (ghLevel === "Strong" || liLevel === "Strong") {
        status = "match";
      } else if (ghLevel === "Moderate" || liLevel === "Moderate" || (ghLevel === "Weak" && liLevel === "Weak")) {
        status = "partial";
      } else {
        status = "gap";
        missingSkillsForGapTracker.push(skill);
      }

      skillMatrix.push({
        skill,
        requirement: isReq ? "Required" : "Preferred",
        github: ghLevel,
        linkedin: liLevel,
        status,
      });
    }

    // 5. Generate Actionable Recommendations based on actual detected gaps
    const recommendations: ActionableRecommendation[] = [];

    const gaps = skillMatrix.filter((s) => s.status === "gap");
    const partials = skillMatrix.filter((s) => s.status === "partial");

    if (gaps.length > 0) {
      const topGap = gaps[0].skill;
      recommendations.push({
        priority: "High",
        title: `Build & showcase ${topGap} evidence`,
        description: `${topGap} is a critical requirement with little or no public evidence on GitHub or LinkedIn.`,
        actions: [
          `Create a focused project incorporating ${topGap} and push to GitHub with clean documentation.`,
          `Highlight ${topGap} in your LinkedIn skills and experience descriptions.`,
        ],
      });
    }

    if (partials.length > 0) {
      const topPartial = partials[0].skill;
      recommendations.push({
        priority: "Medium",
        title: `Strengthen hands-on depth in ${topPartial}`,
        description: `${topPartial} has moderate or weak evidence. Increasing project depth will boost your score.`,
        actions: [
          `Add comprehensive README setup instructions and architecture details for repositories using ${topPartial}.`,
          `Quantify business impact or performance metrics related to ${topPartial} in your profile experience.`,
        ],
      });
    }

    if (!githubResult) {
      recommendations.push({
        priority: "High",
        title: "Connect your GitHub profile",
        description: "Your GitHub profile is not linked. Connecting it demonstrates technical code competence.",
        actions: [
          "Add your GitHub username in Dashboard Settings.",
          "Ensure top repositories are public and have descriptive READMEs.",
        ],
      });
    } else if (githubResult.breakdown.activity < 5) {
      recommendations.push({
        priority: "Low",
        title: "Show recent active commits",
        description: "Your GitHub repositories show limited recent activity. Modern employers favor active developers.",
        actions: [
          "Commit improvements or new features to your core projects.",
          "Pin your 3 best role-relevant repositories to the top of your GitHub profile.",
        ],
      });
    }

    if (!linkedinResult) {
      recommendations.push({
        priority: "Medium",
        title: "Connect or update LinkedIn Profile",
        description: "Adding your LinkedIn profile boosts credibility and role positioning.",
        actions: [
          "Add your LinkedIn URL in Dashboard Settings.",
          `Align your headline to emphasize "${targetRole}".`,
        ],
      });
    } else if (linkedinResult.breakdown.achievementQuality < 10) {
      recommendations.push({
        priority: "Medium",
        title: "Add measurable achievements to LinkedIn experience",
        description: "Descriptions with metrics (% improvements, latency reductions, scale handled) score higher.",
        actions: [
          "Revise experience bullets with measurable figures (e.g. 'Improved speed by 30%').",
          `Highlight specific achievements delivering ${targetRole} outcomes.`,
        ],
      });
    }

    // 6. Connect with Skill Learning Tracker (Task 1 integration)
    // Update skill gap tracking without creating duplicate records for same analysis
    try {
      const jdSkillsList = allSkillsToEvaluate;
      // Candidate skills = skills with Strong evidence from either GitHub or LinkedIn
      const candidateSkillsList = skillMatrix
        .filter((s) => s.status === "match")
        .map((s) => s.skill);

      await SkillGapTracker.recordSkillGaps({
        userId,
        jobTitle: company ? `${targetRole} at ${company}` : targetRole,
        targetJobDesc: inputType === "jd" ? jobDescription : `Role: ${targetRole}${company ? ` at ${company}` : ""}`,
        jdSkills: jdSkillsList,
        candidateSkills: candidateSkillsList,
      });
    } catch (trackErr) {
      console.error("SkillGapTracker update error:", trackErr);
    }

    // Fetch top learning priorities for this user
    let topSkillsToLearn: { canonicalSkill: string; missingCount: number }[] = [];
    try {
      const gapsData = await prisma.userSkillGap.findMany({
        where: { userId, status: "learning" },
        orderBy: { missingCount: "desc" },
        take: 4,
        select: { canonicalSkill: true, missingCount: true },
      });
      topSkillsToLearn = gapsData;
    } catch {
      // fallback
    }

    // Strengths & Weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (githubResult?.strengths) strengths.push(...githubResult.strengths.slice(0, 2));
    if (linkedinResult?.strengths) strengths.push(...linkedinResult.strengths.slice(0, 2));
    if (strengths.length === 0) {
      strengths.push(`Profile is positioned for evaluation against ${targetRole}.`);
    }

    if (githubResult?.improvements) weaknesses.push(...githubResult.improvements.slice(0, 2));
    if (linkedinResult?.improvements) weaknesses.push(...linkedinResult.improvements.slice(0, 2));
    if (gaps.length > 0) {
      weaknesses.push(`Missing role evidence for: ${gaps.slice(0, 3).map((g) => g.skill).join(", ")}.`);
    }

    // 7. Persist to ProfileScoreCheck for history
    let savedCheckId: string | undefined = undefined;
    try {
      const savedCheck = await prisma.profileScoreCheck.create({
        data: {
          userId,
          role: targetRole,
          company: company || null,
          inputType,
          jdSnippet: jobDescription ? jobDescription.slice(0, 1000) : null,
          githubScore: ghScore,
          linkedinScore: liScore,
          overallScore,
          breakdown: {
            github: (githubResult?.breakdown as any) || null,
            linkedin: (linkedinResult?.breakdown as any) || null,
            overall: { overallScore, ghScore, liScore },
          } as any,
          skillMatches: skillMatrix as any,
          strengths,
          weaknesses,
          recommendations: recommendations as any,
        },
      });
      savedCheckId = savedCheck.id;
    } catch (dbSaveErr) {
      console.error("Failed to persist ProfileScoreCheck:", dbSaveErr);
    }

    return {
      id: savedCheckId,
      target: {
        role: targetRole,
        company: company || undefined,
        sourceType: inputType,
      },
      github: {
        score: ghScore,
        breakdown: githubResult?.breakdown || {},
        strengths: githubResult?.strengths || [],
        weaknesses: githubResult?.improvements || [],
        reposAnalyzed: githubResult?.evidence.repoCount || 0,
      },
      linkedin: {
        score: liScore,
        breakdown: linkedinResult?.breakdown || {},
        strengths: linkedinResult?.strengths || [],
        weaknesses: linkedinResult?.improvements || [],
      },
      overall: overallScore,
      skills: skillMatrix,
      recommendations,
      topSkillsToLearn,
      createdAt: new Date().toISOString(),
    };
  }
}

