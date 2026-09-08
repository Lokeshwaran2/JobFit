import { LiveStats } from "@/lib/stats/get-stats";
import { Users, FileCheck2, Award, Activity } from "lucide-react";

interface StatsBannerProps {
  stats: LiveStats | null;
}

export function StatsBanner({ stats }: StatsBannerProps) {
  // Graceful fallback: If exact live numbers aren't queryable, hide the section entirely
  if (!stats) return null;

  return (
    <section className="container mx-auto px-4 md:px-0 max-w-5xl py-6">
      <div className="rounded-2xl border border-border/80 bg-slate-50/70 dark:bg-card/50 backdrop-blur-sm p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Activity & Verified Usage</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Live database metrics • Zero inflated numbers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center">
          <div className="flex flex-col items-center justify-center p-3 space-y-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.totalUsers.toLocaleString()}+
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Registered Candidates
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 space-y-1 sm:border-x border-border/60">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.totalResumes.toLocaleString()}+
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Resumes Scanned & Tailored
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 space-y-1">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Award className="h-5 w-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.averageScore}%
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Average Tailored Match Score
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
