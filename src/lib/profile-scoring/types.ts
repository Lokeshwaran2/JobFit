export type EvidenceLevel = "Strong" | "Moderate" | "Weak" | "None";

export interface SkillEvidence {
  skill: string;
  level: EvidenceLevel;
  sources: string[]; // repository names or experience titles
  notes?: string;
}

export interface GitHubScoringWeights {
  roleRelevance: number;        // e.g. 30
  skillEvidence: number;        // e.g. 30
  projectQuality: number;       // e.g. 20
  activity: number;             // e.g. 10
  profileQuality: number;       // e.g. 10
}

export interface LinkedInScoringWeights {
  roleAlignment: number;        // e.g. 30
  skillCoverage: number;        // e.g. 25
  experienceRelevance: number;  // e.g. 20
  achievementQuality: number;   // e.g. 15
  profileCompleteness: number;  // e.g. 10
}

export interface GitHubAnalysisResult {
  platform: "github";
  score: number;
  targetRole: string;
  breakdown: {
    roleRelevance: number;
    skillEvidence: number;
    projectQuality: number;
    activity: number;
    profileQuality: number;
    maxPossible: GitHubScoringWeights;
  };
  evidence: {
    matchedSkills: SkillEvidence[];
    analyzedRepos: {
      name: string;
      description?: string;
      language?: string;
      topics: string[];
      stars: number;
      relevanceScore: number;
      matchedRoleSkills: string[];
      hasReadme: boolean;
      updatedAt?: string;
    }[];
    username: string;
    repoCount: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface LinkedInProfileData {
  headline?: string;
  about?: string;
  skills?: string[];
  experience?: {
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }[];
  projects?: {
    name: string;
    description?: string;
    skills?: string[];
  }[];
  certifications?: string[];
  education?: string[];
}

export interface LinkedInAnalysisResult {
  platform: "linkedin";
  score: number;
  targetRole: string;
  breakdown: {
    roleAlignment: number;
    skillCoverage: number;
    experienceRelevance: number;
    achievementQuality: number;
    profileCompleteness: number;
    maxPossible: LinkedInScoringWeights;
  };
  evidence: {
    matchedSkills: SkillEvidence[];
    matchedExperiences: {
      title: string;
      company: string;
      relevanceScore: number;
      matchedRoleSkills: string[];
    }[];
    hasHeadline: boolean;
    hasAbout: boolean;
    experienceCount: number;
    skillCount: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface OverallProfileScoreResult {
  platform: "overall";
  score: number;
  targetRole: string;
  resumeScore: number;
  githubScore: number | null;
  linkedinScore: number | null;
  breakdown: {
    resumeContribution: number;
    githubContribution: number;
    linkedinContribution: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface SkillMatrixRow {
  skill: string;
  requirement: "Required" | "Preferred";
  github: EvidenceLevel;
  linkedin: EvidenceLevel;
  status: "match" | "partial" | "gap";
}

export interface ActionableRecommendation {
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  actions: string[];
}

export interface ProfileCheckResult {
  id?: string;
  target: {
    role: string;
    company?: string;
    sourceType: "jd" | "role";
  };
  github: {
    score: number | null;
    breakdown: any;
    strengths: string[];
    weaknesses: string[];
    reposAnalyzed?: number;
  };
  linkedin: {
    score: number | null;
    breakdown: any;
    strengths: string[];
    weaknesses: string[];
  };
  overall: number;
  skills: SkillMatrixRow[];
  recommendations: ActionableRecommendation[];
  topSkillsToLearn: {
    canonicalSkill: string;
    missingCount: number;
  }[];
  createdAt: string;
}

