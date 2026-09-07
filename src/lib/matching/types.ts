import { z } from "zod";

/**
 * Normalizes string representations of workplace types to standard enum
 */
export const WorkplaceTypeSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (["remote", "hybrid", "onsite"].includes(lower)) return lower;
  }
  return null;
}, z.enum(["remote", "hybrid", "onsite"]).nullable());

export type WorkplaceType = z.infer<typeof WorkplaceTypeSchema>;

/**
 * Normalizes string representations of job types to standard enum
 */
export const JobTypeSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (["full-time", "part-time", "contract", "internship"].includes(lower)) return lower;
  }
  return null;
}, z.enum(["full-time", "part-time", "contract", "internship"]).nullable());

export type JobType = z.infer<typeof JobTypeSchema>;

/**
 * Normalizes numeric values or string numbers, returning null for missing or invalid numbers
 */
const NullableNumberSchema = z.preprocess((val) => {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const match = val.match(/(\d+(\.\d+)?)/);
    if (match) {
      const num = parseFloat(match[1]);
      return isNaN(num) ? null : num;
    }
  }
  return null;
}, z.number().nullable());

/**
 * Normalizes array of strings, ensuring empty array fallback and trimming
 */
const StringArraySchema = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());
  }
  if (typeof val === "string" && val.trim().length > 0) {
    return [val.trim()];
  }
  return [];
}, z.array(z.string()).default([]));

/**
 * Structured Job Description Schema (Task 3)
 */
export const StructuredJobDescriptionSchema = z.object({
  company: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable()).default(null),
  role: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Target Role"), z.string()).default("Target Role"),
  location: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable()).default(null),
  workplaceType: WorkplaceTypeSchema.default(null),
  jobType: JobTypeSchema.default(null),
  seniorityLevel: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : null), z.string().nullable()).default(null),
  minYearsExperience: NullableNumberSchema.default(null),
  maxYearsExperience: NullableNumberSchema.default(null),
  requiredSkills: StringArraySchema,
  preferredSkills: StringArraySchema,
  tools: StringArraySchema,
  coreResponsibilities: StringArraySchema,
  educationRequirements: StringArraySchema,
  certifications: StringArraySchema,
  keywords: StringArraySchema,
});

export type StructuredJobDescription = z.infer<typeof StructuredJobDescriptionSchema>;

/**
 * Traceable Evidence item
 */
export interface RequirementEvidence {
  requirement: string;
  category: "requiredSkill" | "preferredSkill" | "keyword" | "responsibility" | "education" | "certification";
  status: "matched" | "missing";
  evidence: string[];
  confidence: "high" | "medium" | "low";
}

/**
 * Structured Job Match Result (Task 4 & 5)
 */
export interface JobMatchResult {
  score: number; // 0-100 deterministic integer

  breakdown: {
    requiredSkills: number; // 0-100
    preferredSkills: number; // 0-100
    experience: number; // 0-100
    responsibilities: number; // 0-100
    keywords: number; // 0-100
    education: number; // 0-100
  };

  weights: {
    requiredSkills: number; // 35
    preferredSkills: number; // 15
    experience: number; // 20
    responsibilities: number; // 15
    keywords: number; // 10
    education: number; // 5
  };

  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];

  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];

  matchedKeywords: string[];
  missingKeywords: string[];

  experienceAssessment: {
    meetsMinimum: boolean | null;
    candidateYears: number | null;
    requiredYears: number | null;
    summary: string;
  };

  evidence: RequirementEvidence[];

  strengths: string[];
  gaps: string[];
  recommendations: string[];
}
