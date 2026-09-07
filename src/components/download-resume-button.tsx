"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileCode,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeDialog } from "./upgrade-dialog";
import { TemplateId } from "@/lib/templates/template-registry";
import { toast } from "sonner";

interface DownloadResumeButtonProps {
  data: any;
  resumeId?: string;
  templateId?: TemplateId;
  fileName?: string;
  isPro: boolean;
  credits: number;
}

export function DownloadResumeButton({
  data,
  resumeId,
  templateId = "classic",
  fileName = "JobFit_Resume",
  isPro,
  credits,
}: DownloadResumeButtonProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "docx" | null>(null);

  if (!isPro && (credits || 0) <= 0) {
    return (
      <UpgradeDialog>
        <Button size="sm" variant="default" className="h-8 gap-1.5 shadow-sm">
          <Download className="h-3.5 w-3.5" />
          Export Resume
        </Button>
      </UpgradeDialog>
    );
  }

  const handleExport = async (format: "pdf" | "docx") => {
    try {
      setDownloadingFormat(format);

      // If resumeId is available, download directly from authenticated export API
      if (resumeId) {
        const url = `/api/resume/${resumeId}/export?format=${format}&template=${templateId}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to export ${format.toUpperCase()}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;

        // Candidate clean filename
        const candidateName = (data?.personalInfo?.fullName || data?.personalInfo?.name || fileName)
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        link.download = `${candidateName}_${templateId}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        toast.success(`Exported ${format.toUpperCase()} successfully!`);
      } else {
        toast.error("Resume ID missing for export");
      }
    } catch (err: any) {
      console.error("[Export Error]:", err);
      toast.error(err?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const isLoading = downloadingFormat !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="default"
          disabled={isLoading}
          className="h-8 gap-1.5 shadow-sm font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span>Export</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Download Formats
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 cursor-pointer rounded-md hover:bg-accent"
        >
          <FileText className="h-4 w-4 text-red-500 shrink-0" />
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">PDF Document (.pdf)</span>
            <span className="text-[11px] text-muted-foreground">Vector text, ATS-ready layout</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("docx")}
          disabled={isLoading}
          className="flex items-center gap-2 p-2 cursor-pointer rounded-md hover:bg-accent"
        >
          <FileCode className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">Word Document (.docx)</span>
            <span className="text-[11px] text-muted-foreground">Editable Microsoft Word OpenXML</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
