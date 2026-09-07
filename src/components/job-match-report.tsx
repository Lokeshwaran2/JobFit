"use client";

import React, { useState } from "react";
import { JobMatchResult } from "@/lib/matching/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
} from "lucide-react";

export interface JobMatchReportProps {
  jobMatch: JobMatchResult;
  roleTitle?: string;
  companyName?: string | null;
  className?: string;
}

export function JobMatchReport({
  jobMatch,
  roleTitle = "Target Role",
  companyName,
  className = "",
}: JobMatchReportProps) {
  const [showEvidence, setShowEvidence] = useState(false);

  if (!jobMatch) return null;

  const score = jobMatch.score;
  const scoreColor =
    score >= 75 ? "text-green-600 dark:text-green-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const scoreBg =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";

  const categories = [
    { label: "Required Skills", score: jobMatch.breakdown.requiredSkills, weight: jobMatch.weights.requiredSkills },
    { label: "Preferred Skills", score: jobMatch.breakdown.preferredSkills, weight: jobMatch.weights.preferredSkills },
    { label: "Experience", score: jobMatch.breakdown.experience, weight: jobMatch.weights.experience },
    { label: "Responsibilities", score: jobMatch.breakdown.responsibilities, weight: jobMatch.weights.responsibilities },
    { label: "Keyword Alignment", score: jobMatch.breakdown.keywords, weight: jobMatch.weights.keywords },
    { label: "Education", score: jobMatch.breakdown.education, weight: jobMatch.weights.education },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Overview Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Job Match Report</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Deterministic alignment analysis for {roleTitle}
                {companyName ? ` at ${companyName}` : ""} based on verified resume evidence.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto bg-muted/40 px-4 py-2 rounded-xl border border-border/50">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Job Match Score
                </div>
                <div className={`text-3xl font-extrabold ${scoreColor}`}>{score} / 100</div>
              </div>
              <div className={`h-4 w-4 rounded-full ${scoreBg} animate-pulse`} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Category Breakdown Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scoring Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {categories.map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground/90">
                      {cat.label} <span className="text-muted-foreground text-[10px]">({cat.weight}%)</span>
                    </span>
                    <span className="font-semibold">{cat.score}%</span>
                  </div>
                  <Progress value={cat.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Alignment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Matches */}
        <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-base font-semibold text-green-950 dark:text-green-100">
                Strong Matches
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Requirements supported by concrete evidence in your resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobMatch.matchedRequiredSkills.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                  Required Skills ({jobMatch.matchedRequiredSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.matchedRequiredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/40 text-xs py-0.5"
                    >
                      ✓ {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {jobMatch.matchedPreferredSkills.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                  Preferred Skills ({jobMatch.matchedPreferredSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.matchedPreferredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300/40 text-xs py-0.5"
                    >
                      ★ {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {jobMatch.matchedKeywords.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                  Key Terminology ({jobMatch.matchedKeywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.matchedKeywords.slice(0, 10).map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs py-0.5">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing Requirements & Gaps */}
        <Card className="border-rose-500/20 bg-rose-500/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <CardTitle className="text-base font-semibold text-rose-950 dark:text-rose-100">
                Identified Gaps
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Requirements not found in your current resume text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobMatch.missingRequiredSkills.length > 0 ? (
              <div>
                <div className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-1.5">
                  Missing Required Skills ({jobMatch.missingRequiredSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.missingRequiredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="destructive"
                      className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300/40 text-xs py-0.5 font-normal"
                    >
                      ✕ {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> All required skills matched!
              </div>
            )}

            {jobMatch.missingPreferredSkills.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1.5">
                  Preferred Gaps ({jobMatch.missingPreferredSkills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.missingPreferredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/40 text-xs py-0.5 font-normal"
                    >
                      △ {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {jobMatch.missingKeywords.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                  Unmatched Keywords ({jobMatch.missingKeywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.missingKeywords.slice(0, 8).map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs py-0.5 text-muted-foreground">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Experience Assessment Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Experience Assessment</CardTitle>
            </div>
            {jobMatch.experienceAssessment.meetsMinimum === true ? (
              <Badge className="bg-green-600 text-white text-xs">Meets Requirement</Badge>
            ) : jobMatch.experienceAssessment.meetsMinimum === false ? (
              <Badge variant="destructive" className="text-xs">Duration Shortfall</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Unspecified in JD</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90">
            {jobMatch.experienceAssessment.summary}
          </p>
        </CardContent>
      </Card>

      {/* Actionable Recommendations */}
      {jobMatch.recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-semibold">Actionable Recommendations</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Direct steps to strengthen your resume alignment for this specific role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground/90">
              {jobMatch.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Expandable Traceable Evidence */}
      {jobMatch.evidence && jobMatch.evidence.length > 0 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full justify-between text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {showEvidence ? "Hide Resume Evidence Citations" : "View Resume Evidence Citations"}
            </span>
            {showEvidence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showEvidence && (
            <Card className="mt-3 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Traceable Match Evidence</CardTitle>
                <CardDescription className="text-xs">
                  Every match is traced directly to content verified in your resume.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs max-h-96 overflow-y-auto">
                {jobMatch.evidence
                  .filter((e) => e.status === "matched" && e.evidence.length > 0)
                  .map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-muted/40 border border-border/40 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{ev.requirement}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {ev.category} • {ev.confidence} confidence
                        </Badge>
                      </div>
                      <div className="text-muted-foreground space-y-0.5">
                        {ev.evidence.map((snippet, sIdx) => (
                          <p key={sIdx} className="italic">
                            ↳ {snippet}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
