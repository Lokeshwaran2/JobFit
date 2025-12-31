"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingSectionProps {
    userId: string;
    isPro: boolean;
    credits: number;
}

export function PricingSection({ userId, isPro, credits }: PricingSectionProps) {
    const router = useRouter();
    const currency = "INR";

    const pricing = {
        INR: { symbol: "₹", credit: 99, pro: 299 },
    };

    const currentPricing = pricing[currency];

    const handleCheckout = (plan: "starter" | "jobhunt") => {
        router.push(`/checkout?plan=${plan}`);
    };

    return (
        <section id="pricing" className="py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-transparent">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Don’t change your skills — change how your resume presents them.
                    </p>


                </div>
                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
                    {/* Free Tier */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Check Your Fit</CardTitle>
                            <CardDescription>Hook users emotionally before charging.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">{currentPricing.symbol}0</div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Upload resume + JD</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> ATS match score</li>
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
                            <CardTitle>Starter Plan</CardTitle>
                            <CardDescription>Perfect for active job seekers</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">{currentPricing.symbol}{currentPricing.credit} <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 20 Credits / month</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> High ATS-score rewrite</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Professional formatting</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Rollover unused credits</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => handleCheckout("starter")}>
                                Get 20 Credits
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Unlimited */}
                    <Card className="flex flex-col bg-slate-900 text-white dark:bg-slate-50 dark:text-black">
                        <CardHeader>
                            <CardTitle className="text-white dark:text-black">Job Hunt Mode</CardTitle>
                            <CardDescription className="text-slate-300 dark:text-slate-600">Best Value</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold">{currentPricing.symbol}{currentPricing.pro} <span className="text-sm font-normal text-slate-300 dark:text-slate-600">/ month</span></div>
                            <ul className="mt-4 space-y-2">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Unlimited JD-based resumes</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Unlimited ATS optimization</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> Multiple job applications</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-400" /> PDF + DOCX download</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-white text-black hover:bg-slate-200 dark:bg-black dark:text-white dark:hover:bg-slate-800"
                                onClick={() => handleCheckout("jobhunt")}
                                disabled={isPro}
                            >
                                {isPro ? "Current Plan" : "Go Unlimited"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>✔ Used by job seekers applying to top companies</p>
                    <p>✔ ATS-safe formatting</p>
                    <p>✔ No data stored permanently</p>
                    <p>✔ Cancel anytime</p>
                </div>
            </div>
        </section>
    );
}
