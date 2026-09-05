"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Sparkles, Trash2, Plus, CheckCircle2 } from "lucide-react";

import { updateResume } from "@/actions/resume";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ResumeEditor({
    initialData,
    onUpdate,
    missingSkills = [],
    improvements = {},
    resumeId,
    isMobile
}: {
    initialData: any;
    onUpdate: (data: any) => void;
    missingSkills?: string[];
    improvements?: any;
    resumeId: string;
    isMobile?: boolean; // New prop for layout control
}) {
    const [data, setData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);

    // Debounce updates to the parent (preview)
    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdate(data);
        }, 500);
        return () => clearTimeout(timer);
    }, [data, onUpdate]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateResume(resumeId, data);
            toast.success("Resume saved successfully!");
        } catch (error) {
            console.error("Failed to save resume:", error);
            toast.error("Failed to save resume.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveExperience = (index: number) => {
        setData((prev: any) => {
            const newData = { ...prev };
            if (newData.experience && Array.isArray(newData.experience)) {
                newData.experience = newData.experience.filter((_: any, idx: number) => idx !== index);
            }
            return newData;
        });
    };

    const handleChange = (section: string, field: string | null, value: any, index?: number) => {
        setData((prev: any) => {
            const newData = { ...prev };
            if (index !== undefined && field) {
                // Array item update
                newData[section][index][field] = value;
            } else if (field) {
                // Deep nested update
                if (!newData[section]) newData[section] = {};
                newData[section][field] = value;
            } else {
                // Direct section update (e.g. summary)
                newData[section] = value;
            }
            return newData;
        });
    };

    return (
        <div className={`flex ${isMobile ? '' : 'h-full'} flex-col gap-4`}>
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold">Edit Resume</h2>
                <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Content Container - Conditional ScrollArea */}
            {isMobile ? (
                // Mobile: No ScrollArea, just flow naturally
                <div className="space-y-4 pb-20">
                    <EditorTabsContent data={data} setData={setData} improvements={improvements} missingSkills={missingSkills} handleChange={handleChange} handleRemoveExperience={handleRemoveExperience} />
                </div>
            ) : (
                // Desktop: ScrollArea with fixed height
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <EditorTabsContent data={data} setData={setData} improvements={improvements} missingSkills={missingSkills} handleChange={handleChange} handleRemoveExperience={handleRemoveExperience} />
                </ScrollArea>
            )}
        </div>
    );
}

// Sub-component to avoid code duplication across mobile/desktop views
function EditorTabsContent({ data, setData, improvements, missingSkills = [], handleChange, handleRemoveExperience }: any) {
    // Determine remaining missing skills that are not yet in the user's hard skills
    const existingHardSkills: string[] = Array.isArray(data.skills?.hard)
        ? data.skills.hard.map((s: string) => s.trim().toLowerCase())
        : (typeof data.skills?.hard === "string" ? data.skills.hard.split(",").map((s: string) => s.trim().toLowerCase()) : []);

    const [showAllMissing, setShowAllMissing] = useState(false);

    const remainingMissing = missingSkills.filter(
        (skill: string) => !existingHardSkills.includes(skill.trim().toLowerCase())
    );

    const displayedMissing = showAllMissing ? remainingMissing : remainingMissing.slice(0, 5);
    const hasMoreMissing = remainingMissing.length > 5;

    const handleAddMissingSkill = (skillToAdd: string) => {
        const currentList = Array.isArray(data.skills?.hard)
            ? [...data.skills.hard]
            : (typeof data.skills?.hard === "string" ? data.skills.hard.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

        if (!currentList.some((s: string) => s.toLowerCase() === skillToAdd.toLowerCase())) {
            const updatedList = [...currentList, skillToAdd];
            handleChange("skills", "hard", updatedList);
            toast.success(`Added "${skillToAdd}" to your skills!`);
        }
    };

    const handleAddAllMissingSkills = () => {
        const currentList = Array.isArray(data.skills?.hard)
            ? [...data.skills.hard]
            : (typeof data.skills?.hard === "string" ? data.skills.hard.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

        const remaining = missingSkills.filter(
            (s: string) => !currentList.some((h: string) => h.toLowerCase() === s.trim().toLowerCase())
        );

        if (remaining.length > 0) {
            const updatedList = [...currentList, ...remaining];
            handleChange("skills", "hard", updatedList);
            toast.success(`Added ${remaining.length} suggested keywords to your skills!`);
        }
    };

    return (
        <Tabs defaultValue="basics" className="w-full">
            <TabsList className="w-full">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills" className="relative">
                    Skills
                    {remainingMissing.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                            {remainingMissing.length}
                        </span>
                    )}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 py-4">
                {improvements?.summaryOptimized && (
                    <Alert className="bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertTitle>Summary Enhanced</AlertTitle>
                        <AlertDescription>
                            Your professional summary has been rewritten to highlight your key strengths.
                        </AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input
                                value={data.personalInfo?.name || ""}
                                onChange={(e) => handleChange("personalInfo", "name", e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Job Title</Label>
                            <Input
                                value={data.personalInfo?.title || ""}
                                onChange={(e) => handleChange("personalInfo", "title", e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Summary</Label>
                            <Textarea
                                className="min-h-[150px]"
                                value={data.summary || ""}
                                onChange={(e) => handleChange("summary", null, e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4 py-4">
                {improvements?.bulletPointsRewritten > 0 && (
                    <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertTitle>Experience Optimized</AlertTitle>
                        <AlertDescription>
                            Rewrote {improvements.bulletPointsRewritten} bullet points for maximum impact.
                        </AlertDescription>
                    </Alert>
                )}
                {data.experience?.map((job: any, i: number) => (
                    <Card key={i}>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-medium">Job {i + 1}</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                onClick={() => handleRemoveExperience(i)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Company"
                                    value={job.company}
                                    onChange={(e) => handleChange("experience", "company", e.target.value, i)}
                                />
                                <Input
                                    placeholder="Role"
                                    value={job.role}
                                    onChange={(e) => handleChange("experience", "role", e.target.value, i)}
                                />
                            </div>
                            <Textarea
                                placeholder="Bullets (one per line)..."
                                value={Array.isArray(job.description) ? job.description.map((b: any) => typeof b === "string" ? b : b.text).join("\n") : job.description}
                                onChange={(e) => {
                                    const bullets = e.target.value.split("\n");
                                    handleChange("experience", "description", bullets, i);
                                }}
                                className="min-h-[100px]"
                            />
                        </CardContent>
                    </Card>
                ))}
                <Button variant="outline" className="w-full" onClick={() => {
                    // Add new job
                    setData((prev: any) => ({
                        ...prev,
                        experience: [...(prev.experience || []), { company: "New Company", role: "Role", description: [] }]
                    }))
                }}>+ Add Position</Button>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 py-4">
                <Card>
                    <CardHeader><CardTitle>Hard Skills & Keywords</CardTitle></CardHeader>
                    <CardContent className="space-y-4">

                        {/* Interactive Suggested Missing Keywords Section */}
                        {remainingMissing.length > 0 ? (
                            <div className="p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-xs">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span>Suggested Missing Keywords ({remainingMissing.length})</span>
                                    </div>
                                    {remainingMissing.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[11px] text-amber-800 hover:text-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-semibold underline px-2 py-0"
                                            onClick={handleAddAllMissingSkills}
                                        >
                                            + Add All
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/90">
                                    These keywords are in the job description but missing from your skills. <strong>Click any keyword to add it</strong> to your resume:
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-0.5 items-center">
                                    {displayedMissing.map((skill: string, idx: number) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddMissingSkill(skill)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-800 border border-amber-300 dark:border-amber-700 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                            title={`Click to add "${skill}" to your skills`}
                                        >
                                            <Plus className="h-3 w-3 text-amber-700 dark:text-amber-300" />
                                            <span>{skill}</span>
                                        </button>
                                    ))}
                                    {hasMoreMissing && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllMissing(!showAllMissing)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-800/60 dark:hover:bg-amber-700 border border-amber-300 dark:border-amber-600 transition-all cursor-pointer shadow-xs"
                                        >
                                            {showAllMissing ? "Show top 5 only" : `+${remainingMissing.length - 5} more (Show all)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : missingSkills.length > 0 ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>All suggested job description keywords have been added to your skills!</span>
                            </div>
                        ) : null}

                        {/* Current Matched Skills Display */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Current Hard Skills (Comma Separated)</Label>
                            <Textarea
                                value={Array.isArray(data.skills?.hard) ? data.skills.hard.join(", ") : (data.skills?.hard || "")}
                                onChange={(e) => {
                                    const list = e.target.value.split(",").map((s: string) => s.trim());
                                    handleChange("skills", "hard", list);
                                }}
                                className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground">Editing the text area updates your resume preview live.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    );
}

