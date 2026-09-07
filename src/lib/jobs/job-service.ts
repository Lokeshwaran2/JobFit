import { prisma } from "@/lib/prisma";
import { createJobHash, canonicalizeJobUrl } from "./job-fingerprint";
import { CreateJobInput, JobSource, isValidJobSource } from "./types";
import { Job } from "@prisma/client";

export interface JobServiceResult {
  job: Job;
  isDuplicate: boolean;
}

export class JobService {
  /**
   * Finds an existing job for an authenticated user by its deterministic hash.
   * Strictly scopes query to the user (IDOR safe).
   */
  static async findJobByHash(userId: string, jobHash: string): Promise<Job | null> {
    if (!userId || !jobHash) return null;

    return prisma.job.findUnique({
      where: {
        userId_jobHash: {
          userId,
          jobHash,
        },
      },
    });
  }

  /**
   * Retrieves a job by ID, ensuring the authenticated user owns the job.
   * Protects against Insecure Direct Object References (IDOR).
   */
  static async getJobById(userId: string, jobId: string): Promise<Job | null> {
    if (!userId || !jobId) return null;

    return prisma.job.findFirst({
      where: {
        id: jobId,
        userId, // Strictly verified ownership
      },
    });
  }

  /**
   * Finds an existing job for an authenticated user by its canonical source URL.
   * Strictly scopes query to the user (IDOR safe).
   */
  static async findJobByUrl(userId: string, sourceUrl: string): Promise<Job | null> {
    if (!userId || !sourceUrl) return null;
    const canonicalUrl = canonicalizeJobUrl(sourceUrl);
    if (!canonicalUrl) return null;

    return prisma.job.findFirst({
      where: {
        userId,
        sourceUrl: canonicalUrl,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Creates a new job or returns the existing duplicate job for the authenticated user.
   */
  static async createOrFindJob(input: CreateJobInput): Promise<JobServiceResult> {
    const { userId, rawDescription } = input;

    if (!userId) {
      throw new Error("Unauthorized: userId is required to store or query a job.");
    }

    if (!rawDescription || !rawDescription.trim()) {
      throw new Error("Bad Request: rawDescription is required.");
    }

    const canonicalUrl = canonicalizeJobUrl(input.sourceUrl);
    let sourceDomain: string | null = null;
    if (canonicalUrl) {
      try {
        sourceDomain = new URL(canonicalUrl).hostname.toLowerCase();
      } catch {
        sourceDomain = null;
      }
    }

    // Determine safe controlled source
    let source: JobSource = "manual";
    if (input.source && isValidJobSource(input.source)) {
      source = input.source;
    } else if (sourceDomain) {
      if (sourceDomain.includes("linkedin.com")) source = "linkedin";
      else if (sourceDomain.includes("greenhouse.io")) source = "greenhouse";
      else if (sourceDomain.includes("lever.co")) source = "lever";
      else if (sourceDomain.includes("myworkdayjobs.com") || sourceDomain.includes("workday.com")) source = "workday";
      else source = "generic_url";
    }

    const jobHash = createJobHash({
      company: input.company,
      title: input.title,
      description: rawDescription,
      url: canonicalUrl,
    });

    // 1. Check for existing duplicate job for this user
    const existingJob = await this.findJobByHash(userId, jobHash);

    if (existingJob) {
      // If the existing job was missing parsedData and we now have it, update it
      if (!existingJob.parsedData && input.parsedData) {
        const updated = await prisma.job.update({
          where: { id: existingJob.id },
          data: {
            parsedData: input.parsedData as any,
            company: existingJob.company || input.company || null,
            location: existingJob.location || input.location || null,
            workplaceType: existingJob.workplaceType || input.workplaceType || null,
            jobType: existingJob.jobType || input.jobType || null,
          },
        });
        return { job: updated, isDuplicate: true };
      }

      return { job: existingJob, isDuplicate: true };
    }

    // 2. Create new job record
    const title = input.title?.trim() || "Target Job Application";
    const job = await prisma.job.create({
      data: {
        userId,
        jobHash,
        title,
        company: input.company?.trim() || null,
        location: input.location?.trim() || null,
        workplaceType: input.workplaceType || null,
        jobType: input.jobType || null,
        source,
        sourceUrl: canonicalUrl,
        sourceDomain,
        rawDescription,
        parsedData: (input.parsedData as any) || null,
      },
    });

    return { job, isDuplicate: false };
  }

  /**
   * Retrieves all jobs for the authenticated user, ordered by creation date.
   */
  static async listUserJobs(
    userId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<Job[]> {
    if (!userId) return [];

    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = Math.max(0, options.skip || 0);

    return prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        resumes: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            atsScore: true,
          },
        },
      },
    });
  }

  /**
   * Deletes a job owned by the authenticated user.
   * Linked resumes are preserved with jobId set to null (via ON DELETE SET NULL).
   */
  static async deleteJob(userId: string, jobId: string): Promise<boolean> {
    if (!userId || !jobId) return false;

    const result = await prisma.job.deleteMany({
      where: {
        id: jobId,
        userId, // Strictly verified ownership
      },
    });

    return result.count > 0;
  }
}
