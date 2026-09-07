import { AiService } from "../ai-service";

function runTests() {
  console.log("=== Running Prompt Safety & Truthfulness Tests ===\n");
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

  const sampleResume = {
    personalInfo: {
      name: "Alex Smith",
      email: "alex@example.com",
      title: "Junior Frontend Developer",
    },
    experience: [
      {
        company: "Startup Co",
        role: "Frontend Developer",
        description: [
          "Built checkout components with React and styled them with CSS.",
        ],
      },
    ],
    skills: {
      hard: ["JavaScript", "React"],
      soft: ["Teamwork"],
    },
  };

  const sampleJd = {
    role: "Staff Infrastructure Architect",
    keywords: ["Kubernetes", "Distributed Systems", "AWS", "Terraform"],
  };

  const prompt = AiService.getRewritePrompt(sampleResume, sampleJd);

  // 1. Source of Truth & Candidate Fact Integrity
  console.log("--- 1. Source of Truth & Fact Authority ---");
  assert(
    prompt.includes("RESUME FACTS ARE AUTHORITATIVE"),
    "Prompt declares resume facts as authoritative"
  );
  assert(
    prompt.includes("The job description describes job REQUIREMENTS, NOT candidate experience"),
    "Prompt establishes JD as requirements rather than candidate experience"
  );
  assert(
    prompt.includes("NEVER transfer job requirements into the candidate's experience"),
    "Prompt forbids transferring JD requirements into candidate experience"
  );

  // 2. Candidate Job Title Preservation
  console.log("\n--- 2. Job Title Preservation ---");
  assert(
    prompt.includes("PRESERVE CANDIDATE JOB TITLES"),
    "Prompt explicitly requires preserving candidate job titles"
  );
  assert(
    prompt.includes('Do NOT overwrite or change the candidate\'s actual job title in "personalInfo.title"'),
    "Prompt explicitly protects personalInfo.title from being overwritten by target JD role"
  );
  assert(
    !prompt.includes("FORCE Job Title Match"),
    "Legacy instruction 'FORCE Job Title Match' is completely eliminated"
  );
  assert(
    !prompt.includes("replace \"personalInfo.title\" with the EXACT target role title"),
    "Legacy instruction to overwrite personalInfo.title is completely eliminated"
  );

  // 3. Metric Fabrication & Hallucination Prevention
  console.log("\n--- 3. Metric Fabrication & Hallucination Prevention ---");
  assert(
    prompt.includes("ZERO FABRICATION & STRICT METRICS INTEGRITY"),
    "Prompt includes zero fabrication and metrics integrity section"
  );
  assert(
    prompt.includes("DO NOT invent a metric"),
    "Prompt forbids inventing metrics"
  );
  assert(
    prompt.includes("DO NOT estimate a metric"),
    "Prompt forbids estimating metrics"
  );
  assert(
    !prompt.includes("ESTIMATE reasonable metrics"),
    "Legacy instruction 'ESTIMATE reasonable metrics' is completely eliminated"
  );
  assert(
    prompt.includes("write a strong, professional QUALITATIVE achievement"),
    "Prompt instructs qualitative achievements when source contains no metrics"
  );

  // 4. Skills Section Gap Isolation
  console.log("\n--- 4. Skills Gap Isolation ---");
  assert(
    prompt.includes("NEVER auto-inject unmentioned skills into candidate's hard skills array or experience bullets"),
    "Prompt strictly forbids auto-injecting missing skills into candidate profile"
  );
  assert(
    prompt.includes('Put all missing JD skills strictly into the "missingSkills" array'),
    "Prompt routes missing JD skills to missingSkills array for user review"
  );

  // 5. Score Integrity & Elimination of Fake Targets
  console.log("\n--- 5. Score Integrity ---");
  assert(
    prompt.includes("REALISTIC JOB MATCH STATS (NO ARTIFICIAL SCORE INFLATION)"),
    "Prompt mandates realistic scoring without inflation"
  );
  assert(
    !prompt.includes("target 90-99"),
    "Legacy instruction to force fake 'target 90-99' score is eliminated"
  );
  assert(
    !prompt.includes("PERFORM 95+ SCORE ANALYSIS"),
    "Legacy instruction 'PERFORM 95+ SCORE ANALYSIS' is eliminated"
  );

  console.log(`\nPROMPT SAFETY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
