import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { orderId, subscriptionId, paymentId, signature, plan } = body;

        if ((!orderId && !subscriptionId) || !paymentId || !signature || !plan) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Verify Signature
        // For Razorpay AutoPay Subscriptions: payment_id + "|" + subscription_id
        // For standard Orders: order_id + "|" + payment_id
        let isValidSignature = false;

        if (subscriptionId) {
            const expectedSubscriptionSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
                .update(paymentId + "|" + subscriptionId)
                .digest("hex");
            isValidSignature = expectedSubscriptionSignature === signature;
        } else if (orderId) {
            const expectedOrderSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
                .update(orderId + "|" + paymentId)
                .digest("hex");
            isValidSignature = expectedOrderSignature === signature;
        }

        if (!isValidSignature) {
            return new NextResponse("Invalid signature", { status: 400 });
        }

        // Payment Successful - Update DB
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        if (plan === "starter") {
            // Add 20 credits, remove 'pro' if meant to be only specific plans, but here "starter" is credits.
            // Wait, previous logic: starter = 20 credits. JobHunt = unlimited (pro).
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    credits: user.credits + 20
                }
            });
        } else if (plan === "jobhunt") {
            // Set Pro subscription for exactly 1 calendar month from payment day
            const paymentDate = new Date();
            const renewalDate = new Date(paymentDate.getTime());
            const targetMonth = (renewalDate.getMonth() + 1) % 12;

            renewalDate.setMonth(renewalDate.getMonth() + 1);
            if (renewalDate.getMonth() !== targetMonth) {
                renewalDate.setDate(0); // Handle month boundary overflow (e.g., Aug 31 -> Sep 30, Jan 31 -> Feb 28)
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isPro: true,
                    stripeCurrentPeriodEnd: renewalDate
                }
            });
        }

        // Record in unified billing models for consistent reporting
        try {
            const amountMinor = plan === "starter" ? 9900 : 29900;
            await (prisma as any).payment.upsert({
                where: {
                    provider_providerPaymentId: {
                        provider: "razorpay",
                        providerPaymentId: paymentId,
                    }
                },
                update: { status: "succeeded" },
                create: {
                    userId: user.id,
                    provider: "razorpay",
                    providerPaymentId: paymentId,
                    amountMinor,
                    currency: "INR",
                    status: "succeeded",
                    type: subscriptionId ? "renewal" : "initial",
                    paidAt: new Date(),
                }
            });

            if (subscriptionId || plan === "jobhunt") {
                const now = new Date();
                const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                await (prisma as any).subscription.upsert({
                    where: { id: subscriptionId || `sub_rzp_${user.id}` },
                    update: {
                        status: "active",
                        currentPeriodEnd: nextMonth,
                    },
                    create: {
                        userId: user.id,
                        planId: "jobhunt",
                        provider: "razorpay",
                        providerSubscriptionId: subscriptionId || undefined,
                        currency: "INR",
                        amountMinor: 29900,
                        interval: "month",
                        intervalCount: 1,
                        status: "active",
                        currentPeriodStart: now,
                        currentPeriodEnd: nextMonth,
                    }
                });
            }
        } catch (billingSyncErr) {
            console.warn("[RAZORPAY_VERIFY_BILLING_SYNC_WARN]", billingSyncErr);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[RAZORPAY_VERIFY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
