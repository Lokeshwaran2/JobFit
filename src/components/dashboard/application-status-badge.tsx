"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
} from "@/lib/applications/types";
import { Briefcase, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ApplicationStatusBadgeProps {
  jobId: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  SAVED: { label: "Saved", color: "bg-slate-100 text-slate-800 border-slate-300" },
  APPLIED: { label: "Applied", color: "bg-blue-100 text-blue-800 border-blue-300" },
  INTERVIEW: { label: "Interview", color: "bg-purple-100 text-purple-800 border-purple-300" },
  OFFER: { label: "Offer", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-800 border-rose-300" },
};

export function ApplicationStatusBadge({ jobId }: ApplicationStatusBadgeProps) {
  const [status, setStatus] = useState<ApplicationStatus>("SAVED");
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchApp() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/application`);
        if (res.ok) {
          const data = await res.json();
          if (data?.application?.status && isMounted) {
            setStatus(data.application.status);
          }
        }
      } catch (err) {
        console.warn("Could not fetch application status", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (jobId) {
      fetchApp();
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (newStatus === status) return;
    try {
      setUpdating(true);
      const res = await fetch(`/api/jobs/${jobId}/application`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setStatus(data.application.status);
      toast.success(`Application status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (!jobId || loading) {
    return null;
  }

  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={updating}
            className={`h-8 gap-1.5 text-xs font-semibold border ${currentConfig.color} shadow-xs hover:opacity-90`}
          >
            {updating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Briefcase className="h-3.5 w-3.5" />
            )}
            <span>Status: {currentConfig.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 p-1">
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
            Application Pipeline
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {APPLICATION_STATUSES.map((st) => {
            const isSelected = st === status;
            return (
              <DropdownMenuItem
                key={st}
                onClick={() => handleUpdateStatus(st)}
                className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-md hover:bg-accent"
              >
                <span>{STATUS_CONFIG[st].label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="p-2 text-xs text-muted-foreground cursor-pointer">
            <Link href="/dashboard/jobs" className="flex items-center justify-between w-full">
              <span>View in Job Tracker</span>
              <span className="text-[10px]">→</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
