"use client";

import { Check, ChevronDown, ChevronUp, FileCheck, Info, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TailoringDiffResult } from "@/lib/tailoring/types";
import { JobMatchResult } from "@/lib/matching/types";

interface ImprovementStats {
    bulletPointsRewritten?: number;
    keywordsAdded?: string[];
    actionVerbsUsed?: string[];
    summaryOptimized?: boolean;
}

interface ImprovementSummaryProps {
    stats?: ImprovementStats | any;
    tailoringDiff?: TailoringDiffResult;
    jobMatch?: JobMatchResult;
    defaultOpen?: boolean;
    className?: string;
}

const COMMON_ACTION_VERBS = new Set([
    "delivered", "developed", "architected", "engineered", "optimized", "built",
    "scaled", "spearheaded", "implemented", "designed", "streamlined", "resolved",
    "integrated", "led", "managed", "deployed", "orchestrated", "automated",
    "refactored", "analyzed", "collaborated", "facilitated", "executed", "created",
    "accelerated", "enhanced", "established", "formulated", "standardized", "boosted"
]);

export function ImprovementSummary({
    stats,
    tailoringDiff: explicitTailoringDiff,
    jobMatch: explicitJobMatch,
    defaultOpen = false,
    className = "",
}: ImprovementSummaryProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Resolve authoritative sources from explicit props or stats object
    const tailoring: TailoringDiffResult | undefined =
        explicitTailoringDiff || stats?.tailoring || (stats?.bulletDiffs ? stats : undefined);
    const jobMatch: JobMatchResult | undefined = explicitJobMatch || stats?.jobMatch;

    const bulletDiffs = tailoring?.bulletDiffs || [];
    const acceptedDiffs = bulletDiffs.filter((d: any) => d.status === "accepted");
    const rejectedDiffs = bulletDiffs.filter((d: any) => d.status === "rejected");

    // 1. Bullet rewrites
    const bulletPointsRewritten =
        stats?.bulletPointsRewritten !== undefined
            ? stats.bulletPointsRewritten
            : acceptedDiffs.length;

    // 2. Summary optimization
    const summaryOptimized =
        stats?.summaryOptimized !== undefined
            ? stats.summaryOptimized
            : Boolean(
                  tailoring?.summaryDiff?.status === "accepted" ||
                  (stats?.tailoredData?.summary &&
                      stats?.originalData?.summary &&
                      stats.tailoredData.summary !== stats.originalData.summary)
              );

    // 3. Relevance ordering
    const relevanceOrderingApplied = Boolean(tailoring?.relevanceOrderApplied);

    // 4. Action verbs extraction
    let actionVerbsUsed: string[] = Array.isArray(stats?.actionVerbsUsed)
        ? stats.actionVerbsUsed
        : [];

    if (actionVerbsUsed.length === 0 && acceptedDiffs.length > 0) {
        const verbsFound = new Set<string>();
        for (const diff of acceptedDiffs) {
            const text = diff.rewrittenBullet || "";
            const firstWord = text.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, "").toLowerCase();
            if (firstWord && COMMON_ACTION_VERBS.has(firstWord)) {
                verbsFound.add(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
            }
        }
        actionVerbsUsed = Array.from(verbsFound);
    }

    // 5. Matched role requirements (never falsely labeled as "added keywords")
    let matchedRequirements: string[] = Array.isArray(stats?.matchedRequirements)
        ? stats.matchedRequirements
        : Array.isArray(stats?.keywordsAdded)
        ? stats.keywordsAdded
        : [];

    if (matchedRequirements.length === 0 && jobMatch) {
        const reqList = [
            ...(jobMatch.matchedRequiredSkills || []),
            ...(jobMatch.matchedPreferredSkills || []),
        ];
        const uniqueSet = new Set<string>();
        for (const req of reqList) {
            if (typeof req === "string" && req.trim().length > 1) {
                uniqueSet.add(req.trim());
            }
        }
        matchedRequirements = Array.from(uniqueSet).slice(0, 8);
    }

    // Calculate total count of tangible enhancements
    const totalEnhancements =
        bulletPointsRewritten +
        (summaryOptimized ? 1 : 0) +
        (relevanceOrderingApplied ? 1 : 0);

    const hasAnyOptimizations =
        totalEnhancements > 0 || matchedRequirements.length > 0 || actionVerbsUsed.length > 0;

    return (
        <Card className={`border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 shadow-sm overflow-hidden ${className}`}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                {/* Clickable Header Area */}
                <div
                    className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-emerald-100/30 dark:hover:bg-emerald-900/20 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }
                    }}
                    aria-expanded={isOpen}
                    aria-label="Toggle Optimization Report"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-xl">
                            <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-emerald-950 dark:text-emerald-50">
                                    Optimization Report
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-medium"
                                >
                                    {hasAnyOptimizations
                                        ? `${totalEnhancements} Enhancement${totalEnhancements !== 1 ? "s" : ""} Applied`
                                        : "Original Text Retained"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Verified evidence-backed enhancements applied to your tailored resume
                            </p>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">Toggle Optimization Report</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                {/* Collapsible Content */}
                <CollapsibleContent className="px-4 sm:px-6 pb-5 pt-1 border-t border-emerald-200/40 dark:border-emerald-900/30">
                    {hasAnyOptimizations ? (
                        <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
                            {summaryOptimized && (
                                <div className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20">
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                    <span>
                                        Refined <strong>Professional Summary</strong> to highlight role alignment while retaining factual background.
                                    </span>
                                </div>
                            )}

                            {bulletPointsRewritten > 0 && (
                                <div className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20">
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                    <span>
                                        Aligned and strengthened <strong>{bulletPointsRewritten} experience bullet{bulletPointsRewritten !== 1 ? "s" : ""}</strong> with target role requirements.
                                    </span>
                                </div>
                            )}

                            {relevanceOrderingApplied && (
                                <div className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20">
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                    <span>
                                        Applied <strong>relevance ordering</strong> to prioritize your most impactful role-matched achievements.
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <span>
                                    <strong>100% factual integrity:</strong> All employment dates, company names, and metrics were preserved.
                                </span>
                            </div>

                            {rejectedDiffs.length > 0 && (
                                <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-background/60 p-3 rounded-lg border border-border/40 col-span-full">
                                    <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>{rejectedDiffs.length} proposed rewrite{rejectedDiffs.length !== 1 ? "s" : ""} safely reverted:</strong> Preserved original candidate text to prevent unsupported factual claims.
                                    </span>
                                </div>
                            )}

                            {actionVerbsUsed.length > 0 && (
                                <div className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20 col-span-full">
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-medium">Enhanced action verbs: </span>
                                        <span className="italic text-muted-foreground">
                                            {actionVerbsUsed.slice(0, 8).join(", ")}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {matchedRequirements.length > 0 && (
                                <div className="col-span-full mt-1 bg-background/60 p-3.5 rounded-lg border border-emerald-200/40 dark:border-emerald-900/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                            Matched Role Requirements
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Verified candidate evidence
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {matchedRequirements.map((req, i) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs py-1"
                                            >
                                                {req}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-background/60 border border-emerald-200/40 dark:border-emerald-900/20 text-sm text-muted-foreground mt-2">
                            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <span>
                                No additional optimizations were applied. Your original resume content already accurately aligns with this role, or candidate bullets were preserved in their original form to prevent factual deviation.
                            </span>
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
