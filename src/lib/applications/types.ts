/**
 * Valid application statuses (Task 13)
 */
export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export function isValidApplicationStatus(status: any): status is ApplicationStatus {
  return typeof status === "string" && (APPLICATION_STATUSES as readonly string[]).includes(status);
}

export interface CreateApplicationInput {
  userId: string;
  jobId: string;
  status?: ApplicationStatus;
  appliedAt?: Date | string | null;
  notes?: string | null;
}

export interface UpdateApplicationInput {
  userId: string;
  jobId: string;
  status?: ApplicationStatus;
  appliedAt?: Date | string | null;
  notes?: string | null;
}

export interface ApplicationDTO {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackedJobDashboardItem {
  id: string; // Job id
  jobId: string;
  title: string;
  company: string | null;
  location: string | null;
  workplaceType: string | null;
  jobType: string | null;
  source: string;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  application: {
    id: string;
    status: ApplicationStatus;
    appliedAt: Date | null;
    notes: string | null;
    updatedAt: Date;
  } | null;
  resume: {
    id: string;
    title: string;
    atsScore: number;
    keywordMatch: number;
    updatedAt: Date;
  } | null;
}
