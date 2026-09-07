import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateJobUrl } from "@/lib/jobs/url-validator";
import { JobService } from "@/lib/jobs/job-service";
import { extractJobFromUrl } from "@/lib/jobs/job-extractor";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { url } = body || {};
    const validation = validateJobUrl(url);

    if (!validation.isValid || !validation.canonicalUrl) {
      return NextResponse.json(
        { error: validation.error || "Invalid job posting URL." },
        { status: 400 }
      );
    }

    const canonicalUrl = validation.canonicalUrl;
    let sourceDomain = "";
    try {
      sourceDomain = new URL(canonicalUrl).hostname.toLowerCase();
    } catch {
      sourceDomain = "";
    }

    // 1. Check if the authenticated user previously analyzed a job with this canonical URL
    const existingJob = await JobService.findJobByUrl(user.id, canonicalUrl);

    if (existingJob && existingJob.rawDescription && existingJob.rawDescription.trim()) {
      return NextResponse.json({
        success: true,
        extracted: true,
        source: existingJob.source,
        sourceDomain: existingJob.sourceDomain || sourceDomain,
        canonicalUrl,
        job: {
          id: existingJob.id,
          title: existingJob.title,
          company: existingJob.company,
          location: existingJob.location,
          workplaceType: existingJob.workplaceType,
          jobType: existingJob.jobType,
          rawDescription: existingJob.rawDescription,
        },
      });
    }

    // 2. Perform safe, allowlisted public job extraction (Greenhouse & Lever)
    const extractionResult = await extractJobFromUrl(canonicalUrl);

    if (extractionResult.extracted && extractionResult.job) {
      return NextResponse.json({
        success: true,
        extracted: true,
        source: extractionResult.source,
        sourceDomain: extractionResult.sourceDomain,
        canonicalUrl: extractionResult.canonicalUrl,
        job: {
          title: extractionResult.job.title,
          company: extractionResult.job.company,
          location: extractionResult.job.location,
          workplaceType: extractionResult.job.workplaceType,
          jobType: extractionResult.job.jobType,
          rawDescription: extractionResult.job.rawDescription,
        },
      });
    }

    // 3. Extraction unavailable (LinkedIn, Workday, generic URL, or API 404/timeout/error)
    return NextResponse.json({
      success: true,
      extracted: false,
      canonicalUrl,
      source: extractionResult.source,
      sourceDomain: extractionResult.sourceDomain || sourceDomain,
      message:
        extractionResult.message ||
        "We couldn't extract the job details from this URL. Paste the job description below to continue.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve job URL. Please try again." },
      { status: 500 }
    );
  }
}
