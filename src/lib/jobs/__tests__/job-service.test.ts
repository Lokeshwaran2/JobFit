import { JobService } from "../job-service";
import { prisma } from "@/lib/prisma";

async function runTests() {
  console.log("=== Running Job Service & IDOR Security Tests ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  const testUserAId = "test-user-a-" + Date.now();
  const testUserBId = "test-user-b-" + Date.now();

  try {
    // 0. Setup mock users
    await prisma.user.create({
      data: {
        id: testUserAId,
        email: `${testUserAId}@example.com`,
        name: "User A",
      },
    });

    await prisma.user.create({
      data: {
        id: testUserBId,
        email: `${testUserBId}@example.com`,
        name: "User B",
      },
    });

    // 1. Create Job for User A
    console.log("--- 1. Job Creation & Duplicate Detection ---");
    const jdText = "We are seeking a Backend Architect to lead our distributed PostgreSQL infrastructure.";
    const result1 = await JobService.createOrFindJob({
      userId: testUserAId,
      rawDescription: jdText,
      title: "Backend Architect",
      company: "CloudScale Inc",
      location: "Bengaluru",
      workplaceType: "hybrid",
      jobType: "full-time",
      source: "manual",
      parsedData: { requiredSkills: ["PostgreSQL", "System Design"], seniorityLevel: "Senior" },
    });

    assert(!!result1.job && !!result1.job.id, "Creates job successfully with CUID ID");
    assert(!result1.isDuplicate, "Initial creation is not marked as duplicate");
    assert(result1.job.company === "CloudScale Inc", "Persists company accurately");
    assert(result1.job.location === "Bengaluru", "Persists location accurately");
    assert(result1.job.workplaceType === "hybrid", "Persists workplace type accurately");
    assert(result1.job.source === "manual", "Persists controlled job source");

    // 2. Duplicate Detection for same user
    const result2 = await JobService.createOrFindJob({
      userId: testUserAId,
      rawDescription: `  we are seeking a backend architect to lead our distributed postgresql infrastructure.  `,
      title: "Backend Architect",
      company: "CloudScale Inc",
      source: "manual",
    });

    assert(result2.isDuplicate, "Detects duplicate job submission for same user");
    assert(result2.job.id === result1.job.id, "Returns the exact same existing job ID");

    // 3. User Scoping: User B submitting identical JD gets their own Job record
    const resultUserB = await JobService.createOrFindJob({
      userId: testUserBId,
      rawDescription: jdText,
      title: "Backend Architect",
      company: "CloudScale Inc",
      source: "manual",
    });

    assert(!resultUserB.isDuplicate, "User B gets their own record (not shared across users)");
    assert(resultUserB.job.id !== result1.job.id, "User B job has distinct ID");
    assert(resultUserB.job.userId === testUserBId, "User B job is properly scoped to User B");

    // 4. IDOR Security Verification
    console.log("\n--- 2. IDOR Security Verification ---");
    // User B tries to access User A's job by ID
    const stolenJob = await JobService.getJobById(testUserBId, result1.job.id);
    assert(stolenJob === null, "User B CANNOT access User A's job by ID (IDOR blocked)");

    // User A can access their own job
    const myJob = await JobService.getJobById(testUserAId, result1.job.id);
    assert(myJob !== null && myJob.id === result1.job.id, "User A can access their own job");

    // 5. Multiple Resumes per Job
    console.log("\n--- 3. Multiple Resumes Linked to Single Job ---");
    await prisma.resume.create({
      data: {
        userId: testUserAId,
        jobId: result1.job.id,
        title: "Resume v1 for CloudScale",
        targetJobDesc: jdText,
        structuredData: { summary: "Senior developer v1" },
        originalData: { summary: "Original raw v1" },
        templateId: "classic",
      },
    });

    await prisma.resume.create({
      data: {
        userId: testUserAId,
        jobId: result1.job.id,
        title: "Resume v2 for CloudScale",
        targetJobDesc: jdText,
        structuredData: { summary: "Senior developer v2 tailored" },
        originalData: { summary: "Original raw v2" },
        templateId: "classic",
      },
    });

    const jobWithResumes = await prisma.job.findUnique({
      where: { id: result1.job.id },
      include: { resumes: true },
    });

    assert(jobWithResumes?.resumes?.length === 2, "Single Job can have multiple tailored Resumes over time");

    // 6. Existing Resume Backward Compatibility (jobId = null)
    console.log("\n--- 4. Existing Resume Backward Compatibility ---");
    const legacyResume = await prisma.resume.create({
      data: {
        userId: testUserAId,
        title: "Legacy Resume without JobId",
        targetJobDesc: "Legacy JD text",
        structuredData: { summary: "Legacy summary" },
        // jobId, originalData omitted / null
      },
    });

    assert(legacyResume.jobId === null, "Legacy resume allows nullable jobId");
    assert(legacyResume.targetJobDesc === "Legacy JD text", "targetJobDesc remains intact");
    assert(legacyResume.templateId === "classic", "Defaults templateId to 'classic'");

    // Query like Builder page
    const fetchedLegacy = await prisma.resume.findUnique({
      where: { id: legacyResume.id },
      select: {
        id: true,
        structuredData: true,
        targetJobDesc: true,
        atsScore: true,
        improvements: true,
        missingSkills: true,
        jobId: true,
      },
    });

    assert(fetchedLegacy !== null && fetchedLegacy.jobId === null, "Builder query on legacy resume succeeds without error");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    // Cleanup test data
    try {
      await prisma.resume.deleteMany({ where: { userId: { in: [testUserAId, testUserBId] } } });
      await prisma.job.deleteMany({ where: { userId: { in: [testUserAId, testUserBId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [testUserAId, testUserBId] } } });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr);
    }
  }

  console.log(`\nJOB SERVICE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
