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
  private resolvedEnv: "live_mode" | "test_mode" | null = null;

  private getCleanCredentials() {
    const rawApiKey = process.env.DODO_PAYMENTS_API_KEY;
    const apiKey = rawApiKey
      ? rawApiKey.trim().replace(/^["']|["']$/g, "").trim()
      : "";

    const rawWebhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    const webhookKey = rawWebhookKey
      ? rawWebhookKey.trim().replace(/^["']|["']$/g, "").trim()
      : undefined;

    const rawEnv = (process.env.DODO_PAYMENTS_ENVIRONMENT || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .toLowerCase();

    const configuredEnv: "live_mode" | "test_mode" =
      rawEnv === "live_mode" ? "live_mode" : "test_mode";

    return { apiKey, webhookKey, configuredEnv };
  }

  public getClient(targetEnv?: "live_mode" | "test_mode"): DodoPayments {
    const { apiKey, webhookKey, configuredEnv } = this.getCleanCredentials();
    if (!apiKey || apiKey.startsWith("test_dodo_api_key_placeholder")) {
      throw new Error(
        "Dodo Payments is not configured on this server. Please set DODO_PAYMENTS_API_KEY in your environment variables."
      );
    }

    const env = targetEnv || this.resolvedEnv || configuredEnv;
    return new DodoPayments({
      bearerToken: apiKey,
      environment: env,
      webhookKey,
    });
  }

  private async executeWithFallback<T>(
    operation: (client: DodoPayments, env: "live_mode" | "test_mode") => Promise<T>
  ): Promise<T> {
    const { apiKey, configuredEnv } = this.getCleanCredentials();
    if (!apiKey || apiKey.startsWith("test_dodo_api_key_placeholder")) {
      throw new Error(
        "Dodo Payments is not configured on this server. Please set DODO_PAYMENTS_API_KEY in your environment variables."
      );
    }

    const primaryEnv = this.resolvedEnv || configuredEnv;
    const alternateEnv = primaryEnv === "live_mode" ? "test_mode" : "live_mode";

    try {
      const client = this.getClient(primaryEnv);
      const result = await operation(client, primaryEnv);
      this.resolvedEnv = primaryEnv;
      return result;
    } catch (primaryError: any) {
      const isAuthError =
        primaryError?.status === 401 ||
        primaryError?.statusCode === 401 ||
        String(primaryError?.message || "").includes("401") ||
        String(primaryError?.message || "").toLowerCase().includes("unauthorized");

      if (isAuthError) {
        console.warn(
          `[DodoPayments] Authentication to '${primaryEnv}' returned 401. Trying alternate environment '${alternateEnv}'...`
        );
        try {
          const fallbackClient = this.getClient(alternateEnv);
          const result = await operation(fallbackClient, alternateEnv);
          console.log(
            `[DodoPayments] Fallback to '${alternateEnv}' succeeded! Automatically using '${alternateEnv}'.`
          );
          this.resolvedEnv = alternateEnv;
          return result;
        } catch (fallbackError: any) {
          console.error(
            `[DodoPayments] Both '${primaryEnv}' and '${alternateEnv}' failed authentication:`,
            fallbackError?.message
          );
          throw new Error(
            `Dodo Payments authentication failed (401 Unauthorized). Please check your DODO_PAYMENTS_API_KEY and verify whether it matches test_mode or live_mode.`
          );
        }
      }

      console.error("[DODO_PAYMENTS_API_ERROR]", primaryError);
      const detail =
        primaryError?.message ||
        primaryError?.error?.message ||
        primaryError?.statusText ||
        "Unknown error communicating with Dodo Payments";
      throw new Error(`Dodo Payments rejected checkout: ${detail}`);
    }
  }

  public async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    const currency = (params.currency || "USD").toUpperCase();
    const planPrice = getPlanPriceForCurrency(params.planId, currency);

    const productId =
      planPrice.dodoProductId ||
      (params.planId === "jobhunt" ? "pdt_0Nn13iu7iyjBaUFxoQhco" : "pdt_0Nn13P7ZHGAsPi6dTyH1S");

    const session = await this.executeWithFallback(async (client, env) => {
      return await client.checkoutSessions.create({
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
          environment: env,
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
    });

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
    const baseUrl = process.env.NEXTAUTH_URL || "";
    const targetReturn = returnUrl || `${baseUrl}/dashboard`;

    if (!providerCustomerId) {
      return { url: targetReturn };
    }

    try {
      return await this.executeWithFallback(async (client) => {
        const portal = await client.customers.customerPortal.create(
          providerCustomerId,
          {
            return_url: targetReturn,
          }
        );
        const portalUrl =
          (portal as any)?.url ||
          (portal as any)?.customer_portal_url ||
          targetReturn;
        return { url: portalUrl };
      });
    } catch (error) {
      console.error("[DodoPayments] Error creating customer portal session:", error);
      return { url: targetReturn };
    }
  }

  public async cancelSubscription(
    providerSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ success: boolean; canceledAt?: Date }> {
    if (!providerSubscriptionId) {
      return { success: true, canceledAt: new Date() };
    }

    try {
      return await this.executeWithFallback(async (client) => {
        await client.subscriptions.update(providerSubscriptionId, {
          cancel_at_next_billing_date: cancelAtPeriodEnd,
        });
        return { success: true, canceledAt: new Date() };
      });
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
    const { webhookKey } = this.getCleanCredentials();

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
      key: webhookKey,
    });
  }
}

export const dodoProvider = new DodoPaymentsProvider();
