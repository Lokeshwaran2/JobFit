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
            try {
                let planId = process.env.RAZORPAY_JOBHUNT_PLAN_ID;

                // Dynamically create Razorpay Plan if not pre-configured in .env
                if (!planId) {
                    const dynamicPlan = await razorpay.plans.create({
                        period: "monthly",
                        interval: 1,
                        item: {
                            name: plan === "starter" ? "JobFit Starter Plan" : "JobFit Job Hunt Mode",
                            amount: amountInPaise,
                            currency: "INR",
                            description: "Monthly AutoPay Subscription for JobFit"
                        }
                    });
                    planId = dynamicPlan.id;
                }

                // Create Razorpay Subscription ID for AutoPay UPI / Mandate / Card Standing Instructions
                const subscription = await razorpay.subscriptions.create({
                    plan_id: planId,
                    customer_notify: 1,
                    total_count: 12, // 12 monthly billing cycles
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
                console.error("[RAZORPAY_SUBSCRIPTION_CREATION_FAILED]", subError);
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
