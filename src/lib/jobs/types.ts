/**
 * Controlled job source constants and types
 */
export const JOB_SOURCES = [
  "manual",
  "linkedin",
  "greenhouse",
  "lever",
  "workday",
  "generic_url",
] as const;

export type JobSource = typeof JOB_SOURCES[number];

export function isValidJobSource(source: string | null | undefined): source is JobSource {
  if (!source) return false;
  return (JOB_SOURCES as readonly string[]).includes(source);
}

export interface JobParsedData {
  role?: string;
  company?: string | null;
  location?: string | null;
  workplaceType?: "remote" | "hybrid" | "onsite" | null;
  jobType?: "full-time" | "part-time" | "contract" | "internship" | null;
  seniorityLevel?: string;
  requiredSkills?: string[];
  keywords?: string[];
  coreResponsibilities?: string[];
  minYearsExperience?: number | null;
  [key: string]: any;
}

export interface CreateJobInput {
  userId: string;
  rawDescription: string;
  source?: JobSource;
  sourceUrl?: string | null;
  title?: string;
  company?: string | null;
  location?: string | null;
  workplaceType?: string | null;
  jobType?: string | null;
  parsedData?: JobParsedData | null;
}
