import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(bodyText)
                .digest("hex");

            if (expectedSignature !== signature) {
                return new NextResponse("Invalid webhook signature", { status: 400 });
            }
        }

        const event = JSON.parse(bodyText);
        const eventType = event.event;

        // AutoPay Subscription Renewal Charge Success Event
        if (eventType === "subscription.charged" || eventType === "invoice.paid") {
            const payload = event.payload;
            const subscription = payload.subscription?.entity || payload.invoice?.entity;
            const userId = subscription?.notes?.userId;
            const userEmail = subscription?.customer_email;

            let user = null;
            if (userId) {
                user = await prisma.user.findUnique({ where: { id: userId } });
            } else if (userEmail) {
                user = await prisma.user.findUnique({ where: { email: userEmail } });
            }

            if (user) {
                // Calculate next renewal date exactly 1 calendar month from today (payment date)
                const chargeDate = new Date();
                const nextRenewalDate = new Date(chargeDate.getTime());
                const targetMonth = (nextRenewalDate.getMonth() + 1) % 12;

                nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
                if (nextRenewalDate.getMonth() !== targetMonth) {
                    nextRenewalDate.setDate(0); // Handle boundary overflow (e.g. Aug 31 -> Sep 30)
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        isPro: true,
                        stripeCurrentPeriodEnd: nextRenewalDate
                    }
                });

                console.log(`[RAZORPAY_AUTOPAY_WEBHOOK] Renewed subscription for user ${user.id} until ${nextRenewalDate.toISOString()}`);
            }
        } else if (eventType === "subscription.halted" || eventType === "subscription.cancelled") {
            const userId = event.payload?.subscription?.entity?.notes?.userId;
            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isPro: false
                    }
                });
                console.log(`[RAZORPAY_AUTOPAY_WEBHOOK] Cancelled subscription for user ${userId}`);
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("[RAZORPAY_WEBHOOK_ERROR]", error);
        return new NextResponse("Webhook processing error", { status: 500 });
    }
}
