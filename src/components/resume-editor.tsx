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
import { Check, AlertTriangle, Sparkles, Trash2 } from "lucide-react";

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

    // ... existing helpers ...

    const handleRemoveExperience = (index: number) => {
        setData((prev: any) => {
            const newData = { ...prev };
            if (newData.experience && Array.isArray(newData.experience)) {
                newData.experience = newData.experience.filter((_: any, idx: number) => idx !== index);
            }
            // Auto-save on crucial structure changes? Maybe not, keep manual for now or debounced auto-save later.
            // Let's stick to manual save button as requested/implied by "check save changes".
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
function EditorTabsContent({ data, setData, improvements, missingSkills, handleChange, handleRemoveExperience }: any) {
    return (
        <Tabs defaultValue="basics" className="w-full">
            <TabsList className="w-full">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
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
                    <CardHeader><CardTitle>Hard Skills</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* ATS Feedback for Skills */}
                        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">ATS Skills Analysis</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                {data.skills?.hard?.map((skill: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-green-700 dark:text-green-400">
                                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>{skill} <span className="text-xs opacity-70 ml-1">(Matched)</span></span>
                                    </div>
                                ))}
                                {missingSkills.map((skill: any, i: number) => (
                                    <div key={`missing-${i}`} className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>Consider adding: <strong>{skill}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Textarea
                            value={data.skills?.hard?.join(", ") || ""}
                            onChange={(e) => {
                                const list = e.target.value.split(",").map((s: string) => s.trim());
                                handleChange("skills", "hard", list);
                            }}
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">Comma separated</p>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    );
}
