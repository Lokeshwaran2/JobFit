"use client";

import { useState } from "react";
import { ResumeEditor } from "./resume-editor";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResumePreview } from "./resume-preview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DownloadResumeButton } from "./download-resume-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AtsScoreHeader } from "./ats-score-header";
import { ImprovementSummary } from "./improvement-summary";

export function ResumeBuilder({
    initialData,
    resumeId,
    jobDescription,
    atsScore,
    improvements,
    missingSkills = [],
    isPro,
    credits
}: {
    initialData: any;
    resumeId: string;
    jobDescription: string;
    atsScore: number;
    improvements?: any;
    missingSkills?: string[];
    isPro: boolean;
    credits: number;
}) {
    const [resumeData, setResumeData] = useState(initialData);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Calculate live dynamic ATS score based on candidate's added missing keywords
    const totalMissing = missingSkills.length;
    const existingSkillsList: string[] = Array.isArray(resumeData.skills?.hard)
        ? resumeData.skills.hard.map((s: string) => s.trim().toLowerCase())
        : (typeof resumeData.skills?.hard === "string" ? resumeData.skills.hard.split(",").map((s: string) => s.trim().toLowerCase()) : []);

    const addedMissingCount = missingSkills.filter(
        (skill: string) => existingSkillsList.includes(skill.trim().toLowerCase())
    ).length;

    const baseScore = improvements?.originalScore || (totalMissing > 0 ? Math.max(35, atsScore - Math.round(totalMissing * 3)) : atsScore);
    const targetScore = atsScore;

    const liveAtsScore = totalMissing > 0
        ? Math.min(99, baseScore + Math.round((targetScore - baseScore) * (addedMissingCount / totalMissing)))
        : atsScore;

    const dynamicScoreBreakdown = {
        ...improvements?.scoreBreakdown,
        originalScore: baseScore,
        targetScore: targetScore,
        scoreGain: liveAtsScore - baseScore,
        percentageGain: baseScore > 0 ? Math.round(((liveAtsScore - baseScore) / baseScore) * 100) : 0
    };

    if (!isDesktop) {
        return (
            <div className="h-full w-full flex flex-col">
                <div className="flex-none">
                    <AtsScoreHeader score={liveAtsScore} scoreBreakdown={dynamicScoreBreakdown} />
                    <div className="max-w-5xl mx-auto px-4">
                        <ImprovementSummary stats={improvements} />
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <Tabs defaultValue="editor" className="h-full flex flex-col">
                        <div className="px-4 border-b bg-white dark:bg-slate-950">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="editor">Edit Resume</TabsTrigger>
                                <TabsTrigger value="preview">Preview PDF</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="editor" className="flex-1 mt-0">
                            <div className="p-4 bg-white">
                                <ResumeEditor
                                    initialData={resumeData}
                                    onUpdate={(newData) => setResumeData(newData)}
                                    missingSkills={missingSkills || []}
                                    improvements={improvements}
                                    resumeId={resumeId}
                                    isMobile={true}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 mt-0">
                            <div className="p-4 bg-slate-100 dark:bg-slate-900 flex flex-col min-h-[500px]">
                                <div className="mb-2 flex justify-between items-center px-2">
                                    <span className="text-sm font-medium text-muted-foreground">Live PDF Preview</span>
                                    <DownloadResumeButton data={resumeData} fileName="JobFit_Resume.pdf" isPro={isPro} credits={credits} />
                                </div>
                                <ResumePreview data={resumeData} isMobile={true} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* ATS Score and Improvements */}
            <div className="flex-none">
                <AtsScoreHeader score={liveAtsScore} scoreBreakdown={dynamicScoreBreakdown} />
                <div className="max-w-5xl mx-auto px-4">
                    <ImprovementSummary stats={improvements} />
                </div>
            </div>

            <ResizablePanelGroup
                orientation="horizontal"
                className="min-h-0 flex-1 rounded-lg border"
            >
                {/* Left Panel: Editor */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full p-4  bg-white overflow-y-auto">
                        <ResumeEditor
                            initialData={resumeData}
                            onUpdate={(newData) => setResumeData(newData)}
                            missingSkills={missingSkills || []}
                            improvements={improvements}
                            resumeId={resumeId}
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel: Preview (PDF) */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full p-4 bg-slate-100 dark:bg-slate-900 flex flex-col">
                        <div className="mb-2 flex justify-between items-center px-2">
                            <span className="text-sm font-medium text-muted-foreground">Live PDF Preview</span>
                            <DownloadResumeButton data={resumeData} fileName="JobFit_Resume.pdf" isPro={isPro} credits={credits} />
                        </div>
                        <ResumePreview data={resumeData} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
