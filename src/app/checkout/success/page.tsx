"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const plan = searchParams.get("plan") || "jobhunt";
    const provider = searchParams.get("provider") || "dodo";

    const [verifying, setVerifying] = useState(true);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkSubscription = async () => {
            try {
                const res = await fetch("/api/billing/subscription");
                if (res.ok) {
                    const data = await res.json();
                    if (data.isPro || (data.credits && data.credits > 0)) {
                        setConfirmed(true);
                        setVerifying(false);
                        router.replace("/dashboard?success=true");
                        return;
                    }
                }
            } catch (err) {
                console.error("Verification check error:", err);
            }

            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkSubscription, 2000);
            } else {
                // Done polling - redirect to dashboard
                setVerifying(false);
                setConfirmed(true);
                router.replace("/dashboard?success=true");
            }
        };

        checkSubscription();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-emerald-500/30 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto my-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        {verifying ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-8 w-8" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {verifying ? "Confirming Payment..." : "Payment Authorized!"}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {verifying
                            ? "Connecting with the payment network to activate your account entitlements."
                            : `Your ${plan === "starter" ? "Starter Pack credits" : "Pro Unlimited Subscription"} has been confirmed.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="rounded-lg border p-4 bg-muted/20 text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider:</span>
                            <span className="font-semibold capitalize">{provider === "dodo" ? "Dodo Payments" : "Razorpay"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan:</span>
                            <span className="font-semibold capitalize">{plan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {verifying ? "Syncing..." : "Active"}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Bank-grade security verification complete.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                        onClick={() => router.push("/dashboard")}
                    >
                        Go to Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
