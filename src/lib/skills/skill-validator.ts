/**
 * Skill Validation & Quality Gate
 * Filters out locations, company boilerplate, transactional words,
 * job requirements, and non-skill phrases before skill gap tracking.
 */

// 1. Blacklisted Locations, Cities, States, Countries, and Work Arrangement Terms
const LOCATION_BLACKLIST = new Set([
  // Cities - India
  "bengaluru", "bangalore", "hyderabad", "pune", "mumbai", "delhi", "chennai", "gurgaon", "gurugram", "noida", "kolkata", "ahmedabad", "jaipur", "kochi", "coimbatore",
  // Cities - Global
  "new york", "nyc", "san francisco", "sf", "bay area", "seattle", "austin", "boston", "chicago", "los angeles", "london", "manchester", "berlin", "munich", "amsterdam", "paris", "dublin", "singapore", "tokyo", "sydney", "melbourne", "toronto", "vancouver",
  // Countries / Regions
  "india", "usa", "us", "united states", "uk", "united kingdom", "canada", "germany", "australia", "japan", "europe", "apac", "emea", "latam",
  // Work Arrangements
  "remote", "hybrid", "onsite", "on-site", "in-office", "work from home", "wfh", "relocation", "visa sponsorship", "hybrid work", "remote work",
]);

// 2. Blacklisted Generic Job Boilerplate, Perks, Benefits, and HR Requirements
const JOB_BOILERPLATE_BLACKLIST = new Set([
  // Common JD descriptions
  "high volume applications", "high-volume applications", "high volume", "high volume systems",
  "fast paced environment", "fast-paced environment", "dynamic environment", "agile environment",
  "ambiguous environments", "ambiguous environment", "high-pressure environments", "high pressure environments",
  "greenfield projects", "greenfield project", "legacy codebase", "cross-functional teams", "cross functional teams",
  "data-driven approach", "data driven approach", "customer needs", "user needs",
  "innovating on behalf of customers", "positive impact", "engaging work atmosphere", "inclusive team culture",
  "continuous learning opportunities", "learning opportunities", "growth mindset",
  // Experience & Education
  "years of experience", "years experience", "minimum 3 years", "minimum 5 years", "3+ years", "5+ years", "8+ years", "10+ years",
  "bachelor's degree", "bachelors degree", "master's degree", "masters degree", "computer science degree", "engineering degree", "b.tech", "b.e", "m.tech", "m.s", "bs/ms",
  "degree", "diploma", "graduates", "fresher",
  // Perks & Compensation
  "competitive salary", "market standard", "health insurance", "401k", "stock options", "equity", "esop", "paid time off", "pto",
  "equal opportunity", "equal opportunity employer", "eoe", "diversity and inclusion",
  // Employment types
  "full time", "full-time", "part time", "part-time", "contract", "contractor", "freelance", "internship", "intern", "permanent",
  // Generic headings
  "responsibilities", "requirements", "qualifications", "preferred qualifications", "job summary", "day to day", "overview", "about us", "who you are", "what you will do",
]);

// 3. Blacklisted Transactional / Business Domain Words (Not Technical or Transferable Skills)
const BUSINESS_TRANSACTION_BLACKLIST = new Set([
  "discounts", "promos", "promotions", "pricing", "returns", "refunds", "cancellations", "gst", "invoice", "invoices",
  "platform fee", "delivery fee", "convenience fee", "packaging fee", "shipping fee",
  "order-to-cash cycle", "order to cash", "revenue validation", "revenue integrity",
  "grocery stores tech", "kitchen facilities", "innovative centralized kitchen facilities",
  "automated production processes", "retail technology", "branch management",
]);

// 4. Blacklisted Soft Skills & Buzzwords (Non-actionable / generic)
const SOFT_BUZZWORDS_BLACKLIST = new Set([
  "team player", "strong team player", "individual contributor",
  "problem solver", "problem solving", "problem-solving", "problem solving skills",
  "self starter", "self-starter", "self motivated", "highly motivated",
  "attention to detail", "detail oriented", "detail-oriented",
  "fast learner", "quick learner", "eager to learn",
  "critical thinking", "analytical mindset", "analytical skills",
  "communication", "communication skills", "excellent communication", "verbal communication", "written communication",
  "interpersonal skills", "presentation skills", "public speaking",
  "time management", "multitasking", "multi-tasking",
  "adaptability", "flexibility", "resilience",
  "leadership", "leadership skills", "mentoring", "coaching",
  "decision making", "decision-making", "strategic thinking", "strategic planning", "results orientation", "business acumen", "customer focus",
]);

// 5. Explicitly Recognized Technical Skills & Hard Skills (Whitelist to protect valid technical terms)
const TECHNICAL_WHITELIST = new Set([
  "react", "react native", "next.js", "vue.js", "angular", "svelte", "html", "css", "tailwind css", "javascript", "typescript",
  "node.js", "express.js", "nestjs", "fastapi", "django", "flask", "spring boot", "ruby on rails", "asp.net", "fastify",
  "python", "java", "c++", "c#", "c", "go", "golang", "rust", "php", "ruby", "kotlin", "swift", "scala", "solidity", "r", "dart",
  "postgresql", "mysql", "mongodb", "redis", "dynamodb", "sqlite", "cassandra", "elasticsearch", "neo4j", "mariadb", "sql", "nosql",
  "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "gitlab ci", "github actions", "linux", "git",
  "graphql", "rest api", "grpc", "microservices", "system design", "distributed systems", "kafka", "rabbitmq", "celery",
  "ci/cd", "devops", "cloud computing", "machine learning", "deep learning", "nlp", "computer vision", "llm", "rag",
  "jest", "pytest", "cypress", "playwright", "unit testing", "selenium",
  "prisma", "typeorm", "hibernate", "redux", "zustand",
]);

// Verb prefixes and filler phrases to reject
const VERB_PREFIX_REGEX = /^(innovating|working|building|handling|delivering|driving|supporting|executing|creating|managing|providing|ensuring|assisting|helping|maintaining|developing)\b/i;
const PHRASE_PREFIX_REGEX = /^(knowledge of|experience with|understanding of|proficiency in|ability to|responsible for|familiarity with|strong understanding of|hands-on experience with|proven experience in|must have|good to have)\b/i;

/**
 * Validates whether a candidate string is genuinely a technical or actionable professional skill,
 * rather than a location, job requirement, corporate phrase, or business transaction word.
 */
export function isValidSkill(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== "string") {
    return false;
  }

  const trimmed = candidate.trim();
  if (trimmed.length < 2 || trimmed.length > 35) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  // If in technical whitelist, immediately valid
  if (TECHNICAL_WHITELIST.has(lower)) {
    return true;
  }

  // 1. Blacklist check - Locations
  if (LOCATION_BLACKLIST.has(lower)) {
    return false;
  }

  // 2. Blacklist check - Job Boilerplate & Perks
  if (JOB_BOILERPLATE_BLACKLIST.has(lower)) {
    return false;
  }

  // 3. Blacklist check - Business Transactions
  if (BUSINESS_TRANSACTION_BLACKLIST.has(lower)) {
    return false;
  }

  // 4. Blacklist check - Soft Buzzwords
  if (SOFT_BUZZWORDS_BLACKLIST.has(lower)) {
    return false;
  }

  // 5. Pattern Checks
  // Check word count: technical skills rarely exceed 3 words
  const words = trimmed.split(/\s+/);
  if (words.length > 3) {
    return false;
  }

  // Reject strings starting with verb gerunds or filler phrases
  if (VERB_PREFIX_REGEX.test(trimmed) || PHRASE_PREFIX_REGEX.test(trimmed)) {
    return false;
  }

  // Reject strings containing years of experience indicators or purely numeric patterns
  if (/\b\d+\+?\s*(years?|yrs?|months?)\b/i.test(trimmed)) {
    return false;
  }
  if (/^\d+$/.test(trimmed)) {
    return false;
  }

  // Reject if it ends with generic terms that indicate job descriptions rather than skills
  if (/\b(fee|fees|promos|discounts|refunds|returns|cancellations|atmosphere|culture|facilities|cycle|opportunity|environment|environments)\b/i.test(trimmed)) {
    return false;
  }

  // Reject if contains punctuation like full stops, commas, or question marks
  if (/[.,!?;:"]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Sanitizes and extracts clean skill name if valid, or returns null.
 */
export function sanitizeSkillName(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== "string") return null;

  // Remove filler prefixes
  let cleaned = candidate.trim().replace(PHRASE_PREFIX_REGEX, "").trim();

  if (!isValidSkill(cleaned)) {
    return null;
  }

  return cleaned;
}
