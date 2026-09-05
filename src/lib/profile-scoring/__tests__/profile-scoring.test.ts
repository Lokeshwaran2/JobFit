import { validateAndNormalizeGithubUrl, validateAndNormalizeLinkedinUrl } from "../url-validator";
import { GitHubScoringService } from "../github-scoring-service";
import { LinkedInScoringService } from "../linkedin-scoring-service";
import { DEFAULT_GITHUB_WEIGHTS, DEFAULT_LINKEDIN_WEIGHTS } from "../config";

function runTests() {
  console.log("=== Running Profile Scoring & URL Validation Tests ===\n");
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

  // Test 1: URL Normalization and Validation
  console.log("--- 1. URL Normalization & Validation ---");
  const gh1 = validateAndNormalizeGithubUrl("https://github.com/torvalds");
  assert(gh1.isValid && gh1.identifier === "torvalds" && gh1.normalizedUrl === "https://github.com/torvalds", "GitHub URL with full https");

  const gh2 = validateAndNormalizeGithubUrl("github.com/lokeshwaran2/");
  assert(gh2.isValid && gh2.identifier === "lokeshwaran2" && gh2.normalizedUrl === "https://github.com/lokeshwaran2", "GitHub URL without protocol and trailing slash");

  const gh3 = validateAndNormalizeGithubUrl("@octocat");
  assert(gh3.isValid && gh3.identifier === "octocat" && gh3.normalizedUrl === "https://github.com/octocat", "GitHub username with @");

  const ghInvalid = validateAndNormalizeGithubUrl("https://evil.com/fakeuser");
  assert(!ghInvalid.isValid && !!ghInvalid.error, "Rejects non-github domain");

  const li1 = validateAndNormalizeLinkedinUrl("https://www.linkedin.com/in/john-doe-123/");
  assert(li1.isValid && li1.identifier === "john-doe-123" && li1.normalizedUrl === "https://www.linkedin.com/in/john-doe-123", "LinkedIn URL with /in/");

  const li2 = validateAndNormalizeLinkedinUrl("linkedin.com/in/alex");
  assert(li2.isValid && li2.identifier === "alex" && li2.normalizedUrl === "https://www.linkedin.com/in/alex", "LinkedIn URL without protocol");

  const liInvalid = validateAndNormalizeLinkedinUrl("https://phishing-linkedin.org/in/alex");
  assert(!liInvalid.isValid, "Rejects invalid LinkedIn domain");

  // Test 2: GitHub Role-Specific Scoring
  console.log("\n--- 2. GitHub Role-Specific Scoring ---");
  const ghService = new GitHubScoringService();
  const mockUser = {
    login: "backendDev",
    name: "Backend Pro",
    bio: "Passionate Backend Engineer building microservices in Node.js and PostgreSQL",
    public_repos: 4,
    followers: 120,
    created_at: "2022-01-01T00:00:00Z",
    blog: "https://backenddev.io",
  };

  const mockRepos = [
    {
      name: "ecommerce-api",
      description: "High-throughput REST API backend built with Node.js, PostgreSQL, Redis and Docker",
      language: "TypeScript",
      topics: ["nodejs", "postgresql", "docker", "rest-api"],
      stargazers_count: 45,
      fork: false,
      pushed_at: new Date().toISOString(),
    },
    {
      name: "aws-infra-deploy",
      description: "Terraform and Docker scripts for deploying backend services to AWS ECS",
      language: "HCL",
      topics: ["aws", "docker", "devops"],
      stargazers_count: 12,
      fork: false,
      pushed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      name: "react-frontend-demo",
      description: "Simple showcase website in React",
      language: "JavaScript",
      topics: ["react"],
      stargazers_count: 2,
      fork: false,
      pushed_at: "2023-01-01T00:00:00Z",
    }
  ];

  // Backend target role
  const backendResult = ghService.analyze({
    username: "backendDev",
    user: mockUser,
    repos: mockRepos,
    targetRole: "Backend Software Engineer",
    requiredSkills: ["Node.js", "PostgreSQL", "Docker", "AWS", "REST API", "Redis"],
  });

  assert(backendResult.score >= 70, `High score for aligned backend role (Score: ${backendResult.score})`);
  assert(backendResult.breakdown.roleRelevance >= 20, "High role relevance score for backend projects");
  assert(backendResult.strengths.length > 0, "Provides positive reasons ('Why') for score");
  assert(backendResult.improvements.length > 0, "Provides constructive improvement suggestions");

  // Evidence level check
  const nodeEvidence = backendResult.evidence.matchedSkills.find((s) => s.skill.toLowerCase().includes("node"));
  assert(nodeEvidence?.level === "Strong" || nodeEvidence?.level === "Moderate", "Correctly identifies Strong/Moderate evidence for Node.js");

  // Role sensitivity check: Scoring the SAME repos against an unaligned role (e.g. iOS Mobile Engineer)
  const iosResult = ghService.analyze({
    username: "backendDev",
    user: mockUser,
    repos: mockRepos,
    targetRole: "iOS Swift Mobile Developer",
    requiredSkills: ["Swift", "SwiftUI", "CoreData", "Xcode", "Cocoapods"],
  });

  assert(iosResult.score < backendResult.score, `Contextual scoring: iOS score (${iosResult.score}) is lower than Backend score (${backendResult.score})`);
  assert(iosResult.breakdown.skillEvidence <= 10, "Skill evidence for unmatching skills is low");

  // Test 3: Deterministic Scoring Check
  console.log("\n--- 3. Deterministic Scoring Check ---");
  const repeatResult = ghService.analyze({
    username: "backendDev",
    user: mockUser,
    repos: mockRepos,
    targetRole: "Backend Software Engineer",
    requiredSkills: ["Node.js", "PostgreSQL", "Docker", "AWS", "REST API", "Redis"],
  });
  assert(repeatResult.score === backendResult.score, `Scores are 100% deterministic (${repeatResult.score} === ${backendResult.score})`);

  // Test 4: LinkedIn Role-Specific Scoring
  console.log("\n--- 4. LinkedIn Role-Specific Scoring ---");
  const liService = new LinkedInScoringService();

  const mockLinkedInProfile = {
    headline: "Senior Backend Engineer | Node.js, PostgreSQL, Distributed Systems",
    about: "Backend architect with 5+ years of experience designing high-scale REST APIs and data processing pipelines.",
    skills: ["Node.js", "PostgreSQL", "Docker", "AWS", "REST API", "Redis", "TypeScript"],
    experience: [
      {
        title: "Senior Backend Engineer",
        company: "Acme Corp",
        description: "Built scalable Node.js microservices with PostgreSQL handling 25,000 requests/sec. Reduced server latency by 40% with Redis caching.",
      },
      {
        title: "Software Developer",
        company: "Startup Co",
        description: "Developed RESTful APIs and containerized microservices using Docker and AWS ECS.",
      }
    ]
  };

  const liResult = liService.analyze({
    profileData: mockLinkedInProfile,
    targetRole: "Backend Software Engineer",
    requiredSkills: ["Node.js", "PostgreSQL", "Docker", "AWS", "Redis"],
  });

  assert(liResult.score >= 80, `Strong LinkedIn score for aligned profile (Score: ${liResult.score})`);
  assert(liResult.breakdown.achievementQuality >= 10, "Recognizes quantifiable achievements (25,000 req/sec, 40% latency)");
  assert(liResult.strengths.some((s) => s.includes("headline") || s.includes("alignment")), "Generates headline alignment strength");

  // Incomplete LinkedIn profile test
  const emptyLiResult = liService.analyze({
    profileData: {},
    targetRole: "Backend Software Engineer",
    requiredSkills: ["Node.js", "PostgreSQL"],
  });
  assert(emptyLiResult.score < 40, `Low score for empty profile (${emptyLiResult.score} < 40)`);
  assert(emptyLiResult.improvements.length > 0, "Provides clear improvement steps for empty profile");

  // Test 5: Configurable Weights Check
  console.log("\n--- 5. Configurable Weights Sum Check ---");
  const ghWeightSum = Object.values(DEFAULT_GITHUB_WEIGHTS).reduce((a, b) => a + b, 0);
  assert(ghWeightSum === 100, `GitHub weights sum to 100 (Sum: ${ghWeightSum})`);

  const liWeightSum = Object.values(DEFAULT_LINKEDIN_WEIGHTS).reduce((a, b) => a + b, 0);
  assert(liWeightSum === 100, `LinkedIn weights sum to 100 (Sum: ${liWeightSum})`);

  console.log(`\n========================================`);
  console.log(`Tests Finished: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
