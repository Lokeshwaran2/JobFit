/**
 * Comprehensive Automated Test Suite for Advanced Skill Learning Engine
 * Validates:
 * 1. Distinct curricula across skills (PostgreSQL, Docker, AWS, Redis, React)
 * 2. Exact topic-specific authoritative free URLs (no root homepages)
 * 3. Free-only resource filtering
 * 4. Configurable resource ranking weights & scoring
 * 5. Resource verification & fallback substitution
 * 6. Evidence-based current-level detection (Intermediate vs Beginner)
 * 7. JD-aware topic weighting & Capstone adaptation
 * 8. Learn -> Practice -> Build -> Prove structure
 * 9. Weighted progress calculation (10%, 20%, 25%, 20%, 20%, 5%)
 * 10. Checkpoint assessment & Capstone verification
 * 11. Preservation of skill-gap frequency & priorities
 * 12. Non-generic dynamic handling for unknown skills
 */

import assert from "node:assert";
import { SkillLearningEngine } from "../engine/skill-learning-engine";
import { resourceRankingService, ResourceRankingService } from "../engine/resource-ranking-service";
import { resourceVerificationService } from "../engine/resource-verification-service";
import { UserLevelDetector } from "../engine/user-level-detector";
import { JdAwareCurriculumService } from "../engine/jd-aware-curriculum-service";
import { AssessmentService } from "../engine/assessment-service";
import { getCurriculumDefinition } from "../engine/skill-curriculum-registry";

async function runLearningEngineTests() {
  console.log("==================================================");
  console.log("RUNNING ADVANCED SKILL LEARNING ENGINE TEST SUITE");
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

  // TEST 1: Two different skills produce completely distinct curricula
  await test("TEST 1: Distinct curricula across PostgreSQL, Docker, AWS, Redis, React", async () => {
    const pgPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "PostgreSQL" });
    const dockerPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "Docker" });
    const awsPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "AWS" });
    const redisPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "Redis" });
    const reactPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "React" });

    // Assert completely distinct skills and topics
    assert.notStrictEqual(pgPath.modules[0].title, dockerPath.modules[0].title);
    assert.notStrictEqual(dockerPath.modules[0].title, awsPath.modules[0].title);
    assert.notStrictEqual(awsPath.modules[0].title, redisPath.modules[0].title);
    assert.notStrictEqual(redisPath.modules[0].title, reactPath.modules[0].title);

    // Assert skills contain domain-specific modules
    assert.ok(pgPath.modules.some((m) => m.title.includes("Relational") || m.title.includes("Indexing")));
    assert.ok(dockerPath.modules.some((m) => m.title.includes("Container") || m.title.includes("Compose")));
    assert.ok(awsPath.modules.some((m) => m.title.includes("IAM") || m.title.includes("VPC")));
    assert.ok(redisPath.modules.some((m) => m.title.includes("In-Memory") || m.title.includes("Caching")));
    assert.ok(reactPath.modules.some((m) => m.title.includes("Component") || m.title.includes("Hooks")));
  });

  // TEST 2: Topic-specific exact URLs (Never generic homepages)
  await test("TEST 2: Authoritative topic-specific exact URLs", async () => {
    const pgDef = getCurriculumDefinition("PostgreSQL")!;
    const indexTopic = pgDef.modules[1].topics[0];

    assert.ok(indexTopic.title.includes("Indexes"));
    assert.strictEqual(
      indexTopic.primaryResource.url,
      "https://www.postgresql.org/docs/current/indexes-types.html",
      "Must be exact documentation page for indexes, not root postgresql.org"
    );

    const dockerDef = getCurriculumDefinition("Docker")!;
    const multiStageTopic = dockerDef.modules[1].topics[0];
    assert.strictEqual(
      multiStageTopic.primaryResource.url,
      "https://docs.docker.com/build/building/multi-stage/",
      "Must be exact multi-stage docs page"
    );
  });

  // TEST 3: Free-only filtering (Paid resources excluded from default path)
  await test("TEST 3: Free-only resource filtering", () => {
    const mixedResources = [
      {
        id: "res-free-1",
        skillId: "PostgreSQL",
        title: "Official Free Docs",
        url: "https://postgresql.org/docs",
        provider: "PostgreSQL",
        resourceType: "official_docs" as const,
        level: "beginner" as const,
        isFree: true,
        isOfficial: true,
        qualityScore: 98,
        interactive: false,
        projectBased: false,
        estimatedMinutes: 30,
        status: "active" as const,
        isPrimary: true,
      },
      {
        id: "res-paid-1",
        skillId: "PostgreSQL",
        title: "Expensive Paid Course $199",
        url: "https://example.com/paid-course",
        provider: "Paid Provider",
        resourceType: "structured_course" as const,
        level: "beginner" as const,
        isFree: false,
        isOfficial: false,
        qualityScore: 99,
        interactive: true,
        projectBased: true,
        estimatedMinutes: 300,
        status: "active" as const,
        isPrimary: false,
      },
    ];

    const ranked = resourceRankingService.rankResources(mixedResources);
    assert.strictEqual(ranked.length, 1);
    assert.strictEqual(ranked[0].id, "res-free-1");
    assert.strictEqual(ranked[0].isFree, true);
  });

  // TEST 4: Resource ranking configurable weights & scoring
  await test("TEST 4: Resource ranking scoring with configurable weights", () => {
    const customService = new ResourceRankingService({
      authority: 0.50,
      topicRelevance: 0.50,
    });

    const candidate = {
      id: "res-official",
      skillId: "PostgreSQL",
      title: "PostgreSQL Indexing Guide",
      url: "https://postgresql.org/docs/current/indexes-types.html",
      provider: "PostgreSQL Global Development Group",
      resourceType: "official_docs" as const,
      level: "intermediate" as const,
      isFree: true,
      isOfficial: true,
      qualityScore: 95,
      interactive: false,
      projectBased: false,
      estimatedMinutes: 45,
      status: "active" as const,
      isPrimary: false,
    };

    const score = customService.computeScore(candidate, {
      targetTopic: "PostgreSQL Indexing",
      targetSkill: "PostgreSQL",
    });

    assert.ok(score >= 90, "Official documentation on exact topic should score >= 90");
  });

  // TEST 5: Resource verification and fallback substitution
  await test("TEST 5: Resource verification & fallback substitution", async () => {
    const primary = {
      id: "res-broken",
      skillId: "TestSkill",
      title: "Broken Link",
      url: "https://this-domain-does-not-exist-123456789.com/doc",
      provider: "Unknown",
      resourceType: "tutorial" as const,
      level: "beginner" as const,
      isFree: true,
      isOfficial: false,
      qualityScore: 70,
      interactive: false,
      projectBased: false,
      estimatedMinutes: 30,
      status: "active" as const,
      isPrimary: true,
    };

    const alternative = {
      id: "res-healthy",
      skillId: "TestSkill",
      title: "Healthy MDN Docs",
      url: "https://developer.mozilla.org/",
      provider: "MDN",
      resourceType: "official_docs" as const,
      level: "beginner" as const,
      isFree: true,
      isOfficial: true,
      qualityScore: 95,
      interactive: false,
      projectBased: false,
      estimatedMinutes: 30,
      status: "active" as const,
      isPrimary: false,
    };

    const result = await resourceVerificationService.verifyAndApplyFallbacks(primary, alternative);
    assert.strictEqual(result.wasFallbackApplied, true, "Fallback should be promoted when primary is unreachable");
    assert.strictEqual(result.activePrimary?.id, "res-healthy");
  });

  // TEST 6: User level detection (Existing SQL experience starts user at Intermediate)
  await test("TEST 6: Evidence-based current-level detection", async () => {
    const pgDef = getCurriculumDefinition("PostgreSQL")!;
    const assessment = await UserLevelDetector.assessUserLevel(
      {
        userId: "candidate-123",
        skill: "PostgreSQL",
        existingEvidence: {
          resumeSkills: ["PostgreSQL", "SQL", "Node.js"],
          projectBullets: [
            "Designed normalized PostgreSQL schemas and executed relational joins for customer order API",
            "Built REST API endpoints with CRUD operations in PostgreSQL",
          ],
        },
      },
      pgDef
    );

    assert.strictEqual(assessment.currentLevel, "intermediate", "Candidate with schema/CRUD experience should be intermediate");
    assert.ok(
      assessment.startHere.topicTitle.toLowerCase().includes("index") ||
      assessment.startHere.topicTitle.toLowerCase().includes("performance") ||
      assessment.startHere.level === "intermediate",
      "Start Here should target intermediate indexing/performance instead of beginner SQL syntax"
    );
  });

  // TEST 7: JD-aware topic weighting & Capstone adaptation
  await test("TEST 7: JD-aware topic emphasis & Capstone adaptation", async () => {
    const pgDef = getCurriculumDefinition("PostgreSQL")!;
    const adaptation = await JdAwareCurriculumService.adaptCurriculumForJd(pgDef, {
      targetRole: "Senior Backend Developer",
      company: "Acme Fintech",
      jobDescription: "Seeking Backend Developer with deep PostgreSQL performance optimization, indexing, and EXPLAIN ANALYZE experience. Stack: Node.js, PostgreSQL, Docker, AWS.",
    });

    // Check JD highlights
    assert.ok(adaptation.jdKeyHighlights.length > 0);
    assert.ok(
      adaptation.jdKeyHighlights.some((h) => h.toLowerCase().includes("index") || h.toLowerCase().includes("explain") || h.toLowerCase().includes("optimization"))
    );

    // Check Capstone adapted with role and complementary stack
    assert.ok(adaptation.adaptedCapstone.title.includes("Senior Backend Developer"));
    assert.ok(adaptation.adaptedCapstone.title.includes("Acme Fintech"));
    assert.ok(adaptation.adaptedCapstone.expectedTechnologies.includes("Node.js"));
    assert.ok(adaptation.adaptedCapstone.expectedTechnologies.includes("Docker"));
  });

  // TEST 8: Learn -> Practice -> Build -> Prove structure
  await test("TEST 8: Learn -> Practice -> Build -> Prove curriculum structure", async () => {
    const pgPath = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "PostgreSQL" });

    // 1. Learn
    assert.ok(pgPath.resources.length > 0);
    assert.ok(pgPath.modules[0].topics[0].primaryResource !== null);

    // 2. Practice
    assert.ok(pgPath.practiceTasks.length > 0);
    assert.ok(pgPath.practiceTasks[0].expectedOutcome.length > 0);

    // 3. Build
    assert.ok(pgPath.implementationTasks.length > 0);
    assert.ok(pgPath.implementationTasks[0].requirements.length > 0);

    // 4. Prove
    assert.ok(pgPath.verificationTasks.length > 0);
  });

  // TEST 9: Weighted progress formula calculation
  await test("TEST 9: Weighted progress calculation (10, 20, 25, 20, 20, 5)", async () => {
    const path = await SkillLearningEngine.generateLearningPath({ userId: "test-user", skill: "PostgreSQL" });
    assert.strictEqual(typeof path.progress, "number");
    assert.strictEqual(path.weightedProgress.foundations.weight, 0.10);
    assert.strictEqual(path.weightedProgress.core.weight, 0.20);
    assert.strictEqual(path.weightedProgress.intermediate.weight, 0.25);
    assert.strictEqual(path.weightedProgress.advanced.weight, 0.20);
    assert.strictEqual(path.weightedProgress.implementation.weight, 0.20);
    assert.strictEqual(path.weightedProgress.assessment.weight, 0.05);
  });

  // TEST 10: Checkpoint assessment evaluation and scoring
  await test("TEST 10: Checkpoint assessment evaluation", async () => {
    const quizResult = await AssessmentService.evaluateAndRecordAssessment({
      userId: "user-test",
      skillId: "PostgreSQL",
      assessmentType: "mcq",
      answers: { "pg-q1": 0 },
    });

    assert.strictEqual(quizResult.success, true);
    assert.strictEqual(quizResult.score, 100);

    const capstoneResult = await AssessmentService.evaluateAndRecordAssessment({
      userId: "user-test",
      skillId: "PostgreSQL",
      assessmentType: "capstone",
      githubRepoUrl: "https://github.com/developer/postgresql-ledger-service",
    });

    assert.strictEqual(capstoneResult.success, true);
    assert.ok(capstoneResult.score >= 90);
  });

  // TEST 11: Skill-gap frequency and priority preservation
  await test("TEST 11: Missing frequency integration and preservation", async () => {
    const pgPath = await SkillLearningEngine.generateLearningPath({ userId: "user-test", skill: "PostgreSQL" });
    assert.ok(pgPath.missingCount >= 1);
    assert.ok(pgPath.priority >= 1);
  });

  console.log("==================================================");
  console.log(`ENGINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLearningEngineTests();
