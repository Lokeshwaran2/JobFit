import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseFileToText } from "@/lib/file-parser";
import { AiService } from "@/lib/ai-service";
import { prisma } from "@/lib/prisma";

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

        const formData = await req.formData();
        const file = formData.get("resumeFile") as File;
        const jdText = formData.get("jobDescription") as string;

        if (!file || !jdText) {
            return NextResponse.json({ error: "Missing file or JD" }, { status: 400 });
        }

        // 1. Process File
        const rawResumeText = await parseFileToText(file);
        // Helper to remove null bytes (Postgres Text incompatibility)
        const sanitize = (str: string) => str.replace(/\0/g, "");
        const resumeText = sanitize(rawResumeText);

        // 2. AI Extraction & Analysis (Parallelize for speed)
        const [resumeData, jdData] = await Promise.all([
            AiService.extractResumeFromText(resumeText),
            AiService.analyzeJobDescription(jdText)
        ]);

        // 3. Tailor Resume (The Core Match)
        const tailoredResult = await AiService.rewriteResume(resumeData, jdData);

        // 4. Save to DB
        const resume = await prisma.resume.create({
            data: {
                userId: dbUserId,
                title: sanitize(`Resume for ${jdData.role || "Job Application"}`),
                originalText: resumeText, // Already sanitized
                targetJobDesc: sanitize(jdText),
                // tailoredResult contains structuredData, missingSkills, atsScore
                structuredData: tailoredResult.structuredData,
                missingSkills: tailoredResult.missingSkills || [],
                atsScore: tailoredResult.atsScore || 0,
                keywordMatch: tailoredResult.keywordMatch || 0,
                improvements: tailoredResult.improvementStats || {},
            }
        });

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
            analysis: {
                original: resumeData,
                tailored: tailoredResult.structuredData,
                jd: jdData,
                score: tailoredResult.atsScore
            }
        });
    } catch (error: any) {
        console.error("Analysis Error Details:", error);

        // Check for common OpenAI Errors
        if (error?.message?.includes("API key")) {
            return NextResponse.json({ error: "OpenAI API Key is missing or invalid." }, { status: 500 });
        }

        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
