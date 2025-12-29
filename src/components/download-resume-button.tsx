"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Download, Eye, Loader2, Lock } from "lucide-react";
import { ResumeDocument } from "./resume-document";
import { UpgradeDialog } from "./upgrade-dialog";

const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button disabled size="sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</Button> }
);

export function DownloadResumeButton({ data, fileName, isPro, credits }: { data: any, fileName: string, isPro: boolean, credits: number }) {

    if (!isPro && (credits || 0) <= 0) {
        return (
            <UpgradeDialog>
                <Button size="sm" variant="default">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview PDF
                </Button>
            </UpgradeDialog>
        );
    }

    return (
        <PDFDownloadLink
            key={JSON.stringify(data)}
            document={<ResumeDocument data={data} />}
            fileName={fileName}
        >
            {({ blob, url, loading, error }) => (
                <Button size="sm" disabled={loading} variant="default">
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Download PDF
                </Button>
            )}
        </PDFDownloadLink>
    );
}
