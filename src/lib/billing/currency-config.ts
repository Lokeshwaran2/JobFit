import { CurrencyConfig, PlanPricing } from "./types";

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimalDigits: 2,
    minorMultiplier: 100,
    enabled: true,
    defaultProvider: "razorpay",
    supportsRecurring: true,
    supportsAdaptiveCurrency: false,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimalDigits: 2,
    minorMultiplier: 100,
    enabled: true,
    defaultProvider: "dodo",
    supportsRecurring: true,
    supportsAdaptiveCurrency: true,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimalDigits: 2,
    minorMultiplier: 100,
    enabled: true,
    defaultProvider: "dodo",
    supportsRecurring: true,
    supportsAdaptiveCurrency: true,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimalDigits: 2,
    minorMultiplier: 100,
    enabled: true,
    defaultProvider: "dodo",
    supportsRecurring: true,
    supportsAdaptiveCurrency: true,
  },
};

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_INTERNATIONAL_CURRENCY = "USD";

export const CANONICAL_PLANS: Record<"starter" | "jobhunt", PlanPricing> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    description: "20 credits for targeted resume optimizations & profile checks",
    credits: 20,
    isRecurring: false,
    prices: {
      INR: {
        amountMinor: 9900, // ₹99
        currency: "INR",
        displayPrice: "₹99",
      },
      USD: {
        amountMinor: 299, // $2.99
        currency: "USD",
        displayPrice: "$2.99",
        dodoProductId: process.env.DODO_PRODUCT_STARTER_USD || "pdt_0Nn13P7ZHGAsPi6dTyH1S",
      },
      EUR: {
        amountMinor: 299, // €2.99
        currency: "EUR",
        displayPrice: "€2.99",
        dodoProductId: process.env.DODO_PRODUCT_STARTER_EUR || "pdt_0Nn1EnW7p0vDqTEBfNtOS",
      },
      GBP: {
        amountMinor: 249, // £2.49
        currency: "GBP",
        displayPrice: "£2.49",
        dodoProductId: process.env.DODO_PRODUCT_STARTER_GBP || "pdt_0Nn1F5MlhujOmg0MMJiWj",
      },
    },
  },
  jobhunt: {
    id: "jobhunt",
    name: "Pro Unlimited Pass",
    description: "Unlimited resume builds, JD matching, GitHub & LinkedIn audits, and career learning roadmaps",
    credits: 999999, // unlimited pro
    isRecurring: true,
    interval: "month",
    intervalCount: 1,
    prices: {
      INR: {
        amountMinor: 29900, // ₹299/mo
        currency: "INR",
        displayPrice: "₹299",
      },
      USD: {
        amountMinor: 1200, // $12.00/mo
        currency: "USD",
        displayPrice: "$12",
        dodoProductId: process.env.DODO_PRODUCT_JOBHUNT_USD || "pdt_0Nn13iu7iyjBaUFxoQhco",
      },
      EUR: {
        amountMinor: 1100, // €11.00/mo
        currency: "EUR",
        displayPrice: "€11",
        dodoProductId: process.env.DODO_PRODUCT_JOBHUNT_EUR || "pdt_0Nn1EwMFBWCHWcYn5JvDU",
      },
      GBP: {
        amountMinor: 1000, // £10.00/mo
        currency: "GBP",
        displayPrice: "£10",
        dodoProductId: process.env.DODO_PRODUCT_JOBHUNT_GBP || "pdt_0Nn1FCA76QdV69KOxcMOd",
      },
    },
  },
};

export function getCurrencyConfig(currencyCode?: string): CurrencyConfig {
  if (!currencyCode) return SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const upper = currencyCode.toUpperCase();
  return (
    SUPPORTED_CURRENCIES[upper] || {
      code: upper,
      symbol: upper,
      name: upper,
      decimalDigits: 2,
      minorMultiplier: 100,
      enabled: true,
      defaultProvider: "dodo",
      supportsRecurring: true,
      supportsAdaptiveCurrency: true,
    }
  );
}

export function isCurrencySupported(currencyCode: string): boolean {
  return !!SUPPORTED_CURRENCIES[currencyCode.toUpperCase()];
}

export function getPlanPricing(planId: "starter" | "jobhunt"): PlanPricing {
  const plan = CANONICAL_PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan ID: ${planId}`);
  }
  return plan;
}

export function getPlanPriceForCurrency(
  planId: "starter" | "jobhunt",
  currencyCode: string
) {
  const plan = getPlanPricing(planId);
  const upper = currencyCode.toUpperCase();

  if (plan.prices[upper]) {
    return plan.prices[upper];
  }

  // Fallback to USD base pricing if adaptive or other international currency
  if (plan.prices.USD) {
    return plan.prices.USD;
  }

  return plan.prices.INR;
}

export function formatAmountMinor(
  amountMinor: number,
  currencyCode: string
): string {
  const config = getCurrencyConfig(currencyCode);
  const major = amountMinor / config.minorMultiplier;

  // Format nicely with symbol
  if (config.code === "INR") {
    return `₹${Math.round(major)}`;
  }
  if (config.code === "USD") {
    return `$${major.toFixed(config.decimalDigits).replace(/\.00$/, "")}`;
  }
  if (config.code === "EUR") {
    return `€${major.toFixed(config.decimalDigits).replace(/\.00$/, "")}`;
  }
  if (config.code === "GBP") {
    return `£${major.toFixed(config.decimalDigits).replace(/\.00$/, "")}`;
  }

  return `${config.symbol}${major.toFixed(config.decimalDigits)}`;
}

export function toMinorUnits(amountMajor: number, currencyCode: string): number {
  const config = getCurrencyConfig(currencyCode);
  return Math.round(amountMajor * config.minorMultiplier);
}

export function fromMinorUnits(amountMinor: number, currencyCode: string): number {
  const config = getCurrencyConfig(currencyCode);
  return amountMinor / config.minorMultiplier;
}
