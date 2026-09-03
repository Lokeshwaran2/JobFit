import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Resume } from "@prisma/client";
import { ResumeList } from "@/components/dashboard/resume-list";
import { SkillPrioritiesCard } from "@/components/dashboard/skill-priorities-card";

export default async function DashboardPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return null;

    let resumes: Resume[] = [];
    let dbUser: { isPro: boolean; credits: number } | null = null;

    try {
        const [resumesData, userData] = await Promise.all([
            prisma.resume.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { isPro: true, credits: true }
            })
        ]);
        resumes = resumesData;
        dbUser = userData;
    } catch (error) {
        console.error("Dashboard DB fetch error:", error);
    }

    const newResumeHref = (dbUser?.isPro || (dbUser?.credits ?? 0) > 0) ? "/builder/new" : "/subscription";

    return (
        <div className="space-y-8">
            {/* Skill Learning Priorities Section */}
            <SkillPrioritiesCard />

            {/* My Resumes Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">My Resumes</h2>
                        <p className="text-muted-foreground text-sm">Manage your AI-tailored resumes.</p>
                    </div>
                    <Button asChild>
                        <Link href={newResumeHref}>
                            <Plus className="mr-2 h-4 w-4" /> New Resume
                        </Link>
                    </Button>
                </div>

                {resumes.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-primary/10 p-4 mb-4">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg">No resumes yet</h3>
                            <p className="text-muted-foreground mb-4 max-w-sm">
                                Create your first tailored resume by matching your skills to a job description.
                            </p>
                            <Button asChild>
                                <Link href={newResumeHref}>Create Resume</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <ResumeList resumes={resumes} />
                )}
            </div>
        </div>
    );
}
