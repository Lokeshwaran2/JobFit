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

    const planDetails = {
        starter: {
            name: "Starter Plan",
            price: "₹99",
            description: "20 Credits for resume optimization"
        },
        jobhunt: {
            name: "Job Hunt Mode",
            price: "₹299",
            description: "Unlimited access & PDF downloads"
        }
    };

    const selectedPlan = plan && (plan === "starter" || plan === "jobhunt") ? planDetails[plan] : null;

    const handlePayment = async () => {
        if (!selectedPlan) return;
        setLoading(true);

        try {
            // 1. Create Order
            const res = await fetch("/api/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });

            if (!res.ok) throw new Error("Failed to create order");
            const data = await res.json();

            // 2. Open Razorpay Modal
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "JobFit",
                description: selectedPlan.name,
                order_id: data.orderId,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                plan
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Payment Successful!");
                            router.push("/dashboard?success=true");
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    // We could pass user details here if available in context
                },
                theme: {
                    color: "#0f172a"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
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

            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Checkout</CardTitle>
                    <CardDescription>Complete your purchase securely</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                                <p className="text-sm text-slate-500">{selectedPlan.description}</p>
                            </div>
                            <div className="text-xl font-bold">{selectedPlan.price}</div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button
                        className="w-full h-11 text-lg"
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Pay {selectedPlan.price}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Secure payment via Razorpay.
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