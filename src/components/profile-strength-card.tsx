"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Github, Linkedin, Target, ArrowUpRight, RefreshCw, AlertCircle } from "lucide-react";
import { ProfileAnalysisDialog } from "./profile-analysis-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface ProfileStrengthCardProps {
  resumeId: string;
  targetRole?: string;
  jobDescription?: string;
  resumeScore: number;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
}

export function ProfileStrengthCard({
  resumeId,
  targetRole = "Software Engineer",
  jobDescription,
  resumeScore,
  githubUrl,
  linkedinUrl,
}: ProfileStrengthCardProps) {
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [githubResult, setGithubResult] = useState<any>(null);
  const [linkedinResult, setLinkedinResult] = useState<any>(null);
  const [overallResult, setOverallResult] = useState<any>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlatform, setDialogPlatform] = useState<"github" | "linkedin" | "overall">("github");

  // Fetch or trigger analysis
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile-score/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          targetJobDesc: jobDescription,
          role: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze profile strength.");
      }

      setGithubResult(data.githubResult);
      setLinkedinResult(data.linkedinResult);
      setOverallResult(data.overallResult);
      setAnalyzed(true);
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      toast.error(err.message || "Failed to calculate profile scores.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load: check for existing persisted score
  useEffect(() => {
    let isMounted = true;
    async function fetchScores() {
      try {
        const res = await fetch(`/api/profile-score/${resumeId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.latest && Object.keys(json.latest).length > 0 && isMounted) {
            setGithubResult(json.latest.github || null);
            setLinkedinResult(json.latest.linkedin || null);
            setOverallResult(json.latest.overall || null);
            setAnalyzed(true);
            return;
          }
        }
        // If not analyzed yet and profile links exist, automatically run first analysis
        if (isMounted && (githubUrl || linkedinUrl) && jobDescription) {
          runAnalysis();
        }
      } catch {
        // silent fallback
      }
    }

    fetchScores();
    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  const hasJD = !!(jobDescription && jobDescription.trim().length > 10);

  const openDialog = (platform: "github" | "linkedin" | "overall") => {
    setDialogPlatform(platform);
    setDialogOpen(true);
  };

  const getActiveDialogData = () => {
    if (dialogPlatform === "github") return githubResult;
    if (dialogPlatform === "linkedin") return linkedinResult;
    return overallResult;
  };

  return (
    <>
      <Card className="mb-4 border-indigo-500/20 bg-gradient-to-br from-indigo-50/40 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Profile Strength for This Role
            </CardTitle>
            <CardDescription className="text-xs">
              Contextual assessment tailored to: <strong className="text-foreground">{targetRole}</strong>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={runAnalysis}
              disabled={loading || !hasJD}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Evaluating..." : "Recalculate"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasJD ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Role-specific scoring requires a job description or target role.</span>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Resume Match Score */}
              <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Resume Match</span>
                  <span className="font-bold text-foreground">{resumeScore}/100</span>
                </div>
                <Progress value={resumeScore} className="h-2" />
                <p className="text-[11px] text-muted-foreground">ATS keyword & metric match</p>
              </div>

              {/* 2. GitHub Role Score */}
              <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </span>
                  <span className="font-bold text-foreground">
                    {githubResult ? `${githubResult.score}/100` : githubUrl ? "Pending" : "Not Linked"}
                  </span>
                </div>
                <Progress
                  value={githubResult?.score || 0}
                  className={`h-2 ${!githubUrl ? "opacity-30" : ""}`}
                />
                <div className="flex items-center justify-between">
                  {githubResult ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-1 text-primary hover:text-primary/80 font-medium"
                      onClick={() => openDialog("github")}
                    >
                      View Analysis <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  ) : githubUrl ? (
                    <span className="text-[11px] text-muted-foreground">Evaluating repos...</span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="text-[11px] text-primary hover:underline"
                    >
                      + Add GitHub Profile
                    </Link>
                  )}
                </div>
              </div>

              {/* 3. LinkedIn Role Score */}
              <div className="p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn
                  </span>
                  <span className="font-bold text-foreground">
                    {linkedinResult ? `${linkedinResult.score}/100` : linkedinUrl ? "Pending" : "Not Linked"}
                  </span>
                </div>
                <Progress
                  value={linkedinResult?.score || 0}
                  className={`h-2 ${!linkedinUrl ? "opacity-30" : ""}`}
                />
                <div className="flex items-center justify-between">
                  {linkedinResult ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-1 text-primary hover:text-primary/80 font-medium"
                      onClick={() => openDialog("linkedin")}
                    >
                      View Analysis <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  ) : linkedinUrl ? (
                    <span className="text-[11px] text-muted-foreground">Evaluating role alignment...</span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="text-[11px] text-primary hover:underline"
                    >
                      + Add LinkedIn Profile
                    </Link>
                  )}
                </div>
              </div>

              {/* 4. Overall Profile Score */}
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-950 dark:text-indigo-200">Overall Profile</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {overallResult ? `${overallResult.score}/100` : `${resumeScore}/100`}
                  </span>
                </div>
                <Progress
                  value={overallResult?.score || resumeScore}
                  className="h-2 bg-indigo-200/60 dark:bg-indigo-900/60"
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    onClick={() => openDialog("overall")}
                  >
                    Combined Analysis <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProfileAnalysisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={dialogPlatform}
        data={getActiveDialogData()}
        targetRole={targetRole}
      />
    </>
  );
}
