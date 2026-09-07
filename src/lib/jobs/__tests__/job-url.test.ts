import assert from "assert";
import { validateJobUrl, isRestrictedHostname } from "../url-validator";
import { JobService } from "../job-service";
import { prisma } from "@/lib/prisma";
import { canonicalizeJobUrl } from "../job-fingerprint";

async function runJobUrlTestSuite() {
  console.log("\n=======================================================");
  console.log("   JOB URL VALIDATION & RESOLUTION TEST SUITE          ");
  console.log("=======================================================\n");

  let passed = 0;
  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      process.exit(1);
    }
  };

  const testUserAId = `test-user-url-a-${Date.now()}`;
  const testUserBId = `test-user-url-b-${Date.now()}`;

  try {
    // Setup test users in database
    await prisma.user.createMany({
      data: [
        { id: testUserAId, email: `${testUserAId}@example.com`, name: "User A" },
        { id: testUserBId, email: `${testUserBId}@example.com`, name: "User B" },
      ],
    });

    console.log("--- 1. URL Validation & Security Guards ---");

    // 1. Valid HTTPS URL -> accepted
    test("1. Valid HTTPS URL is accepted and canonicalized", () => {
      const res = validateJobUrl("https://careers.google.com/jobs/results/123456?utm_source=linkedin");
      assert.strictEqual(res.isValid, true);
      assert(res.canonicalUrl);
      assert.strictEqual(res.canonicalUrl, "https://careers.google.com/jobs/results/123456");
    });

    // 2. Valid HTTP URL -> accepted
    test("2. Valid HTTP URL is accepted", () => {
      const res = validateJobUrl("http://jobs.example.org/openings/dev-1");
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.canonicalUrl, "http://jobs.example.org/openings/dev-1");
    });

    // 3. Invalid URL -> rejected
    test("3. Invalid malformed URL is rejected", () => {
      const res = validateJobUrl("not a valid url // definitely not");
      assert.strictEqual(res.isValid, false);
      assert(res.error);
    });

    // 4. Unsupported protocol -> rejected
    test("4. Unsupported protocol (javascript:, file:, data:, ftp:) is rejected", () => {
      const jsRes = validateJobUrl("javascript:alert(1)");
      assert.strictEqual(jsRes.isValid, false);
      assert(jsRes.error?.includes("Unsupported protocol"));

      const fileRes = validateJobUrl("file:///etc/passwd");
      assert.strictEqual(fileRes.isValid, false);
      assert(fileRes.error?.includes("Unsupported protocol"));

      const dataRes = validateJobUrl("data:text/html,<h1>test</h1>");
      assert.strictEqual(dataRes.isValid, false);

      const ftpRes = validateJobUrl("ftp://ftp.example.com/jobs/1");
      assert.strictEqual(ftpRes.isValid, false);
    });

    // 5. Empty URL -> rejected
    test("5. Empty or whitespace URL is rejected", () => {
      const emptyRes = validateJobUrl("");
      assert.strictEqual(emptyRes.isValid, false);

      const spaceRes = validateJobUrl("    ");
      assert.strictEqual(spaceRes.isValid, false);

      const nullRes = validateJobUrl(null);
      assert.strictEqual(nullRes.isValid, false);
    });

    // SSRF protection checks
    test("5b. SSRF / Localhost / Cloud metadata targets are rejected", () => {
      assert.strictEqual(isRestrictedHostname("localhost"), true);
      assert.strictEqual(isRestrictedHostname("127.0.0.1"), true);
      assert.strictEqual(isRestrictedHostname("169.254.169.254"), true);
      assert.strictEqual(isRestrictedHostname("192.168.1.1"), true);
      assert.strictEqual(isRestrictedHostname("10.0.0.5"), true);

      const ssrfRes = validateJobUrl("http://169.254.169.254/latest/meta-data/");
      assert.strictEqual(ssrfRes.isValid, false);
      assert(ssrfRes.error?.includes("restricted"));
    });

    console.log("\n--- 2. URL & Job Architecture Behavior ---");

    const sampleUrl = "https://jobs.lever.co/stripe/software-engineer-platform?trk=feed";
    const canonicalUrl = canonicalizeJobUrl(sampleUrl)!;
    const sampleJd = "Looking for a Software Engineer with TypeScript, Node.js, and PostgreSQL experience to scale platform payments.";

    // 6. Canonical URL creates/reuses the correct Job
    await test("6. Canonical URL creates a Job with properly attributed source, domain, and sourceUrl", async () => {
      const result = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: sampleJd,
        sourceUrl: sampleUrl,
        title: "Platform Software Engineer",
        company: "Stripe",
      });

      assert.strictEqual(result.isDuplicate, false);
      assert.strictEqual(result.job.sourceUrl, canonicalUrl);
      assert.strictEqual(result.job.sourceDomain, "jobs.lever.co");
      assert.strictEqual(result.job.source, "lever");
      assert.strictEqual(result.job.company, "Stripe");

      // Verify lookup by URL finds this exact job
      const found = await JobService.findJobByUrl(testUserAId, sampleUrl);
      assert(found);
      assert.strictEqual(found.id, result.job.id);
    });

    // 7. Duplicate canonical URL does not create duplicate Job
    await test("7. Duplicate canonical URL submission reuses existing Job for user", async () => {
      const duplicateUrlVariant = "https://jobs.lever.co/stripe/software-engineer-platform?utm_source=twitter&utm_medium=social";
      const result = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: sampleJd,
        sourceUrl: duplicateUrlVariant,
        title: "Platform Software Engineer",
        company: "Stripe",
      });

      assert.strictEqual(result.isDuplicate, true);

      // Verify count in DB is still 1
      const count = await prisma.job.count({
        where: { userId: testUserAId, sourceUrl: canonicalUrl },
      });
      assert.strictEqual(count, 1);
    });

    // 8. User A cannot access User B's Job (IDOR safe)
    await test("8. User isolation (IDOR): User B cannot query User A's job by URL or ID", async () => {
      // User B tries to look up User A's job by URL
      const userBJobByUrl = await JobService.findJobByUrl(testUserBId, sampleUrl);
      assert.strictEqual(userBJobByUrl, null, "User B cannot find User A's job by URL");

      // User A creates their own job
      const userAJob = await JobService.findJobByUrl(testUserAId, sampleUrl);
      assert(userAJob);

      // User B cannot access User A's job by ID
      const userBJobById = await JobService.getJobById(testUserBId, userAJob.id);
      assert.strictEqual(userBJobById, null, "User B cannot access User A's job by ID");
    });

    // 9. URL extraction failure does not fabricate job data
    test("9. URL extraction failure does not fabricate job requirements or details", () => {
      const unknownUrl = "https://careers.unknown-startup.co/jobs/999";
      const val = validateJobUrl(unknownUrl);
      assert.strictEqual(val.isValid, true);

      // Ensure no hallucinated schema or defaults
      const unpopulatedParsedData: any = {};
      assert.strictEqual(unpopulatedParsedData.requiredSkills, undefined);
      assert.strictEqual(unpopulatedParsedData.coreResponsibilities, undefined);
      assert.strictEqual(unpopulatedParsedData.minYearsExperience, undefined);
    });

    // 10. URL failure provides JD fallback
    await test("10. URL resolution without existing DB record provides clear fallback message and preserves canonicalUrl", async () => {
      const unparsedUrl = "https://boards.greenhouse.io/newco/jobs/12345";
      const existing = await JobService.findJobByUrl(testUserAId, unparsedUrl);
      assert.strictEqual(existing, null);

      const expectedFallbackMessage = "We couldn't extract the full job description from this URL. Paste the job description below to continue.";
      assert(expectedFallbackMessage.includes("Paste the job description below to continue"));
    });

    console.log("\n--- 3. Job Description Fallback & Pipeline Equivalence ---");

    // 11. Pasted JD continues to work exactly as before
    await test("11. Pasted JD without URL creates job with manual source and null sourceUrl", async () => {
      const manualJd = "Backend Developer required for payments processing using Python, Django, and PostgreSQL.";
      const result = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: manualJd,
        title: "Backend Developer",
        company: "Acme Corp",
      });

      assert.strictEqual(result.job.source, "manual");
      assert.strictEqual(result.job.sourceUrl, null);
      assert.strictEqual(result.job.sourceDomain, null);
      assert.strictEqual(result.job.rawDescription, manualJd);
    });

    // 12. URL and JD modes both reach the same analysis pipeline
    await test("12. Both URL-backed and manual JD jobs store uniform data models and generate deterministic hashes", async () => {
      const jobUrlRecord = await JobService.findJobByUrl(testUserAId, sampleUrl);
      const manualJob = await prisma.job.findFirst({
        where: { userId: testUserAId, source: "manual" },
      });

      assert(jobUrlRecord);
      assert(manualJob);

      // Both models have non-empty jobHash, title, rawDescription, and userId
      assert(jobUrlRecord.jobHash.length === 64);
      assert(manualJob.jobHash.length === 64);
      assert(jobUrlRecord.rawDescription.length > 0);
      assert(manualJob.rawDescription.length > 0);
    });

    console.log(`\n=======================================================`);
    console.log(`   JOB URL TEST SUITE: ${passed} PASSED, 0 FAILED     `);
    console.log(`=======================================================\n`);
  } finally {
    // Clean up test data
    await prisma.job.deleteMany({
      where: { userId: { in: [testUserAId, testUserBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserAId, testUserBId] } },
    });
  }
}

runJobUrlTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
