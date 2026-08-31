"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan"); // "starter" | "jobhunt"
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [isAutoPay, setIsAutoPay] = useState(true); // Default AutoPay for recurring subscription

    const planDetails = {
        starter: {
            name: "Starter Plan",
            price: "₹99",
            description: "20 Credits for resume optimization",
            recurring: false
        },
        jobhunt: {
            name: "Job Hunt Mode",
            price: "₹299/mo",
            description: "Unlimited access & PDF downloads",
            recurring: true
        }
    };

    const selectedPlan = plan && (plan === "starter" || plan === "jobhunt") ? planDetails[plan] : null;

    const handlePayment = async () => {
        if (!selectedPlan) return;
        setLoading(true);

        try {
            // 1. Create Order or AutoPay Subscription
            const res = await fetch("/api/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, isAutoPay }),
            });

            if (!res.ok) throw new Error("Failed to initialize payment");
            const data = await res.json();

            // 2. Configure Razorpay Modal Options for AutoPay or Standard Order
            const options: any = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "JobFit",
                description: `${selectedPlan.name} ${isAutoPay ? "(AutoPay Enabled)" : ""}`,
                handler: async function (response: any) {
                    // 3. Verify Payment / Subscription
                    try {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                subscriptionId: response.razorpay_subscription_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                plan
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Payment Successful & AutoPay Activated!");
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
                    color: "#0f172a"
                }
            };

            // Set subscription_id for AutoPay or order_id for standard order
            if (data.subscriptionId) {
                options.subscription_id = data.subscriptionId;
            } else if (data.orderId) {
                options.order_id = data.orderId;
            }

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong initializing payment");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedPlan) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-500 flex items-center gap-2">
                            <AlertCircle /> Invalid Plan
                        </CardTitle>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => router.push("/subscription")}>Go Back</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <Card className="w-full max-w-md shadow-lg border-emerald-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Checkout</span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                            AutoPay Enabled
                        </span>
                    </CardTitle>
                    <CardDescription>Complete your purchase with UPI AutoPay & Cards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 bg-white dark:bg-slate-900">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                                <p className="text-sm text-slate-500">{selectedPlan.description}</p>
                            </div>
                            <div className="text-xl font-bold">{selectedPlan.price}</div>
                        </div>
                    </div>

                    {/* AutoPay Settings Banner */}
                    <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-xs text-emerald-900 dark:text-emerald-300">
                                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Razorpay AutoPay (Recurring Billing)</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAutoPay}
                                    onChange={(e) => setIsAutoPay(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/90 leading-relaxed">
                            {isAutoPay
                                ? "Auto-renew monthly via GPay, PhonePe, Paytm UPI AutoPay, Debit/Credit Cards, or NetBanking. Cancel anytime from your dashboard."
                                : "One-time payment for this billing cycle."}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow"
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAutoPay ? `Enable AutoPay (${selectedPlan.price})` : `Pay ${selectedPlan.price}`}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        🔒 Secured by Razorpay UPI AutoPay & Mandate API
                    </p>
                </CardFooter>
            </Card>
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