"use client";

import React, { useState } from "react";
import {
  ApplicationStatus,
  TrackedJobDashboardItem,
} from "@/lib/applications/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { JobDetailDialog } from "./job-detail-dialog";

interface TrackedJobListProps {
  initialItems: TrackedJobDashboardItem[];
  currentStatus?: string;
}

const STATUS_BADGE_VARIANTS: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  SAVED: {
    label: "Saved",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  },
  APPLIED: {
    label: "Applied",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  },
  INTERVIEW: {
    label: "Interview",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
  },
  OFFER: {
    label: "Offer",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
  },
};

export function TrackedJobList({ initialItems }: TrackedJobListProps) {
  const [items, setItems] = useState<TrackedJobDashboardItem[]>(initialItems);
  const [selectedJob, setSelectedJob] = useState<TrackedJobDashboardItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Synchronize when initialItems change (e.g. via parent search or filter)
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleStatusUpdated = (
    jobId: string,
    newStatus: ApplicationStatus,
    notes: string | null,
    appliedAt: Date | null
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.jobId !== jobId) return item;
        return {
          ...item,
          application: {
            id: item.application?.id || "temp-id",
            status: newStatus,
            notes,
            appliedAt,
            updatedAt: new Date(),
          },
        };
      })
    );
  };

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">No jobs tracked yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            Analyze a job with your resume to see your match, identify gaps, and start building your application pipeline.
          </p>
          <Button asChild>
            <Link href="/builder/new">Analyze a Job</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const status: ApplicationStatus = item.application?.status || "SAVED";
          const badgeConfig = STATUS_BADGE_VARIANTS[status] || STATUS_BADGE_VARIANTS.SAVED;
          const score = item.resume?.atsScore;

          return (
            <Card
              key={item.jobId}
              className="hover:shadow-sm transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
              onClick={() => {
                setSelectedJob(item);
                setDialogOpen(true);
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-base text-foreground tracking-tight truncate">
                      {item.title}
                    </h3>
                    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 ${badgeConfig.className}`}>
                      {badgeConfig.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {item.company && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Building className="h-3.5 w-3.5" />
                        {item.company}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                    )}
                    {item.application?.appliedAt && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Applied: {new Date(item.application.appliedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {score !== undefined && score !== null ? (
                    <div className="flex flex-col items-start sm:items-end pr-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Match Score
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-500"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    {item.resume && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/builder/${item.resume.id}`}>
                          <Sparkles className="h-3 w-3" />
                          <span className="hidden md:inline">Tailor Resume</span>
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <JobDetailDialog
        item={selectedJob}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusUpdated={handleStatusUpdated}
      />
    </>
  );
}
