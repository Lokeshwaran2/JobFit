"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, FileCheck, Link as LinkIcon, FileText, CheckCircle2 } from "lucide-react";

export function ResumeUploadForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [inputMode, setInputMode] = useState<"url" | "paste">("url");
    const [jobUrl, setJobUrl] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // URL validation & resolution state
    const [urlError, setUrlError] = useState<string | null>(null);
    const [isResolvingUrl, setIsResolvingUrl] = useState(false);
    const [extractedJobPreview, setExtractedJobPreview] = useState<{
        title: string;
        company: string | null;
        location: string | null;
        source?: string;
    } | null>(null);
    const [needsFallbackJd, setNeedsFallbackJd] = useState(false);
    const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Client-side protocol validator
    const validateClientUrl = (url: string): { isValid: boolean; error?: string } => {
        const trimmed = url.trim();
        if (!trimmed) {
            return { isValid: false, error: "Please enter a job URL." };
        }

        const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
        if (schemeMatch) {
            const scheme = schemeMatch[1].toLowerCase();
            if (scheme !== "http" && scheme !== "https") {
                return {
                    isValid: false,
                    error: `Unsupported protocol "${scheme}:". Only http:// and https:// URLs are accepted.`,
                };
            }
        }

        try {
            const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return { isValid: false, error: "Only http:// and https:// URLs are accepted." };
            }
            return { isValid: true };
        } catch {
            return { isValid: false, error: "Invalid URL format." };
        }
    };

    const handleResolveUrl = async () => {
        setUrlError(null);
        setExtractedJobPreview(null);
        setFallbackMessage(null);

        const check = validateClientUrl(jobUrl);
        if (!check.isValid) {
            setUrlError(check.error || "Invalid URL.");
            return;
        }

        setIsResolvingUrl(true);
        try {
            const res = await fetch("/api/jobs/resolve-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: jobUrl }),
            });

            const data = await res.json();
            if (!res.ok) {
                setUrlError(data.error || "Failed to validate URL.");
                return;
            }

            if (data.extracted && data.job) {
                setExtractedJobPreview({
                    title: data.job.title,
                    company: data.job.company || null,
                    location: data.job.location || null,
                    source: data.source,
                });
                setJobDescription(data.job.rawDescription);
                setNeedsFallbackJd(false);
                setFallbackMessage(null);
            } else {
                setExtractedJobPreview(null);
                setNeedsFallbackJd(true);
                setFallbackMessage(
                    data.message ||
                    "We couldn't extract the job details from this URL. Paste the job description below to continue."
                );
            }
        } catch {
            setExtractedJobPreview(null);
            setNeedsFallbackJd(true);
            setFallbackMessage(
                "We couldn't extract the job details from this URL. Paste the job description below to continue."
            );
        } finally {
            setIsResolvingUrl(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setUrlError(null);

        if (!resumeFile) {
            setFormError("Please select a resume file (PDF, DOCX, or DOC).");
            return;
        }

        let effectiveJd = jobDescription.trim();
        let effectiveSourceUrl: string | null = null;

        if (inputMode === "url") {
            const urlCheck = validateClientUrl(jobUrl);
            if (!urlCheck.isValid) {
                setUrlError(urlCheck.error || "Invalid job URL.");
                return;
            }
            effectiveSourceUrl = jobUrl.trim();

            // If no job description is available yet, attempt resolution first or ask for manual fallback
            if (!effectiveJd) {
                setIsResolvingUrl(true);
                try {
                    const res = await fetch("/api/jobs/resolve-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: jobUrl }),
                    });
                    const data = await res.json();
                    if (data.extracted && data.job?.rawDescription) {
                        effectiveJd = data.job.rawDescription;
                        setJobDescription(data.job.rawDescription);
                        setExtractedJobPreview({
                            title: data.job.title,
                            company: data.job.company || null,
                            location: data.job.location || null,
                            source: data.source,
                        });
                    } else {
                        setExtractedJobPreview(null);
                        setNeedsFallbackJd(true);
                        setFallbackMessage(
                            data.message ||
                            "We couldn't extract the job details from this URL. Paste the job description below to continue."
                        );
                        setIsResolvingUrl(false);
                        return;
                    }
                } catch {
                    setExtractedJobPreview(null);
                    setNeedsFallbackJd(true);
                    setFallbackMessage(
                        "We couldn't extract the job details from this URL. Paste the job description below to continue."
                    );
                    setIsResolvingUrl(false);
                    return;
                }
                setIsResolvingUrl(false);
            }
        } else {
            if (!effectiveJd) {
                setFormError("Please paste the job description.");
                return;
            }
        }

        if (!effectiveJd) {
            setFormError("A job description is required to analyze your resume.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("jobDescription", effectiveJd);
            formData.append("resumeFile", resumeFile);
            if (effectiveSourceUrl) {
                formData.append("sourceUrl", effectiveSourceUrl);
            }

            const res = await fetch("/api/resume/analyze", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();

            if (!res.ok) {
                if (result.code === "NO_CREDITS") {
                    if (confirm("You have insufficient credits. Would you like to get more?")) {
                        router.push("/#pricing");
                        return;
                    }
                }
                if (result.code === "URL_EXTRACTION_UNAVAILABLE") {
                    setExtractedJobPreview(null);
                    setNeedsFallbackJd(true);
                    setFallbackMessage(
                        result.error ||
                        "We couldn't extract the job details from this URL. Paste the job description below to continue."
                    );
                    return;
                }
                throw new Error(result.error || "Analysis failed");
            }

            // Redirect to the Editor
            if (result.resumeId) {
                router.push(`/builder/${result.resumeId}`);
            } else {
                alert("Error: No resume ID returned.");
            }
        } catch (error: any) {
            console.error(error);
            setFormError(error.message || "Something went wrong during analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Target Job</CardTitle>
                    <CardDescription>Add the job you're applying for.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs
                        value={inputMode}
                        onValueChange={(v) => {
                            setInputMode(v as "url" | "paste");
                            setUrlError(null);
                            setFormError(null);
                        }}
                    >
                        <TabsList className="grid w-full max-w-sm grid-cols-2 mb-4">
                            <TabsTrigger value="url" className="gap-1.5 text-xs sm:text-sm">
                                <LinkIcon className="h-3.5 w-3.5" />
                                Job URL
                            </TabsTrigger>
                            <TabsTrigger value="paste" className="gap-1.5 text-xs sm:text-sm">
                                <FileText className="h-3.5 w-3.5" />
                                Paste Job Description
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="url" className="space-y-4 mt-0">
                            <div className="grid w-full gap-2">
                                <Label htmlFor="jobUrl">Job URL</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        id="jobUrl"
                                        type="url"
                                        placeholder="https://company.com/jobs/software-engineer"
                                        value={jobUrl}
                                        onChange={(e) => {
                                            setJobUrl(e.target.value);
                                            setUrlError(null);
                                            setExtractedJobPreview(null);
                                            setFallbackMessage(null);
                                        }}
                                        className={urlError ? "border-red-500" : ""}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResolveUrl}
                                        disabled={isResolvingUrl || !jobUrl.trim()}
                                        className="shrink-0"
                                    >
                                        {isResolvingUrl ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            "Check URL"
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Paste the URL of the job posting. JobFit will extract the available job details for analysis.
                                </p>
                                {urlError && <span className="text-xs text-red-500">{urlError}</span>}
                            </div>

                            {/* Successful Extraction Preview Card */}
                            {extractedJobPreview && (
                                <div className="rounded-lg border border-green-200 bg-green-50/70 dark:border-green-900/60 dark:bg-green-950/30 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        Job details found
                                    </div>
                                    <div className="space-y-0.5 text-sm">
                                        <p className="font-bold text-foreground">{extractedJobPreview.title}</p>
                                        {extractedJobPreview.company && (
                                            <p className="text-muted-foreground font-medium">{extractedJobPreview.company}</p>
                                        )}
                                        {extractedJobPreview.location && (
                                            <p className="text-xs text-muted-foreground">{extractedJobPreview.location}</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-green-700/80 dark:text-green-400/80 pt-1.5 border-t border-green-200 dark:border-green-900/50">
                                        Job details successfully loaded. You can continue to resume upload below.
                                    </p>
                                </div>
                            )}

                            {/* Fallback Banner & Textarea */}
                            {(needsFallbackJd || fallbackMessage) && !extractedJobPreview && (
                                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                                        {fallbackMessage ||
                                            "We couldn't extract the job details from this URL. Paste the job description below to continue."}
                                    </div>
                                    <div className="grid w-full gap-2">
                                        <Label htmlFor="fallback-jd">Job Description</Label>
                                        <Textarea
                                            id="fallback-jd"
                                            placeholder="Paste the full job description here..."
                                            className="min-h-[180px]"
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="paste" className="space-y-4 mt-0">
                            <div className="grid w-full gap-2">
                                <Label htmlFor="jd">Job Description</Label>
                                <Textarea
                                    id="jd"
                                    placeholder="Paste the full job description here..."
                                    className="min-h-[200px]"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Your Resume</CardTitle>
                    <CardDescription>Upload your current resume so JobFit can analyze your experience against the role.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-2">
                        <Label htmlFor="resume">Resume (PDF / DOCX / DOC)</Label>
                        <Input
                            id="resume"
                            type="file"
                            accept=".pdf, .docx, .doc"
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    setResumeFile(files[0]);
                                    setFormError(null);
                                } else {
                                    setResumeFile(null);
                                }
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {formError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
                    {formError}
                </div>
            )}

            <div className="flex justify-end">
                <Button size="lg" type="submit" disabled={loading || isResolvingUrl}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Analyze & Tailor Resume
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
