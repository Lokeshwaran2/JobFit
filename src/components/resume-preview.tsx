"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ResumeDocument } from "./resume-document";
import { useEffect, useState, useRef } from "react";

// Dynamically import BlobProvider to avoid SSR issues with @react-pdf/renderer
const BlobProvider = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.BlobProvider),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[600px] items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ),
    }
);

export function ResumePreview({ data, isMobile }: { data: any, isMobile?: boolean }) {
    // Estimate PDF height to force scrollable container
    const contentHeight = Math.max(1150, 1000 + ((data.experience?.length || 0) * 180) + ((data.projects?.length || 0) * 120));

    return (
        <div className={`${isMobile ? 'h-auto min-h-[600px]' : 'h-full'} w-full overflow-hidden rounded-lg border bg-background shadow-sm`}>
            <BlobProvider document={<ResumeDocument data={data} />} key={JSON.stringify(data)}>
                {({ url, loading, error }) => {
                    if (loading) {
                        return (
                            <div className="flex h-full items-center justify-center bg-muted/50">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        );
                    }
                    if (error) {
                        return (
                            <div className="flex h-full items-center justify-center text-red-500">
                                Failed to generate PDF
                            </div>
                        );
                    }
                    return (
                        <div className="h-full w-full overflow-y-auto relative bg-gray-50/50">
                            {/* Content Wrapper with estimated height */}
                            <div style={{ height: `${contentHeight}px`, width: '100%' }} className="relative">
                                <iframe
                                    src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                    className={`w-full h-full border-none ${isMobile ? '' : 'pointer-events-none'}`}
                                    title="Resume Preview"
                                />
                                {/* Overlay to block interactions - Desktop only */}
                                {!isMobile && (
                                    <div
                                        className="absolute inset-0 z-10 bg-transparent"
                                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                }}
            </BlobProvider>
        </div>
    );
}
