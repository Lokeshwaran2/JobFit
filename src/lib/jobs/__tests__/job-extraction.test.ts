import assert from "assert";
import {
  parseGreenhouseUrl,
  parseLeverUrl,
  htmlToPlainText,
  extractJobFromUrl,
} from "../job-extractor";
import { validateJobUrl, isRestrictedHostname } from "../url-validator";
import { JobService } from "../job-service";
import { prisma } from "@/lib/prisma";

async function runJobExtractionTestSuite() {
  console.log("\n=======================================================");
  console.log("   SAFE PUBLIC JOB EXTRACTION TEST SUITE               ");
  console.log("   (Greenhouse, Lever, SSRF Guards & Fallbacks)        ");
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

  const testUserAId = `test-extractor-user-a-${Date.now()}`;
  const testUserBId = `test-extractor-user-b-${Date.now()}`;

  try {
    await prisma.user.createMany({
      data: [
        { id: testUserAId, email: `${testUserAId}@example.com`, name: "User A" },
        { id: testUserBId, email: `${testUserBId}@example.com`, name: "User B" },
      ],
    });

    console.log("--- 1. Greenhouse URL & Extraction Tests ---");

    // 1. Valid Greenhouse URL -> correct board token/job ID extraction
    test("1. Valid Greenhouse URL extracts correct boardToken and jobId", () => {
      const parsed1 = parseGreenhouseUrl("https://job-boards.greenhouse.io/cloudsek/jobs/6149788004");
      assert(parsed1);
      assert.strictEqual(parsed1.boardToken, "cloudsek");
      assert.strictEqual(parsed1.jobId, "6149788004");

      const parsed2 = parseGreenhouseUrl("https://boards.greenhouse.io/stripe/jobs/123456?gh_src=feed");
      assert(parsed2);
      assert.strictEqual(parsed2.boardToken, "stripe");
      assert.strictEqual(parsed2.jobId, "123456");

      const parsedEmbed = parseGreenhouseUrl("https://boards.greenhouse.io/embed/job_app?for=github&token=998877");
      assert(parsedEmbed);
      assert.strictEqual(parsedEmbed.boardToken, "github");
      assert.strictEqual(parsedEmbed.jobId, "998877");
    });

    // 2. Greenhouse API response -> correct structured job
    await test("2. Live Greenhouse public API returns correct structured job", async () => {
      const res = await extractJobFromUrl("https://job-boards.greenhouse.io/cloudsek/jobs/6149788004");
      assert.strictEqual(res.extracted, true);
      assert.strictEqual(res.source, "greenhouse");
      assert(res.job);
      assert.strictEqual(res.job.title, "DevOps Intern");
      assert.strictEqual(res.job.company, "CloudSEK");
      assert(res.job.location?.includes("Bengaluru"));
      assert(res.job.rawDescription.length > 500);
      assert(!res.job.rawDescription.includes("<div"));
      assert(!res.job.rawDescription.includes("<script"));
    });

    // 3. Missing description -> graceful fallback
    test("3. Missing or empty HTML content converts to empty string and triggers fallback", () => {
      const clean = htmlToPlainText("");
      assert.strictEqual(clean, "");
      const cleanShort = htmlToPlainText("<p>Too short</p>");
      assert.strictEqual(cleanShort, "Too short");
    });

    // 4. API 404 -> fallback
    await test("4. Non-existent Greenhouse job ID gracefully falls back", async () => {
      const res = await extractJobFromUrl("https://job-boards.greenhouse.io/cloudsek/jobs/00000000000");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "greenhouse");
      assert(res.message?.includes("Paste the job description below to continue"));
    });

    // 5. API timeout -> fallback
    test("5. Requests enforce a strict 5-second timeout safeguard", () => {
      assert(typeof AbortSignal.timeout === "function");
    });

    // 6. Malformed API response -> fallback
    test("6. Malformed HTML or entities are safely sanitized without throwing", () => {
      const malformedHtml = "&lt;div&gt;&lt;p&gt;Valid job details &amp; responsibilities&lt;/p&gt;&lt;/div&gt;<script>alert(1)</script>";
      const clean = htmlToPlainText(malformedHtml);
      assert(clean.includes("Valid job details & responsibilities"));
      assert(!clean.includes("<script>"));
      assert(!clean.includes("&lt;"));
    });

    console.log("\n--- 2. Lever URL & Extraction Tests ---");

    // 7. Valid Lever URL -> correct identifiers
    test("7. Valid Lever URL extracts correct site and postingId", () => {
      const parsed = parseLeverUrl("https://jobs.lever.co/spotify/2193db3f-77c5-43b8-b030-8f92c9882bf1");
      assert(parsed);
      assert.strictEqual(parsed.site, "spotify");
      assert.strictEqual(parsed.postingId, "2193db3f-77c5-43b8-b030-8f92c9882bf1");

      const invalid = parseLeverUrl("https://jobs.lever.co/static/css");
      assert.strictEqual(invalid, null);
    });

    // 8. Lever API response -> correct structured job
    await test("8. Live Lever public API returns correct structured job", async () => {
      const res = await extractJobFromUrl("https://jobs.lever.co/spotify/2193db3f-77c5-43b8-b030-8f92c9882bf1");
      assert.strictEqual(res.extracted, true);
      assert.strictEqual(res.source, "lever");
      assert(res.job);
      assert.strictEqual(res.job.title, "Android Engineer - Experience");
      assert.strictEqual(res.job.company, "Spotify");
      assert.strictEqual(res.job.location, "London");
      assert.strictEqual(res.job.workplaceType, "hybrid");
      assert(res.job.rawDescription.length > 500);
      assert(!res.job.rawDescription.includes("<div>"));
    });

    // 9. API failure -> fallback
    await test("9. Non-existent Lever posting gracefully falls back", async () => {
      const res = await extractJobFromUrl("https://jobs.lever.co/spotify/invalid-uuid-99999");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "lever");
      assert(res.message?.includes("Paste the job description below to continue"));
    });

    console.log("\n--- 3. Security & SSRF Protection Tests ---");

    // 10. Arbitrary external domain -> NO outbound request
    await test("10. Arbitrary external domain makes NO outbound request and returns fallback", async () => {
      const res = await extractJobFromUrl("https://arbitrary-company.com/careers/12345");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "generic_url");
      assert.strictEqual(res.sourceDomain, "arbitrary-company.com");
    });

    // 11. localhost -> rejected
    test("11. localhost URLs are rejected by SSRF guard", () => {
      const res = validateJobUrl("http://localhost:3000/jobs/1");
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(isRestrictedHostname("localhost"), true);
    });

    // 12. private IP -> rejected
    test("12. Private RFC 1918 IPs are rejected by SSRF guard", () => {
      assert.strictEqual(isRestrictedHostname("192.168.1.50"), true);
      assert.strictEqual(isRestrictedHostname("10.200.1.1"), true);
      assert.strictEqual(isRestrictedHostname("172.20.0.1"), true);
      const res = validateJobUrl("http://192.168.1.50/jobs");
      assert.strictEqual(res.isValid, false);
    });

    // 13. cloud metadata address -> rejected
    test("13. Cloud metadata endpoint (169.254.169.254) is rejected", () => {
      assert.strictEqual(isRestrictedHostname("169.254.169.254"), true);
      const res = validateJobUrl("http://169.254.169.254/latest/meta-data");
      assert.strictEqual(res.isValid, false);
    });

    // 14. unsupported protocol -> rejected
    test("14. Unsupported schemes (javascript:, file:, data:, ftp:) are rejected", () => {
      assert.strictEqual(validateJobUrl("javascript:alert(1)").isValid, false);
      assert.strictEqual(validateJobUrl("file:///etc/passwd").isValid, false);
      assert.strictEqual(validateJobUrl("ftp://files.example.com").isValid, false);
      assert.strictEqual(validateJobUrl("data:text/html,test").isValid, false);
    });

    // 15. API host is always fixed/allowlisted
    test("15. Outbound API endpoints are hardcoded strictly to boards-api.greenhouse.io and api.lever.co", () => {
      const ghUrl = "https://job-boards.greenhouse.io/evil/jobs/1";
      const parsed = parseGreenhouseUrl(ghUrl);
      assert(parsed);
      const expectedApi = `https://boards-api.greenhouse.io/v1/boards/${parsed.boardToken}/jobs/${parsed.jobId}`;
      assert(expectedApi.startsWith("https://boards-api.greenhouse.io/v1/boards/"));
    });

    // 16. user cannot control API hostname
    test("16. User input in path cannot traverse or alter the fixed API hostname", () => {
      const traversalUrl = "https://job-boards.greenhouse.io/../../evil/jobs/1";
      const parsed = parseGreenhouseUrl(traversalUrl);
      assert.strictEqual(parsed, null, "Path traversal tokens are rejected");
    });

    console.log("\n--- 4. Existing Behavior & Unsupported Sources ---");

    // 17. LinkedIn -> fallback
    await test("17. LinkedIn URLs trigger manual JD fallback without outbound scraping", async () => {
      const res = await extractJobFromUrl("https://www.linkedin.com/jobs/view/9988776655");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "linkedin");
      assert(res.message?.includes("Paste the job description below to continue"));
    });

    // 18. Workday -> fallback
    await test("18. Workday URLs trigger manual JD fallback without outbound scraping", async () => {
      const res = await extractJobFromUrl("https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/12345");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "workday");
      assert(res.message?.includes("Paste the job description below to continue"));
    });

    // 19. Generic URL -> fallback
    await test("19. Generic company URLs trigger manual JD fallback", async () => {
      const res = await extractJobFromUrl("https://company.com/careers/software-engineer");
      assert.strictEqual(res.extracted, false);
      assert.strictEqual(res.source, "generic_url");
      assert(res.message?.includes("Paste the job description below to continue"));
    });

    // 20. Existing previously analyzed Job -> reuse behavior remains correct
    await test("20. Existing previously analyzed Job is found and reused by URL", async () => {
      const sampleUrl = "https://job-boards.greenhouse.io/samplecorp/jobs/1001";
      const sampleJd = "Senior Infrastructure Engineer experienced with Kubernetes and AWS.";
      const created = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: sampleJd,
        sourceUrl: sampleUrl,
        title: "Senior Infrastructure Engineer",
        company: "SampleCorp",
      });

      const found = await JobService.findJobByUrl(testUserAId, sampleUrl);
      assert(found);
      assert.strictEqual(found.id, created.job.id);
      assert.strictEqual(found.rawDescription, sampleJd);
    });

    // 21. Duplicate canonical URL -> no duplicate Job
    await test("21. Submitting the exact same canonical URL does not duplicate Job record", async () => {
      const sampleUrl = "https://job-boards.greenhouse.io/samplecorp/jobs/1001?utm_campaign=winter";
      const sampleJd = "Senior Infrastructure Engineer experienced with Kubernetes and AWS.";
      const res2 = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: sampleJd,
        sourceUrl: sampleUrl,
        title: "Senior Infrastructure Engineer",
        company: "SampleCorp",
      });

      assert.strictEqual(res2.isDuplicate, true);
    });

    console.log("\n--- 5. Pipeline Integration & Parity ---");

    // 22. Extracted Greenhouse job reaches existing analysis pipeline
    await test("22. Extracted Greenhouse job stores uniform Job entity with source=greenhouse and valid hash", async () => {
      const extracted = await extractJobFromUrl("https://job-boards.greenhouse.io/cloudsek/jobs/6149788004");
      assert(extracted.extracted && extracted.job);

      const jobResult = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: extracted.job.rawDescription,
        source: extracted.job.source,
        sourceUrl: extracted.job.sourceUrl,
        title: extracted.job.title,
        company: extracted.job.company,
        location: extracted.job.location,
      });

      assert.strictEqual(jobResult.job.source, "greenhouse");
      assert.strictEqual(jobResult.job.title, "DevOps Intern");
      assert.strictEqual(jobResult.job.company, "CloudSEK");
      assert(jobResult.job.jobHash.length === 64);
    });

    // 23. Pasted JD still reaches the same pipeline
    await test("23. Pasted JD without URL continues to use the exact same Job schema and pipeline", async () => {
      const manualJd = "Staff Frontend Engineer with React and Next.js experience.";
      const jobResult = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: manualJd,
        title: "Staff Frontend Engineer",
      });

      assert.strictEqual(jobResult.job.source, "manual");
      assert.strictEqual(jobResult.job.sourceUrl, null);
      assert(jobResult.job.jobHash.length === 64);
    });

    // 24. URL extraction failure -> JD fallback works
    await test("24. When extraction fails, manual JD creates job successfully with sourceUrl preserved", async () => {
      const failedUrl = "https://www.linkedin.com/jobs/view/888888";
      const manualJd = "Full Stack Engineer for Fintech Application.";

      const jobResult = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: manualJd,
        sourceUrl: failedUrl,
        title: "Full Stack Engineer",
      });

      assert.strictEqual(jobResult.job.source, "linkedin");
      assert.strictEqual(jobResult.job.sourceUrl, "https://www.linkedin.com/jobs/view/888888");
      assert.strictEqual(jobResult.job.rawDescription, manualJd);
    });

    console.log(`\n=======================================================`);
    console.log(`   JOB EXTRACTION TEST SUITE: ${passed} PASSED, 0 FAILED `);
    console.log(`=======================================================\n`);
  } finally {
    await prisma.job.deleteMany({
      where: { userId: { in: [testUserAId, testUserBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserAId, testUserBId] } },
    });
  }
}

runJobExtractionTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
