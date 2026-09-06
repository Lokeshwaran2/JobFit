"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Zap, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatAmountMinor } from "@/lib/billing/currency-config";

interface SubscriptionCardProps {
    isPro: boolean;
    credits: number;
    renewalDate?: Date | null;
    provider?: string | null;
    currency?: string | null;
    amountMinor?: number | null;
    status?: string | null;
}

export function SubscriptionCard({
    isPro,
    credits,
    renewalDate,
    provider,
    currency,
    amountMinor,
    status
}: SubscriptionCardProps) {
    const [loadingPortal, setLoadingPortal] = useState(false);

    const formatDate = (date?: Date | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleManage = async () => {
        setLoadingPortal(true);
        try {
            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returnUrl: window.location.href }),
            });

            if (!res.ok) {
                toast.info("Customer portal is only available for active Dodo subscriptions.");
                return;
            }

            const data = await res.json();
            if (data.url && data.url !== "/dashboard" && data.url.startsWith("http")) {
                window.location.href = data.url;
            } else {
                toast.info("Manage subscription details via your payment provider.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to open subscription management portal.");
        } finally {
            setLoadingPortal(false);
        }
    };

    const providerLabel = provider === "dodo" 
        ? "Dodo Payments (Global Recurring)" 
        : provider === "razorpay" 
        ? "Razorpay (INR AutoPay)" 
        : "Standard";

    const formattedAmount = (amountMinor && currency)
        ? `${formatAmountMinor(amountMinor, currency)}/mo`
        : isPro ? "Active Recurring" : "Free";

    return (
        <Card className="border shadow-sm">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-xl">Subscription & Plan Details</CardTitle>
                        <CardDescription>Multi-currency billing, auto-renewal, and usage credits</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {provider && (
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                                {providerLabel}
                            </Badge>
                        )}
                        {isPro ? (
                            <Badge variant="default" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold">
                                PRO UNLIMITED
                            </Badge>
                        ) : (
                            <Badge variant="secondary">STARTER PLAN</Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center space-x-3 rounded-lg border p-4 bg-muted/20">
                        <Zap className="h-6 w-6 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Credits</p>
                            <p className="text-xl font-bold truncate">{isPro ? "Unlimited" : credits}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 bg-muted/20">
                        <Calendar className="h-6 w-6 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing / Expiry</p>
                            <p className="text-sm font-semibold truncate">{formatDate(renewalDate)}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 bg-muted/20">
                        <CreditCard className="h-6 w-6 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recurring Rate</p>
                            <p className="text-base font-bold truncate">{formattedAmount}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 bg-muted/20">
                        <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                            <p className="text-sm font-semibold capitalize truncate">{status || (isPro ? "active" : "inactive")}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>
                        {provider === "dodo" 
                            ? "Dodo Payments manages your recurring subscription & payment method automatically." 
                            : "Protected by 256-bit bank-grade encryption."}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleManage}
                        disabled={loadingPortal}
                        className="gap-1.5"
                    >
                        {loadingPortal ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CreditCard className="h-3.5 w-3.5" />
                        )}
                        Manage Subscription
                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
