import { auth } from "@/auth";
import { BillingService } from "@/lib/billing/billing-service";
import { NextResponse } from "next/server";

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
    const { planId, currency, country, returnUrl } = body;

    if (!planId || (planId !== "starter" && planId !== "jobhunt")) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid plan specified. Must be 'starter' or 'jobhunt'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const checkoutResult = await BillingService.createCheckout({
      userId: session.user.id,
      userEmail: session.user.email || "",
      userName: session.user.name || undefined,
      planId,
      currency,
      country,
      returnUrl,
    });

    return NextResponse.json(checkoutResult);
  } catch (error: any) {
    console.error("[API_BILLING_CHECKOUT_ERROR]", error);
    return new NextResponse(
      JSON.stringify({
        error: error.message || "Failed to initialize checkout session",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
