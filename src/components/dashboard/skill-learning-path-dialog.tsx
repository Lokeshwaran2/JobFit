"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles,
  Trophy,
  History,
  Check,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { StructuredLearningPath, LearningStep, LearningResource } from "@/lib/skills/learning-path-service";

interface SkillLearningPathDialogProps {
  skillName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export function SkillLearningPathDialog({
  skillName,
  isOpen,
  onClose,
  onProgressUpdated,
}: SkillLearningPathDialogProps) {
  const [loading, setLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<StructuredLearningPath | null>(null);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all");

  useEffect(() => {
    if (!skillName || !isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/skills/gaps/${encodeURIComponent(skillName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load skill details");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data) {
          setLearningPath(data.data.learningPath);
          setOccurrences(data.data.occurrences || []);
          setGapData(data.data.gap || null);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load learning path");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [skillName, isOpen]);

  const handleStepStatusToggle = async (step: LearningStep) => {
    if (!skillName) return;

    const nextStatusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
      not_started: "in_progress",
      in_progress: "completed",
      completed: "not_started",
    };

    const current = step.status || "not_started";
    const nextStatus = nextStatusMap[current];

    // Optimistic UI update
    setUpdatingStepId(step.id);
    if (learningPath) {
      const updateStepInList = (list: LearningStep[]) =>
        list.map((s) => (s.id === step.id ? { ...s, status: nextStatus } : s));

      const updatedStages = {
        beginner: updateStepInList(learningPath.stages.beginner),
        intermediate: updateStepInList(learningPath.stages.intermediate),
        advanced: updateStepInList(learningPath.stages.advanced),
        implementation: updateStepInList(learningPath.stages.implementation),
      };

      const allSteps = [
        ...updatedStages.beginner,
        ...updatedStages.intermediate,
        ...updatedStages.advanced,
        ...updatedStages.implementation,
      ];
      const completedCount = allSteps.filter((s) => s.status === "completed").length;
      const progressPercentage = Math.round((completedCount / allSteps.length) * 100);

      setLearningPath({
        ...learningPath,
        stages: updatedStages,
        completedStepsCount: completedCount,
        progressPercentage,
      });
    }

    try {
      const res = await fetch("/api/skills/learning-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: skillName,
          stepId: step.id,
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save progress");
      }

      if (onProgressUpdated) {
        onProgressUpdated();
      }

      if (nextStatus === "completed") {
        toast.success(`Completed: ${step.title}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update step status");
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleMarkAsAcquired = async () => {
    if (!skillName) return;

    setIsAcquiring(true);
    try {
      const res = await fetch("/api/skills/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: skillName }),
      });

      if (!res.ok) throw new Error("Failed to mark as acquired");

      const data = await res.json();
      if (data.success) {
        toast.success(`Marked ${skillName} as Acquired in your profile!`);
        setGapData((prev: any) => ({ ...prev, status: "acquired" }));
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || "Could not mark skill as acquired");
    } finally {
      setIsAcquiring(false);
    }
  };

  const renderStepItem = (step: LearningStep) => {
    const status = step.status || "not_started";
    const isUpdating = updatingStepId === step.id;

    return (
      <div
        key={step.id}
        onClick={() => !isUpdating && handleStepStatusToggle(step)}
        className={`group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
          status === "completed"
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm"
            : status === "in_progress"
            ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-sm"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
        }`}
      >
        <button
          type="button"
          className="mt-0.5 shrink-0 focus:outline-none"
          title={`Status: ${status}. Click to cycle: Not Started → In Progress → Completed`}
        >
          {isUpdating ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : status === "in_progress" ? (
            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400 dark:text-slate-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-sm font-semibold leading-tight ${
                status === "completed"
                  ? "line-through text-slate-500 dark:text-slate-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {step.title}
            </h4>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase tracking-wider font-semibold shrink-0 ${
                status === "completed"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                  : status === "in_progress"
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    );
  };

  const isAcquired = gapData?.status === "acquired";
  const progressPct = learningPath?.progressPercentage ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[88vh] max-h-[850px] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {learningPath?.skill || skillName}
                </DialogTitle>
                {isAcquired ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <Check className="h-3 w-3 mr-1" /> Acquired in Profile
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-semibold text-xs">
                    Target Skill Gap
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {gapData?.missingCount
                  ? `Extracted from ${gapData.missingCount} target job application${
                      gapData.missingCount > 1 ? "s" : ""
                    }`
                  : "Customized step-by-step mastery curriculum"}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {!isAcquired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsAcquired}
                  disabled={isAcquiring}
                  className="text-xs border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                >
                  {isAcquiring ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trophy className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  Mark as Acquired
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar & Milestones */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <span>Learning Progress</span>
                <span className="text-[11px] font-semibold text-primary">
                  ({progressPct === 100 ? "Mastered 🎉" : progressPct >= 50 ? "Advanced Mastery" : progressPct > 0 ? "In Progress" : "Not Started"})
                </span>
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {progressPct}% Complete ({learningPath?.completedStepsCount ?? 0}/{learningPath?.totalSteps ?? 0} steps)
              </span>
            </div>
            <Progress value={progressPct} className="h-2 rounded-full" />
          </div>
        </DialogHeader>

        {/* Modal Body with Guaranteed Scroll Container */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Generating customized learning curriculum...</p>
          </div>
        ) : (
          <Tabs defaultValue="roadmap" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Navigation */}
            <div className="px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
              <TabsList className="h-11 bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="roadmap"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 text-xs font-semibold data-[state=active]:text-primary"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Learning Roadmap
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 text-xs font-semibold data-[state=active]:text-primary"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Free Resources ({learningPath?.resources.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 text-xs font-semibold data-[state=active]:text-primary"
                >
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Job Applications ({occurrences.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Guaranteed Smooth Scroll Area */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 overscroll-contain">
              {/* TAB 1: ROADMAP */}
              <TabsContent value="roadmap" className="m-0 space-y-6 focus-visible:outline-none">
                {/* Why It Matters Callout */}
                {learningPath?.whyItMatters && (
                  <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-200 mb-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Why This Skill Matters for Hiring Managers</span>
                    </div>
                    <p className="text-blue-900/90 dark:text-blue-300 leading-relaxed">
                      {learningPath.whyItMatters}
                    </p>
                  </div>
                )}

                {/* Stage Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filter:
                  </span>
                  {[
                    { id: "all", label: "All Stages" },
                    { id: "beginner", label: "Stage 1: Beginner" },
                    { id: "intermediate", label: "Stage 2: Core" },
                    { id: "advanced", label: "Stage 3: Advanced" },
                    { id: "project", label: "Stage 4: Project" },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => setActiveStageFilter(pill.id)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                        activeStageFilter === pill.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Beginner Stage */}
                {(activeStageFilter === "all" || activeStageFilter === "beginner") &&
                  learningPath?.stages.beginner &&
                  learningPath.stages.beginner.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Stage 1: Foundations & Prerequisites
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">~1-2 Weeks</span>
                      </div>
                      <div className="space-y-2.5">
                        {learningPath.stages.beginner.map(renderStepItem)}
                      </div>
                    </div>
                  )}

                {/* Intermediate Stage */}
                {(activeStageFilter === "all" || activeStageFilter === "intermediate") &&
                  learningPath?.stages.intermediate &&
                  learningPath.stages.intermediate.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Stage 2: Core Architecture & Industry Patterns
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">~2-3 Weeks</span>
                      </div>
                      <div className="space-y-2.5">
                        {learningPath.stages.intermediate.map(renderStepItem)}
                      </div>
                    </div>
                  )}

                {/* Advanced Stage */}
                {(activeStageFilter === "all" || activeStageFilter === "advanced") &&
                  learningPath?.stages.advanced &&
                  learningPath.stages.advanced.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Stage 3: Advanced Optimization & Production Scale
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">~2 Weeks</span>
                      </div>
                      <div className="space-y-2.5">
                        {learningPath.stages.advanced.map(renderStepItem)}
                      </div>
                    </div>
                  )}

                {/* Practical Projects / Implementation */}
                {(activeStageFilter === "all" || activeStageFilter === "project") &&
                  learningPath?.stages.implementation &&
                  learningPath.stages.implementation.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Stage 4: Hands-on Portfolio Implementation
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Capstone Project</span>
                      </div>
                      <div className="space-y-2.5">
                        {learningPath.stages.implementation.map(renderStepItem)}
                      </div>
                    </div>
                  )}
              </TabsContent>

              {/* TAB 2: RESOURCES */}
              <TabsContent value="resources" className="m-0 space-y-4 focus-visible:outline-none">
                <div className="text-xs text-slate-500">
                  Authoritative, genuinely free tutorials, documentation, and practice platforms curated for {skillName}:
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {learningPath?.resources.map((res: LearningResource) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors flex items-center gap-1.5 leading-snug">
                            {res.title}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Provider: <span className="font-medium text-slate-700 dark:text-slate-300">{res.provider}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 capitalize font-medium">
                          {res.resourceType}
                        </Badge>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                          100% Free
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 3: APPLICATIONS HISTORY */}
              <TabsContent value="history" className="m-0 space-y-3 focus-visible:outline-none">
                <div className="text-xs text-slate-500">
                  Target job descriptions where {skillName} was detected as a required qualification:
                </div>

                {occurrences.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <p className="text-xs italic">No historical application occurrences recorded yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden shadow-xs">
                    {occurrences.map((occ) => (
                      <div key={occ.id} className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between text-xs hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {occ.jobTitle || occ.resume?.title || "Target Job Application"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {occ.originalSkill ? `Extracted from JD as "${occ.originalSkill}"` : "Extracted as required qualification"}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-3">
                          {new Date(occ.detectedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
