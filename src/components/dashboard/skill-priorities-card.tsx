"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame,
  Zap,
  TrendingUp,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PrioritizedSkill } from "@/lib/skills/priority-calculator";
import { SkillLearningPathDialog } from "./skill-learning-path-dialog";

export function SkillPrioritiesCard() {
  const [skills, setSkills] = useState<PrioritizedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("learning");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/skills/gaps?status=${filter}`);
      if (!res.ok) throw new Error("Failed to load skill gaps");
      const data = await res.json();
      if (data.success && Array.isArray(data.skills)) {
        setSkills(data.skills);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, [filter]);

  const handleOpenSkill = (canonicalSkill: string) => {
    setSelectedSkill(canonicalSkill);
    setIsDialogOpen(true);
  };

  // Top 3 highest frequency skills for highlight banner (exclude completed/acquired skills)
  const topHighlights = skills
    .filter((s) => s.status === "learning" && (s.progressPercentage || 0) < 100)
    .slice(0, 3);

  // Top 5 skills initially, or all if clicked more
  const displayedSkills = showAll ? skills : skills.slice(0, 5);
  const hasMore = skills.length > 5;

  return (
    <>
      <Card className="border shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Skill Learning Priorities
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Personalized learning roadmap ranked by missing frequency across your job applications.
            </CardDescription>
          </div>

          <Tabs
            value={filter}
            onValueChange={(val) => {
              setFilter(val);
              setShowAll(false);
            }}
            className="w-auto"
          >
            <TabsList className="h-8 text-xs bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="learning" className="text-xs px-2.5">
                Active Gaps
              </TabsTrigger>
              <TabsTrigger value="acquired" className="text-xs px-2.5">
                Acquired
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2.5">
                All Skills
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Top 3 Quick Highlights Banner */}
          {filter !== "acquired" && topHighlights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Your Top Skills to Learn
                </span>
                <span className="text-[11px] text-slate-400">Ranked by hiring demand</span>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {topHighlights.map((item, index) => {
                  const isTop = index === 0;
                  const isSecond = index === 1;

                  return (
                    <div
                      key={item.canonicalSkill}
                      onClick={() => handleOpenSkill(item.canonicalSkill)}
                      className="group relative p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {isTop || isSecond ? (
                            <span className="text-base" role="img" aria-label="high demand">
                              🔥
                            </span>
                          ) : (
                            <span className="text-base" role="img" aria-label="moderate demand">
                              ⚡
                            </span>
                          )}
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.canonicalSkill}
                          </h4>
                        </div>
                        <Badge
                          variant={item.priority === "High" ? "destructive" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 font-bold ${
                            item.priority === "High"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Missing in {item.frequency} job application{item.frequency > 1 ? "s" : ""}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Start Here:</span>
                        <span className="truncate">Personalized Roadmap</span>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Progress: {item.progressPercentage || 0}%</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Continue Learning <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Analyzing skill gaps and priorities...</p>
            </div>
          ) : skills.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed p-6">
              <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {filter === "acquired" ? "No acquired skills yet" : "No skill gaps recorded yet"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
                {filter === "acquired"
                  ? "Mark skills as acquired in your learning paths to showcase them here."
                  : "Upload a job description and tailor your resume to discover your missing skills and personalized learning roadmaps."}
              </p>
            </div>
          ) : (
            /* Prioritized Skills Table / List */
            <div className="border rounded-xl overflow-x-auto bg-white dark:bg-slate-900">
              <div className="min-w-[480px] sm:min-w-0">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <div className="col-span-1 text-center">Rank</div>
                  <div className="col-span-4 sm:col-span-4">Skill</div>
                  <div className="col-span-3 sm:col-span-3">Missing Frequency</div>
                  <div className="col-span-2 hidden sm:block">Priority</div>
                  <div className="col-span-4 sm:col-span-2 text-right">Roadmap</div>
                </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {displayedSkills.map((item) => (
                  <div
                    key={item.canonicalSkill}
                    onClick={() => handleOpenSkill(item.canonicalSkill)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center font-bold text-slate-400">
                      #{item.rank}
                    </div>

                    {/* Skill & Progress */}
                    <div className="col-span-4 sm:col-span-4 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.canonicalSkill}
                        </span>
                        {item.status === "acquired" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={item.progressPercentage || 0}
                          className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.progressPercentage || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Missing Frequency */}
                    <div className="col-span-3 sm:col-span-3 text-slate-600 dark:text-slate-400 font-medium">
                      Missing {item.frequency} time{item.frequency > 1 ? "s" : ""}
                    </div>

                    {/* Priority Badge */}
                    <div className="col-span-2 hidden sm:block">
                      {item.status === "acquired" || (item.progressPercentage || 0) >= 100 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          Acquired
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            item.priority === "High"
                              ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                              : item.priority === "Medium"
                              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>

                    {/* Action */}
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSkill(item.canonicalSkill);
                        }}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">
                          {item.status === "acquired" || (item.progressPercentage || 0) >= 100
                            ? "Review Path"
                            : "Learning Path"}
                        </span>
                        <span className="sm:hidden">
                          {item.status === "acquired" || (item.progressPercentage || 0) >= 100
                            ? "Review"
                            : "Path"}
                        </span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              {/* Show More / Show Less Toggle Footer */}
              {hasMore && (
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {showAll
                      ? `Showing all ${skills.length} skills`
                      : `Showing top 5 of ${skills.length} skills`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-xs"
                  >
                    {showAll ? (
                      <>
                        Show Top 5 Only <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Show All ({skills.length}) <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Path Modal */}
      <SkillLearningPathDialog
        key={selectedSkill || "none"}
        skillName={selectedSkill}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSkill(null);
          fetchPriorities();
        }}
        onProgressUpdated={fetchPriorities}
      />
    </>
  );
}
