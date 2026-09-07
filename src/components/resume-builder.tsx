"use client";

import { useState } from "react";
import { ResumeEditor } from "./resume-editor";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResumePreview } from "./resume-preview";
import { DownloadResumeButton } from "./download-resume-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AtsScoreHeader } from "./ats-score-header";
import { ImprovementSummary } from "./improvement-summary";
import { ProfileStrengthCard } from "./profile-strength-card";
import { JobMatchReport } from "./job-match-report";
import { BeforeAfterDiff } from "./before-after-diff";

import { TemplateSelector } from "./template-selector";
import { resolveTemplateId, TemplateId } from "@/lib/templates/template-registry";
import { toast } from "sonner";

import { TailoredResumeView } from "./tailored-resume-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, FileText, Edit3, ChevronDown, ChevronUp, ShieldCheck, Target } from "lucide-react";

export function ResumeBuilder({
    initialData,
    resumeId,
    jobId,
    initialTemplateId = "classic",
    jobDescription,
    atsScore,
    improvements,
    missingSkills = [],
    isPro,
    credits,
    githubUrl,
    linkedinUrl,
}: {
    initialData: any;
    resumeId: string;
    jobId?: string | null;
    initialTemplateId?: string | null;
    jobDescription: string;
    atsScore: number;
    improvements?: any;
    missingSkills?: string[];
    isPro: boolean;
    credits: number;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
}) {
    const [resumeData, setResumeData] = useState(initialData);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
        resolveTemplateId(initialTemplateId)
    );
    const [isMatchDetailsOpen, setIsMatchDetailsOpen] = useState(false);
    const [isWhatChangedOpen, setIsWhatChangedOpen] = useState(false);
    const [isProfileStrengthOpen, setIsProfileStrengthOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSelectTemplate = async (templateId: TemplateId) => {
        setSelectedTemplate(templateId);
        try {
            const res = await fetch(`/api/resume/${resumeId}/template`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId }),
            });
            if (!res.ok) {
                console.warn("Failed to persist template to backend");
            } else {
                toast.success(`Switched to ${templateId.charAt(0).toUpperCase() + templateId.slice(1)} template`);
            }
        } catch (err) {
            console.warn("Network error persisting template", err);
        }
    };

    // 1. Authoritative Deterministic Score Flow
    // The baseline score of original candidate resume before tailoring
    const baselineScore =
        improvements?.originalScore ??
        improvements?.beforeMatch?.score ??
        improvements?.tailoring?.beforeScore ??
        atsScore;

    // The authoritative match score of the tailored resume
    const tailoredScore =
        improvements?.atsScore ??
        improvements?.jobMatch?.score ??
        improvements?.tailoring?.afterScore ??
        atsScore;

    // Calculate dynamic score progression if candidate adds missing skills in the editor
    const totalMissing = missingSkills.length;
    const existingSkillsList: string[] = Array.isArray(resumeData.skills?.hard)
        ? resumeData.skills.hard.map((s: string) => s.trim().toLowerCase())
        : typeof resumeData.skills?.hard === "string"
        ? resumeData.skills.hard.split(",").map((s: string) => s.trim().toLowerCase())
        : [];

    const addedMissingCount = missingSkills.filter((skill: string) =>
        existingSkillsList.includes(skill.trim().toLowerCase())
    ).length;

    const liveAtsScore = totalMissing > 0 && addedMissingCount > 0
        ? Math.min(100, tailoredScore + Math.round((100 - tailoredScore) * (addedMissingCount / totalMissing)))
        : tailoredScore;

    const currentGain = Math.max(0, liveAtsScore - baselineScore);
    const currentPercentageGain = baselineScore > 0 ? Math.round((currentGain / baselineScore) * 100) : 0;

    const dynamicScoreBreakdown = {
        ...improvements?.scoreBreakdown,
        originalScore: baselineScore,
        targetScore: tailoredScore,
        scoreGain: currentGain,
        percentageGain: currentPercentageGain,
    };

    return (
        <div className="w-full flex flex-col">
            {/* 1. Job Match Score Sticky Header */}
            <AtsScoreHeader score={liveAtsScore} scoreBreakdown={dynamicScoreBreakdown} jobId={jobId} />

            {/* Main Application Container */}
            <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
                {/* 1. Complete Tailored Resume Section (Primary Content) */}
                <section className="border rounded-xl bg-card shadow-sm overflow-hidden" id="tailored-resume">
                    {/* Section Controls Header */}
                    <div className="border-b bg-muted/30 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Your Tailored Resume
                                </h2>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Validated & Ready
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Complete candidate resume integrating validated, evidence-backed improvements while preserving factual employment history.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Template:</span>
                                <TemplateSelector
                                    selectedTemplate={selectedTemplate}
                                    onSelectTemplate={handleSelectTemplate}
                                />
                            </div>
                            <DownloadResumeButton
                                data={resumeData}
                                resumeId={resumeId}
                                templateId={selectedTemplate}
                                fileName="JobFit_Resume"
                                isPro={isPro}
                                credits={credits}
                            />
                        </div>
                    </div>

                    {/* Interactive Resume Viewers */}
                    <Tabs defaultValue="structured" className="w-full">
                        <div className="px-4 sm:px-6 border-b bg-muted/10">
                            <TabsList className="grid grid-cols-3 w-full sm:w-[420px] my-3">
                                <TabsTrigger value="structured" className="text-xs sm:text-sm flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Document View
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="text-xs sm:text-sm flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    PDF Preview
                                </TabsTrigger>
                                <TabsTrigger value="editor" className="text-xs sm:text-sm flex items-center gap-1.5">
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Edit Resume
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Document View: Full structured resume */}
                        <TabsContent value="structured" className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50 m-0">
                            <TailoredResumeView data={resumeData} />
                        </TabsContent>

                        {/* PDF Preview View */}
                        <TabsContent value="preview" className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-900/50 m-0">
                            <div className="max-w-4xl mx-auto min-h-[700px]">
                                <ResumePreview data={resumeData} templateId={selectedTemplate} isMobile={!isDesktop} />
                            </div>
                        </TabsContent>

                        {/* Interactive Editor View */}
                        <TabsContent value="editor" className="p-4 sm:p-6 bg-white dark:bg-slate-900 m-0">
                            <div className="max-w-4xl mx-auto">
                                <ResumeEditor
                                    initialData={resumeData}
                                    onUpdate={(newData) => setResumeData(newData)}
                                    missingSkills={missingSkills || []}
                                    improvements={improvements}
                                    resumeId={resumeId}
                                    isMobile={!isDesktop}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </section>

                {/* 2. Match Details (Collapsed by default) */}
                {improvements?.jobMatch && (
                    <Card className="border rounded-xl bg-card shadow-sm overflow-hidden">
                        <Collapsible open={isMatchDetailsOpen} onOpenChange={setIsMatchDetailsOpen} className="w-full">
                            <div
                                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setIsMatchDetailsOpen(!isMatchDetailsOpen)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setIsMatchDetailsOpen(!isMatchDetailsOpen);
                                    }
                                }}
                                aria-expanded={isMatchDetailsOpen}
                                aria-label="Toggle Match Details"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2.5 rounded-xl">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                                Match Details
                                            </h3>
                                            <Badge variant="secondary" className="text-xs font-semibold">
                                                Match: {tailoredScore}/100
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Category scoring breakdown, matched requirements, and identified gaps for {resumeData.personalInfo?.title || "Target Role"}
                                        </p>
                                    </div>
                                </div>
                                <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                                        {isMatchDetailsOpen ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">Toggle Match Details</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-4 sm:p-6 border-t">
                                <JobMatchReport
                                    jobMatch={improvements.jobMatch}
                                    roleTitle={resumeData.personalInfo?.title || "Target Role"}
                                />
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                )}

                {/* 3. Optimization Report (Collapsed by default, not empty) */}
                <ImprovementSummary
                    stats={improvements}
                    tailoringDiff={improvements?.tailoring}
                    jobMatch={improvements?.jobMatch}
                    defaultOpen={false}
                />

                {/* 4. What Changed / Tailoring Transparency (Collapsed by default) */}
                {improvements?.tailoring && (
                    <Card className="border rounded-xl bg-card shadow-sm overflow-hidden">
                        <Collapsible open={isWhatChangedOpen} onOpenChange={setIsWhatChangedOpen} className="w-full">
                            <div
                                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setIsWhatChangedOpen(!isWhatChangedOpen)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setIsWhatChangedOpen(!isWhatChangedOpen);
                                    }
                                }}
                                aria-expanded={isWhatChangedOpen}
                                aria-label="Toggle What Changed"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2.5 rounded-xl">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                                What Changed
                                            </h3>
                                            {improvements.tailoring.bulletDiffs && (
                                                <Badge variant="outline" className="text-xs font-medium">
                                                    {improvements.tailoring.bulletDiffs.filter((d: any) => d.status === "accepted").length} Aligned
                                                    {improvements.tailoring.bulletDiffs.filter((d: any) => d.status === "rejected").length > 0 &&
                                                        ` • ${improvements.tailoring.bulletDiffs.filter((d: any) => d.status === "rejected").length} Safety Fallback${improvements.tailoring.bulletDiffs.filter((d: any) => d.status === "rejected").length > 1 ? "s" : ""}`}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Before & after comparison showing exact original text vs tailored text
                                        </p>
                                    </div>
                                </div>
                                <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                                        {isWhatChangedOpen ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">Toggle What Changed</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="p-4 sm:p-6 border-t">
                                <BeforeAfterDiff tailoringDiff={improvements.tailoring} />
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                )}

                {/* 5. Profile Strength for This Role (Collapsed by default) */}
                <Card className="border rounded-xl bg-card shadow-sm overflow-hidden">
                    <Collapsible open={isProfileStrengthOpen} onOpenChange={setIsProfileStrengthOpen} className="w-full">
                        <div
                            className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setIsProfileStrengthOpen(!isProfileStrengthOpen)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setIsProfileStrengthOpen(!isProfileStrengthOpen);
                                }
                            }}
                            aria-expanded={isProfileStrengthOpen}
                            aria-label="Toggle Profile Strength"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2.5 rounded-xl">
                                    <Target className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                            Profile Strength for This Role
                                        </h3>
                                        <Badge variant="outline" className="text-xs font-medium">
                                            GitHub & LinkedIn
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        External profile evidence and role alignment scoring
                                    </p>
                                </div>
                            </div>
                            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                                    {isProfileStrengthOpen ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">Toggle Profile Strength</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="p-4 sm:p-6 border-t">
                            <ProfileStrengthCard
                                resumeId={resumeId}
                                targetRole={resumeData.personalInfo?.title || "Software Engineer"}
                                jobDescription={jobDescription}
                                resumeScore={liveAtsScore}
                                githubUrl={githubUrl}
                                linkedinUrl={linkedinUrl}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                </Card>
            </div>
        </div>
    );
}
