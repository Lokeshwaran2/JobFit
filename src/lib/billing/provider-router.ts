import {
  CurrencyConfig,
  PaymentProviderType,
} from "./types";
import {
  DEFAULT_CURRENCY,
  DEFAULT_INTERNATIONAL_CURRENCY,
  SUPPORTED_CURRENCIES,
  getCurrencyConfig,
} from "./currency-config";

export interface ProviderRoutingInput {
  userId?: string;
  planId: "starter" | "jobhunt";
  currency?: string;
  country?: string;
  paymentMethod?: string;
}

export interface ProviderRoutingResult {
  provider: PaymentProviderType;
  currency: string;
  country?: string;
  reason: string;
}

export class PaymentProviderRouter {
  /**
   * Deterministically select the appropriate payment provider.
   * India + INR -> Razorpay
   * International / non-INR (USD, EUR, GBP, Adaptive) -> Dodo Payments
   */
  public static selectProvider(
    input: ProviderRoutingInput
  ): ProviderRoutingResult {
    const rawCurrency = input.currency?.trim().toUpperCase();
    const rawCountry = input.country?.trim().toUpperCase();

    // 1. Explicit INR currency requests always route to Razorpay
    if (rawCurrency === "INR") {
      return {
        provider: "razorpay",
        currency: "INR",
        country: rawCountry || "IN",
        reason: "Explicit INR currency selected -> Razorpay provider",
      };
    }

    // 2. Explicit International / Non-INR currency requests route to Dodo Payments
    if (rawCurrency && rawCurrency !== "INR") {
      return {
        provider: "dodo",
        currency: rawCurrency,
        country: rawCountry,
        reason: `International currency (${rawCurrency}) selected -> Dodo Payments provider`,
      };
    }

    // 3. Currency is omitted; determine based on country
    if (rawCountry === "IN" || rawCountry === "INDIA") {
      return {
        provider: "razorpay",
        currency: "INR",
        country: "IN",
        reason: "User country is India -> Razorpay INR provider",
      };
    }

    // 4. Default international routing
    const internationalCurrency =
      rawCountry === "GB" || rawCountry === "UK"
        ? "GBP"
        : ["DE", "FR", "IT", "ES", "NL", "IE", "PT", "BE", "AT", "GR"].includes(
            rawCountry || ""
          )
        ? "EUR"
        : DEFAULT_INTERNATIONAL_CURRENCY;

    return {
      provider: "dodo",
      currency: internationalCurrency,
      country: rawCountry,
      reason: "International location or default international checkout -> Dodo Payments provider",
    };
  }

  /**
   * Check if a given currency is supported by a specific provider
   */
  public static isSupported(
    currency: string,
    provider: PaymentProviderType
  ): boolean {
    const upper = currency.toUpperCase();
    if (provider === "razorpay") {
      // In this product flow, Razorpay handles INR
      return upper === "INR";
    }
    if (provider === "dodo") {
      // Dodo supports USD, EUR, GBP natively and other currencies via adaptive checkout
      return true;
    }
    return false;
  }

  /**
   * Get available currencies list for presentation
   */
  public static getAvailableCurrencies(country?: string): CurrencyConfig[] {
    return Object.values(SUPPORTED_CURRENCIES).filter((c) => c.enabled);
  }
}
