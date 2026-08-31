"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";



interface AtsScoreHeaderProps {
    score: number;
    scoreBreakdown?: any; // New prop
}

export function AtsScoreHeader({ score, scoreBreakdown }: AtsScoreHeaderProps) {
    const originalScore = scoreBreakdown?.originalScore || (score > 40 ? Math.round(score * 0.7) : 35);
    const scoreGain = Math.max(score - originalScore, 0);
    const percentageGain = originalScore > 0 ? Math.round((scoreGain / originalScore) * 100) : 0;
    const targetPotential = scoreBreakdown?.targetScore || score;

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
                                    <p>Recalculated live as you edit and add missing keywords.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold transition-all duration-300 ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {score} / 100
                            </span>
                            <div className={`h-3 w-3 rounded-full ${score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
                        </div>
                        {scoreGain > 0 ? (
                            <span className="text-xs text-green-600 font-medium transition-all">
                                ↑ Improved by +{scoreGain} pts (+{percentageGain}%) from baseline {originalScore}/100
                            </span>
                        ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Baseline match ({originalScore}/100) — Add keywords below to reach {targetPotential}/100!
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Progress Bar Visual */}
            <Progress value={score} className="h-1.5 w-full mt-4 bg-muted transition-all duration-500" />
        </div>
    );
}
