"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  TrackedJobDashboardItem,
} from "@/lib/applications/types";
import {
  ExternalLink,
  FileText,
  Building,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface JobDetailDialogProps {
  item: TrackedJobDashboardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: (jobId: string, newStatus: ApplicationStatus, notes: string | null, appliedAt: Date | null) => void;
}

export function JobDetailDialog({
  item,
  open,
  onOpenChange,
  onStatusUpdated,
}: JobDetailDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>("SAVED");
  const [notes, setNotes] = useState<string>("");
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when opened item changes
  React.useEffect(() => {
    if (item) {
      setSelectedStatus(item.application?.status || "SAVED");
      setNotes(item.application?.notes || "");
      setAppliedDate(
        item.application?.appliedAt
          ? new Date(item.application.appliedAt).toISOString().split("T")[0]
          : ""
      );
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/jobs/${item.jobId}/application`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes.trim() || null,
          appliedAt: appliedDate ? new Date(appliedDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update application");
      }

      const updatedDate = appliedDate ? new Date(appliedDate) : (selectedStatus === "APPLIED" ? new Date() : null);
      onStatusUpdated(item.jobId, selectedStatus, notes.trim() || null, updatedDate);
      toast.success("Application details updated!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save application");
    } finally {
      setIsSaving(false);
    }
  };

  const score = item.resume?.atsScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">{item.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-3 text-sm mt-1 text-muted-foreground">
                {item.company && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
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
              </DialogDescription>
            </div>
            {score !== undefined && score !== null && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Match Score</span>
                <span
                  className={`text-xl font-extrabold ${
                    score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-500"
                  }`}
                >
                  {score}%
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Status Progression Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Application Pipeline Status
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {APPLICATION_STATUSES.map((st) => {
                const isSelected = selectedStatus === st;
                return (
                  <Button
                    key={st}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`h-9 text-xs font-medium ${
                      isSelected ? "shadow-sm font-semibold" : "border-slate-200"
                    }`}
                    onClick={() => {
                      setSelectedStatus(st);
                      if (st === "APPLIED" && !appliedDate) {
                        setAppliedDate(new Date().toISOString().split("T")[0]);
                      }
                    }}
                  >
                    {isSelected && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    {st}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Applied Date Field (Visible or active especially for APPLIED, INTERVIEW, OFFER, REJECTED) */}
          <div className="space-y-2">
            <Label htmlFor="appliedDate" className="text-xs font-semibold text-muted-foreground">
              Applied Date
            </Label>
            <Input
              id="appliedDate"
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
          </div>

          {/* Private Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">
              Private Application Notes
            </Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="e.g. Recruiter contact, salary expectations, interview feedback, follow-up deadlines..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm resize-y"
              maxLength={5000}
            />
            <p className="text-[11px] text-muted-foreground text-right">{notes.length} / 5,000</p>
          </div>

          {/* Connected Resume and Actions */}
          <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Connected Resume & Tailoring
            </h4>
            {item.resume ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{item.resume.title}</span>
                    <span className="text-xs text-muted-foreground">
                      Job Match Score: <strong className="text-foreground">{item.resume.atsScore}/100</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="default" className="h-8 gap-1.5 text-xs font-medium">
                    <Link href={`/builder/${item.resume.id}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Tailor / Export
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">No tailored resume linked to this job yet.</span>
                <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                  <Link href="/builder/new">Create Tailored Resume</Link>
                </Button>
              </div>
            )}

            {item.sourceUrl && (
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Job Posting Source:</span>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View Job URL <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
