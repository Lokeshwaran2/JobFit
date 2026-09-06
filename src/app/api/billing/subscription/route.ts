import { auth } from "@/auth";
import { BillingService } from "@/lib/billing/billing-service";
import { dodoProvider } from "@/lib/billing/dodo-provider";
import { razorpayProvider } from "@/lib/billing/razorpay-provider";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const [subscription, dbUser] = await Promise.all([
      BillingService.getUserSubscription(session.user.id),
      (prisma as any).user.findUnique({
        where: { id: session.user.id },
        select: { isPro: true, credits: true },
      }),
    ]);

    return NextResponse.json({
      subscription: subscription || null,
      isPro: !!dbUser?.isPro,
      credits: dbUser?.credits ?? 0,
    });
  } catch (error: any) {
    console.error("[API_BILLING_SUBSCRIPTION_GET_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to retrieve subscription details" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, cancelAtPeriodEnd = true } = body;

    if (action === "cancel") {
      const sub = await BillingService.getUserSubscription(session.user.id);
      if (!sub || !sub.providerSubscriptionId) {
        return new NextResponse(
          JSON.stringify({ error: "No active subscription found to cancel." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (sub.provider === "dodo") {
        await dodoProvider.cancelSubscription(
          sub.providerSubscriptionId,
          cancelAtPeriodEnd
        );
      } else if (sub.provider === "razorpay") {
        await razorpayProvider.cancelSubscription(sub.providerSubscriptionId);
      }

      await BillingService.updateSubscriptionStatus({
        provider: sub.provider,
        providerSubscriptionId: sub.providerSubscriptionId,
        status: cancelAtPeriodEnd ? "active" : "cancelled",
        cancelAtPeriodEnd,
      });

      return NextResponse.json({
        success: true,
        message: cancelAtPeriodEnd
          ? "Subscription will cancel at the end of the current billing cycle."
          : "Subscription cancelled immediately.",
      });
    }

    return new NextResponse(
      JSON.stringify({ error: "Invalid action." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[API_BILLING_SUBSCRIPTION_POST_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Failed to process subscription action" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
