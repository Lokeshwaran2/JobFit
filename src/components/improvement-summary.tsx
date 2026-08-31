"use client";

import { Check, ChevronDown, ChevronUp, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImprovementStats {
    bulletPointsRewritten?: number;
    keywordsAdded?: string[];
    actionVerbsUsed?: string[];
    summaryOptimized?: boolean;
}

interface ImprovementSummaryProps {
    stats?: ImprovementStats; // Optional because old resumes won't have it
}

export function ImprovementSummary({ stats }: ImprovementSummaryProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (!stats || Object.keys(stats).length === 0) {
        return null;
    }

    const {
        bulletPointsRewritten = 0,
        keywordsAdded = [],
        actionVerbsUsed = [],
        summaryOptimized = false
    } = stats;

    return (
        <Card className="mb-4 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10">
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                            <Wand2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-950 dark:text-emerald-50">Optimization Report</h3>
                            <p className="text-xs text-muted-foreground">What AI improved in your resume</p>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-4 pb-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {summaryOptimized && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                                <span>Rewrote <strong>Professional Summary</strong> for impact</span>
                            </div>
                        )}

                        {bulletPointsRewritten > 0 && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                                <span>Optimized <strong>{bulletPointsRewritten} experience bullets</strong> with metrics</span>
                            </div>
                        )}

                        {actionVerbsUsed.length > 0 && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground col-span-full">
                                <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                                <span>
                                    Enhanced action verbs: <span className="italic">{actionVerbsUsed.slice(0, 5).join(", ")}</span>
                                </span>
                            </div>
                        )}

                        {keywordsAdded.length > 0 && (
                            <div className="col-span-full mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                        Target ATS Keywords for this Role
                                    </span>
                                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">
                                        (Add missing keywords in the Skills tab)
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {keywordsAdded.map((keyword, i) => (
                                        <Badge key={i} variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-200 dark:border-emerald-800">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
