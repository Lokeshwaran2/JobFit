import assert from "assert";
import { JobMatcher } from "../job-matcher";
import { StructuredJobDescription } from "../types";

function runTests() {
  console.log("=======================================================");
  console.log("   DETERMINISTIC JOB MATCH ENGINE TEST SUITE (BATCH 3) ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // --- Test 1: Strong Match ---
  test("Test 1 — Strong match (All required + preferred matched)", () => {
    const resume = {
      skills: {
        hard: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      },
      experience: [
        {
          role: "Full Stack Engineer",
          company: "Tech Corp",
          startDate: "2019",
          endDate: "2024",
          description: [
            "Built TypeScript and React web apps with Node.js and PostgreSQL backend.",
            "Deployed microservices to AWS cloud.",
          ],
        },
      ],
      education: [{ degree: "B.S. in Computer Science", institution: "State Univ", year: "2019" }],
    };

    const jd: StructuredJobDescription = {
      company: "Acme Inc",
      role: "Senior Full Stack Engineer",
      location: "Remote",
      workplaceType: "remote",
      jobType: "full-time",
      seniorityLevel: "Senior",
      minYearsExperience: 3,
      maxYearsExperience: 6,
      requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      preferredSkills: ["AWS"],
      tools: ["Git"],
      coreResponsibilities: ["Build scalable web apps with React and Node.js backend"],
      educationRequirements: ["Bachelor's in Computer Science"],
      certifications: [],
      keywords: ["TypeScript", "React", "AWS"],
    };

    const result = JobMatcher.match(resume, jd);

    assert(result.score >= 85, `Score should be high (>= 85), got ${result.score}`);
    assert.strictEqual(result.missingRequiredSkills.length, 0, "No missing required skills");
    assert.strictEqual(result.matchedRequiredSkills.length, 4, "All 4 required skills matched");
    assert(result.matchedPreferredSkills.includes("AWS"), "AWS preferred skill matched");
    assert.strictEqual(result.experienceAssessment.meetsMinimum, true, "Meets minimum years");
    assert.strictEqual(result.breakdown.requiredSkills, 100, "Required skills score is 100%");
    assert.strictEqual(result.breakdown.preferredSkills, 100, "Preferred skills score is 100%");
  });

  // --- Test 2: Missing Required Skill ---
  test("Test 2 — Missing required skill (Materially lower score)", () => {
    const resume = {
      skills: {
        hard: ["TypeScript", "React"],
      },
      experience: [
        {
          role: "Frontend Developer",
          company: "Web Studio",
          startDate: "2021",
          endDate: "2024",
          description: ["Developed user interfaces with React and TypeScript."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: "Acme Inc",
      role: "Senior Backend Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: 3,
      maxYearsExperience: null,
      requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert(result.missingRequiredSkills.includes("Node.js"), "Node.js must be in missingRequiredSkills");
    assert(result.missingRequiredSkills.includes("PostgreSQL"), "PostgreSQL must be in missingRequiredSkills");
    assert.strictEqual(result.breakdown.requiredSkills, 50, "Only 2 of 4 required skills matched (50%)");
    assert(result.score <= 75, `Score must be materially lower than complete match, got ${result.score}`);
  });

  // --- Test 3: Preferred Skill Missing ---
  test("Test 3 — Preferred skill missing (Required strong, preferred lower)", () => {
    const resume = {
      skills: {
        hard: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      },
      experience: [
        {
          role: "Software Engineer",
          company: "SaaS Co",
          startDate: "2020",
          endDate: "2024",
          description: ["Built full stack features with TypeScript, React, Node.js and PostgreSQL."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Full Stack Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      preferredSkills: ["AWS", "Docker", "Kubernetes"],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert.strictEqual(result.breakdown.requiredSkills, 100, "Required score is 100%");
    assert.strictEqual(result.breakdown.preferredSkills, 0, "Preferred score is 0%");
    assert.strictEqual(result.missingPreferredSkills.length, 3, "All 3 preferred skills missing");
    assert(result.missingPreferredSkills.includes("AWS"), "AWS is missing");
    assert(result.missingPreferredSkills.includes("Docker"), "Docker is missing");
    assert(result.missingPreferredSkills.includes("Kubernetes"), "Kubernetes is missing");
  });

  // --- Test 4: Synonym Normalization ---
  test("Test 4 — Synonym normalization (Postgres -> PostgreSQL, NodeJS -> Node.js)", () => {
    const resume = {
      skills: {
        hard: ["Postgres", "NodeJS", "TS", "NextJS"],
      },
      experience: [
        {
          role: "Developer",
          company: "Startup",
          startDate: "2021",
          endDate: "2023",
          description: ["Worked with Postgres database and NodeJS backend service."],
        },
      ],
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
      requiredSkills: ["PostgreSQL", "Node.js", "TypeScript", "Next.js"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert(result.matchedRequiredSkills.includes("PostgreSQL"), "Postgres recognized canonically as PostgreSQL");
    assert(result.matchedRequiredSkills.includes("Node.js"), "NodeJS recognized canonically as Node.js");
    assert(result.matchedRequiredSkills.includes("TypeScript"), "TS recognized canonically as TypeScript");
    assert(result.matchedRequiredSkills.includes("Next.js"), "NextJS recognized canonically as Next.js");
    assert.strictEqual(result.missingRequiredSkills.length, 0, "Zero missing skills after canonical normalization");
  });

  // --- Test 5: False Positive Protection ---
  test("Test 5 — False positive protection (Java does not match JavaScript, C does not match words with 'c')", () => {
    const resume = {
      skills: {
        hard: ["JavaScript", "CSS", "React", "Docker"],
      },
      experience: [
        {
          role: "Frontend Developer",
          company: "Web Agency",
          startDate: "2022",
          endDate: "2024",
          description: [
            "Crafted beautiful user interfaces with JavaScript and CSS.",
            "Containerized client sites using Docker.",
          ],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Systems Programmer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Java", "C"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert(!result.matchedRequiredSkills.includes("Java"), "Java MUST NOT match JavaScript");
    assert(result.missingRequiredSkills.includes("Java"), "Java must be missing");
    assert(!result.matchedRequiredSkills.includes("C"), "C MUST NOT match words containing 'c' (React, Docker, CSS)");
    assert(result.missingRequiredSkills.includes("C"), "C must be missing");
    assert.strictEqual(result.breakdown.requiredSkills, 0, "Required skills score is 0% (zero false positives)");
  });

  // --- Test 6: Missing Information ---
  test("Test 6 — Missing information (Job has no years, education, workplace type)", () => {
    const resume = {
      skills: {
        hard: ["Python"],
      },
      experience: [
        {
          role: "Data Analyst",
          company: "Corp",
          description: ["Analyzed datasets with Python."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Python Analyst",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Python"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert.strictEqual(result.experienceAssessment.requiredYears, null, "Required years is null");
    assert.strictEqual(result.experienceAssessment.meetsMinimum, null, "meetsMinimum is null when unspecified");
    assert.strictEqual(result.breakdown.education, 100, "Education score is 100% when no education is required");
    assert.strictEqual(result.breakdown.experience, 100, "Experience score is 100% when no minimum is required");
    assert(result.score > 0, "Produces a valid non-zero score");
  });

  // --- Test 7: Determinism ---
  test("Test 7 — Determinism (Same input produces identical output across multiple runs)", () => {
    const resume = {
      skills: {
        hard: ["Go", "Docker", "PostgreSQL"],
      },
      experience: [
        {
          role: "Backend Engineer",
          company: "Cloud Co",
          startDate: "2020",
          endDate: "2023",
          description: ["Developed microservices in Go, stored data in PostgreSQL, deployed in Docker."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: "CloudScale",
      role: "Backend Engineer",
      location: "San Francisco",
      workplaceType: "hybrid",
      jobType: "full-time",
      seniorityLevel: "Mid-Senior",
      minYearsExperience: 3,
      maxYearsExperience: 5,
      requiredSkills: ["Go", "PostgreSQL"],
      preferredSkills: ["Kubernetes"],
      tools: ["Docker"],
      coreResponsibilities: ["Build scalable microservices"],
      educationRequirements: [],
      certifications: [],
      keywords: ["Go", "PostgreSQL", "Docker"],
    };

    const result1 = JobMatcher.match(resume, jd);
    const result2 = JobMatcher.match(resume, jd);

    assert.strictEqual(result1.score, result2.score, "Scores must be identical");
    assert.deepStrictEqual(result1.breakdown, result2.breakdown, "Breakdowns must be identical");
    assert.deepStrictEqual(result1.matchedRequiredSkills, result2.matchedRequiredSkills, "Matched required skills identical");
    assert.deepStrictEqual(result1.missingRequiredSkills, result2.missingRequiredSkills, "Missing required skills identical");
    assert.deepStrictEqual(result1.matchedPreferredSkills, result2.matchedPreferredSkills, "Matched preferred skills identical");
    assert.deepStrictEqual(result1.missingPreferredSkills, result2.missingPreferredSkills, "Missing preferred skills identical");
    assert.deepStrictEqual(result1.experienceAssessment, result2.experienceAssessment, "Experience assessment identical");
  });

  // --- Test 8: Experience Assessment ---
  test("Test 8 — Experience assessment (Job requires 3+, resume demonstrates ~4 yrs)", () => {
    const resumePassing = {
      skills: { hard: ["Java"] },
      experience: [
        {
          role: "Engineer 1",
          company: "Co A",
          startDate: "2020-01",
          endDate: "2022-01",
          description: ["Built Java services."],
        },
        {
          role: "Engineer 2",
          company: "Co B",
          startDate: "2022-02",
          endDate: "2024-02",
          description: ["Senior Java engineer."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Java Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: 3,
      maxYearsExperience: null,
      requiredSkills: ["Java"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const resultPass = JobMatcher.match(resumePassing, jd);
    assert.strictEqual(resultPass.experienceAssessment.meetsMinimum, true, "4 years meets 3+ years requirement");
    assert(resultPass.experienceAssessment.candidateYears! >= 3.8, "Candidate has ~4 years");

    const resumeFailing = {
      skills: { hard: ["Java"] },
      experience: [
        {
          role: "Junior Engineer",
          company: "Co A",
          startDate: "2023-01",
          endDate: "2024-01",
          description: ["Java developer."],
        },
      ],
    };

    const resultFail = JobMatcher.match(resumeFailing, jd);
    assert.strictEqual(resultFail.experienceAssessment.meetsMinimum, false, "1 year does not meet 3+ requirement");
    assert.strictEqual(resultFail.breakdown.experience <= 50, true, "Experience score is lower for shortfall");
  });

  // --- Test 9: Responsibility Evidence ---
  test("Test 9 — Responsibility evidence (REST API backend vs Docker alone for Kubernetes migration)", () => {
    const resume = {
      skills: { hard: ["Node.js", "Docker"] },
      experience: [
        {
          role: "Backend Developer",
          company: "API Co",
          description: [
            "Built REST APIs using Node.js and PostgreSQL for production applications.",
            "Worked with Docker for local development.",
          ],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "Lead Architect",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Node.js"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [
        "Design REST APIs and scalable backend services",
        "Lead Kubernetes infrastructure migration",
      ],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    // Finding REST API evidence
    const restEvidence = result.evidence.find(
      (e) => e.requirement === "Design REST APIs and scalable backend services"
    );
    assert(restEvidence && restEvidence.status === "matched", "REST APIs responsibility matched");
    assert(restEvidence.evidence.length > 0, "REST API evidence cited from bullet");

    // Kubernetes responsibility must NOT match Docker
    const k8sEvidence = result.evidence.find(
      (e) => e.requirement === "Lead Kubernetes infrastructure migration"
    );
    assert(k8sEvidence && k8sEvidence.status === "missing", "Kubernetes migration MUST NOT match Docker");
    assert.strictEqual(k8sEvidence.evidence.length, 0, "No evidence fabricated for Kubernetes migration");
  });

  // --- Test 10: No Fabricated Evidence ---
  test("Test 10 — No fabricated evidence (Kubernetes required, not in resume)", () => {
    const resume = {
      skills: { hard: ["Python", "Django"] },
      experience: [
        {
          role: "Developer",
          company: "Agency",
          description: ["Built web endpoints with Django."],
        },
      ],
    };

    const jd: StructuredJobDescription = {
      company: null,
      role: "DevOps Engineer",
      location: null,
      workplaceType: null,
      jobType: null,
      seniorityLevel: null,
      minYearsExperience: null,
      maxYearsExperience: null,
      requiredSkills: ["Kubernetes"],
      preferredSkills: [],
      tools: [],
      coreResponsibilities: [],
      educationRequirements: [],
      certifications: [],
      keywords: [],
    };

    const result = JobMatcher.match(resume, jd);

    assert(
      result.missingRequiredSkills.includes("Kubernetes"),
      "Kubernetes must be in missingRequiredSkills"
    );
    assert(
      !result.matchedRequiredSkills.includes("Kubernetes"),
      "Kubernetes must NOT be in matchedRequiredSkills"
    );

    const k8sEvidence = result.evidence.find((e) => e.requirement === "Kubernetes");
    assert(k8sEvidence && k8sEvidence.status === "missing", "Kubernetes marked as missing in evidence");
    assert.strictEqual(k8sEvidence.evidence.length, 0, "Evidence array is empty");
  });

  console.log("\n=======================================================");
  console.log(`   MATCH ENGINE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
