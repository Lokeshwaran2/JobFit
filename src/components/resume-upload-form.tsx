"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, FileCheck } from "lucide-react";

// Form Schema
const formSchema = z.object({
    jobDescription: z.string().min(50, "Job Description is too short"),
    resumeFile: typeof window === "undefined"
        ? z.any()
        : z.instanceof(FileList).refine((files) => files?.length === 1, "Resume file is required"),
});

export function ResumeUploadForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        // resolver: zodResolver(formSchema), // TODO: Fix FileList validation issue in client
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("jobDescription", data.jobDescription);
            formData.append("resumeFile", data.resumeFile[0]);

            const res = await fetch("/api/resume/analyze", {
                method: "POST",
                body: formData,
            });

            const result = await res.json(); // Parse JSON once

            if (!res.ok) {
                // Handle Credit Error
                if (result.code === "NO_CREDITS") {
                    if (confirm("You have insufficient credits. Would you like to get more?")) {
                        router.push("/#pricing");
                        return;
                    }
                }
                throw new Error(result.error || "Analysis failed");
            }

            console.log("Analysis Result:", result);

            // Redirect to the Editor
            if (result.resumeId) {
                router.push(`/builder/${result.resumeId}`);
            } else {
                alert("Error: No resume ID returned.");
            }

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Something went wrong during analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Target Job</CardTitle>
                    <CardDescription>Paste the job description you want to apply for.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2">
                        <Label htmlFor="jd">Job Description</Label>
                        <Textarea
                            id="jd"
                            placeholder="Paste the full JD here..."
                            className="min-h-[200px]"
                            {...register("jobDescription", { required: true })}
                        />
                        {errors.jobDescription && <span className="text-sm text-red-500">Required</span>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Your Resume</CardTitle>
                    <CardDescription>Upload your current resume (PDF, DOCX, or DOC).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-2">
                        <Label htmlFor="resume">Resume (PDF / DOCX / DOC)</Label>
                        <Input
                            id="resume"
                            type="file"
                            accept=".pdf, .docx, .doc"
                            {...register("resumeFile", { required: true })}
                        />
                        {errors.resumeFile && <span className="text-sm text-red-500">File Required</span>}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button size="lg" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Generate Tailored Resume
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
