import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dodoProvider } from "@/lib/billing/dodo-provider";
import { BillingService } from "@/lib/billing/billing-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let eventRecordId: string | undefined = undefined;

  try {
    const rawBody = await req.text();
    const reqHeaders = await headers();

    // Map headers for webhook verification
    const headerMap: Record<string, string> = {};
    reqHeaders.forEach((val, key) => {
      headerMap[key] = val;
    });

    const webhookId =
      headerMap["webhook-id"] ||
      headerMap["x-webhook-id"] ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Verify signature
    let payload: any;
    try {
      payload = dodoProvider.unwrapWebhook(rawBody, headerMap);
    } catch (err: any) {
      console.error("[DODO_WEBHOOK_VERIFICATION_FAILED]", err.message);
      return new NextResponse(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const eventType = payload.type || "unknown";
    const data = payload.data || {};

    // 1. Idempotency registration
    const eventId =
      webhookId ||
      data.payment_id ||
      data.subscription_id ||
      `${eventType}_${Date.now()}`;

    const { isDuplicate, eventRecordId: recId } =
      await BillingService.registerWebhookEvent(
        "dodo",
        eventId,
        eventType,
        rawBody
      );

    eventRecordId = recId;

    if (isDuplicate) {
      console.log(`[DodoWebhook] Duplicate event ignored: ${eventId} (${eventType})`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 2. Resolve User ID
    let userId =
      data.metadata?.userId ||
      data.customer?.metadata?.userId;

    if (!userId && data.customer?.email) {
      const dbUser = await (prisma as any).user.findUnique({
        where: { email: data.customer.email },
      });
      if (dbUser) {
        userId = dbUser.id;
      }
    }

    // 3. Process lifecycle events
    switch (eventType) {
      case "payment.succeeded": {
        const amountMinor =
          data.total_amount ??
          (typeof data.amount === "number" ? Math.round(data.amount * 100) : 0);
        const currency = (data.currency || "USD").toUpperCase();
        const planId = data.metadata?.planId || "jobhunt";
        const providerPaymentId = data.payment_id || `dodo_pay_${Date.now()}`;
        const providerSubscriptionId = data.subscription_id;
        const providerCustomerId = data.customer?.customer_id;
        const internalSubId = data.metadata?.internalSubscriptionId;

        if (userId) {
          await BillingService.handlePaymentSuccess({
            userId,
            planId,
            provider: "dodo",
            providerPaymentId,
            providerSubscriptionId,
            providerCustomerId,
            amountMinor,
            currency,
            paymentType: providerSubscriptionId ? "renewal" : "initial",
            internalSubscriptionId: internalSubId,
          });
        } else {
          console.warn("[DodoWebhook] payment.succeeded received without identifiable userId", data);
        }
        break;
      }

      case "payment.failed": {
        const providerPaymentId = data.payment_id || `dodo_fail_${Date.now()}`;
        const providerSubscriptionId = data.subscription_id;
        const failureReason = data.failure_reason || data.error_message || "Payment declined";

        await BillingService.handlePaymentFailure({
          userId,
          provider: "dodo",
          providerPaymentId,
          providerSubscriptionId,
          failureReason,
        });
        break;
      }

      case "subscription.active":
      case "subscription.renewed": {
        const providerSubscriptionId = data.subscription_id;
        if (providerSubscriptionId) {
          const nextBilling = data.next_billing_date
            ? new Date(data.next_billing_date)
            : undefined;

          await BillingService.updateSubscriptionStatus({
            provider: "dodo",
            providerSubscriptionId,
            status: "active",
            currentPeriodEnd: nextBilling,
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const providerSubscriptionId = data.subscription_id;
        if (providerSubscriptionId) {
          await BillingService.updateSubscriptionStatus({
            provider: "dodo",
            providerSubscriptionId,
            status: "cancelled",
            cancelAtPeriodEnd: false,
          });
        }
        break;
      }

      case "subscription.on_hold":
      case "subscription.past_due": {
        const providerSubscriptionId = data.subscription_id;
        if (providerSubscriptionId) {
          await BillingService.updateSubscriptionStatus({
            provider: "dodo",
            providerSubscriptionId,
            status: "past_due",
          });
        }
        break;
      }

      default:
        console.log(`[DodoWebhook] Unhandled event type: ${eventType}`);
        break;
    }

    // Mark event as successfully processed
    await BillingService.completeWebhookEvent(eventRecordId, "processed");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DODO_WEBHOOK_PROCESSING_ERROR]", error);
    if (eventRecordId) {
      await BillingService.completeWebhookEvent(
        eventRecordId,
        "failed",
        error.message
      );
    }
    // Return 500 to allow provider retry
    return new NextResponse(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
