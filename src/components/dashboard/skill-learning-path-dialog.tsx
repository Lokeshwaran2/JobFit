"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles,
  Trophy,
  History,
  Check,
  Loader2,
  Star,
  ShieldCheck,
  Terminal,
  Hammer,
  HelpCircle,
  Github,
  Award,
  ArrowRight,
  Flame,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PersonalizedLearningPathDTO, LearningTopicDTO, CheckpointQuestion, StepProgressStatus } from "@/lib/skills/engine/types";

interface SkillLearningPathDialogProps {
  skillName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export function SkillLearningPathDialog({
  skillName,
  isOpen,
  onClose,
  onProgressUpdated,
}: SkillLearningPathDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PersonalizedLearningPathDTO | null>(null);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [gapData, setGapData] = useState<any>(null);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("roadmap");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

  // Quiz / Checkpoint state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // Capstone submission state
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [isSubmittingCapstone, setIsSubmittingCapstone] = useState(false);
  const [capstoneResult, setCapstoneResult] = useState<{
    score: number;
    level: string;
    feedback: string;
    githubUrl: string;
    assessedAt: string;
    passed?: boolean;
  } | null>(null);

  useEffect(() => {
    // Strictly isolate and reset skill-specific state whenever skillName or dialog open state changes
    setData(null);
    setOccurrences([]);
    setGapData(null);
    setUpdatingStepId(null);
    setSelectedAnswers({});
    setQuizSubmitted({});
    setGithubUrl("");
    setCapstoneResult(null);
    setSelectedTopicId(null);

    if (!skillName || !isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/skills/learning-path/${encodeURIComponent(skillName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load personalized learning path");
        return res.json();
      })
      .then((resData) => {
        if (!isMounted) return;
        if (resData.success) {
          setData(resData);
          setOccurrences(resData.occurrences || []);
          setGapData(resData.gap || null);

          // Default selected topic to "Start Here" topic or first topic
          if (resData.startHere?.topicId) {
            setSelectedTopicId(resData.startHere.topicId);
          } else if (resData.modules?.[0]?.topics?.[0]?.id) {
            setSelectedTopicId(resData.modules[0].topics[0].id);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load learning path");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Also fetch past assessment history strictly for this skill (to display verified capstones)
    fetch(`/api/skills/${encodeURIComponent(skillName)}/assessment`)
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData.success && Array.isArray(resData.assessments)) {
          const capstoneAssessment = resData.assessments.find((a: any) => a.assessmentType === "capstone");
          if (capstoneAssessment) {
            setCapstoneResult({
              score: capstoneAssessment.score,
              level: capstoneAssessment.level,
              feedback: capstoneAssessment.evidence?.feedback || "Capstone project verified.",
              githubUrl: capstoneAssessment.evidence?.githubRepoUrl || "",
              assessedAt: capstoneAssessment.assessedAt,
              passed: capstoneAssessment.score >= 70,
            });
            if (capstoneAssessment.evidence?.githubRepoUrl) {
              setGithubUrl(capstoneAssessment.evidence.githubRepoUrl);
            }
          } else {
            setCapstoneResult(null);
            setGithubUrl("");
          }
        } else {
          setCapstoneResult(null);
          setGithubUrl("");
        }
      })
      .catch(() => {
        if (isMounted) {
          setCapstoneResult(null);
          setGithubUrl("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [skillName, isOpen]);

  const handleStepToggle = async (stepId: string, currentStatus?: string) => {
    if (!skillName || !data) return;

    const nextStatus: StepProgressStatus =
      currentStatus === "completed"
        ? "not_started"
        : currentStatus === "in_progress"
        ? "completed"
        : "in_progress";

    setUpdatingStepId(stepId);

    // Optimistically update local state
    setData((prev) => {
      if (!prev) return null;
      const updatedModules = prev.modules.map((mod) => ({
        ...mod,
        topics: mod.topics.map((top) => {
          let updatedTop = { ...top };
          if (top.id === stepId) {
            updatedTop.status = nextStatus;
          }
          updatedTop.practiceTasks = top.practiceTasks.map((pt) =>
            pt.id === stepId ? { ...pt, status: nextStatus } : pt
          );
          if (top.checkpoint && top.checkpoint.id === stepId) {
            updatedTop.checkpoint = { ...top.checkpoint, status: nextStatus };
          }
          return updatedTop;
        }),
      }));

      const updatedImpls = prev.implementationTasks.map((imp) =>
        imp.id === stepId ? { ...imp, status: nextStatus } : imp
      );

      let updatedCapstone = { ...prev.capstoneProject };
      if (updatedCapstone.id === stepId) {
        updatedCapstone.status = nextStatus;
      }

      return {
        ...prev,
        modules: updatedModules,
        implementationTasks: updatedImpls,
        capstoneProject: updatedCapstone,
      };
    });

    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillName)}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to save progress");
      const resJson = await res.json();

      if (resJson.success && typeof resJson.overallProgress === "number") {
        setData((prev) => (prev ? { ...prev, progress: resJson.overallProgress } : null));
        if (resJson.overallProgress >= 100 || resJson.isAcquired) {
          setGapData((prev: any) => ({ ...prev, status: "acquired" }));
          toast.success(`🎉 100% Progress! Marked ${skillName} as Acquired in your profile.`);
        }
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update step progress");
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleMarkAsAcquired = async () => {
    if (!skillName) return;

    setIsAcquiring(true);
    try {
      const res = await fetch("/api/skills/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: skillName,
        }),
      });

      if (!res.ok) throw new Error("Failed to mark skill as acquired");
      const resJson = await res.json();

      if (resJson.success) {
        toast.success(`Marked ${skillName} as Acquired in your profile!`);
        setGapData((prev: any) => ({ ...prev, status: "acquired" }));
        setData((prev) => (prev ? { ...prev, progress: 100 } : null));
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || "Could not mark skill as acquired");
    } finally {
      setIsAcquiring(false);
    }
  };

  const handleQuizAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckpointSubmit = async (checkpointId: string, questions: CheckpointQuestion[]) => {
    if (!skillName) return;

    const unanswered = questions.filter((q) => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error("Please answer all verification questions before submitting.");
      return;
    }

    let correctCount = 0;
    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    }

    const passed = correctCount === questions.length;
    setQuizSubmitted((prev) => ({ ...prev, [checkpointId]: true }));

    if (passed) {
      toast.success("🎉 Checkpoint Passed! 100% Score");
      await handleStepToggle(checkpointId, "not_started");
    } else {
      toast.error(`Score: ${correctCount}/${questions.length}. Review the explanations and try again!`);
    }

    try {
      await fetch(`/api/skills/${encodeURIComponent(skillName)}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType: "checkpoint",
          answers: selectedAnswers,
        }),
      });
    } catch {
      // Soft-fail assessment log
    }
  };

  const handleCapstoneSubmit = async () => {
    if (!skillName || !githubUrl.trim()) {
      toast.error("Please provide a valid GitHub repository URL.");
      return;
    }

    setIsSubmittingCapstone(true);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillName)}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType: "capstone",
          githubRepoUrl: githubUrl.trim(),
        }),
      });

      const resJson = await res.json();
      if (resJson.passed) {
        toast.success("🏆 Capstone project verified! Marked completed.");
        setCapstoneResult({
          score: resJson.score,
          level: resJson.awardedLevel,
          feedback: resJson.feedback,
          githubUrl: githubUrl.trim(),
          assessedAt: resJson.assessedAt || new Date().toISOString(),
        });
        if (data?.capstoneProject?.id) {
          await handleStepToggle(data.capstoneProject.id, "not_started");
        }
      } else {
        toast.error(resJson.feedback || "Capstone verification failed");
        setCapstoneResult({
          score: resJson.score,
          level: resJson.awardedLevel || "unverified",
          feedback: resJson.feedback,
          githubUrl: githubUrl.trim(),
          assessedAt: resJson.assessedAt || new Date().toISOString(),
          passed: false,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit capstone");
    } finally {
      setIsSubmittingCapstone(false);
    }
  };

  // Find currently selected topic and adjacent topics for smooth navigation
  const allTopics: LearningTopicDTO[] = data?.modules.flatMap((m) => m.topics) || [];
  const currentTopicIndex = allTopics.findIndex((t) => t.id === selectedTopicId);
  const currentTopic = allTopics[currentTopicIndex >= 0 ? currentTopicIndex : 0];
  const prevTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex >= 0 && currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;

  const isAcquired = gapData?.status === "acquired";
  const progressPct = data?.progress ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-200",
          isFullscreen
            ? "!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !border-none z-50"
            : "w-[96vw] max-w-[96vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] h-[93vh] max-h-[960px] rounded-2xl"
        )}
      >
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950 pr-14 sm:pr-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 truncate">
                  {data?.canonicalSkill || skillName}
                </DialogTitle>

                {isAcquired ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2.5 py-0.5 shrink-0">
                    <Check className="h-3 w-3" /> Acquired
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 font-semibold shrink-0"
                  >
                    Priority #{data?.priority || 1}
                  </Badge>
                )}

                {data?.currentLevel && (
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                  >
                    Level: {data.currentLevel}
                  </Badge>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Free & Verified
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl line-clamp-2 leading-relaxed">
                {data?.whyItMatters || "Tailored curriculum structured around real-world industry requirements."}
              </p>
            </div>

            {/* Quick Actions & Fullscreen Toggle */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              {!isAcquired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsAcquired}
                  disabled={isAcquiring}
                  className="text-xs font-semibold h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  {isAcquiring ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  )}
                  Mark Acquired
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="h-8 w-8 p-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                title={isFullscreen ? "Exit Fullscreen" : "Maximize / Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Weighted Progress Bar */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                Weighted Roadmap Mastery
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-slate-100 dark:bg-slate-800" />
          </div>
        </DialogHeader>

        {/* Personalized "Start Here" Recommendation Banner */}
        {data?.startHere && (
          <div className="bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-purple-50 dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-900/50 px-4 sm:px-6 py-2.5 sm:py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200 shrink-0">
                    Personalized Start Here:
                  </span>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">
                    {data.startHere.topicTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  {data.startHere.reason}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedTopicId(data.startHere.topicId);
                setActiveTab("roadmap");
              }}
              className="text-xs h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 gap-1 self-start sm:self-auto"
            >
              Start Here <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 overflow-x-auto scrollbar-none">
              <TabsList className="h-11 bg-transparent p-0 gap-4 sm:gap-6 border-b-0 flex items-center min-w-max">
                <TabsTrigger
                  value="roadmap"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent px-1 py-2.5 font-semibold text-xs text-slate-600 dark:text-slate-400 shrink-0"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  Learn → Practice → Build → Prove
                </TabsTrigger>
                <TabsTrigger
                  value="capstone"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent px-1 py-2.5 font-semibold text-xs text-slate-600 dark:text-slate-400 shrink-0"
                >
                  <Hammer className="h-3.5 w-3.5 mr-1.5 shrink-0 text-amber-500" />
                  Projects & Capstone
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none bg-transparent px-1 py-2.5 font-semibold text-xs text-slate-600 dark:text-slate-400 shrink-0"
                >
                  <History className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  Application Demand ({occurrences.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium">Synthesizing skill-specific learning path...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: ROADMAP (LEARN -> PRACTICE -> BUILD -> PROVE) */}
                <TabsContent value="roadmap" className="flex-1 m-0 overflow-hidden flex flex-col md:flex-row">
                  {/* Mobile Curriculum Topic Switcher Bar (< md) */}
                  <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 p-2.5 px-3 flex items-center justify-between gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobileCurriculumOpen(!mobileCurriculumOpen)}
                      className="text-xs font-semibold h-8 gap-1.5 flex-1 justify-between truncate bg-slate-50 dark:bg-slate-800/60"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Layers className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{currentTopic?.title || "Select Topic"}</span>
                      </span>
                      <Badge variant="secondary" className="text-[10px] ml-1 shrink-0">
                        {currentTopicIndex >= 0 ? currentTopicIndex + 1 : 1}/{allTopics.length}
                      </Badge>
                    </Button>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!prevTopic}
                        onClick={() => prevTopic && setSelectedTopicId(prevTopic.id)}
                        className="h-8 w-8 p-0"
                        title="Previous Topic"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!nextTopic}
                        onClick={() => nextTopic && setSelectedTopicId(nextTopic.id)}
                        className="h-8 w-8 p-0"
                        title="Next Topic"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Curriculum Modal / Dropdown Drawer Overlay */}
                  {mobileCurriculumOpen && (
                    <div className="md:hidden fixed inset-x-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl max-h-[60vh] overflow-y-auto p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Curriculum Outline ({allTopics.length} Topics)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMobileCurriculumOpen(false)}
                          className="h-7 w-7 p-0 text-slate-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {data?.modules.map((module) => (
                        <div key={module.id} className="space-y-1">
                          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span>{module.title}</span>
                            <Badge variant="outline" className="text-[9px] py-0">{module.level}</Badge>
                          </div>
                          <div className="space-y-1">
                            {module.topics.map((topic) => (
                              <button
                                key={topic.id}
                                onClick={() => {
                                  setSelectedTopicId(topic.id);
                                  setMobileCurriculumOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 ${
                                  topic.id === selectedTopicId
                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200"
                                    : "hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
                                }`}
                              >
                                <span className="truncate">{topic.title}</span>
                                {topic.status === "completed" && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Left Sidebar: Modules & Topics (>= md) */}
                  <div className="hidden md:block w-72 lg:w-80 xl:w-96 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto p-4 space-y-4 shrink-0">
                    <div className="flex items-center justify-between px-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Curriculum Modules
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {allTopics.length} Topics
                      </span>
                    </div>

                    {data?.modules.map((module) => (
                      <div key={module.id} className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] lg:max-w-[240px]">
                            {module.title}
                          </span>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 shrink-0">
                            {module.level}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {module.topics.map((topic) => {
                            const isSelected = topic.id === selectedTopicId;
                            const isCompleted = topic.status === "completed";

                            return (
                              <button
                                key={topic.id}
                                onClick={() => setSelectedTopicId(topic.id)}
                                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                                  isSelected
                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800"
                                    : "hover:bg-slate-100/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                )}
                                <span className="flex-1 leading-snug line-clamp-2">{topic.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Content Area: Detailed Learn -> Practice -> Build -> Prove for Current Topic */}
                  <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {currentTopic ? (
                      <div className="space-y-6 max-w-5xl">
                        {/* Topic Header */}
                        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                  {currentTopic.title}
                                </h3>
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {currentTopic.estimatedMinutes} mins
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {currentTopic.description}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant={currentTopic.status === "completed" ? "outline" : "default"}
                              onClick={() => handleStepToggle(currentTopic.id, currentTopic.status)}
                              className={`text-xs h-8 shrink-0 font-semibold gap-1.5 self-start sm:self-auto ${
                                currentTopic.status === "completed"
                                  ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              }`}
                            >
                              {currentTopic.status === "completed" ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Completed
                                </>
                              ) : (
                                "Mark Completed"
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* SECTION 1: LEARN (Verified Free Resources) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                              1. Learn (Verified Free Resources)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {currentTopic.primaryResource && (
                              <div className="p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-xs flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1 text-[10px] font-bold">
                                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Recommended
                                    </Badge>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                      {currentTopic.primaryResource.provider}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {currentTopic.primaryResource.title}
                                  </h4>
                                  {currentTopic.primaryResource.whyThisResource && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                      "{currentTopic.primaryResource.whyThisResource}"
                                    </p>
                                  )}
                                </div>

                                <div className="pt-4 mt-2">
                                  <a
                                    href={currentTopic.primaryResource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                  >
                                    Open Resource <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {currentTopic.alternativeResource && (
                              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Alternative Option:
                                  </span>
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {currentTopic.alternativeResource.title}
                                  </h5>
                                  <span className="text-[11px] text-slate-500 block">
                                    {currentTopic.alternativeResource.provider}
                                  </span>
                                </div>

                                <div className="pt-4 mt-2">
                                  <a
                                    href={currentTopic.alternativeResource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
                                  >
                                    Open Alternative <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SECTION 2: PRACTICE (Hands-on Exercises) */}
                        {currentTopic.practiceTasks.length > 0 && (
                          <div className="space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                              2. Practice (Hands-on Exercises)
                            </span>

                            <div className="space-y-3">
                              {currentTopic.practiceTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {task.title}
                                    </h4>
                                    <Button
                                      size="sm"
                                      variant={task.status === "completed" ? "secondary" : "outline"}
                                      onClick={() => handleStepToggle(task.id, task.status)}
                                      className="text-[11px] h-7 px-2.5 font-semibold shrink-0 self-start sm:self-auto"
                                    >
                                      {task.status === "completed" ? (
                                        <>
                                          <Check className="h-3 w-3 text-emerald-600 mr-1" /> Done
                                        </>
                                      ) : (
                                        "Mark Complete"
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {task.description}
                                  </p>
                                  <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono overflow-x-auto">
                                    <strong>Expected Outcome:</strong> {task.expectedOutcome}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SECTION 3: PROVE (Verification Checkpoint) */}
                        {currentTopic.checkpoint && (
                          <div className="space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Award className="h-3.5 w-3.5 text-indigo-600" />
                              3. Prove (Knowledge Checkpoint)
                            </span>

                            <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                              <h4 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200">
                                {currentTopic.checkpoint.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {currentTopic.checkpoint.description}
                              </p>

                              {currentTopic.checkpoint.questions?.map((q) => (
                                <div key={q.id} className="space-y-2 pt-2">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {q.question}
                                  </p>
                                  <div className="space-y-1.5">
                                    {q.options.map((opt, optIdx) => {
                                      const isSelected = selectedAnswers[q.id] === optIdx;
                                      const isSubmitted = quizSubmitted[currentTopic.checkpoint!.id];
                                      const isCorrect = q.correctIndex === optIdx;

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isSubmitted}
                                          onClick={() => handleQuizAnswerSelect(q.id, optIdx)}
                                          className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                                            isSubmitted
                                              ? isCorrect
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold"
                                                : isSelected
                                                ? "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200"
                                                : "border-slate-200 dark:border-slate-800 opacity-60"
                                              : isSelected
                                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-950 dark:text-indigo-100"
                                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
                                          }`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}

                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleCheckpointSubmit(
                                      currentTopic.checkpoint!.id,
                                      currentTopic.checkpoint!.questions || []
                                    )
                                  }
                                  className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                >
                                  Submit Checkpoint
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sequential Topic Navigator Footer */}
                        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!prevTopic}
                            onClick={() => prevTopic && setSelectedTopicId(prevTopic.id)}
                            className="text-xs gap-1.5 h-8 font-semibold"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Previous:</span>{" "}
                            {prevTopic
                              ? prevTopic.title.slice(0, 24) + (prevTopic.title.length > 24 ? "..." : "")
                              : "Start"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!nextTopic}
                            onClick={() => nextTopic && setSelectedTopicId(nextTopic.id)}
                            className="text-xs gap-1.5 h-8 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                          >
                            <span className="hidden sm:inline">Next:</span>{" "}
                            {nextTopic
                              ? nextTopic.title.slice(0, 24) + (nextTopic.title.length > 24 ? "..." : "")
                              : "Complete"}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                        <BookOpen className="h-8 w-8 mb-2" />
                        <p className="text-xs font-medium">Select a topic from the curriculum sidebar to begin.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: PROJECTS & CAPSTONE */}
                <TabsContent value="capstone" className="flex-1 m-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Implementation Tasks / Mini-Projects */}
                    {data?.implementationTasks && data.implementationTasks.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-indigo-600" />
                            Hands-on Implementation Tasks ({data.implementationTasks.filter(t => t.status === "completed").length}/{data.implementationTasks.length})
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">Mini-Projects & Deliverables</span>
                        </div>

                        <div className="space-y-3">
                          {data.implementationTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {task.title}
                                    </h5>
                                    <Badge variant="outline" className="text-[10px] capitalize font-semibold py-0">
                                      {task.difficulty}
                                    </Badge>
                                    {task.estimatedHours && (
                                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {task.estimatedHours} hrs
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  variant={task.status === "completed" ? "secondary" : "default"}
                                  onClick={() => handleStepToggle(task.id, task.status)}
                                  disabled={updatingStepId === task.id}
                                  className={`text-xs font-semibold shrink-0 ${
                                    task.status === "completed"
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  }`}
                                >
                                  {updatingStepId === task.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : task.status === "completed" ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Done
                                    </>
                                  ) : (
                                    "Mark Complete"
                                  )}
                                </Button>
                              </div>

                              {task.requirements && task.requirements.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Implementation Requirements:
                                  </span>
                                  <div className="space-y-1">
                                    {task.requirements.map((reqText, rIdx) => (
                                      <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                        <span>{reqText}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capstone Project */}
                    {data?.capstoneProject && (
                      <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 shrink-0">
                            <Hammer className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                              {data.capstoneProject.title}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400">
                              Comprehensive Portfolio Capstone Project
                            </span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {data.capstoneProject.description}
                        </p>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Architecture Overview:
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                            {data.capstoneProject.architectureOverview}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Measurable Requirements Checklist:
                          </h5>
                          <div className="space-y-2">
                            {data.capstoneProject.requirements.map((reqText, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{reqText}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Submission Evidence & Result Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          {capstoneResult && (
                            capstoneResult.passed === false || capstoneResult.score < 70 ? (
                              <div className="p-4 sm:p-5 rounded-xl border-2 border-rose-300 dark:border-rose-900 bg-gradient-to-r from-rose-50/70 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/40">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-rose-600 text-white">
                                      <X className="h-4 w-4" />
                                    </div>
                                    <h5 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100">
                                      Verification Failed: Requirements Not Met
                                    </h5>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-rose-600 text-white font-bold text-[11px]">
                                      Score: {capstoneResult.score}/100 (Unverified)
                                    </Badge>
                                  </div>
                                </div>

                                <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-medium">
                                  {capstoneResult.feedback}
                                </p>

                                {capstoneResult.githubUrl && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Github className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <span className="text-slate-500 font-medium">Attempted Repo:</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[280px] sm:max-w-md">
                                        {capstoneResult.githubUrl}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(capstoneResult.assessedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 sm:p-5 rounded-xl border-2 border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-emerald-600 text-white">
                                      <Check className="h-4 w-4" />
                                    </div>
                                    <h5 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100">
                                      Verification Passed & Recorded
                                    </h5>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-600 text-white font-bold text-[11px]">
                                      Score: {capstoneResult.score}/100
                                    </Badge>
                                    <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 uppercase font-bold text-[10px]">
                                      Level: {capstoneResult.level}
                                    </Badge>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {capstoneResult.feedback}
                                </p>

                                {capstoneResult.githubUrl && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Github className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <span className="text-slate-500 font-medium">Verified Repo:</span>
                                      <a
                                        href={capstoneResult.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[280px] sm:max-w-md"
                                      >
                                        {capstoneResult.githubUrl}
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                      </a>
                                    </div>

                                    <span className="text-[10px] text-slate-400">
                                      {new Date(capstoneResult.assessedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Github className="h-4 w-4" />
                            {capstoneResult ? "Update / Resubmit Repository URL:" : "Submit GitHub Repository for Verification:"}
                          </h5>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="url"
                              placeholder="https://github.com/yourname/my-project"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Button
                              size="sm"
                              onClick={handleCapstoneSubmit}
                              disabled={isSubmittingCapstone}
                              className="text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0"
                            >
                              {isSubmittingCapstone ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              {capstoneResult ? "Update & Re-verify" : "Verify & Complete"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 3: APPLICATION DEMAND */}
                <TabsContent value="history" className="flex-1 m-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
                  <div className="max-w-4xl mx-auto space-y-3">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Found missing in {occurrences.length} job application{occurrences.length > 1 ? "s" : ""}:
                    </div>

                    {occurrences.map((occ) => (
                      <div
                        key={occ.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {occ.jobTitle || occ.resume?.title || "Target Application"}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {new Date(occ.detectedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {occ.targetJobDesc && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                            "{occ.targetJobDesc}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
