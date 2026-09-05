"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updateProfile, updateSocialProfiles } from "@/actions/update-profile";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Linkedin, ExternalLink, HelpCircle } from "lucide-react";
import { validateAndNormalizeGithubUrl, validateAndNormalizeLinkedinUrl } from "@/lib/profile-scoring/url-validator";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")).refine((val) => !val || val.length >= 6, {
        message: "Password must be at least 6 characters",
    }),
    githubUrl: z.string().optional().or(z.literal("")),
    linkedinUrl: z.string().optional().or(z.literal("")),
    linkedinHeadline: z.string().optional().or(z.literal("")),
    linkedinAbout: z.string().optional().or(z.literal("")),
    linkedinSkills: z.string().optional().or(z.literal("")),
}).refine((data) => {
    if (data.newPassword && data.newPassword.trim() && !data.password) {
        return false;
    }
    return true;
}, {
    message: "Current password is required to set a new password",
    path: ["password"],
}).refine((data) => {
    if (data.githubUrl && data.githubUrl.trim()) {
        const val = validateAndNormalizeGithubUrl(data.githubUrl);
        return val.isValid;
    }
    return true;
}, {
    message: "Please enter a valid GitHub profile URL or username",
    path: ["githubUrl"],
}).refine((data) => {
    if (data.linkedinUrl && data.linkedinUrl.trim()) {
        const val = validateAndNormalizeLinkedinUrl(data.linkedinUrl);
        return val.isValid;
    }
    return true;
}, {
    message: "Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)",
    path: ["linkedinUrl"],
});

interface SettingsUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    linkedinData?: any;
}

interface SettingsFormProps {
    user: SettingsUser;
}

export function SettingsForm({ user }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isSocialPending, startSocialTransition] = useTransition();
    const [showLinkedInDetails, setShowLinkedInDetails] = useState(false);

    const initialLinkedinData = (user.linkedinData as any) || {};

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || "",
            password: "",
            newPassword: "",
            githubUrl: user.githubUrl || "",
            linkedinUrl: user.linkedinUrl || "",
            linkedinHeadline: initialLinkedinData.headline || "",
            linkedinAbout: initialLinkedinData.about || "",
            linkedinSkills: Array.isArray(initialLinkedinData.skills)
                ? initialLinkedinData.skills.join(", ")
                : (initialLinkedinData.skills || ""),
        },
    });

    function onSaveSocialOnly() {
        startSocialTransition(() => {
            const currentGh = form.getValues("githubUrl");
            const currentLi = form.getValues("linkedinUrl");
            const currentHeadline = form.getValues("linkedinHeadline");
            const currentAbout = form.getValues("linkedinAbout");
            const currentSkills = form.getValues("linkedinSkills");

            // Client-side validations
            if (currentGh && currentGh.trim()) {
                const ghVal = validateAndNormalizeGithubUrl(currentGh);
                if (!ghVal.isValid) {
                    toast.error(ghVal.error || "Please enter a valid GitHub profile URL or username");
                    return;
                }
            }
            if (currentLi && currentLi.trim()) {
                const liVal = validateAndNormalizeLinkedinUrl(currentLi);
                if (!liVal.isValid) {
                    toast.error(liVal.error || "Please enter a valid LinkedIn profile URL");
                    return;
                }
            }

            const linkedinSkillsList = currentSkills
                ? currentSkills.split(",").map((s) => s.trim()).filter(Boolean)
                : initialLinkedinData.skills || [];

            const linkedinDataPayload = {
                ...initialLinkedinData,
                headline: currentHeadline?.trim() || initialLinkedinData.headline,
                about: currentAbout?.trim() || initialLinkedinData.about,
                skills: linkedinSkillsList,
            };

            updateSocialProfiles({
                githubUrl: currentGh?.trim() || null,
                linkedinUrl: currentLi?.trim() || null,
                linkedinData: linkedinDataPayload,
            })
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error);
                    }
                    if (data.success) {
                        toast.success(data.success);
                    }
                })
                .catch(() => toast.error("Failed to save social profiles"));
        });
    }

    function onSubmit(values: z.infer<typeof profileSchema>) {
        startTransition(() => {
            const linkedinSkillsList = values.linkedinSkills
                ? values.linkedinSkills.split(",").map((s) => s.trim()).filter(Boolean)
                : initialLinkedinData.skills || [];

            const linkedinDataPayload = {
                ...initialLinkedinData,
                headline: values.linkedinHeadline?.trim() || initialLinkedinData.headline,
                about: values.linkedinAbout?.trim() || initialLinkedinData.about,
                skills: linkedinSkillsList,
            };

            updateProfile({
                name: values.name,
                password: values.password || undefined,
                newPassword: values.newPassword || undefined,
                githubUrl: values.githubUrl?.trim() || null,
                linkedinUrl: values.linkedinUrl?.trim() || null,
                linkedinData: linkedinDataPayload,
            })
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error);
                    }
                    if (data.success) {
                        toast.success(data.success);
                        form.reset({
                            ...values,
                            password: "",
                            newPassword: "",
                        });
                    }
                })
                .catch(() => toast.error("Something went wrong!"));
        });
    }

    function onInvalid(errors: any) {
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];
        if (firstError?.message) {
            toast.error(firstError.message);
        } else {
            toast.error("Please check the form for errors.");
        }
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                    {/* Social Profiles Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                Social Profiles
                            </CardTitle>
                            <CardDescription>
                                Add your public GitHub and LinkedIn profiles to calculate contextual role-specific scoring against job descriptions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="githubUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Github className="h-4 w-4" />
                                            GitHub Profile
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="https://github.com/username"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            We evaluate public project repositories, tech stack, and code relevance to target job descriptions.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="linkedinUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Linkedin className="h-4 w-4 text-blue-600" />
                                            LinkedIn Profile
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Your profile URL connects your career presence for role alignment and consistency.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Safe LinkedIn Data Import / Paste Section */}
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        Optional: Provide LinkedIn profile details to boost your LinkedIn role score safely.
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7 text-primary"
                                        onClick={() => setShowLinkedInDetails(!showLinkedInDetails)}
                                    >
                                        {showLinkedInDetails ? "Hide Details" : "Add Profile Highlights"}
                                    </Button>
                                </div>

                                {showLinkedInDetails && (
                                    <div className="mt-3 space-y-3 bg-muted/30 p-3 rounded-md border text-sm">
                                        <FormField
                                            control={form.control}
                                            name="linkedinHeadline"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Headline</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={isPending || isSocialPending}
                                                            placeholder="Senior Backend Engineer | Node.js | Distributed Systems"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="linkedinSkills"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Skills (Comma-separated)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={isPending || isSocialPending}
                                                            placeholder="Node.js, PostgreSQL, Docker, AWS, Redis"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="linkedinAbout"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">About Summary</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            disabled={isPending || isSocialPending}
                                                            placeholder="Experienced backend developer specializing in high-throughput microservices..."
                                                            className="min-h-[80px]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Save Social Profiles Button */}
                            <div className="pt-3 flex justify-end">
                                <Button
                                    type="button"
                                    onClick={onSaveSocialOnly}
                                    disabled={isPending || isSocialPending}
                                    className="h-9 px-4 text-xs font-medium"
                                >
                                    {isSocialPending ? "Saving Social Profiles..." : "Save Social Profiles"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update your name and authentication settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={isPending} placeholder="John Doe" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Change Password</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={isPending} type="password" placeholder="******" />
                                                </FormControl>
                                                <FormDescription>Required to set a new password.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={isPending} type="password" placeholder="******" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

