"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Target, Github, Linkedin, History, Clock, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { ProfileScoreCheckDialog } from "./profile-score-check-dialog";
import { ProfileCheckResult } from "@/lib/profile-scoring/types";

export function ProfileScoreCheckCard() {
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recentChecks, setRecentChecks] = useState<any[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<ProfileCheckResult | null>(null);

  const fetchRecentChecks = async () => {
    try {
      const res = await fetch("/api/profile-score/check?limit=3");
      if (res.ok) {
        const data = await res.json();
        if (data.checks && Array.isArray(data.checks)) {
          setRecentChecks(data.checks);
        }
      }
    } catch (err) {
      console.error("Failed to load recent profile checks:", err);
    }
  };

  useEffect(() => {
    fetchRecentChecks();
  }, []);

  const handleOpenCheck = (check: any) => {
    const formattedResult: ProfileCheckResult = {
      id: check.id,
      target: {
        role: check.role,
        company: check.company || undefined,
        sourceType: check.inputType || "role",
      },
      github: {
        score: check.githubScore,
        breakdown: check.breakdown?.github || {},
        strengths: check.strengths || [],
        weaknesses: check.weaknesses || [],
      },
      linkedin: {
        score: check.linkedinScore,
        breakdown: check.breakdown?.linkedin || {},
        strengths: check.strengths || [],
        weaknesses: check.weaknesses || [],
      },
      overall: check.overallScore,
      skills: check.skillMatches || [],
      recommendations: check.recommendations || [],
      topSkillsToLearn: [],
      createdAt: check.createdAt,
    };

    setSelectedCheck(formattedResult);
    setDialogOpen(true);
  };

  const handleNewCheck = () => {
    setSelectedCheck(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-indigo-500/25 bg-gradient-to-br from-indigo-50/40 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background overflow-hidden shadow-xs">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          {/* Header & Clickable Trigger Bar */}
          <div
            className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors select-none"
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
            aria-label="Toggle Profile Overview"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    Profile Overview
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium hidden sm:inline-flex bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/70"
                  >
                    How strong is your profile for your next role?
                  </Badge>
                  {recentChecks.length > 0 && !isOpen && (
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      • Latest: {recentChecks[0]?.overallScore}/100 ({recentChecks[0]?.role})
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate sm:max-w-xl">
                  Check how well your GitHub and LinkedIn profiles match target engineering roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewCheck();
                }}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 sm:h-9 px-3 sm:px-4 gap-1.5 shadow-xs"
              >
                <Target className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">Check My Profile Score</span>
                <span className="xs:hidden sm:hidden">Check</span>
              </Button>

              <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle Profile Overview</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Collapsible Content */}
          <CollapsibleContent className="border-t border-indigo-100/60 dark:border-indigo-950/60">
            <CardContent className="p-4 sm:p-5 pt-3">
              {recentChecks.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Recent Profile Checks
                    </span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {recentChecks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenCheck(item)}
                        className="p-3 rounded-lg border bg-card/80 hover:bg-card hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.role}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.company ? `${item.company}` : "Standard Role Analysis"}
                            </p>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] shrink-0 border-indigo-200">
                            {item.overallScore}/100
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 mt-2 border-t">
                          <div className="flex items-center gap-2">
                            {item.githubScore !== null && (
                              <span className="flex items-center gap-0.5">
                                <Github className="h-3 w-3" /> {item.githubScore}
                              </span>
                            )}
                            {item.linkedinScore !== null && (
                              <span className="flex items-center gap-0.5">
                                <Linkedin className="h-3 w-3 text-blue-600" /> {item.linkedinScore}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>
                      Evaluate your GitHub &amp; LinkedIn profiles against any target engineering role or job description to see your alignment score.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewCheck}
                    className="h-7 text-xs font-semibold shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                  >
                    Check Profile Score
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ProfileScoreCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialResult={selectedCheck}
        onSuccess={fetchRecentChecks}
      />
    </>
  );
}
