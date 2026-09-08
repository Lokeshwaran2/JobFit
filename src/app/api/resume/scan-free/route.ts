import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseFileToText } from "@/lib/file-parser";
import { AiService } from "@/lib/ai-service";
import { JobMatcher } from "@/lib/matching/job-matcher";
import { extractJobFromUrl } from "@/lib/jobs/job-extractor";
import { validateJobUrl } from "@/lib/jobs/url-validator";
import { checkAnonymousQuota, incrementAnonymousQuota } from "@/lib/quota/anonymous-quota";
import { prisma } from "@/lib/prisma";

const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Check if user is logged in
    const session = await auth();
    const userId = session?.user?.id;
    const isLoggedIn = !!userId;

    // 2. If anonymous, enforce quota check (3 free scans)
    if (!isLoggedIn) {
      const quotaCheck = await checkAnonymousQuota();
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: "You have used all 3 free anonymous scans. Create a free account to continue scanning resumes.",
            code: "ANON_QUOTA_EXHAUSTED",
            remaining: 0,
            maxScans: quotaCheck.maxScans,
          },
          { status: 403 }
        );
      }
    } else if (userId) {
      // Check user credits if logged in
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true, credits: true },
      });
      if (dbUser && !dbUser.isPro && dbUser.credits < 1) {
        return NextResponse.json(
          {
            error: "Insufficient credits in your account.",
            code: "NO_CREDITS",
          },
          { status: 403 }
        );
      }
    }

    // 3. Read form data (supports file upload or pasted resume text)
    const formData = await req.formData();
    const file = formData.get("resumeFile");
    const pastedResumeText = (formData.get("resumeText") as string) || "";
    let jdText = (formData.get("jobDescription") as string) || "";
    const rawSourceUrl = (formData.get("jobUrl") || formData.get("sourceUrl")) as string;

    // Handle URL extraction for JD if URL provided
    if (!jdText.trim() && rawSourceUrl && rawSourceUrl.trim()) {
      const urlValidation = validateJobUrl(rawSourceUrl);
      if (!urlValidation.isValid || !urlValidation.canonicalUrl) {
        return NextResponse.json(
          { error: urlValidation.error || "Invalid job posting URL." },
          { status: 400 }
        );
      }
      const extraction = await extractJobFromUrl(urlValidation.canonicalUrl);
      if (extraction.extracted && extraction.job?.rawDescription) {
        jdText = extraction.job.rawDescription;
      } else {
        return NextResponse.json(
          {
            error: extraction.message || "Could not automatically fetch job description from this URL. Please paste the job description text.",
            code: "URL_EXTRACTION_UNAVAILABLE",
          },
          { status: 400 }
        );
      }
    }

    // Parse resume text
    let rawResumeText = "";
    if (file && typeof file === "object" && typeof (file as any).arrayBuffer === "function") {
      const resumeFile = file as File;
      if (resumeFile.size > MAX_RESUME_SIZE) {
        return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
      }
      if (resumeFile.size === 0) {
        return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
      }
      rawResumeText = await parseFileToText(resumeFile);
    } else if (pastedResumeText && pastedResumeText.trim()) {
      rawResumeText = pastedResumeText.trim();
    } else {
      return NextResponse.json(
        { error: "Please upload your resume file (PDF/DOCX) or paste your resume text." },
        { status: 400 }
      );
    }

    if (!jdText || !jdText.trim()) {
      return NextResponse.json(
        { error: "Please provide a target job description or job URL." },
        { status: 400 }
      );
    }

    const sanitize = (str: string) => str.replace(/\0/g, "");
    const cleanResumeText = sanitize(rawResumeText);
    const cleanJdText = sanitize(jdText);

    // 4. Parallel extraction using existing AiService
    const [extractedResume, analyzedJd] = await Promise.all([
      AiService.extractResumeFromText(cleanResumeText),
      AiService.analyzeJobDescription(cleanJdText),
    ]);

    // 5. Run deterministic Job Matcher
    const matchResult = JobMatcher.match(extractedResume, analyzedJd);

    // 6. Curate 2-3 specific, actionable improvement recommendations for free
    const freeRecommendations = (matchResult.recommendations || []).slice(0, 3);
    if (freeRecommendations.length === 0 && matchResult.gaps && matchResult.gaps.length > 0) {
      freeRecommendations.push(
        `Review missing technical requirements: ${matchResult.missingRequiredSkills.slice(0, 3).join(", ")}. Ensure they are highlighted in your experience bullets.`
      );
    }

    // 7. If anonymous, increment quota
    let remainingScans = 0;
    if (!isLoggedIn) {
      const updated = await incrementAnonymousQuota();
      remainingScans = updated.remaining;
    } else if (userId) {
      // Deduct credit for logged-in user if not Pro
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true, credits: true },
      });
      if (dbUser && !dbUser.isPro) {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } },
        });
        remainingScans = Math.max(0, dbUser.credits - 1);
      } else {
        remainingScans = 999;
      }
    }

    // 8. Return the public free scan response with top 2-3 recommendations for free
    // and gated previews for advanced features
    return NextResponse.json({
      success: true,
      isLoggedIn,
      score: matchResult.score,
      targetRole: analyzedJd.role || "Target Role",
      company: analyzedJd.company || null,
      breakdown: matchResult.breakdown,
      matchedSkillsCount: matchResult.matchedRequiredSkills.length,
      missingSkillsCount: matchResult.missingRequiredSkills.length,
      matchedSkillsSample: matchResult.matchedRequiredSkills.slice(0, 5),
      missingSkillsSample: matchResult.missingRequiredSkills.slice(0, 5),
      strengths: matchResult.strengths?.slice(0, 2) || [],
      freeRecommendations,
      remainingScans,
      gatedFeatures: {
        fullAiRewrite: {
          title: "AI Google X-Y-Z Bullet Rewrite",
          description: "Transform generic responsibilities into high-impact metrics tailored to this job description.",
          bulletsReadyCount: Array.isArray(extractedResume?.experience)
            ? extractedResume.experience.reduce((acc: number, exp: any) => acc + (exp.description?.length || 0), 0)
            : 6,
          locked: true,
        },
        profileAudit: {
          title: "GitHub & LinkedIn Technical Proof Audit",
          description: "Verify your public code repos, commit recency, and LinkedIn headline keyword discoverability.",
          locked: true,
        },
        pdfExport: {
          title: "Single-Column Vector PDF Export",
          description: "Download machine-readable vector PDF built strictly for ATS parser readability.",
          locked: true,
        },
        skillRoadmaps: {
          title: "Autonomous Skill Gap Learning Paths",
          description: "Level-aware roadmaps with 100% verified free resources for any missing technologies.",
          locked: true,
        },
      },
    });
  } catch (error: any) {
    console.error("[FREE_SCAN_API_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze resume against job description." },
      { status: 500 }
    );
  }
}
