import assert from "assert";
import crypto from "crypto";
import { POST as handleRazorpayWebhook } from "@/app/api/razorpay/webhook/route";
import { prisma } from "@/lib/prisma";

async function runRazorpayWebhookSecurityTests() {
  console.log("\n=======================================================");
  console.log("   RAZORPAY WEBHOOK SECURITY TEST SUITE (SEC-01)      ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    -> ${e.message}`);
      failed++;
    }
  }

  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const testSecret = "test_rzp_webhook_secret_" + Date.now();
  const testUserId = `test-rzp-user-${Date.now()}`;

  try {
    // Setup test user in database
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: "Razorpay Test User",
        isPro: false,
      },
    });

    // TEST A: Missing RAZORPAY_WEBHOOK_SECRET -> 500
    await test("Test A: Missing RAZORPAY_WEBHOOK_SECRET fails closed with HTTP 500", async () => {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      const body = JSON.stringify({ event: "payment.captured" });
      const req = new Request("http://localhost/api/razorpay/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": "dummy_signature",
        },
        body,
      });

      const res = await handleRazorpayWebhook(req);
      assert.strictEqual(res.status, 500, "Must return HTTP 500 when webhook secret is missing");
      const text = await res.text();
      assert(text.includes("misconfigured"), "Must return safe misconfiguration error");
      assert(!text.includes("secret_"), "Must never leak secret values");
    });

    // Restore secret for remaining tests
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    // TEST B: Missing x-razorpay-signature -> 400
    await test("Test B: Missing x-razorpay-signature header is rejected with HTTP 400", async () => {
      const body = JSON.stringify({ event: "payment.captured" });
      const req = new Request("http://localhost/api/razorpay/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // x-razorpay-signature header omitted!
        },
        body,
      });

      const res = await handleRazorpayWebhook(req);
      assert.strictEqual(res.status, 400, "Must return HTTP 400 when signature header is missing");
      const text = await res.text();
      assert(text.includes("Missing webhook signature header"), "Must identify missing header");
    });

    // TEST C: Invalid signature -> 400 (and no processing occurs)
    await test("Test C: Invalid signature is rejected with HTTP 400 and processing blocked", async () => {
      const body = JSON.stringify({
        event: "subscription.charged",
        event_id: `evt_invalid_${Date.now()}`,
        payload: {
          subscription: {
            entity: { notes: { userId: testUserId } },
          },
        },
      });

      const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const req = new Request("http://localhost/api/razorpay/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": forgedSignature,
        },
        body,
      });

      const res = await handleRazorpayWebhook(req);
      assert.strictEqual(res.status, 400, "Must return HTTP 400 when signature is invalid");

      // Verify user was NOT granted pro access
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      assert.strictEqual(user?.isPro, false, "User must NOT be upgraded when signature fails");
    });

    // TEST D: Valid signature -> 200 and processing occurs
    const validEventId = `evt_valid_${Date.now()}`;
    await test("Test D: Cryptographically valid signature is accepted and processed", async () => {
      const body = JSON.stringify({
        event: "subscription.charged",
        event_id: validEventId,
        payload: {
          subscription: {
            entity: { notes: { userId: testUserId } },
          },
        },
      });

      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(body)
        .digest("hex");

      const req = new Request("http://localhost/api/razorpay/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": validSignature,
        },
        body,
      });

      const res = await handleRazorpayWebhook(req);
      assert.strictEqual(res.status, 200, "Must return HTTP 200 for valid signed webhook");

      // Verify user was successfully upgraded to pro
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      assert.strictEqual(user?.isPro, true, "User must be upgraded when valid signature is verified");
    });

    // TEST E: Duplicate valid webhook -> 200 with duplicate: true (idempotency preserved)
    await test("Test E: Duplicate valid webhook is detected and handled idempotently", async () => {
      const body = JSON.stringify({
        event: "subscription.charged",
        event_id: validEventId, // Same event ID as Test D
        payload: {
          subscription: {
            entity: { notes: { userId: testUserId } },
          },
        },
      });

      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(body)
        .digest("hex");

      const req = new Request("http://localhost/api/razorpay/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": validSignature,
        },
        body,
      });

      const res = await handleRazorpayWebhook(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.duplicate, true, "Must flag duplicate event as idempotent");
    });

  } finally {
    // Restore original environment
    if (originalSecret) {
      process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    }

    // Cleanup test data
    await (prisma as any).webhookEvent.deleteMany({
      where: { provider: "razorpay" },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: testUserId },
    }).catch(() => {});
  }

  console.log(`\nRAZORPAY WEBHOOK SECURITY RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRazorpayWebhookSecurityTests().catch((err) => {
  console.error("Razorpay webhook test failure:", err);
  process.exit(1);
});
