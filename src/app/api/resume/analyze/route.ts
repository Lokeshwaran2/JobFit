import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseFileToText } from "@/lib/file-parser";
import { AiService } from "@/lib/ai-service";
import { prisma } from "@/lib/prisma";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";
import { isValidSkill } from "@/lib/skills/skill-validator";
import { JobService } from "@/lib/jobs/job-service";
import { createJobHash } from "@/lib/jobs/job-fingerprint";
import { validateJobUrl } from "@/lib/jobs/url-validator";
import { extractJobFromUrl } from "@/lib/jobs/job-extractor";
import { JobMatcher } from "@/lib/matching/job-matcher";
import { TailoringService } from "@/lib/tailoring/tailoring-service";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.id || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // User is already in DB due to NextAuth Adapter/Register flow
        // Just verify if needed, but session.user.id IS the DB ID.
        const dbUserId = user.id;

        // Fetch User with credits/pro status
        const dbUser = await prisma.user.findUnique({
            where: { id: dbUserId },
            select: { isPro: true, credits: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!dbUser.isPro && dbUser.credits < 1) {
            return NextResponse.json({
                error: "Insufficient credits",
                code: "NO_CREDITS"
            }, { status: 403 });
        }

        const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB limit

        const formData = await req.formData();
        const file = formData.get("resumeFile");
        let jdText = (formData.get("jobDescription") as string) || "";
        const rawSourceUrl = ((formData.get("sourceUrl") || formData.get("jobUrl")) as string) || null;
        const sourceInput = (formData.get("source") as string) || null;

        let validatedSourceUrl: string | null = null;
        if (rawSourceUrl && rawSourceUrl.trim()) {
            const urlValidation = validateJobUrl(rawSourceUrl);
            if (!urlValidation.isValid || !urlValidation.canonicalUrl) {
                return NextResponse.json({
                    error: urlValidation.error || "Invalid job posting URL. Please provide a valid HTTP or HTTPS URL."
                }, { status: 400 });
            }
            validatedSourceUrl = urlValidation.canonicalUrl;
        }

        // If jobDescription is not provided but a valid URL was passed, try resolving from user's previously analyzed jobs or extracting from public API
        if (!jdText.trim() && validatedSourceUrl) {
            const existingJob = await JobService.findJobByUrl(dbUserId, validatedSourceUrl);
            if (existingJob && existingJob.rawDescription && existingJob.rawDescription.trim()) {
                jdText = existingJob.rawDescription;
            } else {
                const extraction = await extractJobFromUrl(validatedSourceUrl);
                if (extraction.extracted && extraction.job?.rawDescription) {
                    jdText = extraction.job.rawDescription;
                } else {
                    return NextResponse.json({
                        error: extraction.message || "We couldn't extract the job details from this URL. Paste the job description below to continue.",
                        code: "URL_EXTRACTION_UNAVAILABLE",
                    }, { status: 400 });
                }
            }
        }

        // Validation 1: Missing file or JD
        if (!file || !jdText || typeof jdText !== "string" || !jdText.trim()) {
            return NextResponse.json({ error: "Please provide both a resume file and a job description." }, { status: 400 });
        }

        // Validation 2: Ensure uploaded object is a valid File
        if (typeof file !== "object" || typeof (file as any).arrayBuffer !== "function" || typeof (file as any).size !== "number") {
            return NextResponse.json({ error: "Invalid resume file upload. Please upload a valid document." }, { status: 400 });
        }

        const resumeFile = file as File;

        // Validation 3: Enforce maximum file size (SEC-02)
        if (resumeFile.size > MAX_RESUME_SIZE) {
            return NextResponse.json({ error: "File size exceeds the 10 MB limit. Please upload a smaller resume." }, { status: 400 });
        }

        // Validation 4: Reject empty files
        if (resumeFile.size === 0) {
            return NextResponse.json({ error: "The uploaded file is empty. Please upload a valid resume." }, { status: 400 });
        }

        // 1. Process File
        const rawResumeText = await parseFileToText(resumeFile);
        // Helper to remove null bytes (Postgres Text incompatibility)
        const sanitize = (str: string) => str.replace(/\0/g, "");
        const resumeText = sanitize(rawResumeText);
        const cleanJdText = sanitize(jdText);

        // 2. Check for existing duplicate job for this user to save LLM tokens
        const precomputedHash = createJobHash({
            description: cleanJdText,
            url: validatedSourceUrl,
        });
        const existingJob = await JobService.findJobByHash(dbUserId, precomputedHash);

        let resumeData: any;
        let jdData: any;
        let job: any;

        if (existingJob && existingJob.parsedData) {
            // Duplicate detected: reuse parsed job information!
            job = existingJob;
            jdData = existingJob.parsedData;
            resumeData = await AiService.extractResumeFromText(resumeText);
        } else {
            // Parallel extraction: Parse resume and analyze JD with AI
            const [extractedResume, analyzedJd] = await Promise.all([
                AiService.extractResumeFromText(resumeText),
                AiService.analyzeJobDescription(cleanJdText),
            ]);
            resumeData = extractedResume;
            jdData = analyzedJd;

            // Persist or update the Job record
            const { job: savedJob } = await JobService.createOrFindJob({
                userId: dbUserId,
                rawDescription: cleanJdText,
                source: (sourceInput as any) || "manual",
                sourceUrl: validatedSourceUrl,
                title: jdData.role || "Job Application",
                company: jdData.company || null,
                location: jdData.location || null,
                workplaceType: jdData.workplaceType || null,
                jobType: jdData.jobType || null,
                parsedData: jdData,
            });
            job = savedJob;
        }

        // 3. Deterministic Match on Original Resume (Batch 3)
        const beforeMatch = JobMatcher.match(resumeData, jdData);

        // 4. Evidence-Grounded Tailoring with Deterministic Safety Validation (Batch 4)
        const { tailoredData, tailoringDiff, afterMatch } = await TailoringService.tailorResume(
            resumeData,
            jdData,
            beforeMatch
        );

        // Filter missingSkills so places and non-skills are never saved as skill gaps
        const combinedMissing = [
            ...(Array.isArray(afterMatch.missingRequiredSkills) ? afterMatch.missingRequiredSkills : []),
            ...(Array.isArray(beforeMatch.missingRequiredSkills) ? beforeMatch.missingRequiredSkills : []),
        ];
        const filteredMissingSkills = Array.from(
            new Set(combinedMissing.filter((s: string) => typeof s === "string" && isValidSkill(s)))
        );

        // 5. Save to DB with associated jobId, originalData, and deterministic match results
        const resume = await prisma.resume.create({
            data: {
                userId: dbUserId,
                jobId: job?.id || null,
                title: sanitize(`Resume for ${jdData.role || job?.title || "Job Application"}`),
                originalText: resumeText, // Already sanitized
                targetJobDesc: cleanJdText,
                originalData: resumeData, // Persist raw parsed candidate resume (authoritative source)
                templateId: "classic",
                structuredData: tailoredData,
                missingSkills: filteredMissingSkills,
                atsScore: afterMatch.score, // Deterministic Job Match Score
                keywordMatch: afterMatch.breakdown.keywords,
                improvements: {
                    originalScore: beforeMatch.score,
                    atsScore: afterMatch.score,
                    scoreGain: tailoringDiff.scoreGain,
                    percentageGain: tailoringDiff.percentageGain,
                    jobMatch: afterMatch,
                    beforeMatch: beforeMatch,
                    tailoring: tailoringDiff,
                    tailoredData: tailoredData,
                } as any,
            }
        });

        // 6. Track Missing Skill Gaps & Update Learning Priorities (Resilient)
        try {
            const rawJdSkills = [
                ...(Array.isArray(jdData.requiredSkills) ? jdData.requiredSkills.filter(isValidSkill) : []),
                ...(Array.isArray(jdData.keywords) ? jdData.keywords.filter(isValidSkill) : []),
                ...filteredMissingSkills,
            ];

            const rawCandidateSkills = [
                ...(Array.isArray(resumeData?.skills?.hard) ? resumeData.skills.hard : []),
                ...(Array.isArray(resumeData?.skills?.soft) ? resumeData.skills.soft : []),
                ...(Array.isArray(resumeData?.skills?.tools) ? resumeData.skills.tools : []),
                ...(Array.isArray(tailoredData?.skills?.hard) ? tailoredData.skills.hard : []),
            ];

            await SkillGapTracker.recordSkillGaps({
                userId: dbUserId,
                resumeId: resume.id,
                jobTitle: jdData.role || "Job Application",
                targetJobDesc: sanitize(jdText),
                jdSkills: rawJdSkills,
                candidateSkills: rawCandidateSkills,
            });
        } catch (skillGapErr) {
            console.error("Skill gap tracking warning (non-fatal):", skillGapErr);
        }

        // Decrement Credits if not Pro
        if (!dbUser.isPro) {
            await prisma.user.update({
                where: { id: dbUserId },
                data: {
                    credits: {
                        decrement: 1
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            resumeId: resume.id,
            jobId: job?.id || null,
            analysis: {
                original: resumeData,
                tailored: tailoredData,
                jd: jdData,
                score: afterMatch.score
            },
            jobMatch: afterMatch,
            tailoring: tailoringDiff
        });
    } catch (error: any) {
        // Structured safe diagnostic logging (never log full resume text or secrets)
        console.error("[Resume Analysis Error]:", {
            message: error instanceof Error ? error.message : "Unknown error",
            code: error?.code,
        });

        // Check for specific known configuration issues
        if (error?.message?.includes("API key") || error?.message?.includes("GROQ_API_KEY")) {
            return NextResponse.json(
                { error: "AI service configuration issue. Please contact support or check API keys." },
                { status: 500 }
            );
        }

        // Generic user-facing safe error message (ERR-01)
        return NextResponse.json(
            { error: "We encountered an unexpected error analyzing your resume. Please try again." },
            { status: 500 }
        );
    }
}
