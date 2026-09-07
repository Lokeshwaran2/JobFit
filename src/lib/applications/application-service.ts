import { prisma } from "@/lib/prisma";
import {
  ApplicationStatus,
  CreateApplicationInput,
  isValidApplicationStatus,
  TrackedJobDashboardItem,
  UpdateApplicationInput,
} from "./types";
import { Application } from "@prisma/client";

export class ApplicationService {
  /**
   * Retrieves an application by Job ID, strictly scoped to the authenticated user.
   * Prevents IDOR.
   */
  static async getApplicationByJobId(
    userId: string,
    jobId: string
  ): Promise<Application | null> {
    if (!userId || !jobId) return null;

    return prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
  }

  /**
   * Creates or returns an application record for a Job owned by the authenticated user.
   *
   * Rules:
   * 1. Strictly verifies the Job belongs to the authenticated user.
   * 2. Default status is SAVED if not specified.
   * 3. Sets appliedAt automatically if status is APPLIED and no date provided.
   * 4. Enforces notes length limit (max 5000 chars).
   * 5. Never triggers AI analysis.
   */
  static async createOrGetApplication(
    input: CreateApplicationInput
  ): Promise<Application> {
    const { userId, jobId } = input;

    if (!userId || !jobId) {
      throw new Error("Bad Request: userId and jobId are required.");
    }

    // Verify Job exists and belongs to the authenticated user (IDOR protection)
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
      select: { id: true },
    });

    if (!job) {
      throw new Error("Not Found: Job does not exist or you do not have permission to access it.");
    }

    // Check if an application already exists for this Job
    const existing = await this.getApplicationByJobId(userId, jobId);
    if (existing) {
      return existing;
    }

    // Validate status
    const status: ApplicationStatus = input.status && isValidApplicationStatus(input.status)
      ? input.status
      : "SAVED";

    // Validate notes
    let notes: string | null = null;
    if (input.notes) {
      if (typeof input.notes !== "string") {
        throw new Error("Bad Request: notes must be a string.");
      }
      if (input.notes.length > 5000) {
        throw new Error("Bad Request: notes cannot exceed 5,000 characters.");
      }
      notes = input.notes.trim();
    }

    // Calculate appliedAt
    let appliedAt: Date | null = null;
    if (input.appliedAt) {
      const parsedDate = new Date(input.appliedAt);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Bad Request: appliedAt must be a valid date.");
      }
      appliedAt = parsedDate;
    } else if (status === "APPLIED") {
      appliedAt = new Date();
    }

    return prisma.application.create({
      data: {
        userId,
        jobId,
        status,
        appliedAt,
        notes,
      },
    });
  }

  /**
   * Updates an existing application or upserts one for the user's Job.
   *
   * Rules:
   * 1. IDOR-safe: strictly verifies Job ownership.
   * 2. When transitioning to APPLIED, auto-sets appliedAt if none was previously set.
   * 3. Users can transition freely between any status (including correcting mistakes like REJECTED -> APPLIED).
   * 4. Zero AI calls.
   */
  static async updateApplication(
    input: UpdateApplicationInput
  ): Promise<Application> {
    const { userId, jobId } = input;

    if (!userId || !jobId) {
      throw new Error("Bad Request: userId and jobId are required.");
    }

    // Verify Job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
      select: { id: true },
    });

    if (!job) {
      throw new Error("Not Found: Job does not exist or you do not have permission to access it.");
    }

    const existing = await this.getApplicationByJobId(userId, jobId);

    // Validate status if provided
    let newStatus: ApplicationStatus = existing?.status as ApplicationStatus || "SAVED";
    if (input.status !== undefined) {
      if (!isValidApplicationStatus(input.status)) {
        throw new Error(`Bad Request: Invalid application status '${input.status}'.`);
      }
      newStatus = input.status;
    }

    // Validate notes if provided
    let newNotes: string | null | undefined = undefined;
    if (input.notes !== undefined) {
      if (input.notes === null) {
        newNotes = null;
      } else if (typeof input.notes === "string") {
        if (input.notes.length > 5000) {
          throw new Error("Bad Request: notes cannot exceed 5,000 characters.");
        }
        newNotes = input.notes.trim();
      } else {
        throw new Error("Bad Request: notes must be a string or null.");
      }
    }

    // Handle appliedAt
    let newAppliedAt: Date | null | undefined = undefined;
    if (input.appliedAt !== undefined) {
      if (input.appliedAt === null) {
        newAppliedAt = null;
      } else {
        const parsedDate = new Date(input.appliedAt);
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Bad Request: appliedAt must be a valid date.");
        }
        newAppliedAt = parsedDate;
      }
    } else if (newStatus === "APPLIED" && !existing?.appliedAt) {
      // Auto-set appliedAt if moving to APPLIED and none exists
      newAppliedAt = new Date();
    }

    return prisma.application.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      create: {
        userId,
        jobId,
        status: newStatus,
        appliedAt: newAppliedAt !== undefined ? newAppliedAt : (newStatus === "APPLIED" ? new Date() : null),
        notes: newNotes !== undefined ? newNotes : null,
      },
      update: {
        status: newStatus,
        ...(newAppliedAt !== undefined ? { appliedAt: newAppliedAt } : {}),
        ...(newNotes !== undefined ? { notes: newNotes } : {}),
      },
    });
  }

  /**
   * Deletes an application tracking record.
   */
  static async deleteApplication(userId: string, jobId: string): Promise<boolean> {
    if (!userId || !jobId) return false;

    const result = await prisma.application.deleteMany({
      where: {
        userId,
        jobId,
      },
    });

    return result.count > 0;
  }

  /**
   * Lists tracked jobs and applications for the Job Dashboard (Task 14).
   *
   * Features:
   * 1. Single efficient query avoiding N+1.
   * 2. Status filtering (ALL, SAVED, APPLIED, INTERVIEW, OFFER, REJECTED).
   * 3. Search by company, role/title, or location.
   * 4. Deterministic sorting (recent_updated, recent_saved, applied_date, match_score).
   * 5. Reuses deterministic Job Match Score from associated Resume.
   * 6. Zero AI invocations.
   */
  static async listDashboardItems(
    userId: string,
    filters: {
      status?: string | null;
      search?: string | null;
      sort?: "recent_updated" | "recent_saved" | "applied_date" | "match_score" | string | null;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ items: TrackedJobDashboardItem[]; total: number }> {
    if (!userId) return { items: [], total: 0 };

    const { status, search, sort = "recent_updated" } = filters;
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = Math.max(0, filters.skip || 0);

    // Build Prisma where clause for Jobs
    const jobWhere: any = {
      userId,
    };

    // Status filter
    if (status && status.toUpperCase() !== "ALL") {
      const upperStatus = status.toUpperCase();
      if (isValidApplicationStatus(upperStatus)) {
        jobWhere.applications = {
          some: {
            userId,
            status: upperStatus,
          },
        };
      }
    }

    // Search filter across role/title, company, and location
    if (search && search.trim()) {
      const query = search.trim();
      jobWhere.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    // Determine orderBy
    let orderBy: any = { updatedAt: "desc" };
    if (sort === "recent_saved") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "recent_updated") {
      orderBy = { updatedAt: "desc" };
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where: jobWhere }),
      prisma.job.findMany({
        where: jobWhere,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          workplaceType: true,
          jobType: true,
          source: true,
          sourceUrl: true,
          createdAt: true,
          updatedAt: true,
          applications: {
            where: { userId },
            take: 1,
            select: {
              id: true,
              status: true,
              appliedAt: true,
              notes: true,
              updatedAt: true,
            },
          },
          resumes: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              title: true,
              atsScore: true,
              keywordMatch: true,
              updatedAt: true,
            },
          },
        },
      }),
    ]);

    const items: TrackedJobDashboardItem[] = jobs.map((j) => {
      const app = j.applications?.[0];
      const resume = j.resumes?.[0];

      return {
        id: j.id,
        jobId: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        workplaceType: j.workplaceType,
        jobType: j.jobType,
        source: j.source,
        sourceUrl: j.sourceUrl,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        application: app
          ? {
              id: app.id,
              status: app.status as ApplicationStatus,
              appliedAt: app.appliedAt,
              notes: app.notes,
              updatedAt: app.updatedAt,
            }
          : null,
        resume: resume
          ? {
              id: resume.id,
              title: resume.title,
              atsScore: resume.atsScore,
              keywordMatch: resume.keywordMatch,
              updatedAt: resume.updatedAt,
            }
          : null,
      };
    });

    // In-memory post-sort for criteria that span relations (match_score or applied_date)
    if (sort === "match_score") {
      items.sort((a, b) => (b.resume?.atsScore || 0) - (a.resume?.atsScore || 0));
    } else if (sort === "applied_date") {
      items.sort((a, b) => {
        const timeA = a.application?.appliedAt ? new Date(a.application.appliedAt).getTime() : 0;
        const timeB = b.application?.appliedAt ? new Date(b.application.appliedAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    return { items, total };
  }
}
