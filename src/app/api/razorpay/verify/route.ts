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
        const { orderId, paymentId, signature, plan } = body;

        if (!orderId || !paymentId || !signature || !plan) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Verify Signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        if (generatedSignature !== signature) {
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
            // Set Pro for 30 days
            const currentDate = new Date();
            const nextMonth = new Date(currentDate.setMonth(currentDate.getMonth() + 1));

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isPro: true,
                    // We reuse stripeCurrentPeriodEnd field for renewal date for now
                    stripeCurrentPeriodEnd: nextMonth
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[RAZORPAY_VERIFY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
