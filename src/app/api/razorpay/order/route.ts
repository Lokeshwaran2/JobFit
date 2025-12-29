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
        const { plan, currency = "INR" } = body; // plan: "starter" | "jobhunt"

        if (!plan) {
            return new NextResponse("Plan is required", { status: 400 });
        }

        let amountInPaise = 0;

        // Define Pricing (Make sure this matches frontend display)
        // INR values
        // Starter: ₹99
        // JobHunt: ₹299

        // Handling currency conversion simply for now or strictly enforce INR if using Indian Razorpay account
        // Assuming INR for simplicity as Razorpay is primarily INR.

        if (plan === "starter") {
            amountInPaise = 99 * 100;
        } else if (plan === "jobhunt") {
            amountInPaise = 299 * 100;
        } else {
            return new NextResponse("Invalid plan", { status: 400 });
        }

        // Create Order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${session.user.id.slice(0, 5)}`,
            notes: {
                userId: session.user.id,
                plan: plan
            }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("[RAZORPAY_ORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
