"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import { CANONICAL_PLANS, SUPPORTED_CURRENCIES } from "@/lib/billing/currency-config";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan"); // "starter" | "jobhunt"
    const currencyParam = (searchParams.get("currency") || "INR").toUpperCase();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState(currencyParam);
    const [isAutoPay, setIsAutoPay] = useState(plan === "jobhunt");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isSupported = !!CANONICAL_PLANS[plan as "starter" | "jobhunt"];
    const planConfig = isSupported ? CANONICAL_PLANS[plan as "starter" | "jobhunt"] : null;
    const priceInfo = planConfig ? (planConfig.prices[currency] || planConfig.prices.INR) : null;
    const isDodo = currency !== "INR";

    const handlePayment = async () => {
        if (!planConfig) return;
        setErrorMessage(null);
        setLoading(true);

        try {
            // 1. Call unified Billing Checkout API
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: plan,
                    currency,
                    returnUrl: `${window.location.origin}/dashboard?success=true`,
                }),
            });

            if (res.status === 401) {
                toast.error("Please sign in to proceed with checkout.");
                router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                return;
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to initialize checkout session");
            }

            const data = await res.json();

            // 2A. Dodo Payments Flow (Global / Multi-Currency Hosted Checkout)
            if (data.provider === "dodo") {
                if (data.checkoutUrl) {
                    toast.loading("Redirecting to Dodo Payments secure checkout...");
                    window.location.href = data.checkoutUrl;
                    return;
                }
                throw new Error("No checkout URL returned by Dodo Payments provider");
            }

            // 2B. Razorpay Flow (INR Checkout)
            const options: any = {
                key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amountMinor || data.amount,
                currency: data.currency || "INR",
                name: "JobFit",
                description: `${planConfig.name} ${isAutoPay ? "(AutoPay Enabled)" : ""}`,
                handler: async function (response: any) {
                    // 3. Verify Razorpay Payment / Subscription
                    try {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                subscriptionId: response.razorpay_subscription_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                plan,
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Payment Successful & Subscription Activated!");
                            router.push("/dashboard?success=true");
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Payment verification failed");
                    }
                },
                theme: {
                    color: "#0f172a",
                },
            };

            if (data.orderId) {
                options.order_id = data.orderId;
            }

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error("[CHECKOUT_ERROR]", error);
            const msg = error.message || "Something went wrong initializing payment";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!planConfig || !priceInfo) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-500 flex items-center gap-2">
                            <AlertCircle /> Invalid Plan Selection
                        </CardTitle>
                        <CardDescription>The requested subscription plan could not be found.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push("/#pricing")}>Return to Pricing</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <Card className="w-full max-w-md shadow-xl border-indigo-500/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Secure Checkout</CardTitle>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isDodo 
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}>
                            {isDodo ? "Dodo Global" : "Razorpay AutoPay"}
                        </span>
                    </div>
                    <CardDescription>
                        {isDodo 
                            ? "Multi-currency recurring subscription powered by Dodo Payments"
                            : "Instant checkout with UPI AutoPay, NetBanking & Cards"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-lg">{planConfig.name}</h3>
                                <p className="text-sm text-slate-500">{planConfig.description}</p>
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {priceInfo.displayPrice}
                                {planConfig.isRecurring && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                            </div>
                        </div>

                        {/* Currency Selector */}
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Currency:
                            </span>
                            <div className="flex gap-1">
                                {(Object.keys(SUPPORTED_CURRENCIES) as Array<"INR" | "USD" | "EUR" | "GBP">).map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                            currency === c 
                                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-black border-transparent"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Autopay / Provider Banner */}
                    <div className={`p-3.5 rounded-lg border space-y-2 ${
                        isDodo 
                            ? "bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800"
                            : "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                    }`}>
                        <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isDodo ? "text-indigo-600" : "text-emerald-600"}`} />
                            <span>
                                {isDodo 
                                    ? "Global Recurring Autopay via Dodo Payments"
                                    : "Razorpay AutoPay (Recurring Billing)"}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {isDodo
                                ? "International Visa, Mastercard, Amex, and localized debit payment methods supported with bank-grade encryption."
                                : "Auto-renew monthly via UPI AutoPay, Cards, or NetBanking. Cancel anytime from your account settings."}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                    {errorMessage && (
                        <div className="w-full p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold mb-0.5">Checkout Notice</p>
                                <p className="leading-relaxed">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        className={`w-full h-11 text-base font-semibold text-white transition-all shadow ${
                            isDodo 
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {planConfig.isRecurring 
                            ? `Subscribe Now (${priceInfo.displayPrice}/mo)` 
                            : `Pay ${priceInfo.displayPrice}`}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        {isDodo ? "Protected by Dodo Payments" : "Secured by Razorpay Payments"}
                    </p>
                </CardFooter>
            </Card>
            <Toaster richColors position="top-right" />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}