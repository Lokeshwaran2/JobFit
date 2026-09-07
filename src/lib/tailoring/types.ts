import { JobMatchResult, StructuredJobDescription } from "../matching/types";

/**
 * Traceable Evidence & Diff for an individual bullet point rewrite (Task 7 & 9)
 */
export interface RewrittenBulletEvidence {
  originalBullet: string;
  rewrittenBullet: string;
  sourceSection: "experience" | "project" | "summary";
  sourceIndex: number; // Index in the experience or project array
  bulletIndex: number;  // Index of the bullet within that item
  companyOrProjectName?: string;
  relevantRequirements: string[];
  evidenceUsed: string[];
  changes: string[]; // Explanations of why the change was made
  confidence: "high" | "medium" | "low";
  status: "accepted" | "rejected";
  rejectionReason?: string;
}

/**
 * Summary of before and after tailoring changes (Task 9)
 */
export interface TailoringDiffResult {
  beforeScore: number;
  afterScore: number;
  scoreGain: number;
  percentageGain: number;
  bulletDiffs: RewrittenBulletEvidence[];
  summaryDiff?: {
    original: string;
    tailored: string;
    changes: string[];
    status: "accepted" | "rejected";
  };
  relevanceOrderApplied: boolean;
  preservedJobTitles: string[];
  preservedCompanies: string[];
  preservedDates: string[];
}

/**
 * Input to the tailoring engine
 */
export interface TailoringOptions {
  originalResume: any;
  jd: StructuredJobDescription;
  beforeMatch: JobMatchResult;
}
