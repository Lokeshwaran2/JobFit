import { GitHubScoringWeights, LinkedInScoringWeights } from "./types";

export const DEFAULT_GITHUB_WEIGHTS: GitHubScoringWeights = {
  roleRelevance: 30,
  skillEvidence: 30,
  projectQuality: 20,
  activity: 10,
  profileQuality: 10,
};

export const DEFAULT_LINKEDIN_WEIGHTS: LinkedInScoringWeights = {
  roleAlignment: 30,
  skillCoverage: 25,
  experienceRelevance: 20,
  achievementQuality: 15,
  profileCompleteness: 10,
};

export const OVERALL_WEIGHTS = {
  resume: 0.50,
  github: 0.25,
  linkedin: 0.25,
};
