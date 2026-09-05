"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight, Github, Linkedin, History, Clock } from "lucide-react";
import { ProfileScoreCheckDialog } from "./profile-score-check-dialog";
import { ProfileCheckResult } from "@/lib/profile-scoring/types";

export function ProfileScoreCheckCard() {
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
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
          <Target className="h-28 w-28 text-indigo-600" />
        </div>

        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  How strong is your profile for your next role?
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground max-w-xl">
                Check how well your GitHub and LinkedIn profiles match a specific job description or target engineering role.
              </CardDescription>
            </div>

            <Button
              onClick={handleNewCheck}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shrink-0 gap-2 h-10 px-5"
            >
              <Target className="h-4 w-4" /> Check My Profile Score
            </Button>
          </div>
        </CardHeader>

        {/* 13. ANALYSIS HISTORY: Recent Profile Checks */}
        {recentChecks.length > 0 && (
          <CardContent className="px-6 pb-6 pt-2">
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Recent Profile Checks
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {recentChecks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenCheck(item)}
                    className="p-3 rounded-lg border bg-card/70 hover:bg-card hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-2xs group"
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
          </CardContent>
        )}
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
