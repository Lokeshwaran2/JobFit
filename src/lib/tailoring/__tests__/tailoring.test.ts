import assert from "assert";
import { BulletValidator } from "../bullet-validator";
import { TailoringService } from "../tailoring-service";
import { StructuredJobDescription } from "../../matching/types";

async function runTests() {
  console.log("===============================================================");
  console.log("   EVIDENCE-BASED TAILORING & COMPARISON TEST SUITE (BATCH 4)  ");
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

  // --- Test 1: Metric Preservation ---
  await test("Test 1 — Metric preservation (Retaining 40% is valid; changing to 50% is rejected)", () => {
    const originalBullet = "Optimized database queries, reducing latency by 40%.";
    const candidateSkills = new Set(["postgresql", "sql"]);

    // Attempt 1: Preserve 40%
    const validRewrite = "Reduced API latency by 40% through backend database query optimization.";
    const res1 = BulletValidator.validateRewrite(originalBullet, validRewrite, candidateSkills);
    assert.strictEqual(res1.isValid, true, "Preserving 40% metric should be valid");

    // Attempt 2: Fabricate 50%
    const invalidRewrite = "Reduced API latency by 50% through backend database query optimization.";
    const res2 = BulletValidator.validateRewrite(originalBullet, invalidRewrite, candidateSkills);
    assert.strictEqual(res2.isValid, false, "Altering 40% to 50% must be rejected");
    assert(res2.reason?.includes("50%"), "Rejection reason must mention the fabricated metric 50%");
  });

  // --- Test 2: No Fabricated Metric ---
  await test("Test 2 — No fabricated metric (Adding 25+ when source has none is rejected)", () => {
    const originalBullet = "Built REST APIs using Node.js.";
    const attemptedRewrite = "Built 25+ REST APIs using Node.js serving 1M users.";
    const candidateSkills = new Set(["node.js", "rest apis"]);

    const res = BulletValidator.validateRewrite(originalBullet, attemptedRewrite, candidateSkills);
    assert.strictEqual(res.isValid, false, "Fabricating 25+ and 1M must be rejected");
    assert(res.detectedMetrics && res.detectedMetrics.length > 0, "Must detect fabricated metrics");
  });

  // --- Test 3: Missing Skill Cannot Become Experience ---
  await test("Test 3 — Missing skill cannot become experience (Kubernetes missing from resume cannot be added)", () => {
    const originalBullet = "Containerized microservices using Docker.";
    const attemptedRewrite = "Managed Kubernetes cluster deployments for microservices.";
    const candidateSkills = new Set(["docker", "node.js"]); // Kubernetes is missing!

    const res = BulletValidator.validateRewrite(originalBullet, attemptedRewrite, candidateSkills);
    assert.strictEqual(res.isValid, false, "Injecting missing skill 'Kubernetes' into experience must be rejected");
    assert(res.reason?.includes("Kubernetes"), "Rejection reason must identify Kubernetes");
  });

  // --- Test 4: Existing Skill Can Be Emphasized ---
  await test("Test 4 — Existing skill can be emphasized (PostgreSQL from skills list can be highlighted)", () => {
    const originalBullet = "Worked on backend data layers.";
    const rewrittenBullet = "Engineered backend data layers with PostgreSQL.";
    const candidateSkills = new Set(["postgresql", "sql"]); // Candidate has PostgreSQL!

    const res = BulletValidator.validateRewrite(originalBullet, rewrittenBullet, candidateSkills);
    assert.strictEqual(res.isValid, true, "Emphasizing candidate's verified skill PostgreSQL must be accepted");
  });

  // --- Test 5: Title Preservation ---
  await test("Test 5 — Title preservation (Employment title 'Software Engineer' is never overwritten by JD)", async () => {
    const originalResume = {
      personalInfo: { name: "Alice", title: "Software Engineer" },
      experience: [
        {
          role: "Software Engineer",
          company: "Tech Corp",
          startDate: "2021",
          endDate: "2024",
          description: ["Built backend services."],
        },
      ],
      skills: { hard: ["TypeScript", "Node.js"] },
    };

    const jd: StructuredJobDescription = {
      company: "Acme",
      role: "Senior Backend Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: "Senior",
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Node.js"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    // Simulated LLM trying to change title to "Senior Backend Engineer"
    const mockAiOutput = {
      structuredData: {
        personalInfo: { name: "Alice", title: "Senior Backend Engineer" },
        experience: [
          {
            role: "Senior Backend Engineer",
            company: "Tech Corp",
            startDate: "2021",
            endDate: "2024",
            description: [{ text: "Built backend services.", isOptimized: true }],
          },
        ],
        skills: { hard: ["TypeScript", "Node.js"] },
      },
    };

    const result = await TailoringService.tailorResume(originalResume, jd, undefined, mockAiOutput);

    assert.strictEqual(
      result.tailoredData.personalInfo.title,
      "Software Engineer",
      "personalInfo.title must strictly remain 'Software Engineer'"
    );
    assert.strictEqual(
      result.tailoredData.experience[0].role,
      "Software Engineer",
      "experience[0].role must strictly remain 'Software Engineer'"
    );
  });

  // --- Test 6: Company Preservation ---
  await test("Test 6 — Company preservation (Company name 'ABC Technologies' cannot be altered)", async () => {
    const originalResume = {
      personalInfo: { name: "Bob" },
      experience: [
        {
          role: "Developer",
          company: "ABC Technologies",
          startDate: "2020",
          endDate: "2023",
          description: ["Developed web apps."],
        },
      ],
      skills: { hard: ["React"] },
    };

    const jd: StructuredJobDescription = {
      company: "Target Corp",
      role: "Frontend Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["React"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    // Simulated LLM output altering company to "Target Corp"
    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Developer",
            company: "Target Corp",
            startDate: "2020",
            endDate: "2023",
            description: [{ text: "Developed web apps.", isOptimized: true }],
          },
        ],
      },
    };

    const result = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);
    assert.strictEqual(
      result.tailoredData.experience[0].company,
      "ABC Technologies",
      "Company name must be restored to ABC Technologies"
    );
  });

  // --- Test 7: Dates Preserved ---
  await test("Test 7 — Dates preserved (Jan 2022 – Mar 2024 remains completely unaltered)", async () => {
    const originalResume = {
      experience: [
        {
          role: "Engineer",
          company: "Co",
          startDate: "Jan 2022",
          endDate: "Mar 2024",
          description: ["Built software."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: [],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    // Simulated LLM attempting to stretch dates to 5 years
    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Engineer",
            company: "Co",
            startDate: "Jan 2019",
            endDate: "Mar 2024",
            description: [{ text: "Built software.", isOptimized: true }],
          },
        ],
      },
    };

    const result = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);
    assert.strictEqual(result.tailoredData.experience[0].startDate, "Jan 2022", "startDate must remain Jan 2022");
    assert.strictEqual(result.tailoredData.experience[0].endDate, "Mar 2024", "endDate must remain Mar 2024");
  });

  // --- Test 8: Evidence Linkage ---
  await test("Test 8 — Evidence linkage (Every rewritten bullet has traceable source reference)", async () => {
    const originalResume = {
      experience: [
        {
          role: "Backend Engineer",
          company: "Acme",
          startDate: "2021",
          endDate: "2023",
          description: ["Worked with REST APIs."],
        },
      ],
      skills: { hard: ["REST APIs", "Node.js"] },
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Backend Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["REST APIs"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Backend Engineer",
            company: "Acme",
            startDate: "2021",
            endDate: "2023",
            description: [{ text: "Engineered scalable REST APIs using Node.js.", isOptimized: true }],
          },
        ],
      },
    };

    const result = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);
    assert(result.tailoringDiff.bulletDiffs.length > 0, "Must record bullet diff");

    const diff = result.tailoringDiff.bulletDiffs[0];
    assert.strictEqual(diff.status, "accepted", "Diff must be accepted");
    assert(diff.evidenceUsed.length > 0, "Must link to original evidence");
    assert(diff.evidenceUsed[0].includes("bullet #1"), "Must cite source bullet index");
    assert(diff.changes.length > 0, "Must explain reason for change");
  });

  // --- Test 9: Original Preserved ---
  await test("Test 9 — Original preserved (originalData remains completely distinct and unmutated)", async () => {
    const originalResume = {
      personalInfo: { title: "Junior Dev" },
      experience: [
        {
          role: "Junior Dev",
          company: "Startup",
          description: ["Original unedited text."],
        },
      ],
    };

    const originalJsonCopy = JSON.stringify(originalResume);

    const jd: StructuredJobDescription = {
      company: null,
      role: "Junior Dev",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: [],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Junior Dev",
            company: "Startup",
            description: [{ text: "Polished text with strong verbs.", isOptimized: true }],
          },
        ],
      },
    };

    const result = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);

    // Verify original object was NOT mutated
    assert.strictEqual(JSON.stringify(originalResume), originalJsonCopy, "originalResume must not be mutated");
    // Verify tailoredData is distinct
    assert.notStrictEqual(
      result.tailoredData.experience[0].description[0].text,
      originalResume.experience[0].description[0],
      "tailoredData must be distinct from original"
    );
  });

  // --- Test 10: Repeatability ---
  await test("Test 10 — Repeatability (Always tailors from original source; never mutates through loops)", async () => {
    const originalResume = {
      personalInfo: { title: "Developer" },
      experience: [
        {
          role: "Developer",
          company: "Corp",
          description: ["Built Node.js APIs."],
        },
      ],
      skills: { hard: ["Node.js"] },
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Backend Developer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Node.js"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Developer",
            company: "Corp",
            description: [{ text: "Architected Node.js APIs with robust error handling.", isOptimized: true }],
          },
        ],
      },
    };

    const run1 = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);
    const run2 = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);

    assert.strictEqual(
      run1.tailoredData.experience[0].description[0].text,
      run2.tailoredData.experience[0].description[0].text,
      "Repeated runs from original data must produce identical content"
    );
  });

  // --- Test 11: Deterministic Post-Match ---
  await test("Test 11 — Deterministic post-match (Same input produces identical before/after scores)", async () => {
    const originalResume = {
      skills: { hard: ["TypeScript", "PostgreSQL"] },
      experience: [
        {
          role: "Engineer",
          company: "SaaS",
          startDate: "2021",
          endDate: "2024",
          description: ["Built web features using TypeScript and PostgreSQL."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: 3,
      maxYearsExperience: null,
      requiredSkills: ["TypeScript", "PostgreSQL"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: ["Build web features"],
      educationRequirements: [],
      certifications: [],
      keywords: ["TypeScript", "PostgreSQL"],
    };

    const mockAi = {
      structuredData: {
        experience: [
          {
            role: "Engineer",
            company: "SaaS",
            startDate: "2021",
            endDate: "2024",
            description: [{ text: "Engineered web features using TypeScript and PostgreSQL.", isOptimized: true }],
          },
        ],
        skills: { hard: ["TypeScript", "PostgreSQL"] },
      },
    };

    const run1 = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);
    const run2 = await TailoringService.tailorResume(originalResume, jd, undefined, mockAi);

    assert.strictEqual(run1.tailoringDiff.beforeScore, run2.tailoringDiff.beforeScore, "Before scores identical");
    assert.strictEqual(run1.tailoringDiff.afterScore, run2.tailoringDiff.afterScore, "After scores identical");
    assert.strictEqual(run1.afterMatch.score, run2.afterMatch.score, "Deterministic after score match");
  });

  // --- Test 12: No Keyword Stuffing ---
  await test("Test 12 — No keyword stuffing (Unnatural repetition of 'PostgreSQL' 3+ times is rejected)", () => {
    const originalBullet = "Maintained database storage systems.";
    const stuffedBullet = "Maintained PostgreSQL database with PostgreSQL queries for PostgreSQL storage.";
    const candidateSkills = new Set(["postgresql", "sql"]);

    const res = BulletValidator.validateRewrite(originalBullet, stuffedBullet, candidateSkills);
    assert.strictEqual(res.isValid, false, "Keyword stuffing must be rejected");
    assert(res.reason?.includes("repetition"), "Rejection reason must mention repetition");
  });

  console.log("\n===============================================================");
  console.log(`   TAILORING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
