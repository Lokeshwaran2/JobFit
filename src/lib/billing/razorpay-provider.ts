import { razorpay } from "@/lib/razorpay";
import {
  CheckoutSessionResult,
  CreateCheckoutParams,
  IPaymentProvider,
} from "./types";
import { getPlanPriceForCurrency } from "./currency-config";

export class RazorpayProvider implements IPaymentProvider {
  public readonly provider = "razorpay" as const;

  public async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    const planPrice = getPlanPriceForCurrency(params.planId, "INR");
    const amountMinor = planPrice.amountMinor;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountMinor,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${params.userId.slice(0, 5)}`,
      notes: {
        userId: params.userId,
        plan: params.planId,
        autoPay: params.planId === "jobhunt" ? "true" : "false",
        internalSubscriptionId: params.metadata?.internalSubscriptionId || "",
      },
    });

    return {
      provider: "razorpay",
      orderId: order.id,
      amountMinor:
        typeof order.amount === "number" ? order.amount : amountMinor,
      currency: order.currency || "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      customerEmail: params.userEmail,
      customerName: params.userName,
    };
  }

  public async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<{ success: boolean; canceledAt?: Date }> {
    try {
      if (providerSubscriptionId && providerSubscriptionId.startsWith("sub_")) {
        await razorpay.subscriptions.cancel(providerSubscriptionId, false);
      }
      return { success: true, canceledAt: new Date() };
    } catch (error) {
      console.error("[RazorpayProvider] Cancel subscription error:", error);
      return { success: false };
    }
  }
}

export const razorpayProvider = new RazorpayProvider();
