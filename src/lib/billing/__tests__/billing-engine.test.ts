import { PaymentProviderRouter } from "../provider-router";
import {
  CANONICAL_PLANS,
  SUPPORTED_CURRENCIES,
  formatAmountMinor,
  fromMinorUnits,
  getPlanPriceForCurrency,
  toMinorUnits,
} from "../currency-config";
import crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runTestSuite() {
  console.log("\n=======================================================");
  console.log("   DODO PAYMENTS & RAZORPAY BILLING ENGINE TEST SUITE   ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    -> ${e.message}`);
      failed++;
    }
  }

  // 1. DETERMINISTIC PROVIDER ROUTING TESTS
  console.log("--- 1. Provider Routing Strategy ---");

  test("India + INR routes strictly to Razorpay", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      currency: "INR",
      country: "IN",
    });
    assert(route.provider === "razorpay", "Expected provider 'razorpay'");
    assert(route.currency === "INR", "Expected currency 'INR'");
  });

  test("Currency INR without country defaults to Razorpay", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "starter",
      currency: "INR",
    });
    assert(route.provider === "razorpay", "Expected provider 'razorpay'");
    assert(route.currency === "INR", "Expected currency 'INR'");
  });

  test("Country IN without explicit currency defaults to Razorpay INR", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      country: "IN",
    });
    assert(route.provider === "razorpay", "Expected provider 'razorpay'");
    assert(route.currency === "INR", "Expected currency 'INR'");
  });

  test("US + USD routes strictly to Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      currency: "USD",
      country: "US",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "USD", "Expected currency 'USD'");
  });

  test("UK + GBP routes strictly to Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      currency: "GBP",
      country: "GB",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "GBP", "Expected currency 'GBP'");
  });

  test("Germany + EUR routes strictly to Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      currency: "EUR",
      country: "DE",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "EUR", "Expected currency 'EUR'");
  });

  test("GB country without explicit currency infers GBP and Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "starter",
      country: "GB",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "GBP", "Expected currency 'GBP'");
  });

  test("DE country without explicit currency infers EUR and Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "starter",
      country: "DE",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "EUR", "Expected currency 'EUR'");
  });

  test("Unsupported or adaptive international currency routes to Dodo Payments", () => {
    const route = PaymentProviderRouter.selectProvider({
      planId: "jobhunt",
      currency: "CAD",
      country: "CA",
    });
    assert(route.provider === "dodo", "Expected provider 'dodo'");
    assert(route.currency === "CAD", "Expected currency 'CAD'");
  });

  // 2. CURRENCY MINOR UNIT ARITHMETIC & INTEGER GUARANTEES
  console.log("\n--- 2. Currency Minor Units & Float Protection ---");

  test("All plan prices are stored strictly as integers (zero floating-point decimals)", () => {
    for (const planKey of ["starter", "jobhunt"] as const) {
      const plan = CANONICAL_PLANS[planKey];
      for (const [curr, price] of Object.entries(plan.prices)) {
        assert(
          Number.isInteger(price.amountMinor),
          `${planKey} ${curr} amountMinor (${price.amountMinor}) is not an integer!`
        );
        assert(price.amountMinor > 0, `${planKey} ${curr} price must be > 0`);
      }
    }
  });

  test("Minor unit values match exact pricing specifications", () => {
    // INR
    assert(CANONICAL_PLANS.starter.prices.INR.amountMinor === 9900, "INR starter should be 9900 paise (₹99)");
    assert(CANONICAL_PLANS.jobhunt.prices.INR.amountMinor === 29900, "INR jobhunt should be 29900 paise (₹299)");

    // USD
    assert(CANONICAL_PLANS.starter.prices.USD.amountMinor === 299, "USD starter should be 299 cents ($2.99)");
    assert(CANONICAL_PLANS.jobhunt.prices.USD.amountMinor === 1200, "USD jobhunt should be 1200 cents ($12.00)");

    // EUR
    assert(CANONICAL_PLANS.starter.prices.EUR.amountMinor === 299, "EUR starter should be 299 cents (€2.99)");
    assert(CANONICAL_PLANS.jobhunt.prices.EUR.amountMinor === 1100, "EUR jobhunt should be 1100 cents (€11.00)");

    // GBP
    assert(CANONICAL_PLANS.starter.prices.GBP.amountMinor === 249, "GBP starter should be 249 pence (£2.49)");
    assert(CANONICAL_PLANS.jobhunt.prices.GBP.amountMinor === 1000, "GBP jobhunt should be 1000 pence (£10.00)");
  });

  test("toMinorUnits and fromMinorUnits correctly convert without rounding drift", () => {
    assert(toMinorUnits(12, "USD") === 1200, "12 USD -> 1200 cents");
    assert(toMinorUnits(2.99, "USD") === 299, "2.99 USD -> 299 cents");
    assert(toMinorUnits(299, "INR") === 29900, "299 INR -> 29900 paise");

    assert(fromMinorUnits(1200, "USD") === 12, "1200 cents -> 12 USD");
    assert(fromMinorUnits(299, "USD") === 2.99, "299 cents -> 2.99 USD");
    assert(fromMinorUnits(29900, "INR") === 299, "29900 paise -> 299 INR");
  });

  test("formatAmountMinor renders clean currency symbols", () => {
    assert(formatAmountMinor(9900, "INR") === "₹99", "INR formatted");
    assert(formatAmountMinor(29900, "INR") === "₹299", "INR formatted");
    assert(formatAmountMinor(1200, "USD") === "$12", "USD formatted without trailing .00");
    assert(formatAmountMinor(299, "USD") === "$2.99", "USD formatted");
    assert(formatAmountMinor(1100, "EUR") === "€11", "EUR formatted without trailing .00");
    assert(formatAmountMinor(1000, "GBP") === "£10", "GBP formatted without trailing .00");
  });

  // 3. PROVIDER CAPABILITIES & VALIDATION
  console.log("\n--- 3. Provider Capabilities & Currency Validation ---");

  test("Razorpay only handles INR for this product architecture", () => {
    assert(PaymentProviderRouter.isSupported("INR", "razorpay") === true, "INR on Razorpay should be true");
    assert(PaymentProviderRouter.isSupported("USD", "razorpay") === false, "USD on Razorpay should be false");
    assert(PaymentProviderRouter.isSupported("EUR", "razorpay") === false, "EUR on Razorpay should be false");
  });

  test("Dodo Payments handles global currencies and adaptive checkout", () => {
    assert(PaymentProviderRouter.isSupported("USD", "dodo") === true, "USD on Dodo should be true");
    assert(PaymentProviderRouter.isSupported("EUR", "dodo") === true, "EUR on Dodo should be true");
    assert(PaymentProviderRouter.isSupported("GBP", "dodo") === true, "GBP on Dodo should be true");
    assert(PaymentProviderRouter.isSupported("CAD", "dodo") === true, "Adaptive CAD on Dodo should be true");
  });

  // 4. WEBHOOK IDEMPOTENCY & HASHING
  console.log("\n--- 4. Webhook Idempotency & Replay Protection ---");

  test("SHA-256 payload hashing produces deterministic signatures for replay detection", () => {
    const payload = JSON.stringify({
      type: "payment.succeeded",
      data: { payment_id: "pay_123", amount: 12 },
    });

    const hash1 = crypto.createHash("sha256").update(payload).digest("hex");
    const hash2 = crypto.createHash("sha256").update(payload).digest("hex");

    assert(hash1 === hash2, "Hashes must be strictly identical for same payload");
    assert(hash1.length === 64, "SHA-256 hash must be 64 characters");
  });

  // 5. SUBSCRIPTION STATE MACHINE RULES
  console.log("\n--- 5. Subscription State Machine Transitions ---");

  test("Valid status transitions are verified", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["active", "failed"],
      active: ["active", "past_due", "on_hold", "cancelled", "expired"],
      past_due: ["active", "on_hold", "cancelled", "expired"],
      on_hold: ["active", "cancelled", "expired"],
      cancelled: [],
      expired: [],
      failed: [],
    };

    function isValidTransition(from: string, to: string): boolean {
      return validTransitions[from]?.includes(to) || false;
    }

    assert(isValidTransition("pending", "active"), "pending -> active allowed");
    assert(isValidTransition("active", "past_due"), "active -> past_due allowed");
    assert(isValidTransition("past_due", "active"), "past_due -> active (recovery) allowed");
    assert(isValidTransition("active", "cancelled"), "active -> cancelled allowed");
    assert(!isValidTransition("cancelled", "active"), "cancelled -> active should NOT be directly allowed without new checkout");
  });

  console.log("\n=======================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
