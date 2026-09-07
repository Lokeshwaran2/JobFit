import { normalizeJobText, canonicalizeJobUrl, createJobHash } from "../job-fingerprint";

function runTests() {
  console.log("=== Running Job Fingerprint & Normalization Tests ===\n");
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

  // 1. Text Normalization
  console.log("--- 1. Text Normalization ---");
  const raw1 = "  Senior Full-Stack Engineer \n\n at Acme Corp.  \t Must know TypeScript! ";
  const norm1 = normalizeJobText(raw1);
  assert(norm1 === "senior full-stack engineer at acme corp. must know typescript!", "Normalizes whitespace and casing");

  const quotesRaw = `We're seeking a “Senior Engineer” who's 'passionate'`;
  const quotesNorm = normalizeJobText(quotesRaw);
  assert(quotesNorm === `we're seeking a "senior engineer" who's 'passionate'`, "Normalizes smart quotes to standard quotes");

  // 2. URL Canonicalization
  console.log("\n--- 2. URL Canonicalization ---");
  const url1 = "https://boards.greenhouse.io/stripe/jobs/123456?gh_src=linkedin_feed&utm_source=linkedin";
  const can1 = canonicalizeJobUrl(url1);
  assert(can1 === "https://boards.greenhouse.io/stripe/jobs/123456", "Strips gh_src and utm_source tracking parameters");

  const url2 = "https://jobs.lever.co/acme/7890-abcd/?utm_campaign=winter2026&utm_medium=job_board";
  const can2 = canonicalizeJobUrl(url2);
  assert(can2 === "https://jobs.lever.co/acme/7890-abcd", "Strips trailing slash and campaign tracking parameters");

  const url3 = "jobs.lever.co/acme/123#apply";
  const can3 = canonicalizeJobUrl(url3);
  assert(can3 === "https://jobs.lever.co/acme/123", "Prepends https and removes hash fragments");

  const urlInvalid = "ftp://invalid-protocol.com/job";
  assert(canonicalizeJobUrl(urlInvalid) === null, "Rejects non-http(s) protocols");

  // 3. Deterministic Job Hashing
  console.log("\n--- 3. Deterministic Job Hashing ---");
  const descA = `
    We are looking for a Senior Node.js Developer.
    Requirements:
    - 5+ years experience with Node.js and PostgreSQL.
    - Strong communication skills.
  `;

  const descB = `we are looking for a senior node.js developer. requirements: - 5+ years experience with node.js and postgresql. - strong communication skills.`;

  const hashA = createJobHash({
    company: "Acme Corp",
    title: "Senior Node.js Developer",
    description: descA,
  });

  const hashB = createJobHash({
    company: "acme corp ",
    title: "  senior node.js developer",
    description: descB,
  });

  assert(hashA === hashB, "Same job with whitespace and casing differences generates IDENTICAL hash");

  const hashWithTracking = createJobHash({
    company: "Acme Corp",
    title: "Senior Node.js Developer",
    description: descA,
    url: "https://boards.greenhouse.io/acme/jobs/100?utm_source=linkedin",
  });

  const hashCleanUrl = createJobHash({
    company: "Acme Corp",
    title: "Senior Node.js Developer",
    description: descA,
    url: "https://boards.greenhouse.io/acme/jobs/100",
  });

  assert(hashWithTracking === hashCleanUrl, "Tracking parameters do not change the job hash");

  const diffDesc = `
    We are looking for a Junior Python Developer.
    Requirements:
    - Experience with Django.
  `;

  const hashDiff = createJobHash({
    company: "Acme Corp",
    title: "Junior Python Developer",
    description: diffDesc,
  });

  assert(hashA !== hashDiff, "Different job description generates DIFFERENT hash");

  console.log(`\nFINGERPRINT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
