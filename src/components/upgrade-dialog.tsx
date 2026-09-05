"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Zap, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface UpgradeDialogProps {
    children: React.ReactNode;
}

export function UpgradeDialog({ children }: UpgradeDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Unlock Full Access</DialogTitle>
                    </div>
                    <DialogDescription>
                        Upgrade to Pro to download your ATS-optimized resume in PDF format.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                        <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Unlimited AI Resume Scans</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Unlimited PDF Downloads</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Premium Templates</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-lg">
                            <Link href="/subscription">
                                Upgrade to Pro - ₹299/mo
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
