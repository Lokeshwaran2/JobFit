import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Zap } from "lucide-react";

interface SubscriptionCardProps {
    isPro: boolean;
    credits: number;
    renewalDate?: Date | null;
}

export function SubscriptionCard({ isPro, credits, renewalDate }: SubscriptionCardProps) {
    const formatDate = (date?: Date | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Subscription & Credits</CardTitle>
                        <CardDescription>Manage your plan and usage</CardDescription>
                    </div>
                    {isPro ? (
                        <Badge variant="default" className="bg-gradient-to-r from-indigo-500 to-purple-500">PRO PLAN</Badge>
                    ) : (
                        <Badge variant="secondary">STARTER PLAN</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Zap className="h-6 w-6 text-yellow-500" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Available Credits</p>
                            <p className="text-2xl font-bold">{isPro ? "Unlimited" : credits}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Calendar className="h-6 w-6 text-primary" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Renewal Date</p>
                            <p className="text-sm text-muted-foreground">{formatDate(renewalDate)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    {/* In a real app, this would link to the Razorpay Customer Portal if applicable */}
                    <a href="/subscription">
                        <Button variant="outline">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Subscription
                        </Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
