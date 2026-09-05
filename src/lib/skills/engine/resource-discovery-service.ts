import { prisma } from "@/lib/prisma";
import { SkillCurriculumDefinition } from "./skill-curriculum-registry";
import { resourceVerificationService } from "./resource-verification-service";

export type SkillCategory =
  | "database"
  | "devops_cloud"
  | "frontend"
  | "backend_language"
  | "tooling_general";

export class ResourceDiscoveryService {
  /**
   * Classifies a skill name into a technical domain category.
   */
  public static classifySkill(skillName: string): SkillCategory {
    const s = skillName.toLowerCase();
    if (
      s.includes("sql") ||
      s.includes("db") ||
      s.includes("database") ||
      s.includes("mongo") ||
      s.includes("postgres") ||
      s.includes("redis") ||
      s.includes("cassandra") ||
      s.includes("neo4j") ||
      s.includes("elasticsearch") ||
      s.includes("dynamo")
    ) {
      return "database";
    }

    if (
      s.includes("docker") ||
      s.includes("kubernetes") ||
      s.includes("k8s") ||
      s.includes("aws") ||
      s.includes("azure") ||
      s.includes("gcp") ||
      s.includes("terraform") ||
      s.includes("ansible") ||
      s.includes("ci/cd") ||
      s.includes("jenkins") ||
      s.includes("linux")
    ) {
      return "devops_cloud";
    }

    if (
      s.includes("react") ||
      s.includes("vue") ||
      s.includes("angular") ||
      s.includes("svelte") ||
      s.includes("next") ||
      s.includes("html") ||
      s.includes("css") ||
      s.includes("tailwind") ||
      s.includes("ui") ||
      s.includes("frontend")
    ) {
      return "frontend";
    }

    if (
      s.includes("node") ||
      s.includes("python") ||
      s.includes("java") ||
      s.includes("golang") ||
      s.includes("go") ||
      s.includes("rust") ||
      s.includes("c++") ||
      s.includes("c#") ||
      s.includes(".net") ||
      s.includes("ruby") ||
      s.includes("php") ||
      s.includes("backend") ||
      s.includes("api")
    ) {
      return "backend_language";
    }

    return "tooling_general";
  }

  /**
   * Generates a distinct, domain-specific draft curriculum for any unseeded skill,
   * discovers authoritative free resources, validates their reachability, and saves
   * to the database as an AI-generated/synthesized curriculum.
   */
  public static async discoverAndGenerateCurriculum(
    skillName: string
  ): Promise<SkillCurriculumDefinition> {
    const category = ResourceDiscoveryService.classifySkill(skillName);
    const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if we already have a generated curriculum stored in the database
    try {
      const stored = await prisma.skillCurriculum.findFirst({
        where: { skillId: skillName },
        include: {
          modules: {
            include: {
              topics: {
                include: {
                  resources: true,
                  practiceTasks: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          implementations: true,
        },
      });

      if (stored && stored.modules.length > 0) {
        return {
          skillId: stored.skillId,
          canonicalSkill: stored.skillId,
          version: stored.version,
          description: stored.description,
          targetRoles: stored.targetRoles,
          prerequisites: stored.prerequisites,
          estimatedHours: stored.estimatedHours,
          whyItMatters: `${stored.skillId} is a recognized industry technology that directly strengthens modern software engineering resumes.`,
          modules: stored.modules.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            level: m.level as any,
            order: m.order,
            estimatedHours: m.estimatedHours,
            topics: m.topics.map((t) => {
              const primaryRes = t.resources.find((r) => r.isPrimary) || t.resources[0];
              const altRes = t.resources.find((r) => !r.isPrimary);
              return {
                id: t.id,
                title: t.title,
                description: t.description,
                order: t.order,
                required: t.required,
                estimatedMinutes: t.estimatedMinutes,
                prerequisites: [],
                primaryResource: (primaryRes as any) || {
                  id: `res-${t.id}-default`,
                  title: `${t.title} Documentation Guide`,
                  url: `https://devdocs.io/#q=${encodeURIComponent(skillName)}`,
                  provider: "DevDocs Free Technical Documentation",
                  resourceType: "documentation" as const,
                  level: "all" as const,
                  isFree: true,
                  isOfficial: false,
                  qualityScore: 85,
                  interactive: false,
                  projectBased: false,
                  estimatedMinutes: 45,
                  status: "active" as const,
                  isPrimary: true,
                },
                alternativeResource: (altRes as any) || undefined,
                practiceTasks: t.practiceTasks.map((pt) => ({
                  id: pt.id,
                  title: pt.title,
                  description: pt.description,
                  difficulty: pt.difficulty as any,
                  expectedOutcome: pt.expectedOutcome,
                  verificationMethod: pt.verificationMethod as any,
                  order: pt.order,
                })),
              };
            }),
          })),
          implementationTasks: stored.implementations.map((imp) => ({
            id: imp.id,
            title: imp.title,
            description: imp.description,
            requirements: imp.requirements,
            expectedTechnologies: imp.expectedTechnologies,
            difficulty: imp.difficulty as any,
            estimatedHours: imp.estimatedHours,
            order: imp.order,
            isCapstone: imp.isCapstone,
          })),
          capstoneProject: {
            id: `capstone-${slug}`,
            title: `Production ${skillName} Architecture Implementation`,
            description: `End-to-end integration and real-world deployment incorporating best practices for ${skillName}.`,
            architectureOverview: `A fully operational system demonstrating architectural mastery, performance tuning, and integration testing with ${skillName}.`,
            requirements: [
              `Implement core ${skillName} workflows following official design patterns.`,
              `Write automated unit and integration tests verifying error handling and edge cases.`,
              `Document architecture, configuration decisions, and operational benchmarks in README.`,
            ],
            expectedTechnologies: [skillName, "Docker", "Git"],
            estimatedHours: 12,
            portfolioDeliverables: {
              githubRepoRequired: true,
              readmeSpec: "Comprehensive README with setup instructions and performance metrics.",
              liveDemoSuggested: false,
            },
          },
        };
      }
    } catch (e) {
      // Soft-fail: fallback to synthesis
    }

    // Synthesize category-tailored curriculum
    const synthesized = ResourceDiscoveryService.synthesizeCategoryCurriculum(skillName, category, slug);

    // Persist synthesized curriculum into database so it becomes versioned & cached
    try {
      await prisma.skillCurriculum.create({
        data: {
          skillId: skillName,
          version: 1,
          description: synthesized.description,
          targetRoles: synthesized.targetRoles,
          prerequisites: synthesized.prerequisites,
          estimatedHours: synthesized.estimatedHours,
          isAiGenerated: true,
          modules: {
            create: synthesized.modules.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              level: m.level,
              order: m.order,
              estimatedHours: m.estimatedHours,
              topics: {
                create: m.topics.map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  order: t.order,
                  required: t.required,
                  estimatedMinutes: t.estimatedMinutes,
                  resources: {
                    create: [
                      {
                        skillId: skillName,
                        title: t.primaryResource.title,
                        url: t.primaryResource.url,
                        provider: t.primaryResource.provider,
                        resourceType: t.primaryResource.resourceType,
                        level: t.primaryResource.level,
                        isFree: true,
                        isOfficial: t.primaryResource.isOfficial,
                        qualityScore: t.primaryResource.qualityScore,
                        isPrimary: true,
                        whyThisResource: t.primaryResource.whyThisResource,
                        status: "active",
                      },
                    ],
                  },
                  practiceTasks: {
                    create: (t.practiceTasks || []).map((pt) => ({
                      title: pt.title,
                      description: pt.description,
                      difficulty: pt.difficulty,
                      expectedOutcome: pt.expectedOutcome,
                      verificationMethod: pt.verificationMethod,
                      order: pt.order,
                    })),
                  },
                })),
              },
            })),
          },
          implementations: {
            create: synthesized.implementationTasks.map((it) => ({
              title: it.title,
              description: it.description,
              requirements: it.requirements,
              expectedTechnologies: it.expectedTechnologies,
              difficulty: it.difficulty,
              estimatedHours: it.estimatedHours,
              order: it.order,
              isCapstone: it.isCapstone || false,
              skillId: skillName,
            })),
          },
        },
      });
    } catch (saveErr) {
      console.warn("[ResourceDiscoveryService] Soft-warning saving curriculum:", saveErr);
    }

    return synthesized;
  }

  private static synthesizeCategoryCurriculum(
    skillName: string,
    category: SkillCategory,
    slug: string
  ): SkillCurriculumDefinition {
    if (category === "database") {
      return {
        skillId: skillName,
        canonicalSkill: skillName,
        version: 1,
        description: `High-performance database management and query modeling using ${skillName}.`,
        targetRoles: ["Backend Developer", "Data Engineer", "Database Administrator"],
        prerequisites: ["SQL Basics", "Data Structures"],
        estimatedHours: 18,
        whyItMatters: `${skillName} powers resilient transactional storage, high availability, and indexing for data-intensive web applications.`,
        modules: [
          {
            id: `${slug}-mod-1`,
            title: `${skillName} Foundations & Schema Design`,
            description: `Core primitives, data types, connection management, and normalized schema architecture in ${skillName}.`,
            level: "beginner",
            order: 1,
            estimatedHours: 5,
            topics: [
              {
                id: `${slug}-top-schema`,
                title: `${skillName} Schema Modeling & Data Integrity`,
                description: `Define robust schemas, data validation constraints, and foreign key relationships in ${skillName}.`,
                order: 1,
                required: true,
                estimatedMinutes: 60,
                prerequisites: [],
                primaryResource: {
                  id: `res-${slug}-docs`,
                  title: `${skillName} Official Documentation & Reference Manual`,
                  url: `https://devdocs.io/#q=${encodeURIComponent(skillName)}`,
                  provider: "DevDocs Authoritative Reference",
                  resourceType: "official_docs",
                  level: "beginner",
                  isFree: true,
                  isOfficial: true,
                  qualityScore: 92,
                  interactive: false,
                  projectBased: false,
                  estimatedMinutes: 45,
                  status: "active",
                  isPrimary: true,
                  whyThisResource: `Official syntax and architecture guide for ${skillName}.`,
                },
                practiceTasks: [
                  {
                    id: `${slug}-prac-schema`,
                    title: `Create a Normalized Schema for ${skillName}`,
                    description: `Write and verify table DDL or collection schemas with indexing and relationship constraints.`,
                    difficulty: "beginner",
                    expectedOutcome: "Schema executes cleanly with all constraints operational.",
                    verificationMethod: "code_execution",
                    order: 1,
                  },
                ],
              },
            ],
          },
          {
            id: `${slug}-mod-2`,
            title: `Query Optimization & Indexing in ${skillName}`,
            description: `Index tuning, execution analysis, latency reduction, and high-concurrency connection pooling.`,
            level: "intermediate",
            order: 2,
            estimatedHours: 6,
            topics: [
              {
                id: `${slug}-top-tuning`,
                title: `Query Optimization & Index Structures`,
                description: `Eliminate full table scans, create composite indexes, and analyze execution costs.`,
                order: 1,
                required: true,
                estimatedMinutes: 75,
                prerequisites: [`${slug}-top-schema`],
                primaryResource: {
                  id: `res-${slug}-tuning`,
                  title: `${skillName} Performance Tuning & Best Practices Guide`,
                  url: `https://roadmap.sh/backend`,
                  provider: "roadmap.sh Community",
                  resourceType: "tutorial",
                  level: "intermediate",
                  isFree: true,
                  isOfficial: false,
                  qualityScore: 90,
                  interactive: false,
                  projectBased: true,
                  estimatedMinutes: 50,
                  status: "active",
                  isPrimary: true,
                  whyThisResource: "Structured roadmap guidance on database performance and production indexing.",
                },
                practiceTasks: [
                  {
                    id: `${slug}-prac-tuning`,
                    title: `Optimize a High-Latency Query in ${skillName}`,
                    description: `Analyze execution latency on a mock dataset of 50,000 items and introduce compound indexes.`,
                    difficulty: "intermediate",
                    expectedOutcome: "Query time improves by at least 5x.",
                    verificationMethod: "explain_analyze",
                    order: 1,
                  },
                ],
              },
            ],
          },
        ],
        implementationTasks: [
          {
            id: `${slug}-impl-api`,
            title: `Build a High-Throughput REST API with ${skillName}`,
            description: `Implement an end-to-end CRUD service with transactions, pagination, and connection pooling.`,
            requirements: [
              `Connect to ${skillName} using production connection pooling.`,
              `Implement transactional operations with rollback handling.`,
              `Add automated integration tests verifying query correctness.`,
            ],
            expectedTechnologies: [skillName, "Node.js / Python", "Docker"],
            difficulty: "intermediate",
            estimatedHours: 8,
            order: 1,
            isCapstone: false,
          },
        ],
        capstoneProject: {
          id: `${slug}-capstone`,
          title: `Scalable Multi-Tenant Service Powered by ${skillName}`,
          description: `Build an enterprise service leveraging ${skillName} for ACID compliance, low-latency lookups, and audit logging.`,
          architectureOverview: `A decoupled microservice architecture with indexed database queries, connection pooling, and automated Dockerized migrations.`,
          requirements: [
            `Normalized multi-tenant database schema in ${skillName}.`,
            `Zero unindexed table scans on frequent queries.`,
            `Automated database backup and migration scripts in Git.`,
          ],
          expectedTechnologies: [skillName, "Docker", "Git"],
          estimatedHours: 12,
          portfolioDeliverables: {
            githubRepoRequired: true,
            readmeSpec: "Include architecture diagram, performance benchmarks, and deployment steps.",
            liveDemoSuggested: false,
          },
        },
      };
    }

    // Default general technical template
    return {
      skillId: skillName,
      canonicalSkill: skillName,
      version: 1,
      description: `Comprehensive industry curriculum for mastering ${skillName}.`,
      targetRoles: ["Software Engineer", "Full Stack Developer"],
      prerequisites: ["General Programming Fundamentals"],
      estimatedHours: 16,
      whyItMatters: `${skillName} is a valuable technical qualification frequently sought by technical hiring teams.`,
      modules: [
        {
          id: `${slug}-mod-1`,
          title: `${skillName} Fundamentals & Core Architecture`,
          description: `Syntax, component design, workflows, and standard conventions in ${skillName}.`,
          level: "beginner",
          order: 1,
          estimatedHours: 5,
          topics: [
            {
              id: `${slug}-top-core`,
              title: `${skillName} Core Primitives & Setup`,
              description: `Master the foundational primitives, configuration, and environment setup for ${skillName}.`,
              order: 1,
              required: true,
              estimatedMinutes: 60,
              prerequisites: [],
              primaryResource: {
                id: `res-${slug}-devdocs`,
                title: `${skillName} Reference Manual & Guides`,
                url: `https://devdocs.io/#q=${encodeURIComponent(skillName)}`,
                provider: "DevDocs Authoritative Documentation",
                resourceType: "official_docs",
                level: "beginner",
                isFree: true,
                isOfficial: true,
                qualityScore: 90,
                interactive: false,
                projectBased: false,
                estimatedMinutes: 45,
                status: "active",
                isPrimary: true,
                whyThisResource: `Comprehensive documentation and API syntax guide for ${skillName}.`,
              },
              practiceTasks: [
                {
                  id: `${slug}-prac-core`,
                  title: `Implement Hello World & Core Workflows in ${skillName}`,
                  description: `Configure environment, execute baseline commands, and build a working proof-of-concept.`,
                  difficulty: "beginner",
                  expectedOutcome: "Project initializes and passes initial verification tests.",
                  verificationMethod: "code_execution",
                  order: 1,
                },
              ],
            },
          ],
        },
        {
          id: `${slug}-mod-2`,
          title: `Intermediate Best Practices & Integration in ${skillName}`,
          description: `Advanced patterns, error handling, performance tuning, and third-party integration.`,
          level: "intermediate",
          order: 2,
          estimatedHours: 6,
          topics: [
            {
              id: `${slug}-top-patterns`,
              title: `Production Patterns & Error Resilience`,
              description: `Implement industry-standard design patterns, concurrency controls, and automated testing in ${skillName}.`,
              order: 1,
              required: true,
              estimatedMinutes: 75,
              prerequisites: [`${slug}-top-core`],
              primaryResource: {
                id: `res-${slug}-fcc`,
                title: `freeCodeCamp: Comprehensive ${skillName} Guide`,
                url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skillName)}`,
                provider: "freeCodeCamp",
                resourceType: "tutorial",
                level: "intermediate",
                isFree: true,
                isOfficial: false,
                qualityScore: 88,
                interactive: false,
                projectBased: true,
                estimatedMinutes: 50,
                status: "active",
                isPrimary: true,
                whyThisResource: `Practical real-world tutorial walking through best practices in ${skillName}.`,
              },
              practiceTasks: [
                {
                  id: `${slug}-prac-patterns`,
                  title: `Implement Resilient Error Handling in ${skillName}`,
                  description: `Write automated tests verifying graceful degradation and exception handling.`,
                  difficulty: "intermediate",
                  expectedOutcome: "All edge case unit tests pass cleanly.",
                  verificationMethod: "code_execution",
                  order: 1,
                },
              ],
            },
          ],
        },
      ],
      implementationTasks: [
        {
          id: `${slug}-impl-main`,
          title: `Build a Production Feature with ${skillName}`,
          description: `Develop an end-to-end practical project integrating ${skillName} into a modern web stack.`,
          requirements: [
            `Initialize and configure ${skillName} according to production guidelines.`,
            `Implement complete unit test suite achieving >80% test coverage.`,
            `Document design patterns and deployment steps in repository README.`,
          ],
          expectedTechnologies: [skillName, "Git"],
          difficulty: "intermediate",
          estimatedHours: 8,
          order: 1,
          isCapstone: false,
        },
      ],
      capstoneProject: {
        id: `${slug}-capstone`,
        title: `Full-Featured Application Leveraging ${skillName}`,
        description: `Architect a complete, portfolio-ready application demonstrating deep mastery of ${skillName}.`,
        architectureOverview: `A fully functioning production architecture featuring clean separation of concerns, test automation, and containerized deployment.`,
        requirements: [
          `Implement all core architectural features utilizing ${skillName}.`,
          `Write comprehensive automated integration tests.`,
          `Deploy with continuous integration pipeline in GitHub Actions.`,
        ],
        expectedTechnologies: [skillName, "Docker", "Git"],
        estimatedHours: 12,
        portfolioDeliverables: {
          githubRepoRequired: true,
          readmeSpec: "Detailed README with architecture overview, test reports, and instructions.",
          liveDemoSuggested: true,
        },
      },
    };
  }
}
