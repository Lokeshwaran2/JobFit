"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNavTabs() {
  const pathname = usePathname();
  const isJobs = pathname.startsWith("/dashboard/jobs");

  return (
    <div className="flex items-center space-x-1 border-b pb-px mb-6">
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
          !isJobs
            ? "border-primary text-primary font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
        )}
      >
        <FileText className="h-4 w-4" />
        <span>My Resumes</span>
      </Link>
      <Link
        href="/dashboard/jobs"
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
          isJobs
            ? "border-primary text-primary font-semibold"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
        )}
      >
        <Briefcase className="h-4 w-4" />
        <span>Job Tracker</span>
      </Link>
    </div>
  );
}
