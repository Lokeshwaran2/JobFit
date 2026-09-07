"use client";

import React, { useState } from "react";
import { TailoringDiffResult } from "@/lib/tailoring/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, CheckCircle2, ShieldAlert, Sparkles, FileText, ArrowRight } from "lucide-react";

export interface BeforeAfterDiffProps {
  tailoringDiff: TailoringDiffResult;
  className?: string;
}

export function BeforeAfterDiff({ tailoringDiff, className = "" }: BeforeAfterDiffProps) {
  const [filter, setFilter] = useState<"all" | "accepted" | "rejected">("all");

  if (!tailoringDiff || !tailoringDiff.bulletDiffs) {
    return null;
  }

  const { beforeScore, afterScore, scoreGain, bulletDiffs } = tailoringDiff;

  const filteredDiffs = bulletDiffs.filter((diff) => {
    if (filter === "accepted") return diff.status === "accepted";
    if (filter === "rejected") return diff.status === "rejected";
    return true;
  });

  const acceptedCount = bulletDiffs.filter((d) => d.status === "accepted").length;
  const rejectedCount = bulletDiffs.filter((d) => d.status === "rejected").length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">Tailoring Transparency</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Before & after comparison showing how candidate experience was authentically aligned without fabricating facts.
              </CardDescription>
            </div>

            {/* Score Comparison Badge */}
            <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-xl border border-border/50">
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Before</span>
                <span className="text-lg font-bold text-foreground">{beforeScore}/100</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-semibold text-primary block">Tailored</span>
                <span className="text-xl font-extrabold text-green-600 dark:text-green-400">
                  {afterScore}/100
                </span>
              </div>
              {scoreGain > 0 && (
                <Badge className="bg-green-600 text-white text-xs py-0.5 ml-1">
                  +{scoreGain} pts
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Factual Integrity Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="bg-background text-foreground/80 py-1">
              ✓ Source-of-Truth Grounded
            </Badge>
            <Badge variant="outline" className="bg-background text-foreground/80 py-1">
              ✓ Zero Fabricated Metrics
            </Badge>
            <Badge variant="outline" className="bg-background text-foreground/80 py-1">
              ✓ Job Titles & Dates Preserved
            </Badge>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">
              Filter:
            </span>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({bulletDiffs.length})
            </button>
            <button
              onClick={() => setFilter("accepted")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === "accepted" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Aligned ({acceptedCount})
            </button>
            {rejectedCount > 0 && (
              <button
                onClick={() => setFilter("rejected")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === "rejected" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Safety Fallbacks ({rejectedCount})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison List */}
      <div className="space-y-4">
        {filteredDiffs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No bullet rewrites match the current filter.
          </Card>
        ) : (
          filteredDiffs.map((diff, idx) => (
            <Card key={idx} className="border-border/60 shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b border-border/40 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  {diff.companyOrProjectName
                    ? `${diff.companyOrProjectName} • Bullet #${diff.bulletIndex + 1}`
                    : `Bullet #${diff.bulletIndex + 1}`}
                </span>
                {diff.status === "accepted" ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Aligned
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <ShieldAlert className="h-3 w-3" /> Safety Fallback
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* BEFORE */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Before (Original Candidate Text)
                  </span>
                  <div className="p-3 rounded-md bg-muted/40 border-l-2 border-muted-foreground/40 text-sm text-foreground/90 font-mono text-xs leading-relaxed">
                    {diff.originalBullet}
                  </div>
                </div>

                {/* ARROW */}
                <div className="flex justify-center text-muted-foreground">
                  <ArrowDown className="h-4 w-4 text-primary" />
                </div>

                {/* AFTER */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    After (Tailored Alignment)
                  </span>
                  <div className="p-3 rounded-md bg-primary/5 border-l-2 border-primary text-sm text-foreground font-mono text-xs leading-relaxed">
                    {diff.status === "accepted" ? diff.rewrittenBullet : diff.originalBullet}
                  </div>
                </div>

                {/* WHY & EVIDENCE */}
                <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-0.5">Why:</span>
                    <ul className="space-y-0.5 text-foreground/80">
                      {diff.changes.map((ch, cIdx) => (
                        <li key={cIdx}>• {ch}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-0.5">Evidence:</span>
                    <ul className="space-y-0.5 text-foreground/80">
                      {diff.evidenceUsed.map((ev, eIdx) => (
                        <li key={eIdx}>↳ {ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
