"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Github, Linkedin, Target, Layers } from "lucide-react";
import { EvidenceLevel } from "@/lib/profile-scoring/types";

interface ProfileAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: "github" | "linkedin" | "overall";
  data: any;
  targetRole: string;
}

export function ProfileAnalysisDialog({
  open,
  onOpenChange,
  platform,
  data,
  targetRole,
}: ProfileAnalysisDialogProps) {
  if (!data) return null;

  const score = data.score || 0;
  const breakdown = data.breakdown || {};
  const strengths: string[] = data.strengths || [];
  const improvements: string[] = data.improvements || [];
  const evidence = data.evidence || {};

  const getScoreBadgeColor = (val: number) => {
    if (val >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800";
    if (val >= 60) return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800";
    return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800";
  };

  const getEvidenceBadge = (level: EvidenceLevel) => {
    switch (level) {
      case "Strong":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200">Strong</Badge>;
      case "Moderate":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">Moderate</Badge>;
      case "Weak":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">Weak</Badge>;
      case "None":
      default:
        return <Badge variant="outline" className="text-muted-foreground">No Evidence</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {platform === "github" && <Github className="h-6 w-6" />}
              {platform === "linkedin" && <Linkedin className="h-6 w-6 text-blue-600" />}
              {platform === "overall" && <Target className="h-6 w-6 text-indigo-600" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {platform === "github" && "GitHub Role Analysis"}
                {platform === "linkedin" && "LinkedIn Role Analysis"}
                {platform === "overall" && "Combined Profile Analysis"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Contextual alignment for target role: <strong className="text-foreground">{targetRole}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Score Banner */}
        <div className="p-4 rounded-xl border bg-muted/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {platform === "github" ? "GitHub Score" : platform === "linkedin" ? "LinkedIn Score" : "Overall Profile Score"}
            </div>
            <div className="text-3xl font-extrabold flex items-baseline gap-1 mt-0.5">
              <span>{score}</span>
              <span className="text-sm font-medium text-muted-foreground">/100</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBadgeColor(score)}`}>
            {score >= 80 ? "Role Ready" : score >= 60 ? "Competitive" : "Needs Strengthening"}
          </div>
        </div>

        {/* Score Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Score Breakdown
          </h4>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {platform === "github" && (
              <>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Role Relevance</span>
                    <span>{breakdown.roleRelevance || 0} / 30</span>
                  </div>
                  <Progress value={((breakdown.roleRelevance || 0) / 30) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Skill Evidence</span>
                    <span>{breakdown.skillEvidence || 0} / 30</span>
                  </div>
                  <Progress value={((breakdown.skillEvidence || 0) / 30) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Project Quality</span>
                    <span>{breakdown.projectQuality || 0} / 20</span>
                  </div>
                  <Progress value={((breakdown.projectQuality || 0) / 20) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Activity & Recency</span>
                    <span>{breakdown.activity || 0} / 10</span>
                  </div>
                  <Progress value={((breakdown.activity || 0) / 10) * 100} className="h-1.5" />
                </div>
              </>
            )}

            {platform === "linkedin" && (
              <>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Role Alignment</span>
                    <span>{breakdown.roleAlignment || 0} / 30</span>
                  </div>
                  <Progress value={((breakdown.roleAlignment || 0) / 30) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Skill Coverage</span>
                    <span>{breakdown.skillCoverage || 0} / 25</span>
                  </div>
                  <Progress value={((breakdown.skillCoverage || 0) / 25) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Experience Relevance</span>
                    <span>{breakdown.experienceRelevance || 0} / 20</span>
                  </div>
                  <Progress value={((breakdown.experienceRelevance || 0) / 20) * 100} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Achievement Quality</span>
                    <span>{breakdown.achievementQuality || 0} / 15</span>
                  </div>
                  <Progress value={((breakdown.achievementQuality || 0) / 15) * 100} className="h-1.5" />
                </div>
              </>
            )}

            {platform === "overall" && (
              <>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Resume Contribution (50%)</span>
                    <span>{data.resumeScore || 0}/100</span>
                  </div>
                  <Progress value={data.resumeScore || 0} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>GitHub Evidence (25%)</span>
                    <span>{data.githubScore !== null ? `${data.githubScore}/100` : "Not linked"}</span>
                  </div>
                  <Progress value={data.githubScore || 0} className="h-1.5" />
                </div>
                <div className="p-2.5 rounded-lg border bg-card space-y-1.5 col-span-full">
                  <div className="flex justify-between text-xs font-medium">
                    <span>LinkedIn Alignment (25%)</span>
                    <span>{data.linkedinScore !== null ? `${data.linkedinScore}/100` : "Not linked"}</span>
                  </div>
                  <Progress value={data.linkedinScore || 0} className="h-1.5" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Why / Strengths Section */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Why this score was given
            </h4>
            <div className="space-y-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              {strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-100">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Improvement Section */}
        {improvements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Needs improvement
            </h4>
            <div className="space-y-1.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              {improvements.map((imp, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-950 dark:text-amber-100">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span>
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Evidence Matrix (for GitHub or LinkedIn) */}
        {evidence.matchedSkills && evidence.matchedSkills.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Role Skills Evidence Matrix
            </h4>
            <div className="border rounded-lg divide-y text-xs">
              {evidence.matchedSkills.map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold">{item.skill}</span>
                    <p className="text-[11px] text-muted-foreground truncate">{item.notes}</p>
                  </div>
                  <div className="shrink-0">{getEvidenceBadge(item.level)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
