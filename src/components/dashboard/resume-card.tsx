"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Trash2 } from "lucide-react";
import { Resume } from "@prisma/client";
import { deleteResume } from "@/actions/resume";
import { useTransition, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Checkbox } from "@/components/ui/checkbox";

interface ResumeCardProps {
    resume: Resume;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

export function ResumeCard({ resume, isSelectMode = false, isSelected = false, onToggleSelect }: ResumeCardProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteResume(resume.id);
                setOpen(false);
            } catch (error) {
                console.error("Failed to delete resume:", error);
                alert("Failed to delete resume. Please try again.");
            }
        });
    };

    return (
        <>
            <Card
                className={`transition-all relative group cursor-pointer border ${
                    isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                        : "hover:border-primary/50 bg-card"
                }`}
                onClick={() => {
                    if (isSelectMode && onToggleSelect) {
                        onToggleSelect(resume.id);
                    }
                }}
            >
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3 min-w-0 pr-8">
                            {/* Multi-select Checkbox */}
                            {(isSelectMode || isSelected) && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSelect?.(resume.id);
                                    }}
                                    className="shrink-0"
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleSelect?.(resume.id)}
                                    />
                                </div>
                            )}
                            <CardTitle className="line-clamp-1 text-base font-semibold">{resume.title}</CardTitle>
                        </div>

                        {!isSelectMode && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sm:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(true);
                                }}
                                disabled={isPending}
                                title="Delete Resume"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex justify-between items-center mt-2">
                        <div className="text-sm font-medium">
                            Score: <span className={resume.atsScore >= 80 ? "text-green-600 font-bold" : resume.atsScore >= 50 ? "text-yellow-600 font-bold" : "text-red-600 font-bold"}>{resume.atsScore}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild={!isSelectMode}
                            onClick={(e) => {
                                if (isSelectMode) {
                                    e.stopPropagation();
                                    onToggleSelect?.(resume.id);
                                }
                            }}
                        >
                            {isSelectMode ? (
                                <span className="text-xs text-muted-foreground font-medium">
                                    {isSelected ? "Selected" : "Select"}
                                </span>
                            ) : (
                                <Link href={`/builder/${resume.id}`}>Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="shadow-xl bg-white dark:bg-slate-950 border-0 sm:rounded-xl">
                    <AlertDialogHeader className="space-y-2">
                        <AlertDialogTitle className="text-xl font-semibold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete your resume "{resume.title}" and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-2">
                        <AlertDialogCancel disabled={isPending} className="border-0 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 h-11">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700 text-white h-11 px-8 rounded-md transition-colors"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
