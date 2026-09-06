export type PaymentProviderType = "razorpay" | "dodo";

export type InternalSubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "on_hold"
  | "cancelled"
  | "failed"
  | "expired";

export type PaymentStatus = "succeeded" | "failed" | "pending" | "refunded";

export type PaymentType =
  | "initial"
  | "renewal"
  | "upgrade"
  | "downgrade"
  | "one_time"
  | "refund";

export type BillingInterval = "month" | "year";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalDigits: number;
  minorMultiplier: number;
  enabled: boolean;
  defaultProvider: PaymentProviderType;
  supportsRecurring: boolean;
  supportsAdaptiveCurrency: boolean;
}

export interface PlanPricing {
  id: "starter" | "jobhunt";
  name: string;
  description: string;
  credits: number;
  isRecurring: boolean;
  interval?: BillingInterval;
  intervalCount?: number;
  prices: Record<
    string,
    {
      amountMinor: number;
      currency: string;
      displayPrice: string;
      dodoProductId?: string;
    }
  >;
}

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  userName?: string;
  planId: "starter" | "jobhunt";
  currency?: string;
  country?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  provider: PaymentProviderType;
  checkoutUrl?: string;
  sessionId?: string;
  // Razorpay specific client parameters (when provider === 'razorpay')
  orderId?: string;
  amountMinor?: number;
  currency?: string;
  keyId?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface CustomerPortalResult {
  url: string;
}

export interface WebhookProcessingResult {
  handled: boolean;
  provider: PaymentProviderType;
  eventType: string;
  eventId?: string;
  subscriptionId?: string;
  paymentId?: string;
  error?: string;
}

export interface IPaymentProvider {
  readonly provider: PaymentProviderType;

  createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult>;

  getCustomerPortalUrl?(
    providerCustomerId: string,
    returnUrl?: string
  ): Promise<CustomerPortalResult>;

  cancelSubscription?(
    providerSubscriptionId: string,
    cancelAtPeriodEnd?: boolean
  ): Promise<{ success: boolean; canceledAt?: Date }>;
}
