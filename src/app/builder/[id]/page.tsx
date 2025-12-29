import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { auth } from "@/auth";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return notFound();

    // Fetch resume with ATS Score and User Status
    const [resume, user] = await Promise.all([
        prisma.resume.findUnique({
            where: {
                id: id,
                userId: userId
            },
            select: {
                id: true,
                structuredData: true,
                targetJobDesc: true,
                atsScore: true,
                improvements: true,
                missingSkills: true,
            }
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, credits: true }
        })
    ]);

    if (!resume) {
        redirect("/dashboard");
    }

    // Default to empty object if structuredData is null
    const initialData = (resume.structuredData as any) || {};

    return (
        <div className="h-[calc(100vh-4rem)] min-h-[1000px]">
            <ResumeBuilder
                initialData={initialData}
                resumeId={resume.id}
                jobDescription={resume.targetJobDesc || ""}
                atsScore={resume.atsScore}
                improvements={resume.improvements as any}
                missingSkills={(resume.missingSkills as string[]) || []}
                isPro={user?.isPro || false}
                credits={user?.credits || 0}
            />
        </div>
    );
}
