"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Globe, ShieldCheck, CreditCard } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANONICAL_PLANS, SUPPORTED_CURRENCIES } from "@/lib/billing/currency-config";

interface PricingSectionProps {
    userId: string;
    isPro: boolean;
    credits: number;
}

export function PricingSection({ userId, isPro, credits }: PricingSectionProps) {
    const router = useRouter();
    const [currency, setCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">("INR");

    const starterPricing = CANONICAL_PLANS.starter.prices[currency] || CANONICAL_PLANS.starter.prices.INR;
    const jobhuntPricing = CANONICAL_PLANS.jobhunt.prices[currency] || CANONICAL_PLANS.jobhunt.prices.INR;
    const currentCurrencyConfig = SUPPORTED_CURRENCIES[currency];

    const isDodo = currency !== "INR";

    const handleCheckout = (plan: "starter" | "jobhunt") => {
        router.push(`/checkout?plan=${plan}&currency=${currency}`);
    };

    return (
        <section id="pricing" className="py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-transparent">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        Global Multi-Currency Billing
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Choose the plan that fits your career search. Secure recurring checkout in your local currency.
                    </p>

                    {/* Currency Selector */}
                    <div className="pt-2 flex flex-col items-center gap-2">
                        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/40 dark:border-slate-700/40">
                            {(Object.keys(SUPPORTED_CURRENCIES) as Array<"INR" | "USD" | "EUR" | "GBP">).map((curr) => {
                                const cfg = SUPPORTED_CURRENCIES[curr];
                                const active = currency === curr;
                                return (
                                    <button
                                        key={curr}
                                        onClick={() => setCurrency(curr)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                                            active
                                                ? "bg-white dark:bg-slate-900 text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <span>{cfg.symbol}</span>
                                        <span>{curr}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-primary" />
                            {isDodo 
                                ? "Global recurring payments powered by Dodo Payments (International cards, Autopay)"
                                : "India recurring payments powered by Razorpay (UPI, Netbanking, Domestic cards)"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
                    {/* Free Tier */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Check Your Fit</CardTitle>
                            <CardDescription>Hook your target role with instant match diagnosis.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">{currentCurrencyConfig.symbol}0</div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Upload resume + JD</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 10-Factor ATS match score</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Skill gap insights</li>
                                <li className="flex items-center text-muted-foreground"><span className="mr-2 text-red-500">✕</span> Resume download</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" disabled={true}>
                                {credits > 0 ? `${credits} Free Credit${credits > 1 ? 's' : ''} Available` : "Check My ATS Score"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Starter Plan */}
                    <Card className="flex flex-col border-primary relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                            POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle>Starter Pack</CardTitle>
                            <CardDescription>Perfect for targeted applications</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">
                                {starterPricing.displayPrice} 
                                <span className="text-sm font-normal text-muted-foreground"> / one-time</span>
                            </div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 20 Full Credits</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Google XYZ achievement rewrites</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> ATS-optimized PDF & DOCX export</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> No automatic renewal</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => handleCheckout("starter")}>
                                Get 20 Credits ({starterPricing.displayPrice})
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Unlimited */}
                    <Card className="flex flex-col bg-slate-900 text-white dark:bg-slate-50 dark:text-black relative">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                            AUTOPAY / RECURRING
                        </div>
                        <CardHeader>
                            <CardTitle className="text-white dark:text-black">Job Hunt Mode</CardTitle>
                            <CardDescription className="text-slate-300 dark:text-slate-600">Best Value • Unlimited Access</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">
                                {jobhuntPricing.displayPrice} 
                                <span className="text-sm font-normal text-slate-300 dark:text-slate-600"> / month</span>
                            </div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Unlimited JD-based tailored resumes</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> GitHub & LinkedIn profile match auditing</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Autonomous skill gap roadmaps & capstones</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Automatic recurring billing (cancel anytime)</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-white text-black hover:bg-slate-200 dark:bg-black dark:text-white dark:hover:bg-slate-800"
                                onClick={() => handleCheckout("jobhunt")}
                                disabled={isPro}
                            >
                                {isPro ? "Current Active Plan" : `Subscribe (${jobhuntPricing.displayPrice}/mo)`}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> 256-bit encrypted checkout</span>
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> 10-Factor ATS verification guaranteed</span>
                    <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-emerald-500" /> Cancel anytime via self-serve portal</span>
                </div>
            </div>
        </section>
    );
}
