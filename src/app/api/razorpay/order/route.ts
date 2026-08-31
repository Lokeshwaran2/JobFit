import { auth } from "@/auth";
import { razorpay } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { plan, isAutoPay = false } = body; // plan: "starter" | "jobhunt"

        if (!plan) {
            return new NextResponse("Plan is required", { status: 400 });
        }

        let amountInPaise = 0;

        if (plan === "starter") {
            amountInPaise = 99 * 100;
        } else if (plan === "jobhunt") {
            amountInPaise = 299 * 100;
        } else {
            return new NextResponse("Invalid plan", { status: 400 });
        }

        // Check if AutoPay / Subscription is requested
        if (isAutoPay || plan === "jobhunt") {
            const planId = process.env.RAZORPAY_JOBHUNT_PLAN_ID;

            if (planId) {
                try {
                    const subscription = await razorpay.subscriptions.create({
                        plan_id: planId,
                        customer_notify: 1,
                        total_count: 12, // 12 billing cycles (monthly)
                        notes: {
                            userId: session.user.id,
                            plan: plan,
                            autoPay: "true"
                        }
                    });

                    return NextResponse.json({
                        subscriptionId: subscription.id,
                        isAutoPay: true,
                        amount: amountInPaise,
                        currency: "INR",
                        keyId: process.env.RAZORPAY_KEY_ID
                    });
                } catch (subError) {
                    console.warn("[RAZORPAY_SUB_CREATE_FALLBACK] Could not create subscription, falling back to auto-recurring order notes:", subError);
                }
            }
        }

        // Standard Order / Fallback Order Creation with AutoPay metadata
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${session.user.id.slice(0, 5)}`,
            notes: {
                userId: session.user.id,
                plan: plan,
                autoPay: isAutoPay ? "true" : "false"
            }
        });

        return NextResponse.json({
            orderId: order.id,
            isAutoPay: false,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("[RAZORPAY_ORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
