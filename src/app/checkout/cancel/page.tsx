"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function CheckoutCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-amber-500/30 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto my-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Checkout Cancelled</CardTitle>
                    <CardDescription className="text-sm">
                        No charges were made. You can try again whenever you're ready.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-xs text-muted-foreground pt-2">
                    If you ran into any issues with payment methods or currency selection, you can return to pricing and pick an alternative.
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/#pricing")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Pricing
                    </Button>
                    <Button 
                        className="w-full"
                        onClick={() => router.push("/dashboard")}
                    >
                        Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
