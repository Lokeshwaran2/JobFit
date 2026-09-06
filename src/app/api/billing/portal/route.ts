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

    const body = await req.json().catch(() => ({}));
    const returnUrl = body.returnUrl;

    const portal = await BillingService.getCustomerPortal(
      session.user.id,
      returnUrl
    );

    return NextResponse.json(portal);
  } catch (error: any) {
    console.error("[API_BILLING_PORTAL_ERROR]", error);
    return new NextResponse(
      JSON.stringify({
        error: error.message || "Failed to create customer portal session",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
