import { isValidSkill, sanitizeSkillName } from "./skill-validator";
export { isValidSkill, sanitizeSkillName };

export interface NormalizedSkillResult {
  canonicalSkill: string;
  originalSkill: string;
  isValid?: boolean;
}

// Mapping of lowercase alias or variant to authoritative Canonical Name
const CANONICAL_SKILL_MAP: Record<string, string> = {
  // Databases & Storage
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "postgresql db": "PostgreSQL",
  "postgres db": "PostgreSQL",
  "psql": "PostgreSQL",
  "pg": "PostgreSQL",
  "mysql": "MySQL",
  "sqlite": "SQLite",
  "sqlite3": "SQLite",
  "redis": "Redis",
  "redis cache": "Redis",
  "mongodb": "MongoDB",
  "mongo": "MongoDB",
  "dynamodb": "DynamoDB",
  "aws dynamodb": "DynamoDB",
  "cassandra": "Cassandra",
  "apache cassandra": "Cassandra",
  "elasticsearch": "Elasticsearch",
  "elastic search": "Elasticsearch",
  "neo4j": "Neo4j",
  "mariadb": "MariaDB",
  "cockroachdb": "CockroachDB",
  "sql": "SQL",

  // Frontend & UI
  "react": "React",
  "react.js": "React",
  "reactjs": "React",
  "react native": "React Native",
  "react-native": "React Native",
  "vue": "Vue.js",
  "vue.js": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "angular.js": "Angular",
  "angularjs": "Angular",
  "svelte": "Svelte",
  "sveltekit": "SvelteKit",
  "next.js": "Next.js",
  "nextjs": "Next.js",
  "next": "Next.js",
  "nuxt": "Nuxt.js",
  "nuxt.js": "Nuxt.js",
  "nuxtjs": "Nuxt.js",
  "html": "HTML",
  "html5": "HTML5",
  "css": "CSS",
  "css3": "CSS3",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  "bootstrap": "Bootstrap",
  "sass": "Sass",
  "scss": "Sass",
  "material-ui": "Material UI",
  "mui": "Material UI",
  "shadcn": "shadcn/ui",
  "shadcn/ui": "shadcn/ui",
  "redux": "Redux",
  "redux toolkit": "Redux Toolkit",
  "zustand": "Zustand",

  // Backend & Runtimes
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "express": "Express.js",
  "express.js": "Express.js",
  "expressjs": "Express.js",
  "nestjs": "NestJS",
  "nest.js": "NestJS",
  "fastapi": "FastAPI",
  "django": "Django",
  "django rest framework": "Django",
  "drf": "Django",
  "flask": "Flask",
  "spring": "Spring Boot",
  "spring boot": "Spring Boot",
  "springboot": "Spring Boot",
  "ruby on rails": "Ruby on Rails",
  "rails": "Ruby on Rails",
  "asp.net": "ASP.NET",
  "asp.net core": "ASP.NET Core",
  ".net": ".NET",
  ".net core": ".NET Core",
  "fastify": "Fastify",

  // Programming Languages
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ts": "TypeScript",
  "typescript": "TypeScript",
  "py": "Python",
  "python": "Python",
  "python3": "Python",
  "python 3": "Python",
  "go": "Go",
  "golang": "Go",
  "go lang": "Go",
  "rust": "Rust",
  "java": "Java",
  "c++": "C++",
  "cpp": "C++",
  "c#": "C#",
  "csharp": "C#",
  "c": "C",
  "ruby": "Ruby",
  "php": "PHP",
  "swift": "Swift",
  "kotlin": "Kotlin",
  "dart": "Dart",
  "scala": "Scala",
  "r": "R",

  // Cloud & DevOps
  "aws": "AWS",
  "amazon web services": "AWS",
  "aws cloud": "AWS",
  "gcp": "GCP",
  "google cloud": "GCP",
  "google cloud platform": "GCP",
  "azure": "Azure",
  "microsoft azure": "Azure",
  "docker": "Docker",
  "docker containers": "Docker",
  "docker compose": "Docker",
  "k8s": "Kubernetes",
  "kubernetes": "Kubernetes",
  "terraform": "Terraform",
  "ansible": "Ansible",
  "jenkins": "Jenkins",
  "github actions": "GitHub Actions",
  "gitlab ci": "GitLab CI",
  "ci/cd": "CI/CD",
  "cicd": "CI/CD",
  "continuous integration": "CI/CD",
  "linux": "Linux",
  "nginx": "Nginx",
  "apache": "Apache",

  // Architecture & Protocols
  "rest": "REST APIs",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  "restful": "REST APIs",
  "restful api": "REST APIs",
  "restful apis": "REST APIs",
  "graphql": "GraphQL",
  "graph ql": "GraphQL",
  "grpc": "gRPC",
  "websockets": "WebSockets",
  "websocket": "WebSockets",
  "microservices": "Microservices",
  "microservice architecture": "Microservices",
  "system design": "System Design",
  "distributed systems": "Distributed Systems",

  // Messaging & Streaming
  "kafka": "Apache Kafka",
  "apache kafka": "Apache Kafka",
  "rabbitmq": "RabbitMQ",
  "sqs": "AWS SQS",
  "sns": "AWS SNS",

  // Testing & Tooling
  "git": "Git",
  "github": "Git",
  "git / github": "Git",
  "jest": "Jest",
  "vitest": "Vitest",
  "cypress": "Cypress",
  "playwright": "Playwright",
  "postman": "Postman",
  "selenium": "Selenium",

  // AI & Data
  "machine learning": "Machine Learning",
  "ml": "Machine Learning",
  "deep learning": "Deep Learning",
  "nlp": "Natural Language Processing (NLP)",
  "natural language processing": "Natural Language Processing (NLP)",
  "pytorch": "PyTorch",
  "tensorflow": "TensorFlow",
  "scikit-learn": "Scikit-Learn",
  "sklearn": "Scikit-Learn",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "spark": "Apache Spark",
  "apache spark": "Apache Spark",
  "airflow": "Apache Airflow",
  "apache airflow": "Apache Airflow"
};

// Known all-caps acronyms
const KNOWN_ACRONYMS = new Set([
  "AWS", "GCP", "SQL", "CSS", "HTML", "API", "APIS", "REST", "CI/CD", "NLP",
  "ML", "AI", "SDK", "CLI", "UI", "UX", "JSON", "XML", "HTTP", "HTTPS", "DNS",
  "TCP", "IP", "SSH", "SSL", "TLS", "JWT", "OAuth", "SEO", "ATS", "CRM", "ERP"
]);

/**
 * Clean and standardize arbitrary raw text for lookup
 */
function cleanSkillKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\+\#\.\/\-]/g, "") // keep tech symbols like C++, C#, .NET, Node.js, CI/CD
    .replace(/\s+/g, " ");
}

/**
 * Smart formatting for unmapped skills
 */
function formatUnmappedSkill(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Check if it's a known acronym
  const upper = trimmed.toUpperCase();
  if (KNOWN_ACRONYMS.has(upper)) {
    return upper;
  }

  // Preserve special conventions like .NET or C++ or C#
  if (trimmed.startsWith(".")) return trimmed;

  // Title-case words while preserving acronyms
  return trimmed
    .split(/\s+/)
    .map(word => {
      const cleanWord = word.replace(/[^\w]/g, "").toUpperCase();
      if (KNOWN_ACRONYMS.has(cleanWord)) {
        return cleanWord;
      }
      if (word.length <= 2 && !word.includes(".")) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export interface NormalizedSkillResult {
  canonicalSkill: string;
  originalSkill: string;
  aliases?: string[];
}

/**
 * Normalizes any skill name into its canonical representation.
 * Guarantees consistent canonical names across the entire app.
 */
export function normalizeSkill(rawSkill: string): NormalizedSkillResult {
  if (!rawSkill || typeof rawSkill !== "string") {
    return { canonicalSkill: "", originalSkill: "", isValid: false };
  }

  const originalSkill = rawSkill.trim();
  const lookupKey = cleanSkillKey(originalSkill);

  if (CANONICAL_SKILL_MAP[lookupKey]) {
    return {
      canonicalSkill: CANONICAL_SKILL_MAP[lookupKey],
      originalSkill,
      isValid: true,
    };
  }

  // Check without trailing punctuation or "s" (e.g. "microservices" -> "Microservices")
  const singularKey = lookupKey.replace(/s$/, "");
  if (CANONICAL_SKILL_MAP[singularKey]) {
    return {
      canonicalSkill: CANONICAL_SKILL_MAP[singularKey],
      originalSkill,
      isValid: true,
    };
  }

  // Quality gate: If not in canonical map, verify that candidate is genuinely a valid skill
  if (!isValidSkill(originalSkill)) {
    return {
      canonicalSkill: "",
      originalSkill,
      isValid: false,
    };
  }

  // Fallback to cleanly formatted original skill
  return {
    canonicalSkill: formatUnmappedSkill(originalSkill),
    originalSkill,
    isValid: true,
  };
}

/**
 * Checks if two skill strings represent the exact same canonical skill
 */
export function isSameSkill(skillA: string, skillB: string): boolean {
  if (!skillA || !skillB) return false;
  const canonA = normalizeSkill(skillA).canonicalSkill.toLowerCase();
  const canonB = normalizeSkill(skillB).canonicalSkill.toLowerCase();
  return canonA === canonB;
}

/**
 * Extracts canonical missing skills from required skills vs candidate skills.
 * 
 * Rules:
 * 1. Required skills are extracted and normalized.
 * 2. Candidate skills (from resume, profile, tools) are normalized.
 * 3. Deduplicates required skills so a skill repeated 8 times in one JD counts only ONCE.
 * 4. Filters out any skill already possessed by the candidate (canonically).
 */
export function computeMissingSkills(
  requiredSkills: (string | null | undefined)[],
  candidateSkills: (string | null | undefined)[]
): NormalizedSkillResult[] {
  // 1. Build set of lowercase canonical candidate skills
  const candidateCanonicalSet = new Set<string>();
  for (const item of candidateSkills) {
    if (!item) continue;
    // Handle comma-separated skill strings if present
    const parts = typeof item === "string" && item.includes(",") ? item.split(",") : [item];
    for (const part of parts) {
      const norm = normalizeSkill(part);
      if (norm.canonicalSkill) {
        candidateCanonicalSet.add(norm.canonicalSkill.toLowerCase());
      }
    }
  }

  // 2. Process required skills, deduplicating canonically
  const missingMap = new Map<string, NormalizedSkillResult>();

  for (const item of requiredSkills) {
    if (!item) continue;
    const parts = typeof item === "string" && item.includes(",") ? item.split(",") : [item];
    for (const part of parts) {
      const norm = normalizeSkill(part);
      if (!norm.canonicalSkill) continue;

      const lowerCanon = norm.canonicalSkill.toLowerCase();

      // If user already has this skill canonically, skip
      if (candidateCanonicalSet.has(lowerCanon)) {
        continue;
      }

      // If already recorded for this analysis, keep first occurrence (ensures +1 only)
      if (!missingMap.has(lowerCanon)) {
        missingMap.set(lowerCanon, norm);
      }
    }
  }

  return Array.from(missingMap.values());
}
