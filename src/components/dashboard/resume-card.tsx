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

interface ResumeCardProps {
    resume: Resume;
}

export function ResumeCard({ resume }: ResumeCardProps) {
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
            <Card className="hover:border-primary/50 transition-colors relative group">
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="line-clamp-1">{resume.title}</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white/80 backdrop-blur-sm sm:bg-transparent"
                            onClick={() => setOpen(true)}
                            disabled={isPending}
                            title="Delete Resume"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mt-2">
                        <div className="text-sm font-medium">
                            Score: <span className={resume.atsScore > 80 ? "text-green-600" : "text-yellow-600"}>{resume.atsScore}</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/builder/${resume.id}`}>Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="shadow-xl bg-white border-0 sm:rounded-xl">
                    <AlertDialogHeader className="space-y-2">
                        <AlertDialogTitle className="text-xl font-semibold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete your resume "{resume.title}" and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-2">
                        <AlertDialogCancel disabled={isPending} className="border-0 shadow-none hover:bg-slate-100 h-11">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-black hover:bg-gray-800 text-white h-11 px-8 rounded-md transition-colors"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
