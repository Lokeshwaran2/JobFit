import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Resume } from "@prisma/client";
import { SkillPrioritiesCard } from "@/components/dashboard/skill-priorities-card";
import { ProfileScoreCheckCard } from "@/components/dashboard/profile-score-check-card";
import { MyResumesCard } from "@/components/dashboard/my-resumes-card";
import { DashboardNavTabs } from "@/components/dashboard/nav-tabs";

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
        <div className="space-y-6">
            {/* Dashboard Navigation Tabs */}
            <DashboardNavTabs />

            {/* Profile Overview (Expanded by default) */}
            <ProfileScoreCheckCard />

            {/* Skill Learning Priorities (Collapsed by default) */}
            <SkillPrioritiesCard />

            {/* My Resumes (Expanded by default with Show All pagination) */}
            <MyResumesCard resumes={resumes} newResumeHref={newResumeHref} />
        </div>
    );
}
