import { prisma } from "@/lib/prisma";
import {
  CheckoutSessionResult,
  CreateCheckoutParams,
  CustomerPortalResult,
  PaymentProviderType,
  PaymentStatus,
  PaymentType,
  InternalSubscriptionStatus,
} from "./types";
import { PaymentProviderRouter } from "./provider-router";
import { dodoProvider } from "./dodo-provider";
import { razorpayProvider } from "./razorpay-provider";
import { getPlanPriceForCurrency } from "./currency-config";
import crypto from "crypto";

export class BillingService {
  /**
   * Deterministic checkout orchestrator:
   * Validates plan, selects provider, registers pending records, and generates checkout session
   */
  public static async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    // 1. Authoritative routing
    const routing = PaymentProviderRouter.selectProvider({
      userId: params.userId,
      planId: params.planId,
      currency: params.currency,
      country: params.country,
    });

    const activeCurrency = routing.currency;
    const providerType = routing.provider;
    const planPrice = getPlanPriceForCurrency(params.planId, activeCurrency);

    // 2. Prepare internal subscription tracking record if recurring plan
    let internalSubId: string | undefined = undefined;
    if (params.planId === "jobhunt") {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days initial period

      const subRecord = await (prisma as any).subscription.create({
        data: {
          userId: params.userId,
          planId: params.planId,
          provider: providerType,
          providerSubscriptionId: `pending_${Date.now()}_${params.userId.slice(-6)}`,
          currency: activeCurrency,
          amountMinor: planPrice.amountMinor,
          interval: "month",
          intervalCount: 1,
          status: "pending",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      internalSubId = subRecord.id;
    }

    // 3. Delegate to the designated payment provider
    const providerParams: CreateCheckoutParams = {
      ...params,
      currency: activeCurrency,
      metadata: {
        ...params.metadata,
        internalSubscriptionId: internalSubId || "",
        planId: params.planId,
        userId: params.userId,
      },
    };

    if (providerType === "dodo") {
      return await dodoProvider.createCheckoutSession(providerParams);
    } else {
      return await razorpayProvider.createCheckoutSession(providerParams);
    }
  }

  /**
   * Idempotent webhook event registration
   * Returns false if event was already processed (duplicate replay prevention)
   */
  public static async registerWebhookEvent(
    provider: PaymentProviderType,
    providerEventId: string,
    eventType: string,
    rawPayload: string
  ): Promise<{ isDuplicate: boolean; eventRecordId: string }> {
    const payloadHash = crypto
      .createHash("sha256")
      .update(rawPayload)
      .digest("hex");

    try {
      const existing = await (prisma as any).webhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider,
            providerEventId,
          },
        },
      });

      if (existing) {
        return { isDuplicate: true, eventRecordId: existing.id };
      }

      const created = await (prisma as any).webhookEvent.create({
        data: {
          provider,
          providerEventId,
          eventType,
          payloadHash,
          status: "processing",
        },
      });

      return { isDuplicate: false, eventRecordId: created.id };
    } catch (err: any) {
      // In case of race condition / unique constraint collision
      if (err.code === "P2002") {
        return { isDuplicate: true, eventRecordId: "" };
      }
      throw err;
    }
  }

  /**
   * Mark webhook event as completed or failed
   */
  public static async completeWebhookEvent(
    eventRecordId: string,
    status: "processed" | "failed",
    error?: string
  ): Promise<void> {
    if (!eventRecordId) return;
    try {
      await (prisma as any).webhookEvent.update({
        where: { id: eventRecordId },
        data: {
          status,
          processedAt: new Date(),
          error: error || null,
        },
      });
    } catch (e) {
      console.error("[BillingService] Error updating webhook event:", e);
    }
  }

  /**
   * Unified transaction for verified successful payment (Initial, Renewal, or One-time)
   */
  public static async handlePaymentSuccess(args: {
    userId: string;
    planId: "starter" | "jobhunt";
    provider: PaymentProviderType;
    providerPaymentId: string;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    amountMinor: number;
    currency: string;
    paymentType?: PaymentType;
    internalSubscriptionId?: string;
  }): Promise<void> {
    const {
      userId,
      planId,
      provider,
      providerPaymentId,
      providerSubscriptionId,
      providerCustomerId,
      amountMinor,
      currency,
      paymentType = "initial",
      internalSubscriptionId,
    } = args;

    await prisma.$transaction(async (tx) => {
      // 1. Maintain PaymentCustomer link
      if (providerCustomerId) {
        await (tx as any).paymentCustomer.upsert({
          where: {
            provider_providerCustomerId: {
              provider,
              providerCustomerId,
            },
          },
          update: {
            userId,
            updatedAt: new Date(),
          },
          create: {
            userId,
            provider,
            providerCustomerId,
          },
        });
      }

      // 2. Handle Subscription lifecycle
      let subscriptionId = internalSubscriptionId;
      const now = new Date();
      const nextPeriod = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (planId === "jobhunt" || providerSubscriptionId) {
        if (subscriptionId) {
          // Update pending or existing subscription
          await (tx as any).subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "active",
              providerSubscriptionId: providerSubscriptionId || undefined,
              providerCustomerId: providerCustomerId || undefined,
              currentPeriodStart: now,
              currentPeriodEnd: nextPeriod,
              cancelAtPeriodEnd: false,
              amountMinor,
              currency,
            },
          });
        } else if (providerSubscriptionId) {
          // Find by providerSubscriptionId or create
          const existingSub = await (tx as any).subscription.findFirst({
            where: { provider, providerSubscriptionId },
          });

          if (existingSub) {
            subscriptionId = existingSub.id;
            await (tx as any).subscription.update({
              where: { id: existingSub.id },
              data: {
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: nextPeriod,
                cancelAtPeriodEnd: false,
                amountMinor,
                currency,
              },
            });
          } else {
            const newSub = await (tx as any).subscription.create({
              data: {
                userId,
                planId: "jobhunt",
                provider,
                providerSubscriptionId,
                providerCustomerId,
                currency,
                amountMinor,
                interval: "month",
                intervalCount: 1,
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: nextPeriod,
              },
            });
            subscriptionId = newSub.id;
          }
        }
      }

      // 3. Record Payment ledger entry
      await (tx as any).payment.upsert({
        where: {
          provider_providerPaymentId: {
            provider,
            providerPaymentId,
          },
        },
        update: {
          status: "succeeded",
          paidAt: new Date(),
          amountMinor,
          currency,
        },
        create: {
          userId,
          subscriptionId,
          provider,
          providerPaymentId,
          amountMinor,
          currency,
          status: "succeeded",
          type: paymentType,
          paidAt: new Date(),
        },
      });

      // 4. Update User Entitlements (Identical to existing system)
      if (planId === "jobhunt") {
        await (tx as any).user.update({
          where: { id: userId },
          data: {
            isPro: true,
            stripeCurrentPeriodEnd: nextPeriod,
          },
        });
      } else if (planId === "starter") {
        await (tx as any).user.update({
          where: { id: userId },
          data: {
            credits: { increment: 20 },
          },
        });
      }
    });
  }

  /**
   * Handle Payment failure
   */
  public static async handlePaymentFailure(args: {
    userId?: string;
    provider: PaymentProviderType;
    providerPaymentId: string;
    providerSubscriptionId?: string;
    amountMinor?: number;
    currency?: string;
    failureReason?: string;
  }): Promise<void> {
    const {
      userId,
      provider,
      providerPaymentId,
      providerSubscriptionId,
      amountMinor = 0,
      currency = "USD",
      failureReason,
    } = args;

    try {
      await prisma.$transaction(async (tx) => {
        // Record failed payment
        if (userId) {
          await (tx as any).payment.upsert({
            where: {
              provider_providerPaymentId: {
                provider,
                providerPaymentId,
              },
            },
            update: {
              status: "failed",
              failureReason,
            },
            create: {
              userId,
              provider,
              providerPaymentId,
              amountMinor,
              currency,
              status: "failed",
              type: "initial",
              failureReason,
            },
          });
        }

        // Set subscription to past_due / on_hold
        if (providerSubscriptionId) {
          await (tx as any).subscription.updateMany({
            where: { provider, providerSubscriptionId },
            data: { status: "past_due" },
          });
        }
      });
    } catch (e) {
      console.error("[BillingService] Error handling payment failure:", e);
    }
  }

  /**
   * Handle Subscription State Update (active, cancelled, expired, etc.)
   */
  public static async updateSubscriptionStatus(args: {
    provider: PaymentProviderType;
    providerSubscriptionId: string;
    status: InternalSubscriptionStatus;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date;
  }): Promise<void> {
    const {
      provider,
      providerSubscriptionId,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd,
    } = args;

    const existingSub = await (prisma as any).subscription.findFirst({
      where: { provider, providerSubscriptionId },
    });

    if (!existingSub) return;

    await (prisma as any).subscription.update({
      where: { id: existingSub.id },
      data: {
        status,
        cancelAtPeriodEnd:
          cancelAtPeriodEnd !== undefined
            ? cancelAtPeriodEnd
            : existingSub.cancelAtPeriodEnd,
        currentPeriodEnd: currentPeriodEnd || existingSub.currentPeriodEnd,
        canceledAt:
          status === "cancelled" ? new Date() : existingSub.canceledAt,
      },
    });

    // Maintain user entitlement synchronization
    if (status === "active") {
      await (prisma as any).user.update({
        where: { id: existingSub.userId },
        data: {
          isPro: true,
          stripeCurrentPeriodEnd: currentPeriodEnd || existingSub.currentPeriodEnd,
        },
      });
    } else if (status === "cancelled" || status === "expired") {
      await (prisma as any).user.update({
        where: { id: existingSub.userId },
        data: { isPro: false },
      });
    }
  }

  /**
   * Customer portal URL retrieval
   */
  public static async getCustomerPortal(
    userId: string,
    returnUrl?: string
  ): Promise<CustomerPortalResult> {
    const dodoCustomer = await (prisma as any).paymentCustomer.findFirst({
      where: {
        userId,
        provider: "dodo",
      },
      orderBy: { createdAt: "desc" },
    });

    if (dodoCustomer?.providerCustomerId) {
      return await dodoProvider.getCustomerPortalUrl(
        dodoCustomer.providerCustomerId,
        returnUrl
      );
    }

    return { url: returnUrl || "/dashboard" };
  }

  /**
   * Get current user subscription details
   */
  public static async getUserSubscription(userId: string) {
    const sub = await (prisma as any).subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sub;
  }
}
