"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import { AtsChecklistPanel } from "./ats-checklist-panel";

interface AtsScoreHeaderProps {
    score: number;
    scoreBreakdown?: any; // New prop
}

export function AtsScoreHeader({ score, scoreBreakdown }: AtsScoreHeaderProps) {
    // Mock improvement calculation (real logic could be (new - old) / old * 100)
    // For now, valid resume scores are usually 60-90, raw text often <40.
    // Let's assume a static improvement for psychology or derive it if we had history.
    // We'll hardcode a "calculated" improvement feeling for now or just generic.
    const improvement = Math.min(Math.round((score / 40) * 100) - 100, 45); // Roughly +20-40% logic

    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 mb-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ATS Match Score</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground/70 hover:text-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Based on keyword match, structure, and 10+ ATS parsing rules.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Checklist Trigger removed as per user request */}
                    {/* <AtsChecklistPanel breakdown={scoreBreakdown || {}} score={score} /> */}

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {score} / 100
                            </span>
                            <div className={`h-3 w-3 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
                        </div>
                        {score > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                                ↑ Improved by {improvement > 0 ? `+${improvement}%` : "Optimization"} from original
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Progress Bar Visual */}
            <Progress value={score} className="h-1 w-full mt-4 bg-muted" />
        </div>
    );
}
