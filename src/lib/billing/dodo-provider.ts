import { DodoPayments } from "dodopayments";
import {
  CheckoutSessionResult,
  CreateCheckoutParams,
  CustomerPortalResult,
  IPaymentProvider,
} from "./types";
import { getPlanPriceForCurrency } from "./currency-config";

export class DodoPaymentsProvider implements IPaymentProvider {
  public readonly provider = "dodo" as const;
  private client: DodoPayments | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): DodoPayments | null {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!this.client) {
      this.client = new DodoPayments({
        bearerToken: apiKey,
        environment:
          process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
            ? "live_mode"
            : "test_mode",
        webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
      });
    }
    return this.client;
  }

  public getClient(): DodoPayments {
    const client = this.initClient();
    if (!client) {
      throw new Error(
        "Dodo Payments client is not initialized. Check DODO_PAYMENTS_API_KEY."
      );
    }
    return client;
  }

  public async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    const currency = (params.currency || "USD").toUpperCase();
    const planPrice = getPlanPriceForCurrency(params.planId, currency);

    const client = this.initClient();
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;

    if (!client || !apiKey || apiKey.startsWith("test_dodo_api_key_placeholder")) {
      throw new Error(
        "Dodo Payments is not configured on this server. Please set DODO_PAYMENTS_API_KEY in your environment variables."
      );
    }

    const productId =
      planPrice.dodoProductId ||
      (params.planId === "jobhunt" ? "pdt_0Nn13iu7iyjBaUFxoQhco" : "pdt_0Nn13P7ZHGAsPi6dTyH1S");

    let session;
    try {
      session = await client.checkoutSessions.create({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email: params.userEmail,
          name: params.userName || params.userEmail.split("@")[0],
        },
        billing_currency: currency as any,
        metadata: {
          userId: params.userId,
          planId: params.planId,
          internalSubscriptionId: params.metadata?.internalSubscriptionId || "",
          environment: process.env.NODE_ENV || "production",
          ...params.metadata,
        },
        return_url:
          params.returnUrl && params.returnUrl.startsWith("http")
            ? params.returnUrl
            : `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://jobfit.co.in"}${
                params.returnUrl?.startsWith("/") ? "" : "/"
              }${
                params.returnUrl ||
                `dashboard?success=true&provider=dodo&plan=${params.planId}`
              }`,
      });
    } catch (apiError: any) {
      console.error("[DODO_PAYMENTS_API_ERROR]", apiError);
      const detail =
        apiError?.message ||
        apiError?.error?.message ||
        apiError?.statusText ||
        "Unknown error communicating with Dodo Payments";
      throw new Error(`Dodo Payments rejected checkout: ${detail}`);
    }

    if (!session || !session.checkout_url) {
      throw new Error(
        "Dodo Payments checkout creation succeeded but did not return a valid checkout URL."
      );
    }

    return {
      provider: "dodo",
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url,
    };
  }

  public async getCustomerPortalUrl(
    providerCustomerId: string,
    returnUrl?: string
  ): Promise<CustomerPortalResult> {
    const client = this.initClient();
    const baseUrl = process.env.NEXTAUTH_URL || "";
    const targetReturn = returnUrl || `${baseUrl}/dashboard`;

    if (!client || !providerCustomerId) {
      return { url: targetReturn };
    }

    try {
      const portal = await client.customers.customerPortal.create(
        providerCustomerId,
        {
          return_url: targetReturn,
        }
      );
      const portalUrl = (portal as any)?.url || (portal as any)?.customer_portal_url || targetReturn;
      return { url: portalUrl };
    } catch (error) {
      console.error("[DodoPayments] Error creating customer portal session:", error);
      return { url: targetReturn };
    }
  }

  public async cancelSubscription(
    providerSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ success: boolean; canceledAt?: Date }> {
    const client = this.initClient();
    if (!client || !providerSubscriptionId) {
      return { success: true, canceledAt: new Date() };
    }

    try {
      await client.subscriptions.update(providerSubscriptionId, {
        cancel_at_next_billing_date: cancelAtPeriodEnd,
      });
      return { success: true, canceledAt: new Date() };
    } catch (error) {
      console.error("[DodoPayments] Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Verify and unwrap webhook payload using Dodo SDK
   */
  public unwrapWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): any {
    const client = this.getClient();
    // Normalize headers for unwrap
    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        normalizedHeaders[k.toLowerCase()] = v;
      } else if (Array.isArray(v) && v[0]) {
        normalizedHeaders[k.toLowerCase()] = v[0];
      }
    }

    return client.webhooks.unwrap(rawBody, {
      headers: normalizedHeaders,
      key: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    });
  }
}

export const dodoProvider = new DodoPaymentsProvider();
