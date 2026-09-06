import { auth } from "@/auth";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubscriptionCard } from "@/components/subscription-card";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isPro: true,
            credits: true,
            stripeCurrentPeriodEnd: true,
            githubUrl: true,
            linkedinUrl: true,
            linkedinData: true,
        }
    });

    if (!user) redirect("/login");

    const subscription = await (prisma as any).subscription.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <SubscriptionCard
                isPro={user.isPro}
                credits={user.credits}
                renewalDate={subscription?.currentPeriodEnd || user.stripeCurrentPeriodEnd}
                provider={subscription?.provider}
                currency={subscription?.currency}
                amountMinor={subscription?.amountMinor}
                status={subscription?.status}
            />

            <SettingsForm user={user} />
        </div>
    );
}
