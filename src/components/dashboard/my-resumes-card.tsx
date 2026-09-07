"use client";

import { useState } from "react";
import Link from "next/link";
import { Resume } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { ResumeList } from "./resume-list";

interface MyResumesCardProps {
  resumes: Resume[];
  newResumeHref: string;
}

export function MyResumesCard({ resumes, newResumeHref }: MyResumesCardProps) {
  const [isOpen, setIsOpen] = useState(true); // Expanded by default

  return (
    <Card className="border shadow-xs overflow-hidden bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        {/* Header & Clickable Trigger Bar */}
        <div
          className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/30 transition-colors select-none"
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          aria-expanded={isOpen}
          aria-label="Toggle My Resumes"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  My Resumes
                </h3>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {resumes.length} {resumes.length === 1 ? "Resume" : "Resumes"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate sm:max-w-xl">
                Manage your AI-tailored resumes and job match scores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-xs h-8 sm:h-9 px-3 sm:px-4 gap-1.5 shadow-xs"
            >
              <Link href={newResumeHref}>
                <Plus className="h-3.5 w-3.5" />
                <span>New Resume</span>
              </Link>
            </Button>

            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle My Resumes</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible Content */}
        <CollapsibleContent className="border-t border-slate-100 dark:border-slate-800">
          <CardContent className="p-4 sm:p-6">
            {resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed p-6">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">No resumes yet</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm mt-1">
                  Create your first tailored resume by matching your skills to a job description.
                </p>
                <Button asChild size="sm">
                  <Link href={newResumeHref}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Resume
                  </Link>
                </Button>
              </div>
            ) : (
              <ResumeList resumes={resumes} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
