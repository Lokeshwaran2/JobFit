import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApplicationService } from "@/lib/applications/application-service";
import { DashboardNavTabs } from "@/components/dashboard/nav-tabs";
import { TrackedJobList } from "@/components/dashboard/tracked-job-list";
import { JobTrackerControls } from "@/components/dashboard/job-tracker-controls";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function JobTrackerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "ALL";
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : "";
  const sort = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "recent_updated";

  const [{ items, total }, user] = await Promise.all([
    ApplicationService.listDashboardItems(userId, {
      status,
      search,
      sort,
      limit: 50,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true, credits: true },
    }),
  ]);

  const newResumeHref = user?.isPro || (user?.credits ?? 0) > 0 ? "/builder/new" : "/subscription";

  return (
    <div className="space-y-6">
      {/* Dashboard Navigation Tabs */}
      <DashboardNavTabs />

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Job Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Track your target jobs, applications, interview stages, and notes.
          </p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href={newResumeHref}>
            <Plus className="mr-2 h-4 w-4" /> Analyze New Job
          </Link>
        </Button>
      </div>

      {/* Search, Sort, and Status Controls */}
      <JobTrackerControls />

      {/* Tracked Job List */}
      <TrackedJobList initialItems={items} currentStatus={status} />
    </div>
  );
}
