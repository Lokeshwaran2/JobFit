import { TailoringService } from "../tailoring-service";
import { BulletValidator } from "../bullet-validator";
import { JobMatcher } from "../../matching/job-matcher";
import { getExportableResumeData } from "../../export/resume-data-resolver";
import { generateResumePdfBuffer } from "../../export/pdf-generator";
import { generateResumeDocxBuffer } from "../../export/docx-generator";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

async function runTests() {
  console.log("\n===============================================================");
  console.log("   TAILORED RESUME PRESERVATION & SCORE CONSISTENCY SUITE      ");
  console.log("===============================================================\n");

  const originalCandidateResume = {
    personalInfo: {
      name: "Alex Morgan",
      title: "Senior Full Stack Engineer",
      email: "alex@example.com",
      phone: "+1-555-0199",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexmorgan",
      github: "github.com/alexmorgan",
    },
    summary: "Experienced engineer building scalable cloud systems.",
    skills: {
      hard: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"],
      soft: ["Cross-functional leadership", "Mentorship"],
      tools: ["Git", "VS Code", "Jira"],
    },
    experience: [
      {
        company: "Stripe",
        role: "Senior Full Stack Engineer",
        startDate: "2021",
        endDate: "Present",
        location: "San Francisco, CA",
        description: [
          "Scaled billing API throughput by 40% using Node.js and PostgreSQL query optimizations.",
          "Managed a team of 4 engineers delivering merchant onboarding workflows.",
        ],
      },
      {
        company: "Twilio",
        role: "Software Engineer",
        startDate: "2019",
        endDate: "2021",
        location: "San Francisco, CA",
        description: [
          "Built event-driven messaging pipelines handling 10M events daily.",
        ],
      },
    ],
    projects: [
      {
        name: "OpenTelemetry Tracer",
        description: "Lightweight tracing exporter for distributed microservices in TypeScript.",
        link: "github.com/alexmorgan/opentelemetry-tracer",
        technologies: ["TypeScript", "Docker"],
      },
    ],
    education: [
      {
        institution: "UC Berkeley",
        degree: "B.S. Computer Science",
        year: "2019",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2022",
      },
    ],
  };

  const targetJobDescription: any = {
    role: "Staff Backend Engineer",
    requiredSkills: ["Node.js", "PostgreSQL", "Distributed Systems", "Kubernetes"],
    preferredSkills: ["Docker", "Redis"],
    minYearsExperience: 4,
    coreResponsibilities: [
      "Architect and scale high-throughput billing and payment APIs in Node.js",
      "Optimize complex relational database queries in PostgreSQL",
    ],
    keywords: ["Node.js", "PostgreSQL", "Billing API", "Distributed Systems", "Docker"],
    workplaceType: "hybrid",
  };

  // Simulated AI response with 1 valid rewrite and 1 invalid rewrite (trying to fabricate 50+ engineers and Kubernetes)
  const simulatedAiResult = {
    structuredData: {
      personalInfo: {
        name: "Alex Morgan",
        title: "Target Staff Backend Engineer", // AI attempts title change
      },
      summary: "Tailored summary for Staff Backend Engineer role.",
      skills: {
        hard: ["Kubernetes", "Node.js", "PostgreSQL"], // AI attempts to inject Kubernetes and drop TypeScript
      },
      experience: [
        {
          company: "Fake Company", // AI attempts company change
          role: "Target Staff Role", // AI attempts role change
          startDate: "2015", // AI attempts date alteration
          endDate: "2024",
          description: [
            // Valid rewrite: aligns wording with JD while preserving Billing API keyword, 40% metric and verified skills
            "Scaled high-throughput billing API throughput by 40% through Node.js and PostgreSQL query optimizations.",
            // Invalid rewrite: attempts to fabricate metric (50+ engineers) and unverified technology
            "Managed 50+ engineers delivering Kubernetes infrastructure across global clusters.",
          ],
        },
        {
          company: "Twilio",
          role: "Software Engineer",
          description: [
            // Unchanged/valid rewrite preserving original 10M metric
            "Built distributed event-driven messaging pipelines handling 10M events daily.",
          ],
        },
      ],
    },
  };

  const beforeMatch = JobMatcher.match(originalCandidateResume, targetJobDescription);

  const { tailoredData, tailoringDiff, afterMatch } = await TailoringService.tailorResume(
    originalCandidateResume,
    targetJobDescription,
    beforeMatch,
    simulatedAiResult
  );

  // --- FINAL TAILORED RESUME VERIFICATION ---
  assert(tailoredData !== null && typeof tailoredData === "object", "Test 1: Complete tailored structured resume is generated");

  // Test 2: Accepted rewrite replaces corresponding original bullet (may be reordered by relevance ranker)
  const exp0Bullets = tailoredData.experience[0].description.map((b: any) =>
    typeof b === "string" ? b : b.text
  );
  assert(
    exp0Bullets.some((t: string) => t.includes("Scaled high-throughput billing API throughput by 40%")),
    "Test 2: Accepted rewrite replaces corresponding original bullet"
  );

  // Test 3: Rejected rewrite preserves original bullet
  assert(
    exp0Bullets.some((t: string) => t.includes("Managed a team of 4 engineers")) &&
    !exp0Bullets.some((t: string) => t.includes("50+ engineers")),
    "Test 3: Rejected rewrite safely preserves original bullet"
  );

  // Test 4: Company names remain unchanged
  assert(
    tailoredData.experience[0].company === "Stripe" && tailoredData.experience[1].company === "Twilio",
    "Test 4: Company names remain strictly unchanged ('Stripe', 'Twilio')"
  );

  // Test 5: Job titles remain unchanged
  assert(
    tailoredData.personalInfo.title === "Senior Full Stack Engineer" &&
    tailoredData.experience[0].role === "Senior Full Stack Engineer",
    "Test 5: Candidate job titles remain strictly unchanged"
  );

  // Test 6: Dates remain unchanged
  assert(
    tailoredData.experience[0].startDate === "2021" && tailoredData.experience[0].endDate === "Present",
    "Test 6: Experience dates remain strictly unchanged ('2021 - Present')"
  );

  // Test 7: Existing metrics remain unchanged
  assert(
    exp0Bullets.some((t: string) => t.includes("40%")) && exp0Bullets.some((t: string) => t.includes("4 engineers")),
    "Test 7: Factual metrics (40%, 4 engineers) are strictly preserved"
  );

  // Test 8: All sections are preserved
  assert(
    Boolean(tailoredData.personalInfo && tailoredData.summary && tailoredData.skills && tailoredData.experience && tailoredData.projects && tailoredData.education && tailoredData.certifications),
    "Test 8: All candidate resume sections (personalInfo, summary, skills, experience, projects, education, certifications) are preserved"
  );

  // Test 9: Skills, projects, education, certifications preserved from original
  assert(
    tailoredData.skills.hard.includes("TypeScript") &&
    tailoredData.skills.hard.includes("React") &&
    tailoredData.skills.hard.includes("Node.js") &&
    tailoredData.projects.length === 1 &&
    tailoredData.education[0].institution === "UC Berkeley" &&
    tailoredData.certifications[0].name === "AWS Certified Solutions Architect",
    "Test 9: Full skills list, projects, education, and certifications are preserved"
  );

  // Test 10: No new unsupported candidate facts appear (e.g. Kubernetes not in candidate skills)
  assert(
    !tailoredData.skills.hard.includes("Kubernetes"),
    "Test 10: Missing JD skills are not injected into candidate's hard skills"
  );

  // Test 11: Final tailored data structure matches what is persisted
  const simulatedDbRecord = {
    id: "res-test-123",
    structuredData: tailoredData,
    originalData: originalCandidateResume,
    atsScore: afterMatch.score,
    improvements: {
      originalScore: beforeMatch.score,
      atsScore: afterMatch.score,
      scoreGain: tailoringDiff.scoreGain,
      percentageGain: tailoringDiff.percentageGain,
      jobMatch: afterMatch,
      beforeMatch: beforeMatch,
      tailoring: tailoringDiff,
      tailoredData: tailoredData,
    },
  };
  assert(
    simulatedDbRecord.structuredData.personalInfo.name === "Alex Morgan" &&
    simulatedDbRecord.improvements.tailoredData.experience[0].company === "Stripe",
    "Test 11: Final tailored data is correctly formatted for database persistence"
  );

  // Test 12: Page reload / resolver retrieves identical final tailored resume
  const resolvedOnReload = getExportableResumeData(simulatedDbRecord);
  assert(
    JSON.stringify(resolvedOnReload) === JSON.stringify(tailoredData),
    "Test 12: Page reload / export resolver retrieves identical final tailored resume"
  );

  // --- SCORE CONSISTENCY VERIFICATION ---
  // Test 13: Authoritative score flow: beforeScore and afterScore are clearly defined
  assert(
    typeof tailoringDiff.beforeScore === "number" && typeof tailoringDiff.afterScore === "number",
    "Test 13: Authoritative score flow: beforeScore and afterScore are clearly defined"
  );

  // Test 14: Stored score matches jobMatch.score and tailoringDiff.afterScore
  assert(
    simulatedDbRecord.atsScore === afterMatch.score &&
    simulatedDbRecord.improvements.jobMatch.score === afterMatch.score &&
    simulatedDbRecord.improvements.tailoring.afterScore === afterMatch.score,
    "Test 14: Stored score (atsScore) strictly matches jobMatch.score and tailoringDiff.afterScore"
  );

  // Test 15: Header baseline score matches beforeMatch.score and tailoringDiff.beforeScore
  assert(
    simulatedDbRecord.improvements.originalScore === beforeMatch.score &&
    simulatedDbRecord.improvements.tailoring.beforeScore === beforeMatch.score,
    "Test 15: Baseline score strictly matches beforeMatch.score and tailoringDiff.beforeScore"
  );

  // Test 16: Tailoring score never decreases below baseline (no negative scoreGain or regression)
  assert(
    afterMatch.score >= beforeMatch.score && tailoringDiff.scoreGain >= 0,
    "Test 16: Tailoring score never degrades below baseline (afterMatch >= beforeMatch)"
  );

  // Test 17: No artificial score inflation occurs (deterministic formula respected)
  const expectedGain = afterMatch.score - beforeMatch.score;
  assert(
    tailoringDiff.scoreGain === expectedGain,
    "Test 17: Score gain is strictly deterministic without artificial boosts or inflation"
  );

  // --- EXPORT PIPELINE INTEGRITY ---
  // Test 18: PDF generator receives complete validated tailored structured data
  const pdfBuffer = await generateResumePdfBuffer(resolvedOnReload, "classic");
  assert(
    Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 500,
    "Test 18: PDF export receives complete validated tailored data and generates valid buffer"
  );

  // Test 19: DOCX generator receives the exact same validated tailored structured data
  const docxBuffer = await generateResumeDocxBuffer(resolvedOnReload, "classic");
  assert(
    Buffer.isBuffer(docxBuffer) && docxBuffer.length > 500,
    "Test 19: DOCX export receives exact same validated tailored data and generates valid buffer"
  );

  // --- FINAL INTEGRITY & ANTI-FABRICATION VERIFICATION (TESTS A, B, C, D) ---
  // Test 20 (Test A): Original bullet with Angular and .NET - rewrite stripping them must be rejected
  const origBulletA = "Delivered 50+ enterprise features across 10 application modules for a manufacturing software platform, working across Angular frontend, .NET APIs, and database layers within a 7-member engineering team.";
  const strippedRewriteA = "Delivered 50+ enterprise features across 10 application modules for a manufacturing software platform, collaborating with a 7-member engineering team.";
  const validationA = BulletValidator.validateRewrite(
    origBulletA,
    strippedRewriteA,
    new Set(["angular", ".net", "sql"]),
    new Set(["50", "50+", "10", "7"])
  );
  assert(
    !validationA.isValid,
    "Test 20 (Test A): Rewrite stripping 'Angular' and '.NET' evidence is strictly rejected"
  );

  // Test 21 (Test B): Rewrite preserving candidate's technical evidence is approved
  const preservedRewriteA = "Delivered 50+ enterprise features across 10 application modules for a manufacturing platform using Angular frontend and .NET APIs within a 7-member team.";
  const validationPreservedA = BulletValidator.validateRewrite(
    origBulletA,
    preservedRewriteA,
    new Set(["angular", ".net", "sql"]),
    new Set(["50", "50+", "10", "7"])
  );
  assert(
    validationPreservedA.isValid,
    "Test 21 (Test B): Rewrite preserving Angular and .NET evidence is approved"
  );

  // Test 22 (Test C): Performance bullet - rewrite introducing 'query tuning, caching, and code refactoring' is rejected
  const origBulletC = "Optimized application/API performance from ~5 seconds to ~1 second, achieving an 80% reduction in response latency and 5× faster response times through application, API, and data-access optimization.";
  const fabricatedRewriteC = "Optimized application and API performance from ~5 seconds to ~1 second, achieving an 80% reduction in latency through query tuning, caching, and code refactoring.";
  const validationC = BulletValidator.validateRewrite(
    origBulletC,
    fabricatedRewriteC,
    new Set(["api"]),
    new Set(["5", "1", "80%", "5x"])
  );
  assert(
    Boolean(!validationC.isValid && (validationC.reason?.includes("Unsupported technical mechanism") || validationC.reason?.includes("query tuning"))),
    "Test 22 (Test C): Rewrite introducing unsupported techniques ('query tuning', 'caching', 'code refactoring') is strictly rejected"
  );

  // Test 23 (Test D): Production issues bullet - rewrite introducing 'hot-fixes' is rejected if unsupported
  const origBulletD = "Resolved 80+ production issues across UI, APIs, and business logic through root-cause analysis, cross-layer debugging, and production-ready fixes.";
  const fabricatedRewriteD = "Resolved 80+ production incidents by conducting root-cause analysis, cross-layer debugging, and deploying hot-fixes in a timely manner.";
  const validationD = BulletValidator.validateRewrite(
    origBulletD,
    fabricatedRewriteD,
    new Set(["api", "debugging"]),
    new Set(["80", "80+"])
  );
  assert(
    Boolean(!validationD.isValid && (validationD.reason?.includes("hot-fix") || validationD.reason?.includes("Unsupported technical mechanism"))),
    "Test 23 (Test D): Rewrite introducing unsupported 'hot-fixes' is strictly rejected"
  );

  // Test 24: Empty, whitespace, or null skills in JD never produce "Your resume is missing required skill ''."
  const jdWithEmptySkills = {
    role: "DevOps Engineer",
    requiredSkills: ["GitOps (ArgoCD)", "", "   ", null, "Kubernetes Gateway API", "InvalidNonSkillLocation123"],
    preferredSkills: ["", "Docker", null],
    minYearsExperience: null,
    coreResponsibilities: [],
    keywords: [],
  };
  const matchResultWithEmpty = JobMatcher.match(originalCandidateResume, jdWithEmptySkills as any);
  const emptyRecommendations = matchResultWithEmpty.recommendations.filter(
    (rec) => rec.includes("missing required skill ''") || rec.includes("missing required skill ' '")
  );
  assert(
    emptyRecommendations.length === 0,
    "Test 24: Empty or invalid JD skills never produce an empty required skill recommendation"
  );
  // Test 25: Rejected rewrite retains original bullet and cannot reduce tailored score
  const candidateWithOrigBullets = {
    ...originalCandidateResume,
    experience: [
      {
        company: "Manufacturing Corp",
        role: "Software Engineer",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Delivered 50+ enterprise features across 10 application modules for a manufacturing software platform, working across Angular frontend, .NET APIs, and database layers within a 7-member engineering team."
        ]
      }
    ]
  };
  const targetManufacturingJd = {
    role: "Full Stack Engineer",
    requiredSkills: ["Angular", ".NET", "REST APIs"],
    preferredSkills: ["Databases"],
    minYearsExperience: 2,
    coreResponsibilities: [],
    keywords: ["Angular", ".NET", "APIs", "database"]
  };
  const preMatch = JobMatcher.match(candidateWithOrigBullets, targetManufacturingJd as any);
  
  // Simulate AI attempting to strip Angular and .NET
  const strippingRewrite = "Delivered 50+ enterprise features across 10 application modules for a manufacturing software platform, collaborating with a 7-member engineering team.";
  const valCheck = BulletValidator.validateRewrite(
    candidateWithOrigBullets.experience[0].bullets[0],
    strippingRewrite,
    new Set(["angular", ".net", "rest apis", "databases"])
  );
  assert(!valCheck.isValid, "Test 25a: BulletValidator rejects stripping rewrite");
  
  // Since rejected, original bullet is retained
  const retainedExperienceResume = {
    ...candidateWithOrigBullets,
    experience: [
      {
        ...candidateWithOrigBullets.experience[0],
        bullets: [valCheck.isValid ? strippingRewrite : candidateWithOrigBullets.experience[0].bullets[0]]
      }
    ]
  };
  const postMatchRetained = JobMatcher.match(retainedExperienceResume, targetManufacturingJd as any);
  assert(
    postMatchRetained.score === preMatch.score,
    "Test 25b: Retaining original bullet upon rejection preserves the exact source score without regression"
  );

  // Test 26: Genuine alignment improvement increases score deterministically
  const candidateWithBasicBullets = {
    ...originalCandidateResume,
    skills: { hard: ["JavaScript"], soft: [], tools: [] },
    experience: [
      {
        company: "Acme",
        role: "Frontend Dev",
        startDate: "2022",
        endDate: "Present",
        bullets: ["Built customer UI components."]
      }
    ]
  };
  const jdFrontend = {
    role: "Frontend Engineer",
    requiredSkills: ["React", "TypeScript"],
    preferredSkills: [],
    minYearsExperience: 1,
    coreResponsibilities: ["Build web applications"],
    keywords: ["React", "TypeScript"]
  };
  const baselineBasic = JobMatcher.match(candidateWithBasicBullets, jdFrontend as any);
  // Candidate actually has React & TypeScript in their background evidence
  const enhancedCandidate = {
    ...candidateWithBasicBullets,
    skills: { hard: ["JavaScript", "React", "TypeScript"], soft: [], tools: [] },
    experience: [
      {
        company: "Acme",
        role: "Frontend Dev",
        startDate: "2022",
        endDate: "Present",
        bullets: ["Built responsive customer UI components using React and TypeScript."]
      }
    ]
  };
  const tailoredEnhancedMatch = JobMatcher.match(enhancedCandidate, jdFrontend as any);
  assert(
    tailoredEnhancedMatch.score > baselineBasic.score,
    "Test 26: Accepted enhancement with genuine evidence increases match score deterministically"
  );

  // Test 27: Parity check: afterScore and beforeScore are 100% direct matcher outputs (no Math.max or inflation)
  const directMatcherBefore = JobMatcher.match(originalCandidateResume, targetJobDescription).score;
  const directMatcherAfter = JobMatcher.match(tailoredData, targetJobDescription).score;
  assert(
    tailoringDiff.beforeScore === directMatcherBefore && tailoringDiff.afterScore === directMatcherAfter,
    "Test 27: Parity check: displayed beforeScore and afterScore strictly equal raw deterministic matcher outputs without Math.max or artificial floor"
  );

  console.log("\n===============================================================");
  console.log("   TAILORED RESUME SUITE SUMMARY: 28 PASSED, 0 FAILED         ");
  console.log("===============================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
