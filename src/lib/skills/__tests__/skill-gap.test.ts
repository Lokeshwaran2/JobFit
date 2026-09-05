/**
 * Automated Test Suite for Skill Gap Tracking, Frequency Analysis, and Learning Paths
 * Covers all 12 specification requirements:
 * 1. First occurrence of missing skill
 * 2. Repeated occurrence
 * 3. Same skill appearing multiple times in one JD
 * 4. Skill aliases normalization
 * 5. Skill already present in user's profile
 * 6. Skill frequency ordering
 * 7. Ties handled deterministically
 * 8. Learning progress tracking
 * 9. Skill acquisition & history preservation
 * 10. User authorization & isolation
 * 11. Duplicate analysis prevention
 * 12. Existing resume functionality unaffected
 */

import assert from "node:assert";
import { normalizeSkill, isSameSkill, computeMissingSkills } from "../skill-normalization";
import { calculateSkillPriorities, computeSkillScore, determinePriorityTier } from "../priority-calculator";
import { getLearningPath } from "../learning-path-service";
import { SkillGapTracker } from "../skill-gap-tracker";
import { prisma } from "@/lib/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING SKILL GAP & LEARNING PATH TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  }

  // TEST 4: Skill aliases normalization
  await test("TEST 4: Skill aliases normalization (canonical mapping)", () => {
    // Postgres = PostgreSQL
    assert.strictEqual(normalizeSkill("Postgres").canonicalSkill, "PostgreSQL");
    assert.strictEqual(normalizeSkill("postgresql db").canonicalSkill, "PostgreSQL");
    assert.strictEqual(normalizeSkill("psql").canonicalSkill, "PostgreSQL");
    assert.strictEqual(isSameSkill("Postgres", "PostgreSQL"), true);

    // React.js = React
    assert.strictEqual(normalizeSkill("React.js").canonicalSkill, "React");
    assert.strictEqual(normalizeSkill("reactjs").canonicalSkill, "React");
    assert.strictEqual(isSameSkill("React.js", "React"), true);

    // NodeJS = Node.js
    assert.strictEqual(normalizeSkill("NodeJS").canonicalSkill, "Node.js");
    assert.strictEqual(normalizeSkill("node.js").canonicalSkill, "Node.js");
    assert.strictEqual(normalizeSkill("node").canonicalSkill, "Node.js");
    assert.strictEqual(isSameSkill("NodeJS", "Node.js"), true);

    // Amazon Web Services = AWS
    assert.strictEqual(normalizeSkill("Amazon Web Services").canonicalSkill, "AWS");
    assert.strictEqual(normalizeSkill("aws cloud").canonicalSkill, "AWS");
    assert.strictEqual(isSameSkill("Amazon Web Services", "AWS"), true);

    // Additional industry staples
    assert.strictEqual(normalizeSkill("k8s").canonicalSkill, "Kubernetes");
    assert.strictEqual(normalizeSkill("docker compose").canonicalSkill, "Docker");
    assert.strictEqual(normalizeSkill("golang").canonicalSkill, "Go");
    assert.strictEqual(normalizeSkill("ts").canonicalSkill, "TypeScript");
  });

  // TEST 3: Same skill appearing multiple times in one JD
  await test("TEST 3: Same skill appearing multiple times in one JD (counted only ONCE)", () => {
    // Suppose JD repeats "PostgreSQL" 8 times, and "Docker" 3 times
    const jdSkills = [
      "PostgreSQL", "postgres", "POSTGRESQL", "PostgreSQL DB",
      "PostgreSQL", "psql", "Postgres", "PostgreSQL",
      "Docker", "docker", "docker containers"
    ];
    const candidateSkills = ["JavaScript", "HTML", "CSS"];

    const missing = computeMissingSkills(jdSkills, candidateSkills);

    // Must only contain 2 canonical skills: PostgreSQL and Docker
    assert.strictEqual(missing.length, 2);
    const missingNames = missing.map(m => m.canonicalSkill);
    assert.ok(missingNames.includes("PostgreSQL"));
    assert.ok(missingNames.includes("Docker"));

    // Verify deduplication
    const pgOccurrences = missing.filter(m => m.canonicalSkill === "PostgreSQL");
    assert.strictEqual(pgOccurrences.length, 1);
  });

  // TEST 5: Skill already present in user's profile
  await test("TEST 5: Skill already present in user's profile / resume (excluded from missing)", () => {
    const jdSkills = ["PostgreSQL", "Docker", "AWS", "Redis"];
    // Candidate already has AWS (as Amazon Web Services) and Docker (as Docker containers)
    const candidateSkills = ["Amazon Web Services", "Docker containers", "Python"];

    const missing = computeMissingSkills(jdSkills, candidateSkills);
    const missingNames = missing.map(m => m.canonicalSkill);

    // AWS and Docker should be excluded
    assert.strictEqual(missingNames.includes("AWS"), false);
    assert.strictEqual(missingNames.includes("Docker"), false);

    // PostgreSQL and Redis should remain missing
    assert.strictEqual(missingNames.includes("PostgreSQL"), true);
    assert.strictEqual(missingNames.includes("Redis"), true);
    assert.strictEqual(missing.length, 2);
  });

  // TEST 6: Skill frequency ordering
  await test("TEST 6: Skill frequency ordering (highest frequency first)", () => {
    const mockGaps = [
      { canonicalSkill: "Redis", missingCount: 1, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-01") },
      { canonicalSkill: "PostgreSQL", missingCount: 8, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-05") },
      { canonicalSkill: "AWS", missingCount: 3, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-03") },
      { canonicalSkill: "Docker", missingCount: 5, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-04") },
    ];

    const ranked = calculateSkillPriorities(mockGaps);

    assert.strictEqual(ranked[0].canonicalSkill, "PostgreSQL");
    assert.strictEqual(ranked[0].frequency, 8);
    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[0].priority, "High");

    assert.strictEqual(ranked[1].canonicalSkill, "Docker");
    assert.strictEqual(ranked[1].frequency, 5);
    assert.strictEqual(ranked[1].rank, 2);
    assert.strictEqual(ranked[1].priority, "High");

    assert.strictEqual(ranked[2].canonicalSkill, "AWS");
    assert.strictEqual(ranked[2].frequency, 3);
    assert.strictEqual(ranked[2].rank, 3);
    assert.strictEqual(ranked[2].priority, "Medium");

    assert.strictEqual(ranked[3].canonicalSkill, "Redis");
    assert.strictEqual(ranked[3].frequency, 1);
    assert.strictEqual(ranked[3].rank, 4);
    assert.strictEqual(ranked[3].priority, "Low");
  });

  // TEST 7: Ties handled deterministically
  await test("TEST 7: Deterministic tie-breaking (recency -> alphabetical)", () => {
    // Both Docker and AWS have frequency = 2, but AWS was detected more recently
    const mockTies = [
      { canonicalSkill: "Docker", missingCount: 2, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-02T10:00:00Z") },
      { canonicalSkill: "AWS", missingCount: 2, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-03T10:00:00Z") },
    ];

    const ranked = calculateSkillPriorities(mockTies);
    // AWS must be #1 due to more recent lastDetectedAt
    assert.strictEqual(ranked[0].canonicalSkill, "AWS");
    assert.strictEqual(ranked[1].canonicalSkill, "Docker");

    // Equal frequency AND equal date: alphabetical tie-break
    const equalDateTies = [
      { canonicalSkill: "Redis", missingCount: 2, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-02T00:00:00Z") },
      { canonicalSkill: "Kubernetes", missingCount: 2, firstDetectedAt: new Date("2026-01-01"), lastDetectedAt: new Date("2026-01-02T00:00:00Z") },
    ];
    const rankedAlphabetical = calculateSkillPriorities(equalDateTies);
    // "Kubernetes" before "Redis"
    assert.strictEqual(rankedAlphabetical[0].canonicalSkill, "Kubernetes");
    assert.strictEqual(rankedAlphabetical[1].canonicalSkill, "Redis");
  });

  // TEST 8: Learning progress
  await test("TEST 8: Learning path structure & progress calculation", () => {
    const stepProgress = new Map<string, "not_started" | "in_progress" | "completed">();
    // In PostgreSQL path, mark 2 steps completed
    stepProgress.set("pg-b-1", "completed");
    stepProgress.set("pg-b-2", "completed");
    stepProgress.set("pg-b-3", "in_progress");

    const path = getLearningPath("PostgreSQL", stepProgress);

    assert.strictEqual(path.canonicalSkill, "PostgreSQL");
    assert.ok(path.whyItMatters.length > 20);
    assert.ok(path.stages.beginner.length > 0);
    assert.ok(path.stages.intermediate.length > 0);
    assert.ok(path.stages.advanced.length > 0);
    assert.ok(path.stages.implementation.length > 0);
    assert.ok(path.resources.length > 0);
    // All resources must be free
    for (const res of path.resources) {
      assert.strictEqual(res.isFree, true, `Resource ${res.title} must be free`);
    }

    assert.strictEqual(path.completedStepsCount, 2);
    const expectedPercentage = Math.round((2 / path.totalSteps) * 100);
    assert.strictEqual(path.progressPercentage, expectedPercentage);
  });

  // DATABASE INTEGRATION TESTS (Tests 1, 2, 9, 10, 11, 12)
  // Create a dedicated isolated test user
  const testEmail = `test_skill_gap_${Date.now()}@jobfit.internal`;
  const otherUserEmail = `other_user_${Date.now()}@jobfit.internal`;

  const testUser = await prisma.user.create({
    data: { email: testEmail, name: "Skill Gap Test User" },
  });
  const otherUser = await prisma.user.create({
    data: { email: otherUserEmail, name: "Other User" },
  });

  try {
    // TEST 1: First occurrence of missing skill
    await test("TEST 1: First occurrence of missing skill creates DB record with missingCount = 1", async () => {
      const summary = await SkillGapTracker.recordSkillGaps({
        userId: testUser.id,
        jobTitle: "Senior Backend Engineer",
        jdSkills: ["PostgreSQL", "Docker", "Redis"],
        candidateSkills: ["JavaScript"],
      });

      assert.strictEqual(summary.missingSkills.length, 3);
      assert.strictEqual(summary.newGapsCount, 3);

      const pgGap = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "PostgreSQL" } },
      });
      assert.ok(pgGap);
      assert.strictEqual(pgGap?.missingCount, 1);
      assert.strictEqual(pgGap?.status, "learning");
    });

    // TEST 2: Repeated occurrence
    await test("TEST 2: Repeated occurrence increments missingCount", async () => {
      // Analyze second resume with PostgreSQL and AWS
      await SkillGapTracker.recordSkillGaps({
        userId: testUser.id,
        jobTitle: "Cloud Architect",
        jdSkills: ["Postgres", "AWS"], // "Postgres" normalizes to "PostgreSQL"
        candidateSkills: ["JavaScript"],
      });

      const pgGap = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "PostgreSQL" } },
      });
      // PostgreSQL was 1, now should be 2
      assert.strictEqual(pgGap?.missingCount, 2);

      const awsGap = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "AWS" } },
      });
      // AWS is new, missingCount = 1
      assert.strictEqual(awsGap?.missingCount, 1);
    });

    // TEST 11: Duplicate analysis prevention
    await test("TEST 11: Duplicate analysis prevention (same resumeId does not re-increment)", async () => {
      // Create a mock resume
      const resume = await prisma.resume.create({
        data: {
          userId: testUser.id,
          title: "Test Resume",
          atsScore: 85,
        },
      });

      // First run for this resume
      await SkillGapTracker.recordSkillGaps({
        userId: testUser.id,
        resumeId: resume.id,
        jobTitle: "DevOps Engineer",
        jdSkills: ["Docker"],
        candidateSkills: [],
      });

      const dockerGapBefore = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "Docker" } },
      });
      const countBefore = dockerGapBefore?.missingCount;

      // Second run for EXACT SAME resume
      await SkillGapTracker.recordSkillGaps({
        userId: testUser.id,
        resumeId: resume.id,
        jobTitle: "DevOps Engineer",
        jdSkills: ["Docker"],
        candidateSkills: [],
      });

      const dockerGapAfter = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "Docker" } },
      });

      assert.strictEqual(dockerGapAfter?.missingCount, countBefore);
    });

    // TEST 9: Skill acquisition & history preservation
    await test("TEST 9: Skill acquisition transitions status and PRESERVES historical missingCount", async () => {
      const pgGapBefore = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "PostgreSQL" } },
      });
      const countBefore = pgGapBefore?.missingCount || 0;
      assert.ok(countBefore > 0);

      // User marks PostgreSQL as acquired
      const resolution = await SkillGapTracker.resolveSkillGap(testUser.id, "Postgres");

      assert.strictEqual(resolution.canonicalSkill, "PostgreSQL");
      assert.strictEqual(resolution.status, "acquired");
      // MUST preserve count
      assert.strictEqual(resolution.missingCount, countBefore);

      const pgGapAfter = await prisma.userSkillGap.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "PostgreSQL" } },
      });
      assert.strictEqual(pgGapAfter?.status, "acquired");
      assert.strictEqual(pgGapAfter?.missingCount, countBefore);
      assert.ok(pgGapAfter?.acquiredAt !== null);

      // Verify UserSkill record created
      const profileSkill = await prisma.userSkill.findUnique({
        where: { userId_canonicalSkill: { userId: testUser.id, canonicalSkill: "PostgreSQL" } },
      });
      assert.ok(profileSkill);
    });

    // TEST 10: User authorization & isolation
    await test("TEST 10: User authorization and data isolation", async () => {
      const otherUserGaps = await SkillGapTracker.getUserSkillGaps(otherUser.id);
      // Other user has not analyzed anything, must be 0
      assert.strictEqual(otherUserGaps.length, 0);

      const testUserGaps = await SkillGapTracker.getUserSkillGaps(testUser.id);
      // Test user has recorded gaps
      assert.ok(testUserGaps.length > 0);

      // Verify other user cannot see test user's gap details
      const otherDetail = await SkillGapTracker.getSkillGapDetails(otherUser.id, "PostgreSQL");
      assert.strictEqual(otherDetail?.gap, null);
      assert.strictEqual(otherDetail?.occurrences.length, 0);
    });

    // TEST 12: Existing resume functionality remains unaffected
    await test("TEST 12: Existing resume functionality remains completely unaffected", async () => {
      const existingResume = await prisma.resume.create({
        data: {
          userId: testUser.id,
          title: "Full Stack Engineer - Google",
          originalText: "Experienced React & Node developer",
          atsScore: 92,
          keywordMatch: 88,
          missingSkills: ["Kubernetes", "GraphQL"],
          structuredData: {
            personalInfo: { name: "Test Engineer", title: "Full Stack Engineer" },
            skills: { hard: ["React", "Node.js"], soft: ["Leadership"] },
          },
        },
      });

      const fetched = await prisma.resume.findUnique({
        where: { id: existingResume.id },
      });

      assert.strictEqual(fetched?.atsScore, 92);
      assert.strictEqual(fetched?.keywordMatch, 88);
      assert.deepStrictEqual(fetched?.missingSkills, ["Kubernetes", "GraphQL"]);
      assert.strictEqual((fetched?.structuredData as any)?.personalInfo?.name, "Test Engineer");
    });

    // TEST 13: Non-skill and location rejection quality gate
    await test("TEST 13: Non-skill and location rejection (quality gate)", () => {
      const { isValidSkill } = require("../skill-validator");

      // Cities / Locations must be rejected
      assert.strictEqual(isValidSkill("Bengaluru"), false);
      assert.strictEqual(isValidSkill("bangalore"), false);
      assert.strictEqual(isValidSkill("New York"), false);
      assert.strictEqual(isValidSkill("London"), false);
      assert.strictEqual(isValidSkill("Remote"), false);
      assert.strictEqual(isValidSkill("Hybrid"), false);

      // Generic job descriptions and environment buzzwords must be rejected
      assert.strictEqual(isValidSkill("High volume applications"), false);
      assert.strictEqual(isValidSkill("fast paced environment"), false);
      assert.strictEqual(isValidSkill("Ambiguous Environments"), false);
      assert.strictEqual(isValidSkill("High-pressure Environments"), false);
      assert.strictEqual(isValidSkill("5+ years"), false);
      assert.strictEqual(isValidSkill("Bachelor's degree"), false);
      assert.strictEqual(isValidSkill("Competitive salary"), false);

      // Company culture & transaction words must be rejected
      assert.strictEqual(isValidSkill("Inclusive Team Culture"), false);
      assert.strictEqual(isValidSkill("Continuous Learning Opportunities"), false);
      assert.strictEqual(isValidSkill("Platform Fee"), false);
      assert.strictEqual(isValidSkill("Discounts"), false);
      assert.strictEqual(isValidSkill("GST"), false);

      // Legitimate technical skills MUST be accepted
      assert.strictEqual(isValidSkill("PostgreSQL"), true);
      assert.strictEqual(isValidSkill("Docker"), true);
      assert.strictEqual(isValidSkill("React"), true);
      assert.strictEqual(isValidSkill("Next.js"), true);
      assert.strictEqual(isValidSkill("TypeScript"), true);
      assert.strictEqual(isValidSkill("Python"), true);
      assert.strictEqual(isValidSkill("Kubernetes"), true);
      assert.strictEqual(isValidSkill("PyTorch"), true);

      // Verify computeMissingSkills filters out junk
      const rawRequired = [
        "Bengaluru",
        "High volume applications",
        "React",
        "Platform Fee",
        "Docker",
        "Inclusive Team Culture"
      ];
      const candidateHas = ["Git"];
      const missing = computeMissingSkills(rawRequired, candidateHas);
      const missingNames = missing.map(m => m.canonicalSkill);

      assert.deepStrictEqual(missingNames.sort(), ["Docker", "React"]);
    });

    // TEST 14: Customized learning paths for distinct skills
    await test("TEST 14: Customized learning paths are distinct and domain-tailored", () => {
      const reactPath = getLearningPath("React");
      const dockerPath = getLearningPath("Docker");
      const pytorchPath = getLearningPath("PyTorch");

      // Verify skills have customized titles and domains
      assert.strictEqual(reactPath.stages.beginner[0].title.includes("JSX"), true);
      assert.strictEqual(dockerPath.stages.beginner[0].title.includes("Containers"), true);
      assert.strictEqual(pytorchPath.stages.beginner[0].title.includes("PyTorch Environment"), true);

      // Verify they do not share identical generic titles
      assert.notStrictEqual(reactPath.stages.beginner[0].title, dockerPath.stages.beginner[0].title);
      assert.notStrictEqual(reactPath.stages.beginner[0].title, pytorchPath.stages.beginner[0].title);

      // Verify resources have valid URLs and providers
      assert.ok(reactPath.resources.length >= 3);
      assert.ok(dockerPath.resources.length >= 3);
      assert.ok(pytorchPath.resources.length >= 3);
      assert.strictEqual(reactPath.resources[0].isFree, true);
    });
  } finally {
    // Clean up test data
    try {
      await prisma.skillGapOccurrence.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
      await prisma.learningProgress.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
      await prisma.userSkillGap.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
      await prisma.resume.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  }

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
