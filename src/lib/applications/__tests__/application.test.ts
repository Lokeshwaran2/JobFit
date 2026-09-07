import { ApplicationService } from "../application-service";
import { JobService } from "../../jobs/job-service";
import { prisma } from "@/lib/prisma";
import assert from "assert";

async function runTests() {
  console.log("===============================================================");
  console.log("   APPLICATION TRACKING & WORKFLOW TEST SUITE (BATCH 6)        ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testUserAId = `test-b6-userA-${timestamp}`;
  const testUserBId = `test-b6-userB-${timestamp}`;

  let jobAId = "";
  let jobBId = "";

  try {
    // 0. Setup Mock Users and Jobs in Neon DB
    await prisma.user.create({
      data: { id: testUserAId, email: `${testUserAId}@example.com`, name: "Applicant A" },
    });
    await prisma.user.create({
      data: { id: testUserBId, email: `${testUserBId}@example.com`, name: "Applicant B" },
    });

    const jobAResult = await JobService.createOrFindJob({
      userId: testUserAId,
      rawDescription: "Looking for Senior React Developer at NextTech",
      title: "Senior React Developer",
      company: "NextTech",
      location: "San Francisco, CA",
    });
    jobAId = jobAResult.job.id;

    const jobBResult = await JobService.createOrFindJob({
      userId: testUserBId,
      rawDescription: "Looking for Golang Backend Engineer at StreamData",
      title: "Golang Backend Engineer",
      company: "StreamData",
      location: "Austin, TX",
    });
    jobBId = jobBResult.job.id;

    // Attach a tailored resume to Job A to verify match score aggregation
    await prisma.resume.create({
      data: {
        userId: testUserAId,
        jobId: jobAId,
        title: "Tailored Resume for NextTech",
        atsScore: 88,
        keywordMatch: 85,
        templateId: "modern",
      },
    });

    // =========================================================================
    // TASK 13 — APPLICATION TRACKING & MODEL TESTS
    // =========================================================================

    await test("Task 13.1 — Create application with default status 'SAVED'", async () => {
      const app = await ApplicationService.createOrGetApplication({
        userId: testUserAId,
        jobId: jobAId,
      });

      assert(!!app.id, "Application must have a valid ID");
      assert.strictEqual(app.userId, testUserAId);
      assert.strictEqual(app.jobId, jobAId);
      assert.strictEqual(app.status, "SAVED", "Default status must be SAVED");
      assert.strictEqual(app.appliedAt, null, "appliedAt should be null on creation if SAVED");
    });

    await test("Task 13.2 — Uniqueness: Same Job cannot have duplicate applications for user", async () => {
      const duplicateApp = await ApplicationService.createOrGetApplication({
        userId: testUserAId,
        jobId: jobAId,
      });
      const count = await prisma.application.count({
        where: { userId: testUserAId, jobId: jobAId },
      });
      assert.strictEqual(count, 1, "Must not create duplicate application records for same job");
      assert.strictEqual(duplicateApp.status, "SAVED");
    });

    await test("Task 13.3 — Status update to APPLIED automatically sets appliedAt date", async () => {
      const updated = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        status: "APPLIED",
      });

      assert.strictEqual(updated.status, "APPLIED");
      assert(updated.appliedAt instanceof Date, "appliedAt should be automatically populated on APPLIED");
    });

    await test("Task 13.4 — Flexible transitions: Mistake correction (APPLIED -> INTERVIEW -> REJECTED -> APPLIED)", async () => {
      // Transition to INTERVIEW
      const interviewApp = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        status: "INTERVIEW",
      });
      assert.strictEqual(interviewApp.status, "INTERVIEW");

      // Transition to REJECTED
      const rejectedApp = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        status: "REJECTED",
      });
      assert.strictEqual(rejectedApp.status, "REJECTED");

      // Mistake correction: user moves back from REJECTED to APPLIED
      const correctedApp = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        status: "APPLIED",
      });
      assert.strictEqual(correctedApp.status, "APPLIED", "Should allow free user corrections");
      assert(correctedApp.appliedAt instanceof Date, "Preserves appliedAt date across status changes");
    });

    await test("Task 13.5 — Private Notes: Can record, edit, and retain confidential notes", async () => {
      const secretNote = "Recruiter: Sarah Jenkins. Discussed base salary $165k + equity. Onsite scheduled for Thursday.";
      const updated = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        notes: secretNote,
      });

      assert.strictEqual(updated.notes, secretNote);

      const fetched = await ApplicationService.getApplicationByJobId(testUserAId, jobAId);
      assert.strictEqual(fetched?.notes, secretNote);
    });

    // =========================================================================
    // AUTHORIZATION & IDOR SECURITY TESTS
    // =========================================================================

    await test("IDOR Security 1 — User B cannot read User A's application", async () => {
      const crossUserApp = await ApplicationService.getApplicationByJobId(testUserBId, jobAId);
      assert.strictEqual(crossUserApp, null, "User B must not receive User A's application");
    });

    await test("IDOR Security 2 — User B cannot create an application for User A's Job", async () => {
      let threw = false;
      try {
        await ApplicationService.createOrGetApplication({
          userId: testUserBId,
          jobId: jobAId, // Job owned by User A!
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes("Not Found") || err.message.includes("permission"));
      }
      assert.strictEqual(threw, true, "Attempt to attach application to another user's job must fail");
    });

    await test("IDOR Security 3 — User B cannot update User A's application or notes, nor can User A hijack Job B", async () => {
      let threw = false;
      try {
        await ApplicationService.updateApplication({
          userId: testUserBId,
          jobId: jobAId,
          notes: "Hacked notes!",
        });
      } catch {
        threw = true;
      }
      assert.strictEqual(threw, true, "Attempt to update another user's application must be blocked");

      // Confirm User A's notes were NOT altered
      const verifyApp = await ApplicationService.getApplicationByJobId(testUserAId, jobAId);
      assert(!verifyApp?.notes?.includes("Hacked notes"));

      // Also confirm User A cannot hijack User B's Job B
      let hijacked = false;
      try {
        await ApplicationService.createOrGetApplication({
          userId: testUserAId,
          jobId: jobBId,
        });
      } catch {
        hijacked = true;
      }
      assert.strictEqual(hijacked, true, "User A cannot hijack Job B belonging to User B");
    });

    // =========================================================================
    // VALIDATION TESTS
    // =========================================================================

    await test("Validation 1 — Rejects invalid or arbitrary status strings", async () => {
      let threw = false;
      try {
        await ApplicationService.updateApplication({
          userId: testUserAId,
          jobId: jobAId,
          status: "FAKE_STATUS" as any,
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes("Invalid application status"));
      }
      assert.strictEqual(threw, true);
    });

    await test("Validation 2 — Rejects excessively long notes (>5,000 characters)", async () => {
      const hugeNote = "A".repeat(5001);
      let threw = false;
      try {
        await ApplicationService.updateApplication({
          userId: testUserAId,
          jobId: jobAId,
          notes: hugeNote,
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes("5,000 characters"));
      }
      assert.strictEqual(threw, true);
    });

    await test("Validation 3 — Rejects malformed dates for appliedAt", async () => {
      let threw = false;
      try {
        await ApplicationService.updateApplication({
          userId: testUserAId,
          jobId: jobAId,
          appliedAt: "invalid-date-string",
        });
      } catch (err: any) {
        threw = true;
        assert(err.message.includes("valid date"));
      }
      assert.strictEqual(threw, true);
    });

    // =========================================================================
    // TASK 14 — JOB DASHBOARD AGGREGATION & SEARCH TESTS
    // =========================================================================

    await test("Task 14.1 — Dashboard lists tracked jobs with status, company, and deterministic Match Score", async () => {
      const { items, total } = await ApplicationService.listDashboardItems(testUserAId);
      assert.strictEqual(total, 1);
      assert.strictEqual(items.length, 1);

      const firstItem = items[0];
      assert.strictEqual(firstItem.title, "Senior React Developer");
      assert.strictEqual(firstItem.company, "NextTech");
      assert.strictEqual(firstItem.location, "San Francisco, CA");
      assert.strictEqual(firstItem.application?.status, "APPLIED");
      assert.strictEqual(firstItem.resume?.atsScore, 88, "Preserves deterministic match score 88");
    });

    await test("Task 14.2 — Dashboard status filtering works correctly (APPLIED vs OFFER)", async () => {
      // Filter by APPLIED (Job A has APPLIED)
      const appliedResult = await ApplicationService.listDashboardItems(testUserAId, {
        status: "APPLIED",
      });
      assert.strictEqual(appliedResult.items.length, 1);

      // Filter by OFFER (no jobs have OFFER)
      const offerResult = await ApplicationService.listDashboardItems(testUserAId, {
        status: "OFFER",
      });
      assert.strictEqual(offerResult.items.length, 0);
    });

    await test("Task 14.3 — Dashboard search filters by company, role/title, or location", async () => {
      // Search by company
      const searchCompany = await ApplicationService.listDashboardItems(testUserAId, {
        search: "NextTech",
      });
      assert.strictEqual(searchCompany.items.length, 1);

      // Search by location
      const searchLocation = await ApplicationService.listDashboardItems(testUserAId, {
        search: "Francisco",
      });
      assert.strictEqual(searchLocation.items.length, 1);

      // Search non-existent
      const searchNone = await ApplicationService.listDashboardItems(testUserAId, {
        search: "NonExistentCompanyXYZ",
      });
      assert.strictEqual(searchNone.items.length, 0);
    });

    // =========================================================================
    // TASK 15 — APPLICATION WORKFLOW & JOB REUSE INTEGRATION
    // =========================================================================

    await test("Task 15.1 — Job Reuse: Analyzing the same JD again reuses Job and preserves Application tracking", async () => {
      // User A analyzes the exact same JD again
      const reused = await JobService.createOrFindJob({
        userId: testUserAId,
        rawDescription: "Looking for Senior React Developer at NextTech",
        title: "Senior React Developer",
        company: "NextTech",
      });

      assert.strictEqual(reused.isDuplicate, true, "Job service must flag existing job as duplicate");
      assert.strictEqual(reused.job.id, jobAId, "Must return the exact same Job ID");

      // Verify the application tracking state and notes were NOT erased or reset
      const app = await ApplicationService.getApplicationByJobId(testUserAId, reused.job.id);
      assert.strictEqual(app?.status, "APPLIED", "Tracking status must remain APPLIED");
      assert(app?.notes?.includes("Sarah Jenkins"), "Private notes must remain intact across re-analysis");
    });

    await test("Task 15.2 — AI Isolation: Application operations do not invoke AI", async () => {
      // Calling updateApplication, getApplication, listDashboardItems executes purely in PostgreSQL without AI
      const start = Date.now();
      const res = await ApplicationService.updateApplication({
        userId: testUserAId,
        jobId: jobAId,
        status: "OFFER",
      });
      const duration = Date.now() - start;
      assert.ok(res, "Update application succeeded");
      assert.strictEqual(res.status, "OFFER");
      // DB operations over remote Neon PostgreSQL complete in a few hundred ms, well below LLM inference time (5-15 seconds)
      assert(duration < 2500, `Must be fast pure DB operation without LLM latency (took ${duration}ms)`);
    });

    // =========================================================================
    // CLEANUP & DELETION
    // =========================================================================

    await test("Task 13.6 — Deletion removes tracking record cleanly", async () => {
      const deleted = await ApplicationService.deleteApplication(testUserAId, jobAId);
      assert.strictEqual(deleted, true);

      const after = await ApplicationService.getApplicationByJobId(testUserAId, jobAId);
      assert.strictEqual(after, null);
    });

  } finally {
    // Teardown mock test data
    await prisma.application.deleteMany({ where: { userId: { in: [testUserAId, testUserBId] } } }).catch(() => {});
    await prisma.resume.deleteMany({ where: { userId: { in: [testUserAId, testUserBId] } } }).catch(() => {});
    await prisma.job.deleteMany({ where: { userId: { in: [testUserAId, testUserBId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [testUserAId, testUserBId] } } }).catch(() => {});
  }

  console.log("\n===============================================================");
  console.log(`BATCH 6 TEST SUITE SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Batch 6 Test execution fatal error:", err);
  process.exit(1);
});
