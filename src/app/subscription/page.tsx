"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function SubscriptionPage() {
    const currency = "INR";
    const currencySymbol = "₹";

    // Simple conversion rates for display (mock)
    const getPrice = (inrPrice: number) => {
        if (currency === "INR") return `₹${inrPrice}`;
        if (currency === "USD") {
            if (inrPrice === 99) return "$2.99";
            if (inrPrice === 299) return "$9.99";
            return `$${Math.ceil(inrPrice / 83)}`;
        }
        if (currency === "EUR") {
            if (inrPrice === 99) return "€2.99";
            if (inrPrice === 299) return "€9.99";
            return `€${Math.ceil(inrPrice / 90)}`;
        }
        return `₹${inrPrice}`;
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 md:px-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Don&apos;t change your skills — change how your resume presents them.
                    </p>


                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    {/* Plan 1: Check Your Fit */}
                    <Card className="border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">Check Your Fit</CardTitle>
                            <CardDescription className="text-slate-500 mt-2">
                                Hook users emotionally before charging.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            <div className="text-4xl font-bold text-slate-900">{currencySymbol}0</div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    Upload resume + JD
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    ATS match score
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    Skill gap insights
                                </li>
                                <li className="flex items-center text-slate-400">
                                    <X className="h-4 w-4 text-red-300 mr-2.5 shrink-0" />
                                    Resume download
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <div className="w-full py-2.5 px-4 bg-slate-50 text-slate-400 text-sm font-medium text-center border border-slate-100 rounded-md cursor-not-allowed select-none">
                                1 Free Credit Available
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Plan 2: Starter Plan */}
                    <Card className="border-slate-900 shadow-xl flex flex-col relative overflow-hidden scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">Starter Plan</CardTitle>
                            <CardDescription className="text-slate-500 mt-2">
                                Perfect for active job seekers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-bold text-slate-900">{getPrice(99)}</span>
                                <span className="text-slate-500 ml-1">/ month</span>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    20 Credits / month
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    High ATS-score rewrite
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    Professional formatting
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <Check className="h-4 w-4 text-green-500 mr-2.5 shrink-0" />
                                    Rollover unused credits
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-11" asChild>
                                <Link href="/checkout?plan=starter">Get 20 Credits</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Plan 3: Job Hunt Mode */}
                    <Card className="bg-slate-950 border-slate-950 text-white shadow-md flex flex-col relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-white">Job Hunt Mode</CardTitle>
                            <CardDescription className="text-slate-400 mt-2">
                                Best Value
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-bold text-white">{getPrice(299)}</span>
                                <span className="text-slate-400 ml-1">/ month</span>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-4 w-4 text-emerald-400 mr-2.5 shrink-0" />
                                    Unlimited JD-based resumes
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-4 w-4 text-emerald-400 mr-2.5 shrink-0" />
                                    Unlimited ATS optimization
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-4 w-4 text-emerald-400 mr-2.5 shrink-0" />
                                    Multiple job applications
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-4 w-4 text-emerald-400 mr-2.5 shrink-0" />
                                    PDF + DOCX download
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-bold h-11" asChild>
                                <Link href="/checkout?plan=jobhunt">Go Unlimited</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Footer Trust Indicators */}
                <div className="text-center space-y-2 pt-8">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Used by job seekers applying to top companies</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> ATS-safe formatting</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> No data stored permanently</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Cancel anytime</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
