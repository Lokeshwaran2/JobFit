/**
 * Types and DTOs for the Advanced Skill Learning Engine
 */

export type SkillLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export type ResourceType =
  | "official_docs"
  | "structured_course"
  | "tutorial"
  | "interactive"
  | "practice"
  | "project"
  | "video"
  | "book"
  | "documentation";

export type ResourceStatus = "active" | "inactive" | "redirected" | "unknown";

export type StepProgressStatus = "not_started" | "in_progress" | "completed";

export interface CuratedResourceDTO {
  id: string;
  skillId: string;
  topicId?: string;
  title: string;
  url: string;
  provider: string;
  resourceType: ResourceType;
  level: SkillLevel | "all";
  isFree: boolean;
  isOfficial: boolean;
  qualityScore: number;
  interactive: boolean;
  projectBased: boolean;
  estimatedMinutes: number;
  lastVerifiedAt?: string | null;
  status: ResourceStatus;
  isPrimary: boolean;
  whyThisResource?: string;
  verificationError?: string | null;
}

export interface LearningPracticeDTO {
  id: string;
  topicId: string;
  title: string;
  description: string;
  difficulty: SkillLevel;
  expectedOutcome: string;
  verificationMethod: "code_execution" | "explain_analyze" | "quiz" | "manual_check";
  order: number;
  hints?: string[];
  status?: StepProgressStatus;
}

export interface CheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VerificationCheckpointDTO {
  id: string;
  topicId: string;
  title: string;
  description: string;
  checkpointType: "quiz" | "practical" | "code_submission";
  questions?: CheckpointQuestion[];
  practicalPrompt?: string;
  verificationCriteria: string[];
  status?: StepProgressStatus;
  userScore?: number | null;
}

export interface LearningImplementationDTO {
  id: string;
  skillId: string;
  title: string;
  description: string;
  requirements: string[];
  expectedTechnologies: string[];
  difficulty: "intermediate" | "advanced";
  estimatedHours: number;
  order: number;
  isCapstone?: boolean;
  status?: StepProgressStatus;
}

export interface LearningTopicDTO {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  estimatedMinutes: number;
  prerequisites: string[]; // prerequisite topic IDs
  primaryResource?: CuratedResourceDTO | null;
  alternativeResource?: CuratedResourceDTO | null;
  practiceTasks: LearningPracticeDTO[];
  checkpoint?: VerificationCheckpointDTO;
  status?: StepProgressStatus;
  jdRelevance?: {
    isJdRequired: boolean;
    reason?: string;
    relevanceScore: number;
  };
}

export interface LearningModuleDTO {
  id: string;
  curriculumId: string;
  title: string;
  description: string;
  level: SkillLevel;
  order: number;
  estimatedHours: number;
  topics: LearningTopicDTO[];
  status?: StepProgressStatus;
}

export interface CapstoneProjectDTO {
  id: string;
  title: string;
  description: string;
  architectureOverview: string;
  requirements: string[];
  expectedTechnologies: string[];
  estimatedHours: number;
  status?: StepProgressStatus;
  portfolioDeliverables: {
    githubRepoRequired: boolean;
    readmeSpec: string;
    liveDemoSuggested: boolean;
  };
  jobContext?: {
    adaptedForJob: boolean;
    targetRole?: string;
    company?: string;
    targetJobTitle?: string;
  };
}

export interface StartHereRecommendation {
  topicId: string;
  topicTitle: string;
  moduleId: string;
  moduleTitle: string;
  level: SkillLevel;
  reason: string;
  alreadyKnownSkills: string[];
  primaryResourceUrl?: string;
}

export interface WeightedProgressBreakdown {
  foundations: { weight: number; percentage: number };
  core: { weight: number; percentage: number };
  intermediate: { weight: number; percentage: number };
  advanced: { weight: number; percentage: number };
  implementation: { weight: number; percentage: number };
  assessment: { weight: number; percentage: number };
  overallScore: number; // 0 to 100
}

export interface PersonalizedLearningPathDTO {
  skill: string;
  canonicalSkill: string;
  priority: number;
  missingCount: number;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  whyItMatters: string;
  startHere: StartHereRecommendation;
  prerequisites: string[];
  modules: LearningModuleDTO[];
  resources: CuratedResourceDTO[];
  practiceTasks: LearningPracticeDTO[];
  implementationTasks: LearningImplementationDTO[];
  capstoneProject: CapstoneProjectDTO;
  verificationTasks: VerificationCheckpointDTO[];
  estimatedEffort: {
    totalHours: number;
    estimatedWeeks: number;
  };
  progress: number; // overall percentage
  weightedProgress: WeightedProgressBreakdown;
  curriculumVersion: number;
  isAiGenerated: boolean;
  updatedAt: string;
}

export interface SkillLearningEngineInput {
  userId: string;
  skill: string;
  targetRole?: string;
  company?: string;
  jdId?: string;
  jobDescription?: string;
  currentSkills?: string[];
  existingEvidence?: {
    resumeSkills?: string[];
    profileSkills?: string[];
    experienceSnippets?: string[];
    projectBullets?: string[];
    matchedKeywords?: string[];
  };
}
