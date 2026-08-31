"use client";

import { useState, useTransition } from "react";
import { Resume } from "@prisma/client";
import { ResumeCard } from "./resume-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, CheckSquare, X, AlertTriangle } from "lucide-react";
import { deleteResumes } from "@/actions/resume";
import { toast } from "sonner";
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

interface ResumeListProps {
    resumes: Resume[];
}

export function ResumeList({ resumes }: ResumeListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(resumes.map((r) => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = () => {
        startTransition(async () => {
            try {
                await deleteResumes(selectedIds);
                toast.success(`Successfully deleted ${selectedIds.length} resume(s)!`);
                setSelectedIds([]);
                setIsSelectMode(false);
                setConfirmOpen(false);
            } catch (error) {
                console.error("Bulk delete failed:", error);
                toast.error("Failed to delete selected resumes.");
            }
        });
    };

    const isAllSelected = resumes.length > 0 && selectedIds.length === resumes.length;

    return (
        <div className="space-y-4">
            {/* Toolbar for Multi-Select */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Button
                        variant={isSelectMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                            if (isSelectMode) {
                                setIsSelectMode(false);
                                setSelectedIds([]);
                            } else {
                                setIsSelectMode(true);
                            }
                        }}
                    >
                        {isSelectMode ? (
                            <>
                                <X className="mr-1.5 h-4 w-4" /> Cancel Selection
                            </>
                        ) : (
                            <>
                                <CheckSquare className="mr-1.5 h-4 w-4" /> Select Multiple
                            </>
                        )}
                    </Button>

                    {isSelectMode && (
                        <div className="flex items-center gap-2 text-sm pl-1">
                            <Checkbox
                                id="select-all"
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                            <label
                                htmlFor="select-all"
                                className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground"
                            >
                                Select All ({resumes.length})
                            </label>
                        </div>
                    )}
                </div>

                {isSelectMode && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            {selectedIds.length} selected
                        </span>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={selectedIds.length === 0 || isPending}
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected ({selectedIds.length})
                        </Button>
                    </div>
                )}
            </div>

            {/* Resume Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                    <ResumeCard
                        key={resume.id}
                        resume={resume}
                        isSelectMode={isSelectMode}
                        isSelected={selectedIds.includes(resume.id)}
                        onToggleSelect={handleToggleSelect}
                    />
                ))}
            </div>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="shadow-xl bg-white dark:bg-slate-950 border-0 sm:rounded-xl">
                    <AlertDialogHeader className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertDialogTitle className="text-xl font-semibold">
                                Delete {selectedIds.length} Resume(s)?
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete {selectedIds.length} selected resume(s) from your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-2">
                        <AlertDialogCancel disabled={isPending} className="border-0 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 h-11">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700 text-white h-11 px-8 rounded-md transition-colors"
                        >
                            {isPending ? "Deleting..." : `Delete ${selectedIds.length} Resumes`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
