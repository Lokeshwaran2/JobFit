/**
 * Structured Learning Path Service
 * Provides comprehensive, practical 10-point learning paths with 100% free authoritative resources,
 * stages (Beginner, Intermediate, Advanced, Practical Projects), documentation, and practice platforms.
 */

export interface LearningStep {
  id: string;
  skill: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced" | "project";
  order: number;
  status?: "not_started" | "in_progress" | "completed";
}

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  resourceType: "documentation" | "course" | "tutorial" | "practice" | "project";
  provider: string;
  isFree: boolean;
  level: "beginner" | "intermediate" | "advanced" | "all";
}

export interface StructuredLearningPath {
  skill: string;
  canonicalSkill: string;
  whyItMatters: string;
  stages: {
    beginner: LearningStep[];
    intermediate: LearningStep[];
    advanced: LearningStep[];
    implementation: LearningStep[];
  };
  resources: LearningResource[];
  suggestedCompletionOrder: string[];
  totalSteps: number;
  completedStepsCount?: number;
  progressPercentage?: number;
}

// Curated Catalog for Top Industry Technologies
const CURATED_PATHS: Record<string, Omit<StructuredLearningPath, "totalSteps">> = {
  "PostgreSQL": {
    skill: "PostgreSQL",
    canonicalSkill: "PostgreSQL",
    whyItMatters: "PostgreSQL is the world's most advanced open-source relational database. High-scale SaaS, fintech, and enterprise tech rely on it for rock-solid ACID transactions, advanced indexing, JSONB storage, and unmatched reliability.",
    stages: {
      beginner: [
        { id: "pg-b-1", skill: "PostgreSQL", title: "SQL Fundamentals & Schema Creation", description: "Master CREATE TABLE, column data types, constraints (PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE), and schema design.", level: "beginner", order: 1 },
        { id: "pg-b-2", skill: "PostgreSQL", title: "Querying with SELECT, WHERE & ORDER BY", description: "Filter rows, project columns, sort data, and handle NULL values accurately.", level: "beginner", order: 2 },
        { id: "pg-b-3", skill: "PostgreSQL", title: "Relational JOINs & Aggregations", description: "Perform INNER, LEFT, RIGHT, and FULL OUTER JOINs. Aggregate with GROUP BY, HAVING, COUNT, SUM, and AVG.", level: "beginner", order: 3 },
        { id: "pg-b-4", skill: "PostgreSQL", title: "B-Tree Indexes & Primary Keys", description: "Understand how B-Tree indexes speed up lookups, prevent table scans, and when to index foreign keys.", level: "beginner", order: 4 },
      ],
      intermediate: [
        { id: "pg-i-1", skill: "PostgreSQL", title: "Query Optimization & EXPLAIN ANALYZE", description: "Inspect query execution plans, identify sequential scans, buffer hits, and sort spills using EXPLAIN (ANALYZE, BUFFERS).", level: "intermediate", order: 5 },
        { id: "pg-i-2", skill: "PostgreSQL", title: "ACID Transactions & Row Locking", description: "Write atomic transactions with BEGIN, COMMIT, and ROLLBACK. Manage SELECT FOR UPDATE to prevent race conditions.", level: "intermediate", order: 6 },
        { id: "pg-i-3", skill: "PostgreSQL", title: "JSONB & Semi-Structured Querying", description: "Store dynamic payloads using JSONB, query nested keys, and accelerate lookups using GIN indexes.", level: "intermediate", order: 7 },
        { id: "pg-i-4", skill: "PostgreSQL", title: "Window Functions & CTEs", description: "Leverage WITH clauses (Common Table Expressions) and window functions like ROW_NUMBER(), RANK(), and LAG().", level: "intermediate", order: 8 },
      ],
      advanced: [
        { id: "pg-a-1", skill: "PostgreSQL", title: "Isolation Levels & Concurrency Control (MVCC)", description: "Understand Read Committed, Repeatable Read, and Serializable levels. Master deadlocks, dirty reads, and phantom reads.", level: "advanced", order: 9 },
        { id: "pg-a-2", skill: "PostgreSQL", title: "Table Partitioning & Archival", description: "Implement declarative range and hash partitioning on time-series or multi-tenant datasets for faster query pruning.", level: "advanced", order: 10 },
        { id: "pg-a-3", skill: "PostgreSQL", title: "Replication, WAL & High Availability", description: "Configure streaming replication, understand Write-Ahead Logging (WAL), connection pooling (pgBouncer), and failovers.", level: "advanced", order: 11 },
      ],
      implementation: [
        { id: "pg-p-1", skill: "PostgreSQL", title: "Build a Scalable REST API with PostgreSQL", description: "Design a normalized database schema with Prisma or raw SQL, connection pooling, and migrations.", level: "project", order: 12 },
        { id: "pg-p-2", skill: "PostgreSQL", title: "Performance Benchmarking & Query Optimization", description: "Seed 1 million mock rows, measure query latency, optimize with compound indexes, and verify 10x speedup with EXPLAIN.", level: "project", order: 13 },
      ],
    },
    resources: [
      { id: "pg-r-1", title: "PostgreSQL Official Documentation", url: "https://www.postgresql.org/docs/current/", resourceType: "documentation", provider: "PostgreSQL Global Development Group", isFree: true, level: "all" },
      { id: "pg-r-2", title: "PostgreSQL Tutorial by freeCodeCamp", url: "https://www.freecodecamp.org/news/tag/postgresql/", resourceType: "tutorial", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "pg-r-3", title: "SQLZoo Interactive Practice", url: "https://sqlzoo.net/", resourceType: "practice", provider: "SQLZoo", isFree: true, level: "beginner" },
      { id: "pg-r-4", title: "Use The Index, Luke! (Indexing & Tuning Guide)", url: "https://use-the-index-luke.com/", resourceType: "tutorial", provider: "Markus Winand", isFree: true, level: "intermediate" },
      { id: "pg-r-5", title: "Exercism PostgreSQL Track", url: "https://exercism.org/tracks/postgresql", resourceType: "practice", provider: "Exercism", isFree: true, level: "intermediate" },
    ],
    suggestedCompletionOrder: [
      "SQL Fundamentals & Schema Creation",
      "Querying with SELECT, WHERE & ORDER BY",
      "Relational JOINs & Aggregations",
      "B-Tree Indexes & Primary Keys",
      "Build a Scalable REST API with PostgreSQL",
      "Query Optimization & EXPLAIN ANALYZE",
      "ACID Transactions & Row Locking",
      "JSONB & Semi-Structured Querying",
      "Performance Benchmarking & Query Optimization",
      "Isolation Levels & Concurrency Control (MVCC)",
      "Table Partitioning & Archival",
    ],
  },
  "Docker": {
    skill: "Docker",
    canonicalSkill: "Docker",
    whyItMatters: "Docker standardizes application environments across development, CI/CD, and production. Containerization is a core requirement for almost every modern cloud and backend engineering role.",
    stages: {
      beginner: [
        { id: "dk-b-1", skill: "Docker", title: "Containers vs Virtual Machines", description: "Learn container primitives, namespaces, cgroups, and how the Docker daemon operates.", level: "beginner", order: 1 },
        { id: "dk-b-2", skill: "Docker", title: "Core Docker CLI & Lifecycle", description: "Run, inspect, stop, and clean up containers with docker run, ps, exec, logs, and prune.", level: "beginner", order: 2 },
        { id: "dk-b-3", skill: "Docker", title: "Writing Clean Dockerfiles", description: "Master FROM, COPY, RUN, CMD, ENTRYPOINT, and understand layer caching mechanisms.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "dk-i-1", skill: "Docker", title: "Multi-Stage Builds & Image Optimization", description: "Cut image sizes by up to 90% by compiling in builder stages and copying binaries into distroless or alpine bases.", level: "intermediate", order: 4 },
        { id: "dk-i-2", skill: "Docker", title: "Multi-Container Docker Compose", description: "Orchestrate multi-service topologies (Web API, Postgres, Redis) with healthchecks, environment variables, and restart policies.", level: "intermediate", order: 5 },
        { id: "dk-i-3", skill: "Docker", title: "Networking & Persistent Volumes", description: "Configure bridge networks, host networks, named volumes, and bind mounts for database persistence.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "dk-a-1", skill: "Docker", title: "Container Security & Non-Root Users", description: "Run containers without root permissions, drop kernel capabilities, and scan images for vulnerabilities using Docker Scout / Trivy.", level: "advanced", order: 7 },
        { id: "dk-a-2", skill: "Docker", title: "CI/CD Image Pipelines & Registry Publishing", description: "Automate building, tagging with Git SHAs, and pushing to Docker Hub or Amazon ECR via GitHub Actions.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "dk-p-1", skill: "Docker", title: "Containerize a Full-Stack Web Application", description: "Create production-ready Dockerfiles for a Node.js/Next.js frontend and Python/Go backend with Docker Compose and local PostgreSQL.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "dk-r-1", title: "Docker Official Documentation", url: "https://docs.docker.com/get-started/", resourceType: "documentation", provider: "Docker, Inc.", isFree: true, level: "all" },
      { id: "dk-r-2", title: "Docker for Beginners (freeCodeCamp Course)", url: "https://www.freecodecamp.org/news/what-is-docker-used-for-a-docker-container-tutorial-for-beginners/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "dk-r-3", title: "Play with Docker (Interactive In-Browser Labs)", url: "https://labs.play-with-docker.com/", resourceType: "practice", provider: "Docker", isFree: true, level: "intermediate" },
      { id: "dk-r-4", title: "Dockerfile Best Practices Guide", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/", resourceType: "documentation", provider: "Docker", isFree: true, level: "intermediate" },
    ],
    suggestedCompletionOrder: [
      "Containers vs Virtual Machines",
      "Core Docker CLI & Lifecycle",
      "Writing Clean Dockerfiles",
      "Multi-Stage Builds & Image Optimization",
      "Networking & Persistent Volumes",
      "Multi-Container Docker Compose",
      "Containerize a Full-Stack Web Application",
      "Container Security & Non-Root Users",
      "CI/CD Image Pipelines & Registry Publishing",
    ],
  },
  "React": {
    skill: "React",
    canonicalSkill: "React",
    whyItMatters: "React is the dominant frontend UI library globally, powering the web applications of Meta, Netflix, Airbnb, and thousands of tech companies. Mastery of its component model, state hooks, and virtual DOM reconciliation is vital for modern web developers.",
    stages: {
      beginner: [
        { id: "react-b-1", skill: "React", title: "JSX, Component Primitives & Props", description: "Learn declarative JSX syntax, component composition, prop passing, and conditional rendering.", level: "beginner", order: 1 },
        { id: "react-b-2", skill: "React", title: "State Management with useState & useReducer", description: "Manage local component state, immutable update patterns, and complex state transitions with reducers.", level: "beginner", order: 2 },
        { id: "react-b-3", skill: "React", title: "Side Effects & Component Lifecycle with useEffect", description: "Fetch data from APIs, synchronize with external browser events, and master dependency arrays and cleanup functions.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "react-i-1", skill: "React", title: "Custom Hooks & Reusable Logic", description: "Extract stateful logic into custom hooks (useDebounce, useLocalStorage, useWindowSize, useFetch).", level: "intermediate", order: 4 },
        { id: "react-i-2", skill: "React", title: "Global State & Context API / Zustand", description: "Avoid prop drilling by implementing React Context or lightweight stores like Zustand for app-wide state.", level: "intermediate", order: 5 },
        { id: "react-i-3", skill: "React", title: "Performance Tuning: useMemo, useCallback & memo", description: "Prevent wasted re-renders, memoize expensive calculations, and optimize list rendering with stable keys.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "react-a-1", skill: "React", title: "Fiber Architecture & Concurrent Rendering", description: "Understand React Fiber, time-slicing, Suspense boundaries, and non-blocking state updates with useTransition.", level: "advanced", order: 7 },
        { id: "react-a-2", skill: "React", title: "Server Components (RSC) & Streaming SSR", description: "Architect modern apps combining zero-bundle-size React Server Components with client hydration islands.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "react-p-1", skill: "React", title: "Build an Interactive Kanban Task Board with Drag & Drop", description: "Build a production-quality task management app with custom hooks, local persistence, optimistic updates, and accessibility.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "react-r-1", title: "Official React Documentation (react.dev)", url: "https://react.dev/", resourceType: "documentation", provider: "Meta Open Source", isFree: true, level: "all" },
      { id: "react-r-2", title: "Full React 18 Course by freeCodeCamp", url: "https://www.freecodecamp.org/news/learn-react-18-full-course/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "react-r-3", title: "React TypeScript Cheatsheet", url: "https://react-typescript-cheatsheet.netlify.app/", resourceType: "documentation", provider: "React Community", isFree: true, level: "intermediate" },
      { id: "react-r-4", title: "Overreacted (Dan Abramov's In-Depth Articles)", url: "https://overreacted.io/", resourceType: "tutorial", provider: "Dan Abramov", isFree: true, level: "advanced" },
    ],
    suggestedCompletionOrder: [
      "JSX, Component Primitives & Props",
      "State Management with useState & useReducer",
      "Side Effects & Component Lifecycle with useEffect",
      "Custom Hooks & Reusable Logic",
      "Global State & Context API / Zustand",
      "Build an Interactive Kanban Task Board with Drag & Drop",
      "Performance Tuning: useMemo, useCallback & memo",
      "Fiber Architecture & Concurrent Rendering",
      "Server Components (RSC) & Streaming SSR",
    ],
  },
  "Next.js": {
    skill: "Next.js",
    canonicalSkill: "Next.js",
    whyItMatters: "Next.js is the premier React framework for production. It combines server-side rendering (SSR), static site generation (SSG), server actions, and edge computing to deliver unbeatable SEO and performance.",
    stages: {
      beginner: [
        { id: "next-b-1", skill: "Next.js", title: "App Router & File-System Routing", description: "Master layouts, templates, page.tsx, loading.tsx, and error boundaries in the App Router.", level: "beginner", order: 1 },
        { id: "next-b-2", skill: "Next.js", title: "Server vs Client Components", description: "Understand boundary declarations with 'use client', data fetching on the server, and minimizing client bundles.", level: "beginner", order: 2 },
        { id: "next-b-3", skill: "Next.js", title: "Route Handlers & API Routes", description: "Build RESTful endpoints handling GET, POST, PUT, DELETE with NextResponse and cookies/headers access.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "next-i-1", skill: "Next.js", title: "Server Actions & Form Mutations", description: "Perform secure type-safe database mutations directly from components with useActionState and revalidatePath.", level: "intermediate", order: 4 },
        { id: "next-i-2", skill: "Next.js", title: "Incremental Static Regeneration (ISR) & Caching", description: "Configure fetch caching, tag-based on-demand revalidation, and static page pre-rendering.", level: "intermediate", order: 5 },
        { id: "next-i-3", skill: "Next.js", title: "Authentication with Auth.js / NextAuth", description: "Implement secure session tokens, OAuth providers, JWT validation, and protected middleware routes.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "next-a-1", skill: "Next.js", title: "Edge Middleware & Multi-Tenant Routing", description: "Run sub-millisecond edge redirects, bot detection, geolocation headers, and dynamic subdomain rewrites.", level: "advanced", order: 7 },
        { id: "next-a-2", skill: "Next.js", title: "Bundle Optimization & Core Web Vitals", description: "Optimize next/image, next/font, dynamic imports with SSR false, and achieve 95+ Lighthouse performance scores.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "next-p-1", skill: "Next.js", title: "Deploy a Production SaaS Dashboard", description: "Architect and deploy a full-stack SaaS with Next.js App Router, Prisma ORM, Server Actions, Stripe, and Vercel hosting.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "next-r-1", title: "Next.js Official Documentation & Learn Course", url: "https://nextjs.org/learn", resourceType: "documentation", provider: "Vercel", isFree: true, level: "all" },
      { id: "next-r-2", title: "Next.js App Router Masterclass by freeCodeCamp", url: "https://www.freecodecamp.org/news/tag/next-js/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "next-r-3", title: "Vercel Next.js Templates & Examples", url: "https://github.com/vercel/next.js/tree/canary/examples", resourceType: "project", provider: "Vercel", isFree: true, level: "intermediate" },
    ],
    suggestedCompletionOrder: [
      "App Router & File-System Routing",
      "Server vs Client Components",
      "Route Handlers & API Routes",
      "Server Actions & Form Mutations",
      "Authentication with Auth.js / NextAuth",
      "Incremental Static Regeneration (ISR) & Caching",
      "Deploy a Production SaaS Dashboard",
      "Edge Middleware & Multi-Tenant Routing",
      "Bundle Optimization & Core Web Vitals",
    ],
  },
  "Node.js": {
    skill: "Node.js",
    canonicalSkill: "Node.js",
    whyItMatters: "Node.js enables developers to build high-concurrency, asynchronous backend services using JavaScript/TypeScript. It powers the server-side architecture of enterprise microservices and real-time APIs worldwide.",
    stages: {
      beginner: [
        { id: "node-b-1", skill: "Node.js", title: "Event Loop, Libuv & Non-Blocking I/O", description: "Master microtasks, macrotasks, setImmediate, process.nextTick, and understand how the single-threaded event loop processes thousands of concurrent connections.", level: "beginner", order: 1 },
        { id: "node-b-2", skill: "Node.js", title: "File System & Path Operations", description: "Read/write files safely with fs/promises, stream large documents, and handle cross-platform path resolution.", level: "beginner", order: 2 },
        { id: "node-b-3", skill: "Node.js", title: "HTTP Server & Request/Response Flow", description: "Create native HTTP servers, parse headers, handle status codes, and understand request streams.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "node-i-1", skill: "Node.js", title: "Node.js Streams & Backpressure", description: "Work with Readable, Writable, Transform streams and pipeline() to process gigabyte-sized files with minimal RAM.", level: "intermediate", order: 4 },
        { id: "node-i-2", skill: "Node.js", title: "REST APIs with Express / Fastify", description: "Design modular routing architectures, write robust middleware chains, and handle centralized error formatting.", level: "intermediate", order: 5 },
        { id: "node-i-3", skill: "Node.js", title: "Database Connections & Connection Pools", description: "Connect to relational and NoSQL databases, manage connection pool timeouts, and execute parameterized queries.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "node-a-1", skill: "Node.js", title: "Worker Threads & Clustering", description: "Offload CPU-heavy tasks to worker threads (piscina) and scale across multiple CPU cores with the cluster module.", level: "advanced", order: 7 },
        { id: "node-a-2", skill: "Node.js", title: "Memory Leaks, V8 Profiling & Diagnostics", description: "Capture heap snapshots with Chrome DevTools, detect event listener memory leaks, and profile flame graphs.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "node-p-1", skill: "Node.js", title: "Build a Scalable Real-Time Event Engine", description: "Build a production REST API with Fastify or Express, Redis Pub/Sub, WebSockets, rate limiting, and structured logging with Pino.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "node-r-1", title: "Node.js Official Documentation & Guides", url: "https://nodejs.org/en/docs/guides/", resourceType: "documentation", provider: "OpenJS Foundation", isFree: true, level: "all" },
      { id: "node-r-2", title: "Node.js Course for Beginners by freeCodeCamp", url: "https://www.freecodecamp.org/news/learn-node-js-full-course/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "node-r-3", title: "Node.js Best Practices Repository", url: "https://github.com/goldbergyoni/nodebestpractices", resourceType: "tutorial", provider: "Yoni Goldberg", isFree: true, level: "advanced" },
    ],
    suggestedCompletionOrder: [
      "Event Loop, Libuv & Non-Blocking I/O",
      "File System & Path Operations",
      "HTTP Server & Request/Response Flow",
      "REST APIs with Express / Fastify",
      "Node.js Streams & Backpressure",
      "Database Connections & Connection Pools",
      "Build a Scalable Real-Time Event Engine",
      "Worker Threads & Clustering",
      "Memory Leaks, V8 Profiling & Diagnostics",
    ],
  },
  "TypeScript": {
    skill: "TypeScript",
    canonicalSkill: "TypeScript",
    whyItMatters: "TypeScript is the industry standard for scalable JavaScript codebases. Static typing catches entire categories of runtime bugs, provides self-documenting code, and unlocks elite developer tooling.",
    stages: {
      beginner: [
        { id: "ts-b-1", skill: "TypeScript", title: "Core Primitive Types & Type Inference", description: "Master string, number, boolean, arrays, tuples, enums, any vs unknown, and let TypeScript infer types automatically.", level: "beginner", order: 1 },
        { id: "ts-b-2", skill: "TypeScript", title: "Interfaces vs Type Aliases", description: "Structure domain models, understand interface declaration merging, optional properties, and readonly modifiers.", level: "beginner", order: 2 },
        { id: "ts-b-3", skill: "TypeScript", title: "Union Types & Type Narrowing", description: "Work with discriminated unions, typeof/instanceof checks, and custom type predicates (x is Type).", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "ts-i-1", skill: "TypeScript", title: "Generics & Generic Constraints", description: "Write flexible, reusable functions and classes using type parameters (<T extends Record<string, any>>).", level: "intermediate", order: 4 },
        { id: "ts-i-2", skill: "TypeScript", title: "Utility Types (Pick, Omit, Partial, Record)", description: "Transform existing types seamlessly using standard library utilities and mapped types.", level: "intermediate", order: 5 },
        { id: "ts-i-3", skill: "TypeScript", title: "Strict tsconfig & Compiler Configurations", description: "Configure strictNullChecks, noImplicitAny, exactOptionalPropertyTypes, and modern module resolution.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "ts-a-1", skill: "TypeScript", title: "Conditional Types & Type-Level Programming", description: "Leverage 'T extends U ? X : Y', the 'infer' keyword, template literal types, and recursive types.", level: "advanced", order: 7 },
        { id: "ts-a-2", skill: "TypeScript", title: "Runtime Validation with Zod & Type Derivation", description: "Validate incoming API payloads at runtime using Zod or Valibot and derive static TypeScript types with z.infer<T>.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "ts-p-1", skill: "TypeScript", title: "Build an End-to-End Type-Safe Library", description: "Publish a strongly-typed utility library or SDK with comprehensive generic constraints, Zod parsing, and automated type tests.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "ts-r-1", title: "Official TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", resourceType: "documentation", provider: "Microsoft", isFree: true, level: "all" },
      { id: "ts-r-2", title: "Total TypeScript Free Tutorials by Matt Pocock", url: "https://www.totaltypescript.com/tutorials", resourceType: "tutorial", provider: "Matt Pocock", isFree: true, level: "all" },
      { id: "ts-r-3", title: "Type Hero (Interactive Type Challenges)", url: "https://typehero.dev/", resourceType: "practice", provider: "Type Hero", isFree: true, level: "intermediate" },
    ],
    suggestedCompletionOrder: [
      "Core Primitive Types & Type Inference",
      "Interfaces vs Type Aliases",
      "Union Types & Type Narrowing",
      "Generics & Generic Constraints",
      "Utility Types (Pick, Omit, Partial, Record)",
      "Strict tsconfig & Compiler Configurations",
      "Build an End-to-End Type-Safe Library",
      "Runtime Validation with Zod & Type Derivation",
      "Conditional Types & Type-Level Programming",
    ],
  },
  "Python": {
    skill: "Python",
    canonicalSkill: "Python",
    whyItMatters: "Python is the undisputed leader in AI, data engineering, machine learning, and automation, and a primary backend language. Its expressive syntax and expansive ecosystem make it indispensable across tech stacks.",
    stages: {
      beginner: [
        { id: "py-b-1", skill: "Python", title: "Python Data Structures & Idiomatic Syntax", description: "Master lists, dicts, sets, tuples, list comprehensions, slicing, and PEP 8 style conventions.", level: "beginner", order: 1 },
        { id: "py-b-2", skill: "Python", title: "Functions, Args/Kwargs & Scoping", description: "Write reusable functions, default arguments, *args, **kwargs, lambda expressions, and scope resolution.", level: "beginner", order: 2 },
        { id: "py-b-3", skill: "Python", title: "Virtual Environments & Package Management", description: "Manage isolated dependencies with venv, uv, or poetry, and freeze reproducible requirements.txt.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "py-i-1", skill: "Python", title: "Object-Oriented Programming (OOP) & Dunder Methods", description: "Implement classes, inheritance, properties, __init__, __str__, __repr__, and custom context managers (__enter__/__exit__).", level: "intermediate", order: 4 },
        { id: "py-i-2", skill: "Python", title: "Generators, Iterators & Decorators", description: "Yield values with memory-efficient generators and write custom function decorators for caching and timing.", level: "intermediate", order: 5 },
        { id: "py-i-3", skill: "Python", title: "REST APIs with FastAPI or Flask", description: "Build high-speed asynchronous web endpoints with Pydantic type validation, automated OpenAPI docs, and dependency injection.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "py-a-1", skill: "Python", title: "Asynchronous Programming with asyncio", description: "Master event loops, async/await, coroutines, TaskGroups, and non-blocking network calls with aiohttp / httpx.", level: "advanced", order: 7 },
        { id: "py-a-2", skill: "Python", title: "Concurrency: Multiprocessing vs Multithreading vs GIL", description: "Understand the Global Interpreter Lock (GIL), run CPU-bound workloads via ProcessPoolExecutor, and I/O tasks via ThreadPoolExecutor.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "py-p-1", skill: "Python", title: "Build an Async Data Processing & API Microservice", description: "Construct an asynchronous pipeline with FastAPI, SQLAlchemy/SQLModel, background Celery/Redis tasks, and pytest suites.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "py-r-1", title: "Python Official Documentation & Tutorial", url: "https://docs.python.org/3/tutorial/", resourceType: "documentation", provider: "Python Software Foundation", isFree: true, level: "all" },
      { id: "py-r-2", title: "Python for Beginners (freeCodeCamp Course)", url: "https://www.freecodecamp.org/news/python-programming-course/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "py-r-3", title: "Exercism Python Track", url: "https://exercism.org/tracks/python", resourceType: "practice", provider: "Exercism", isFree: true, level: "all" },
    ],
    suggestedCompletionOrder: [
      "Python Data Structures & Idiomatic Syntax",
      "Functions, Args/Kwargs & Scoping",
      "Virtual Environments & Package Management",
      "Object-Oriented Programming (OOP) & Dunder Methods",
      "Generators, Iterators & Decorators",
      "REST APIs with FastAPI or Flask",
      "Build an Async Data Processing & API Microservice",
      "Asynchronous Programming with asyncio",
      "Concurrency: Multiprocessing vs Multithreading vs GIL",
    ],
  },
  "AWS": {
    skill: "AWS",
    canonicalSkill: "AWS",
    whyItMatters: "Amazon Web Services (AWS) powers over 30% of global cloud infrastructure. Knowing how to architect, deploy, secure, and monitor applications on AWS makes you a standout candidate for modern engineering teams.",
    stages: {
      beginner: [
        { id: "aws-b-1", skill: "AWS", title: "AWS Core Concepts & IAM Security", description: "Understand Regions, Availability Zones, and least-privilege IAM policies, users, and roles.", level: "beginner", order: 1 },
        { id: "aws-b-2", skill: "AWS", title: "Compute (EC2) & Storage (S3)", description: "Launch and SSH into EC2 instances, manage security groups, and store/serve objects via Amazon S3 buckets.", level: "beginner", order: 2 },
        { id: "aws-b-3", skill: "AWS", title: "Managed Databases (RDS)", description: "Provision managed PostgreSQL/MySQL instances with automated backups, multi-AZ failover, and connection string setup.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "aws-i-1", skill: "AWS", title: "Serverless Compute with AWS Lambda & API Gateway", description: "Deploy event-driven serverless functions triggered by HTTP requests, S3 events, and scheduled cron jobs.", level: "intermediate", order: 4 },
        { id: "aws-i-2", skill: "AWS", title: "VPC Networking & Subnets", description: "Design secure Virtual Private Clouds with public/private subnets, NAT Gateways, Internet Gateways, and Route Tables.", level: "intermediate", order: 5 },
        { id: "aws-i-3", skill: "AWS", title: "CloudFront CDN & SSL via ACM", description: "Accelerate global content delivery and configure HTTPS certificates with AWS Certificate Manager.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "aws-a-1", skill: "AWS", title: "Infrastructure as Code (Terraform / AWS CDK)", description: "Define entire cloud topologies declaratively in version-controlled configuration files.", level: "advanced", order: 7 },
        { id: "aws-a-2", skill: "AWS", title: "Container Orchestration with ECS / EKS", description: "Deploy Dockerized apps on AWS ECS Fargate with Application Load Balancers and autoscaling policies.", level: "advanced", order: 8 },
        { id: "aws-a-3", skill: "AWS", title: "Monitoring & Observability with CloudWatch", description: "Set up metric alarms, distributed tracing with X-Ray, and centralized log streaming.", level: "advanced", order: 9 },
      ],
      implementation: [
        { id: "aws-p-1", skill: "AWS", title: "Deploy a Production Web App to AWS", description: "Deploy a secure web application utilizing S3 for static assets, CloudFront for CDN, ECS/Lambda for compute, and RDS PostgreSQL.", level: "project", order: 10 },
      ],
    },
    resources: [
      { id: "aws-r-1", title: "AWS Free Tier & Official Hands-on Tutorials", url: "https://aws.amazon.com/getting-started/hands-on/", resourceType: "documentation", provider: "Amazon Web Services", isFree: true, level: "all" },
      { id: "aws-r-2", title: "AWS Certified Cloud Practitioner Free Course", url: "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course-pass-the-exam/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "aws-r-3", title: "AWS Skill Builder Free Digital Training", url: "https://explore.skillbuilder.aws/", resourceType: "course", provider: "AWS Training & Certification", isFree: true, level: "all" },
      { id: "aws-r-4", title: "AWS Well-Architected Framework", url: "https://aws.amazon.com/architecture/well-architected/", resourceType: "documentation", provider: "AWS Architecture Center", isFree: true, level: "advanced" },
    ],
    suggestedCompletionOrder: [
      "AWS Core Concepts & IAM Security",
      "Compute (EC2) & Storage (S3)",
      "Managed Databases (RDS)",
      "Serverless Compute with AWS Lambda & API Gateway",
      "VPC Networking & Subnets",
      "CloudFront CDN & SSL via ACM",
      "Deploy a Production Web App to AWS",
      "Infrastructure as Code (Terraform / AWS CDK)",
      "Container Orchestration with ECS / EKS",
      "Monitoring & Observability with CloudWatch",
    ],
  },
  "Redis": {
    skill: "Redis",
    canonicalSkill: "Redis",
    whyItMatters: "Redis is the industry standard in-memory data store for caching, session management, rate-limiting, and real-time pub/sub messaging.",
    stages: {
      beginner: [
        { id: "rd-b-1", skill: "Redis", title: "In-Memory Storage Primitives & CLI", description: "Understand in-memory execution, run redis-cli, and master string GET/SET and key TTLs.", level: "beginner", order: 1 },
        { id: "rd-b-2", skill: "Redis", title: "Data Structures (Lists, Sets, Hashes, Sorted Sets)", description: "Use Hashes for user profiles, Lists for queues, Sets for unique membership, and Sorted Sets (ZADD) for leaderboards.", level: "beginner", order: 2 },
      ],
      intermediate: [
        { id: "rd-i-1", skill: "Redis", title: "Cache-Aside & Cache Invalidation Strategies", description: "Implement Write-Through, Write-Behind, and Cache-Aside patterns. Prevent cache stampedes and dogpiling.", level: "intermediate", order: 3 },
        { id: "rd-i-2", skill: "Redis", title: "Distributed Locks & Rate Limiting", description: "Implement sliding-window rate limiters and distributed locks using atomic Lua scripts or Redlock.", level: "intermediate", order: 4 },
        { id: "rd-i-3", skill: "Redis", title: "Pub/Sub & Event Streaming", description: "Broadcast live events between microservices using Redis Pub/Sub channels and Consumer Groups via Redis Streams.", level: "intermediate", order: 5 },
      ],
      advanced: [
        { id: "rd-a-1", skill: "Redis", title: "Persistence (RDB vs AOF) & Memory Eviction", description: "Configure snapshotting (RDB), append-only logging (AOF), and memory eviction policies (volatile-lru, allkeys-lru).", level: "advanced", order: 6 },
        { id: "rd-a-2", skill: "Redis", title: "Redis Cluster, Sentinel & High Availability", description: "Setup automatic failovers using Sentinel and horizontal sharding across 16384 hash slots with Redis Cluster.", level: "advanced", order: 7 },
      ],
      implementation: [
        { id: "rd-p-1", skill: "Redis", title: "Build an API Rate-Limiter and Cache Layer", description: "Build a high-performance Express/Next.js middleware utilizing Redis for token bucket rate-limiting and query caching.", level: "project", order: 8 },
      ],
    },
    resources: [
      { id: "rd-r-1", title: "Redis Official Documentation", url: "https://redis.io/docs/latest/", resourceType: "documentation", provider: "Redis Ltd.", isFree: true, level: "all" },
      { id: "rd-r-2", title: "Redis University (Free Certifications)", url: "https://university.redis.com/", resourceType: "course", provider: "Redis University", isFree: true, level: "intermediate" },
      { id: "rd-r-3", title: "Try Redis Interactive Console", url: "https://try.redis.io/", resourceType: "practice", provider: "Redis", isFree: true, level: "beginner" },
    ],
    suggestedCompletionOrder: [
      "In-Memory Storage Primitives & CLI",
      "Data Structures (Lists, Sets, Hashes, Sorted Sets)",
      "Cache-Aside & Cache Invalidation Strategies",
      "Distributed Locks & Rate Limiting",
      "Build an API Rate-Limiter and Cache Layer",
      "Pub/Sub & Event Streaming",
      "Persistence (RDB vs AOF) & Memory Eviction",
      "Redis Cluster, Sentinel & High Availability",
    ],
  },
  "Kubernetes": {
    skill: "Kubernetes",
    canonicalSkill: "Kubernetes",
    whyItMatters: "Kubernetes (K8s) is the de-facto standard container orchestrator. It enables automated deployment, scaling, self-healing, and networking for microservices architectures.",
    stages: {
      beginner: [
        { id: "k8s-b-1", skill: "Kubernetes", title: "K8s Architecture: Control Plane & Worker Nodes", description: "Learn API server, etcd, scheduler, kubelet, and container runtime components.", level: "beginner", order: 1 },
        { id: "k8s-b-2", skill: "Kubernetes", title: "Pods, Deployments & ReplicaSets", description: "Write YAML manifests to launch pods, manage declarative rolling updates, and configure replica counts.", level: "beginner", order: 2 },
        { id: "k8s-b-3", skill: "Kubernetes", title: "Services & Cluster Networking", description: "Route traffic with ClusterIP, NodePort, and LoadBalancer services. Understand kube-proxy and CoreDNS.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "k8s-i-1", skill: "Kubernetes", title: "ConfigMaps, Secrets & Environment Variables", description: "Inject configuration decoupled from container images and mount sensitive secrets securely.", level: "intermediate", order: 4 },
        { id: "k8s-i-2", skill: "Kubernetes", title: "Ingress Controllers & Path-Based Routing", description: "Expose HTTP/HTTPS services externally using NGINX Ingress and automated Let's Encrypt TLS.", level: "intermediate", order: 5 },
        { id: "k8s-i-3", skill: "Kubernetes", title: "Persistent Volumes & StatefulSets", description: "Provision persistent block storage via PVs, PVCs, and orchestrate stateful databases using StatefulSets.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "k8s-a-1", skill: "Kubernetes", title: "Horizontal Pod Autoscaling (HPA) & Resource Quotas", description: "Scale replicas based on CPU/memory usage and enforce namespace memory/CPU resource requests and limits.", level: "advanced", order: 7 },
        { id: "k8s-a-2", skill: "Kubernetes", title: "Helm Package Manager & GitOps", description: "Package microservices into reusable Helm charts and synchronize deployments via ArgoCD or Flux.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "k8s-p-1", skill: "Kubernetes", title: "Deploy a Resilient Microservices App on Minikube", description: "Run a local Kubernetes cluster using Minikube or Kind, deploy a frontend + backend + database with Ingress and zero-downtime rolling updates.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "k8s-r-1", title: "Kubernetes Official Documentation & Interactive Tutorials", url: "https://kubernetes.io/docs/tutorials/", resourceType: "documentation", provider: "CNCF", isFree: true, level: "all" },
      { id: "k8s-r-2", title: "Kubernetes Course for Beginners by freeCodeCamp", url: "https://www.freecodecamp.org/news/learn-kubernetes-in-depth-by-building-a-cluster-from-scratch/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
      { id: "k8s-r-3", title: "KillerCoda Interactive K8s Scenarios", url: "https://killercoda.com/playgrounds/scenario/kubernetes", resourceType: "practice", provider: "KillerCoda", isFree: true, level: "intermediate" },
    ],
    suggestedCompletionOrder: [
      "K8s Architecture: Control Plane & Worker Nodes",
      "Pods, Deployments & ReplicaSets",
      "Services & Cluster Networking",
      "ConfigMaps, Secrets & Environment Variables",
      "Ingress Controllers & Path-Based Routing",
      "Deploy a Resilient Microservices App on Minikube",
      "Persistent Volumes & StatefulSets",
      "Horizontal Pod Autoscaling (HPA) & Resource Quotas",
      "Helm Package Manager & GitOps",
    ],
  },
  "System Design": {
    skill: "System Design",
    canonicalSkill: "System Design",
    whyItMatters: "System Design is the primary benchmark for Senior and Staff engineering levels. It tests your ability to design resilient, distributed architectures capable of handling millions of requests with high availability and low latency.",
    stages: {
      beginner: [
        { id: "sd-b-1", skill: "System Design", title: "Client-Server Architecture, DNS & Load Balancing", description: "Master Layer 4 vs Layer 7 load balancers, round-robin/least-connections algorithms, and CDN caching.", level: "beginner", order: 1 },
        { id: "sd-b-2", skill: "System Design", title: "Relational vs NoSQL Database Selection", description: "Understand ACID vs BASE, when to choose document vs key-value vs relational stores, and schema denormalization.", level: "beginner", order: 2 },
        { id: "sd-b-3", skill: "System Design", title: "Caching Architectures & Eviction Policies", description: "Design multi-tier caching (Redis, Memcached) with Cache-Aside, Write-Through, and LRU/LFU eviction.", level: "beginner", order: 3 },
      ],
      intermediate: [
        { id: "sd-i-1", skill: "System Design", title: "Database Scaling: Replication, Sharding & Partitioning", description: "Implement read-replicas, horizontal sharding keys, consistent hashing rings, and multi-region replication.", level: "intermediate", order: 4 },
        { id: "sd-i-2", skill: "System Design", title: "Asynchronous Messaging & Event-Driven Architecture", description: "Decouple synchronous requests with message queues (Kafka, RabbitMQ, SQS), consumer groups, and idempotency keys.", level: "intermediate", order: 5 },
        { id: "sd-i-3", skill: "System Design", title: "API Rate Limiting & Denial of Service Protection", description: "Implement token bucket and leaky bucket algorithms, distributed locks, and API gateway throttling.", level: "intermediate", order: 6 },
      ],
      advanced: [
        { id: "sd-a-1", skill: "System Design", title: "CAP Theorem, PACELC & Distributed Consensus", description: "Navigate Consistency vs Availability trade-offs, Paxos/Raft consensus, and eventual consistency models.", level: "advanced", order: 7 },
        { id: "sd-a-2", skill: "System Design", title: "Fault Tolerance, Circuit Breakers & Disaster Recovery", description: "Design active-passive vs active-active multi-region failovers, retry storms mitigation, and chaos engineering.", level: "advanced", order: 8 },
      ],
      implementation: [
        { id: "sd-p-1", skill: "System Design", title: "Design a High-Throughput URL Shortener (TinyURL) or Twitter Feed", description: "Create full architectural diagrams, calculate back-of-the-envelope storage and QPS, and present end-to-end data flows.", level: "project", order: 9 },
      ],
    },
    resources: [
      { id: "sd-r-1", title: "System Design Primer by Donne Martin", url: "https://github.com/donnemartin/system-design-primer", resourceType: "tutorial", provider: "GitHub", isFree: true, level: "all" },
      { id: "sd-r-2", title: "ByteByteGo System Design Blog & Diagrams", url: "https://blog.bytebytego.com/", resourceType: "tutorial", provider: "Alex Xu", isFree: true, level: "all" },
      { id: "sd-r-3", title: "Martin Kleppmann's Designing Data-Intensive Applications Resources", url: "https://dataintensive.net/", resourceType: "documentation", provider: "Martin Kleppmann", isFree: true, level: "advanced" },
    ],
    suggestedCompletionOrder: [
      "Client-Server Architecture, DNS & Load Balancing",
      "Relational vs NoSQL Database Selection",
      "Caching Architectures & Eviction Policies",
      "Database Scaling: Replication, Sharding & Partitioning",
      "Asynchronous Messaging & Event-Driven Architecture",
      "API Rate Limiting & Denial of Service Protection",
      "Design a High-Throughput URL Shortener (TinyURL) or Twitter Feed",
      "CAP Theorem, PACELC & Distributed Consensus",
      "Fault Tolerance, Circuit Breakers & Disaster Recovery",
    ],
  },
  "CI/CD": {
    skill: "CI/CD",
    canonicalSkill: "CI/CD",
    whyItMatters: "Continuous Integration and Continuous Deployment (CI/CD) automates testing, security scanning, building, and deployment. It eliminates manual errors and is fundamental to modern engineering velocity.",
    stages: {
      beginner: [
        { id: "cicd-b-1", skill: "CI/CD", title: "CI/CD Principles & Pipeline Triggers", description: "Understand trunk-based development, merge triggers, pull request checks, and build status badges.", level: "beginner", order: 1 },
        { id: "cicd-b-2", skill: "CI/CD", title: "GitHub Actions Workflows & Syntax", description: "Write YAML workflows, define jobs, steps, action runners, and environment secrets.", level: "beginner", order: 2 },
      ],
      intermediate: [
        { id: "cicd-i-1", skill: "CI/CD", title: "Automated Linting, Typecheck & Testing Matrix", description: "Run linters (ESLint), TypeScript checks, and parallel test runners across multiple OS/Node versions.", level: "intermediate", order: 3 },
        { id: "cicd-i-2", skill: "CI/CD", title: "Docker Container Build & Layer Caching in CI", description: "Use Buildx and GitHub Actions cache to speed up multi-stage container builds by 5x.", level: "intermediate", order: 4 },
        { id: "cicd-i-3", skill: "CI/CD", title: "Artifact Storage & Registry Deployment", description: "Package build outputs, generate semver releases, and push artifacts to Docker Hub, npm, or cloud registries.", level: "intermediate", order: 5 },
      ],
      advanced: [
        { id: "cicd-a-1", skill: "CI/CD", title: "Zero-Downtime Blue/Green & Canary Deployments", description: "Automate progressive traffic shifting with automatic rollback on error rate spikes.", level: "advanced", order: 6 },
        { id: "cicd-a-2", skill: "CI/CD", title: "DevSecOps: SAST, DAST & Secret Scanning", description: "Integrate Trivy, Snyk, or SonarQube to block builds with critical CVE vulnerabilities.", level: "advanced", order: 7 },
      ],
      implementation: [
        { id: "cicd-p-1", skill: "CI/CD", title: "Build a Full GitHub Actions CI/CD Pipeline to Production", description: "Create an automated pipeline that lints, runs tests, builds Docker images, runs security scans, and deploys to AWS/Vercel with Slack notifications.", level: "project", order: 8 },
      ],
    },
    resources: [
      { id: "cicd-r-1", title: "GitHub Actions Official Documentation", url: "https://docs.github.com/en/actions", resourceType: "documentation", provider: "GitHub", isFree: true, level: "all" },
      { id: "cicd-r-2", title: "CI/CD Course for Beginners by freeCodeCamp", url: "https://www.freecodecamp.org/news/what-is-cicd-continuous-integration-continuous-deployment-explained/", resourceType: "course", provider: "freeCodeCamp", isFree: true, level: "beginner" },
    ],
    suggestedCompletionOrder: [
      "CI/CD Principles & Pipeline Triggers",
      "GitHub Actions Workflows & Syntax",
      "Automated Linting, Typecheck & Testing Matrix",
      "Docker Container Build & Layer Caching in CI",
      "Build a Full GitHub Actions CI/CD Pipeline to Production",
      "Artifact Storage & Registry Deployment",
      "Zero-Downtime Blue/Green & Canary Deployments",
      "DevSecOps: SAST, DAST & Secret Scanning",
    ],
  },
};

/**
 * Intelligent Domain Classifier
 * Maps any unlisted skill to its specific technology domain to generate
 * genuinely tailored stages, projects, and learning objectives.
 */
function detectSkillDomain(skill: string): {
  domain: string;
  whyItMatters: string;
  beginnerTopics: { title: string; description: string }[];
  intermediateTopics: { title: string; description: string }[];
  advancedTopics: { title: string; description: string }[];
  projectTitle: string;
  projectDescription: string;
} {
  const lower = skill.toLowerCase();

  // 1. AI, Machine Learning & Data Science
  if (lower.match(/(ai|machine learning|deep learning|nlp|computer vision|llm|rag|pytorch|tensorflow|keras|scikit|pandas|numpy|langchain|huggingface|transformers|data science)/)) {
    return {
      domain: "Artificial Intelligence & Data Science",
      whyItMatters: `${skill} is at the forefront of the generative AI and intelligent automation revolution. Organizations across every vertical are integrating ${skill} to power intelligent decision making, embeddings, predictive models, and autonomous agents.`,
      beginnerTopics: [
        { title: `${skill} Environment Setup & Data Foundations`, description: `Configure virtual environments (conda/uv), Jupyter, GPU acceleration (CUDA/Metal), and fundamental data structures for ${skill}.` },
        { title: `Data Cleaning, Preprocessing & Feature Engineering`, description: `Handle missing values, normalize distributions, encode categorical features, and prepare training/validation splits.` },
        { title: `Core Model Architectures & Training Loops`, description: `Implement foundational algorithms in ${skill}, loss functions, optimizers, and evaluate accuracy/F1-score metrics.` },
      ],
      intermediateTopics: [
        { title: `Hyperparameter Tuning & Cross-Validation`, description: `Optimize learning rates, batch sizes, regularization techniques (dropout, L2), and prevent overfitting.` },
        { title: `Embeddings, Vector Search & Feature Stores`, description: `Generate vector embeddings, store and query nearest neighbors via vector databases, and integrate retrieval pipelines.` },
        { title: `Model Serialization & Serving via REST/gRPC API`, description: `Export trained weights (ONNX, PyTorch JIT, SafeTensors) and deploy low-latency inference endpoints with FastAPI.` },
      ],
      advancedTopics: [
        { title: `Distributed Training & Quantization`, description: `Scale across multiple GPUs with data parallelism, apply model quantization (INT8, FP16), and optimize inference throughput.` },
        { title: `MLOps, Model Monitoring & Drift Detection`, description: `Set up automated retraining triggers, monitor data/concept drift in production, and log experiment runs with MLflow.` },
      ],
      projectTitle: `Production AI Microservice: Real-Time Prediction & RAG Pipeline with ${skill}`,
      projectDescription: `Build, evaluate, and deploy an end-to-end production AI application using ${skill}, featuring automated data ingestion, vector search, and a FastAPI inference service.`,
    };
  }

  // 2. Data Engineering & Analytics
  if (lower.match(/(spark|hadoop|airflow|snowflake|databricks|dbt|bigquery|kafka|flink|etl|data pipeline|data warehouse)/)) {
    return {
      domain: "Data Engineering & Distributed Processing",
      whyItMatters: `${skill} is foundational for modern data platforms. High-growth enterprises rely on ${skill} to process terabytes of streaming and batch data with strict SLAs, data governance, and minimal latency.`,
      beginnerTopics: [
        { title: `${skill} Architecture & Core Primitives`, description: `Understand distributed computation models, storage layouts, partitioning strategies, and initial cluster connectivity.` },
        { title: `Batch Ingestion & Transformation Pipelines`, description: `Extract raw datasets, apply schema enforcement, perform filtering, and write clean columnar formats (Parquet/Delta).` },
      ],
      intermediateTopics: [
        { title: `Streaming Data Ingestion & Event Processing`, description: `Consume continuous event streams, manage sliding/tumbling windows, and handle late-arriving records with watermarks.` },
        { title: `Data Quality, Testing & Lineage Tracking`, description: `Implement automated data assertions, schema evolution tests, and track upstream/downstream transformation lineage.` },
        { title: `Performance Tuning: Partition Pruning & Skew Mitigation`, description: `Eliminate data skew bottlenecks, tune partition sizes, optimize shuffle operations, and maximize throughput.` },
      ],
      advancedTopics: [
        { title: `Fault Tolerance, Idempotency & Exactly-Once Semantics`, description: `Ensure zero duplicate writes during worker node failures using atomic transactions and checkpointing.` },
        { title: `Lakehouse Governance, Access Control & Cost Optimization`, description: `Enforce column/row level security, data retention policies, and monitor compute warehouse credit consumption.` },
      ],
      projectTitle: `Scalable Distributed Data Pipeline & Lakehouse Engine with ${skill}`,
      projectDescription: `Architect and deploy an automated data pipeline using ${skill} that ingests high-volume events, transforms records, and writes to an analytical warehouse with data quality tests.`,
    };
  }

  // 3. Cloud & Infrastructure as Code / DevOps
  if (lower.match(/(terraform|ansible|azure|gcp|google cloud|cloud|devops|helm|prometheus|grafana|linux|bash|shell|networking)/)) {
    return {
      domain: "Cloud Infrastructure & Platform Engineering",
      whyItMatters: `${skill} is the backbone of modern cloud platform reliability. Mastering ${skill} allows you to manage infrastructure programmatically, prevent configuration drift, and guarantee high availability.`,
      beginnerTopics: [
        { title: `${skill} Core Syntax & Environment Configuration`, description: `Learn foundational syntax, state files, CLI toolchains, and authenticate securely with cloud providers.` },
        { title: `Declarative Resource Provisioning`, description: `Define compute, networking, and storage components declaratively with reusable parameterization.` },
      ],
      intermediateTopics: [
        { title: `Modular Architecture & Reusable Modules`, description: `Structure configuration into composable, versioned modules following enterprise best practices.` },
        { title: `State Management, Locking & Drift Detection`, description: `Manage remote state storage, configure state locks to prevent concurrent modifications, and run drift detection.` },
        { title: `CI/CD Automation for Infrastructure Deployments`, description: `Automate plan/apply workflows in GitHub Actions or GitLab CI with approval gates and automated validation.` },
      ],
      advancedTopics: [
        { title: `Zero-Trust Security, Secrets & Least Privilege`, description: `Inject sensitive credentials securely via Vault/KMS, enforce least-privilege IAM, and audit compliance policies.` },
        { title: `High Availability, Multi-Region Failover & Observability`, description: `Design cross-region redundancy, automated health checks, metric dashboards, and alerting rules.` },
      ],
      projectTitle: `Automated Multi-Tier Cloud Infrastructure with ${skill}`,
      projectDescription: `Write, test, and deploy a complete production-grade cloud environment using ${skill} with automated validation, remote state locking, and secure credential injection.`,
    };
  }

  // 4. Testing & Quality Assurance
  if (lower.match(/(jest|pytest|cypress|playwright|selenium|unit testing|testing|qa|automation testing)/)) {
    return {
      domain: "Software Testing & Quality Assurance",
      whyItMatters: `High test coverage and reliable automation with ${skill} empower teams to ship features with high velocity and zero regressions. Companies prioritize candidates who write robust, maintainable tests.`,
      beginnerTopics: [
        { title: `${skill} Test Runner Setup & Assertions`, description: `Install test frameworks, configure test runners, and write clean assertions using matchers (toBe, toEqual, expect).` },
        { title: `Unit Testing Primitives & Test Structure (AAA Pattern)`, description: `Structure test suites with Arrange-Act-Assert, test lifecycle hooks (beforeEach/afterEach), and test isolated logic.` },
      ],
      intermediateTopics: [
        { title: `Mocking, Spying & Dependency Stubs`, description: `Isolate external dependencies, mock network requests, spy on function calls, and prevent flaky test behavior.` },
        { title: `Integration Testing & API Validation`, description: `Test interactions between multiple application layers, database state rollbacks, and HTTP request/response validation.` },
        { title: `Component & UI State Testing`, description: `Test user interactions, state transitions, accessibility attributes, and snapshot regressions.` },
      ],
      advancedTopics: [
        { title: `End-to-End (E2E) Automation & Parallel Execution`, description: `Automate full browser user journeys, manage authentication states, and run tests in parallel across headless browsers.` },
        { title: `Continuous Testing in CI/CD & Coverage Gates`, description: `Enforce minimum code coverage thresholds, generate HTML test reports, and integrate test suites into GitHub Actions.` },
      ],
      projectTitle: `Comprehensive Test Suite & CI Automation Matrix with ${skill}`,
      projectDescription: `Build a production-grade automated testing suite using ${skill} covering unit, integration, and E2E flows with parallel test execution and CI reporting.`,
    };
  }

  // 5. Default Specialized Technology Pattern
  return {
    domain: "Software Engineering & Architecture",
    whyItMatters: `${skill} is a high-demand technology frequently requested in modern engineering job descriptions. Mastering it establishes your technical depth and demonstrates hands-on proficiency to hiring managers.`,
    beginnerTopics: [
      { title: `${skill} Core Principles, Architecture & Setup`, description: `Understand fundamental concepts, runtime execution model, configuration parameters, and initial project scaffolding.` },
      { title: `Syntax, Data Types & Standard Library`, description: `Master syntax conventions, standard library modules, error handling, and idiomatic community conventions.` },
    ],
    intermediateTopics: [
      { title: `Design Patterns & Component Modularity`, description: `Organize code into clean modular layers, apply standard design patterns, and handle asynchronous data flows.` },
      { title: `API Integration, State & Persistence`, description: `Connect ${skill} with external data stores, web services, and manage application state predictably.` },
      { title: `Performance Optimization & Bottleneck Profiling`, description: `Identify latency bottlenecks, optimize memory and CPU utilization, and implement caching strategies.` },
    ],
    advancedTopics: [
      { title: `Concurrency, Scalability & Resilience`, description: `Handle concurrent workloads safely, implement retries and circuit breakers, and ensure graceful degradation.` },
      { title: `Production Security, Hardening & Monitoring`, description: `Harden against common security vulnerabilities, set up health checks, structured logging, and production telemetry.` },
    ],
    projectTitle: `Full-Featured Production Application with ${skill}`,
    projectDescription: `Architect, build, and deploy an end-to-end production-grade application utilizing ${skill}, showcasing clean architecture, test coverage, and documentation.`,
  };
}

/**
 * Generates a domain-tailored learning path for any skill.
 */
function generateDynamicLearningPath(canonicalSkill: string): StructuredLearningPath {
  const skill = canonicalSkill || "Technology";
  const slug = skill.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const domainInfo = detectSkillDomain(skill);

  let orderIndex = 1;

  const beginnerSteps: LearningStep[] = domainInfo.beginnerTopics.map((t, i) => ({
    id: `${slug}-b-${i + 1}`,
    skill,
    title: t.title,
    description: t.description,
    level: "beginner",
    order: orderIndex++,
  }));

  const intermediateSteps: LearningStep[] = domainInfo.intermediateTopics.map((t, i) => ({
    id: `${slug}-i-${i + 1}`,
    skill,
    title: t.title,
    description: t.description,
    level: "intermediate",
    order: orderIndex++,
  }));

  const advancedSteps: LearningStep[] = domainInfo.advancedTopics.map((t, i) => ({
    id: `${slug}-a-${i + 1}`,
    skill,
    title: t.title,
    description: t.description,
    level: "advanced",
    order: orderIndex++,
  }));

  const projectSteps: LearningStep[] = [
    {
      id: `${slug}-p-1`,
      skill,
      title: domainInfo.projectTitle,
      description: domainInfo.projectDescription,
      level: "project",
      order: orderIndex++,
    },
  ];

  const resources: LearningResource[] = [
    {
      id: `${slug}-r-1`,
      title: `${skill} Official Documentation & Guides`,
      url: `https://www.google.com/search?q=${encodeURIComponent(skill + " official documentation tutorial")}`,
      resourceType: "documentation",
      provider: "Official Maintainers",
      isFree: true,
      level: "all",
    },
    {
      id: `${slug}-r-2`,
      title: `freeCodeCamp ${skill} In-Depth Guide`,
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skill)}`,
      resourceType: "tutorial",
      provider: "freeCodeCamp",
      isFree: true,
      level: "beginner",
    },
    {
      id: `${slug}-r-3`,
      title: `Exercism & Code Practice for ${skill}`,
      url: `https://exercism.org/`,
      resourceType: "practice",
      provider: "Exercism",
      isFree: true,
      level: "intermediate",
    },
    {
      id: `${slug}-r-4`,
      title: `Curated GitHub Awesome List & Project Examples`,
      url: `https://github.com/topics/${encodeURIComponent(slug)}`,
      resourceType: "project",
      provider: "GitHub Community",
      isFree: true,
      level: "advanced",
    },
  ];

  const suggestedOrder = [
    ...beginnerSteps.map((s) => s.title),
    ...intermediateSteps.map((s) => s.title),
    projectSteps[0].title,
    ...advancedSteps.map((s) => s.title),
  ];

  return {
    skill,
    canonicalSkill: skill,
    whyItMatters: domainInfo.whyItMatters,
    stages: {
      beginner: beginnerSteps,
      intermediate: intermediateSteps,
      advanced: advancedSteps,
      implementation: projectSteps,
    },
    resources,
    suggestedCompletionOrder: suggestedOrder,
    totalSteps:
      beginnerSteps.length +
      intermediateSteps.length +
      advancedSteps.length +
      projectSteps.length,
  };
}

/**
 * Retrieves the complete structured learning path for a skill.
 * Attaches user progress status to each step if progress map is supplied.
 */
export function getLearningPath(
  canonicalSkill: string,
  userProgressMap: Map<string, "not_started" | "in_progress" | "completed"> = new Map()
): StructuredLearningPath {
  const base = CURATED_PATHS[canonicalSkill]
    ? JSON.parse(JSON.stringify(CURATED_PATHS[canonicalSkill]))
    : generateDynamicLearningPath(canonicalSkill);

  // Attach status to each step
  let completedCount = 0;
  const allSteps: LearningStep[] = [
    ...base.stages.beginner,
    ...base.stages.intermediate,
    ...base.stages.advanced,
    ...base.stages.implementation,
  ];

  for (const step of allSteps) {
    const status = userProgressMap.get(step.id) || "not_started";
    step.status = status;
    if (status === "completed") {
      completedCount++;
    }
  }

  const totalSteps = allSteps.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return {
    ...base,
    totalSteps,
    completedStepsCount: completedCount,
    progressPercentage,
  };
}
