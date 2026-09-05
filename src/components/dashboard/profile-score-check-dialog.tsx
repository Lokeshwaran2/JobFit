"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Github,
  Linkedin,
  Target,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  BookOpen,
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Layers,
  GraduationCap,
} from "lucide-react";
import { ProfileCheckResult, SkillMatrixRow, EvidenceLevel } from "@/lib/profile-scoring/types";
import { toast } from "sonner";
import Link from "next/link";

interface ProfileScoreCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialResult?: ProfileCheckResult | null;
  onSuccess?: () => void;
}

export function ProfileScoreCheckDialog({
  open,
  onOpenChange,
  initialResult,
  onSuccess,
}: ProfileScoreCheckDialogProps) {
  const [activeTab, setActiveTab] = useState<"jd" | "role">("jd");
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [result, setResult] = useState<ProfileCheckResult | null>(initialResult || null);

  // Sync initialResult when provided (e.g. clicking from Recent Checks list)
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const currentResult = initialResult || result;

  const handleAnalyze = async () => {
    if (activeTab === "jd" && !jobDescription.trim()) {
      toast.error("Please paste a job description.");
      return;
    }
    if (activeTab === "role" && !role.trim()) {
      toast.error("Please enter a target role.");
      return;
    }

    setLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await fetch("/api/profile-score/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: activeTab,
          jobDescription: activeTab === "jd" ? jobDescription : undefined,
          role: activeTab === "role" ? role : undefined,
          company: activeTab === "role" ? company : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete profile analysis.");
      }

      setResult(data);
      toast.success("Profile analysis completed!");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze profile.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const getEvidenceBadge = (level: EvidenceLevel) => {
    switch (level) {
      case "Strong":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Strong</Badge>;
      case "Moderate":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Moderate</Badge>;
      case "Weak":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Weak</Badge>;
      case "None":
      default:
        return <Badge variant="outline" className="text-muted-foreground text-xs">None</Badge>;
    }
  };

  const getStatusIcon = (status: SkillMatrixRow["status"]) => {
    switch (status) {
      case "match":
        return (
          <span title="Demonstrated Match">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </span>
        );
      case "partial":
        return (
          <span title="Partial Evidence">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </span>
        );
      case "gap":
      default:
        return (
          <span title="Missing Gap">
            <XCircle className="h-4 w-4 text-rose-500" />
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Target className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Profile Strength Analyzer</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Evaluate your public GitHub repositories and LinkedIn profile presence against any target job.
          </DialogDescription>
        </DialogHeader>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
              <Target className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-semibold">Analyzing Your Profile Match...</h3>
              <div className="space-y-1.5 text-xs text-left text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 1 ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>Extracting target role and required skills</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 2 ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>Analyzing GitHub code repositories & tech stack</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 3 ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>Evaluating LinkedIn experience and role alignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 4 ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>Generating Skill Match Matrix & learning recommendations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INPUT MODE (When no result or user wants to re-check) */}
        {!loading && !currentResult && (
          <div className="space-y-5 pt-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "jd" | "role")} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="jd" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Option A: Job Description
                </TabsTrigger>
                <TabsTrigger value="role" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Option B: Role + Company
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Job Description */}
              <TabsContent value="jd" className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="jd-textarea">Target Job Description</Label>
                  <Textarea
                    id="jd-textarea"
                    placeholder="Paste the full job description here (responsibilities, required skills, preferred qualifications)..."
                    className="min-h-[160px] text-sm"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We automatically extract technologies, core responsibilities, and seniority level to match against your profiles.
                  </p>
                </div>
              </TabsContent>

              {/* TAB 2: Role + Company */}
              <TabsContent value="role" className="space-y-4 pt-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="role-input" className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Target Role Title
                    </Label>
                    <Input
                      id="role-input"
                      placeholder="e.g. Backend Software Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company-input" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Company (Optional)
                    </Label>
                    <Input
                      id="company-input"
                      placeholder="e.g. Stripe, Google, or Startup"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border">
                  <strong>Note:</strong> We analyze your profiles using established industry standards for <em>{role || "your target role"}</em> without fabricating a job description.
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Target className="h-4 w-4" /> Analyze Profile
              </Button>
            </div>
          </div>
        )}

        {/* RESULTS MODE */}
        {!loading && currentResult && (
          <div className="space-y-6 pt-1">
            {/* Target Header */}
            <div className="p-4 rounded-xl border bg-gradient-to-r from-indigo-50/60 via-background to-background dark:from-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Target Match Analysis
                </div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {currentResult.target.role}
                  {currentResult.target.company && (
                    <span className="text-sm font-normal text-muted-foreground">
                      at {currentResult.target.company}
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Based on {currentResult.target.sourceType === "jd" ? "Provided Job Description" : "Standard Role Profile"}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setResult(null);
                }}
              >
                Analyze Another Job
              </Button>
            </div>

            {/* Scores Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Overall */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-center space-y-1">
                <div className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold uppercase tracking-wider">
                  Overall Profile Score
                </div>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {currentResult.overall}/100
                </div>
                <Progress value={currentResult.overall} className="h-1.5" />
              </div>

              {/* GitHub */}
              <div className="p-4 rounded-xl border bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <Github className="h-3.5 w-3.5" /> GitHub Score
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {currentResult.github.score !== null ? `${currentResult.github.score}/100` : "Not Linked"}
                </div>
                <Progress value={currentResult.github.score || 0} className="h-1.5" />
                {currentResult.github.reposAnalyzed !== undefined && (
                  <p className="text-[10px] text-muted-foreground">{currentResult.github.reposAnalyzed} repositories analyzed</p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="p-4 rounded-xl border bg-card text-center space-y-1">
                <div className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn Score
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {currentResult.linkedin.score !== null ? `${currentResult.linkedin.score}/100` : "Not Linked"}
                </div>
                <Progress value={currentResult.linkedin.score || 0} className="h-1.5" />
              </div>
            </div>

            {/* 9. SKILL MATCH MATRIX */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" /> Skill Match Matrix
              </h4>
              <div className="border rounded-xl overflow-hidden bg-card text-xs">
                <div className="grid grid-cols-12 bg-muted/60 p-2.5 font-semibold text-muted-foreground border-b text-[11px] uppercase tracking-wider">
                  <div className="col-span-4">Skill</div>
                  <div className="col-span-2">Requirement</div>
                  <div className="col-span-2">GitHub</div>
                  <div className="col-span-2">LinkedIn</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>
                <div className="divide-y max-h-[260px] overflow-y-auto">
                  {currentResult.skills.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 p-2.5 items-center hover:bg-muted/20 transition-colors">
                      <div className="col-span-4 font-semibold text-foreground">{row.skill}</div>
                      <div className="col-span-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${row.requirement === "Required" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                          {row.requirement}
                        </span>
                      </div>
                      <div className="col-span-2">{getEvidenceBadge(row.github)}</div>
                      <div className="col-span-2">{getEvidenceBadge(row.linkedin)}</div>
                      <div className="col-span-2 flex justify-center">{getStatusIcon(row.status)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STRENGTHS & WEAKNESSES */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <h5 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Strengths
                </h5>
                <ul className="space-y-1 text-emerald-950 dark:text-emerald-100">
                  {currentResult.github.strengths.slice(0, 2).map((s, idx) => (
                    <li key={idx}>✓ {s}</li>
                  ))}
                  {currentResult.linkedin.strengths.slice(0, 2).map((s, idx) => (
                    <li key={idx}>✓ {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <h5 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Weaknesses / Gaps
                </h5>
                <ul className="space-y-1 text-amber-950 dark:text-amber-100">
                  {currentResult.github.weaknesses.slice(0, 2).map((w, idx) => (
                    <li key={idx}>⚠ {w}</li>
                  ))}
                  {currentResult.linkedin.weaknesses.slice(0, 2).map((w, idx) => (
                    <li key={idx}>⚠ {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 10. ACTIONABLE RECOMMENDATIONS */}
            {currentResult.recommendations && currentResult.recommendations.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ListChecks className="h-4 w-4 text-indigo-600" /> Highest Priority Recommendations
                </h4>
                <div className="space-y-2">
                  {currentResult.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-card text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{i + 1}. {rec.title}</span>
                        <Badge variant="outline" className={`text-[10px] ${rec.priority === "High" ? "border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30" : "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30"}`}>
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{rec.description}</p>
                      {rec.actions && rec.actions.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                          {rec.actions.map((act, actIdx) => (
                            <li key={actIdx}>{act}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. TOP SKILLS TO LEARN (TASK 1 INTEGRATION) */}
            {currentResult.topSkillsToLearn && currentResult.topSkillsToLearn.length > 0 && (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-100">
                      Your Top Learning Priorities
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Updated in Skill Gap Tracker</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {currentResult.topSkillsToLearn.map((gap, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border bg-background flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold">{gap.canonicalSkill}</span>
                        <p className="text-[11px] text-muted-foreground">Missing in {gap.missingCount} job checks</p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 gap-1 px-2 font-medium">
                        <Link href="/dashboard" onClick={() => onOpenChange(false)}>
                          View Path <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
