import { ProfileScoringEngine } from "../profile-scoring-engine";
import { prisma } from "@/lib/prisma";

async function runProfileCheckTests() {
  console.log("=== Running Profile Score Check & Dashboard Tool Tests ===\n");
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

  // Find or create test user
  let testUser = await prisma.user.findFirst({
    where: { email: "test-profile-check@example.com" },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: "test-profile-check@example.com",
        name: "Test Profile Checker",
        githubUrl: "https://github.com/torvalds",
        linkedinUrl: "https://linkedin.com/in/linustorvalds",
        linkedinData: {
          headline: "Linux Creator and Principal Systems Architect",
          about: "Creator of Linux and Git. Extensive systems programming, C, Linux kernel, and distributed architecture.",
          skills: ["C", "Linux", "Git", "Operating Systems", "Kernel Development"],
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        githubUrl: "https://github.com/torvalds",
        linkedinUrl: "https://linkedin.com/in/linustorvalds",
        linkedinData: {
          headline: "Linux Creator and Principal Systems Architect",
          about: "Creator of Linux and Git. Extensive systems programming, C, Linux kernel, and distributed architecture.",
          skills: ["C", "Linux", "Git", "Operating Systems", "Kernel Development"],
        },
      },
    });
  }

  const engine = new ProfileScoringEngine();

  // Test 1: Option A: Job Description Flow
  console.log("--- 1. Option A: Job Description Flow ---");
  const sampleJD = `
    Job Title: Senior Backend Engineer
    Company: Stripe
    We are looking for a Senior Backend Engineer to join our core payments infrastructure.
    Required Skills:
    - Strong experience in Node.js and TypeScript
    - Relational databases (PostgreSQL or MySQL)
    - Containerization with Docker
    - Cloud infrastructure with AWS
    Preferred Skills:
    - Redis caching
    - Kafka message streaming
  `;

  const jdResult = await engine.checkProfileScore({
    userId: testUser.id,
    inputType: "jd",
    jobDescription: sampleJD,
  });

  assert(jdResult.target.role.toLowerCase().includes("backend"), "Extracted role contains 'backend'");
  assert(jdResult.target.sourceType === "jd", "Target sourceType is 'jd'");
  assert(jdResult.overall >= 0 && jdResult.overall <= 100, `Valid overall score generated (${jdResult.overall}/100)`);
  assert(jdResult.skills.length > 0, "Skill Match Matrix has populated rows");
  assert(jdResult.recommendations.length > 0, "Generated actionable recommendations");
  assert(jdResult.skills.some((s) => s.skill.includes("Node") || s.skill.includes("PostgreSQL")), "Skill Matrix contains required JD skills");

  // Test 2: Option B: Role + Company Flow
  console.log("\n--- 2. Option B: Role + Company Flow ---");
  const roleResult = await engine.checkProfileScore({
    userId: testUser.id,
    inputType: "role",
    role: "Full Stack Engineer",
    company: "Acme Corp",
  });

  assert(roleResult.target.role === "Full Stack Engineer", "Correctly set target role");
  assert(roleResult.target.company === "Acme Corp", "Correctly set target company");
  assert(roleResult.target.sourceType === "role", "Target sourceType is 'role'");
  assert(roleResult.skills.some((s) => s.skill === "React" || s.skill === "TypeScript"), "Role-informed skill matrix generated");

  // Test 3: Skill Match Matrix Status Values
  console.log("\n--- 3. Skill Match Matrix Status Checks ---");
  for (const row of jdResult.skills) {
    assert(
      row.status === "match" || row.status === "partial" || row.status === "gap",
      `Row ${row.skill} has valid status ('${row.status}')`
    );
    assert(
      row.requirement === "Required" || row.requirement === "Preferred",
      `Row ${row.skill} has valid requirement level ('${row.requirement}')`
    );
  }

  // Test 4: Recommendations Gap-Specificity
  console.log("\n--- 4. Actionable Recommendations Gap Specificity ---");
  const hasGaps = jdResult.skills.some((s) => s.status === "gap");
  if (hasGaps) {
    const highPriorityRec = jdResult.recommendations.find((r) => r.priority === "High");
    assert(!!highPriorityRec, "High-priority recommendation generated for missing skills");
    assert(highPriorityRec!.actions.length > 0, "Recommendation contains concrete action steps");
  }

  // Test 5: Integration with Skill Gap Tracker (Task 1)
  console.log("\n--- 5. Skill Gap Tracking Integration ---");
  const userGaps = await prisma.userSkillGap.findMany({
    where: { userId: testUser.id },
  });
  assert(userGaps.length > 0, `SkillGapTracker successfully recorded missing skills (Count: ${userGaps.length})`);

  // Test 6: Standalone Check Persistence and History
  console.log("\n--- 6. ProfileScoreCheck History Persistence ---");
  const persistedChecks = await prisma.profileScoreCheck.findMany({
    where: { userId: testUser.id },
    orderBy: { createdAt: "desc" },
  });
  assert(persistedChecks.length >= 2, `Persisted analysis checks found in database (Count: ${persistedChecks.length})`);
  const latestCheck = persistedChecks[0];
  assert(latestCheck.overallScore >= 0, "Persisted check contains overallScore");
  assert(Array.isArray(latestCheck.skillMatches), "Persisted check contains skillMatches JSON array");

  // Clean up test data
  await prisma.profileScoreCheck.deleteMany({ where: { userId: testUser.id } });
  await prisma.skillGapOccurrence.deleteMany({ where: { userId: testUser.id } });
  await prisma.userSkillGap.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log(`\n========================================`);
  console.log(`Tests Finished: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProfileCheckTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
