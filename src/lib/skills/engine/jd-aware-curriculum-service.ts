import { prisma } from "@/lib/prisma";
import { LearningModuleDTO, CapstoneProjectDTO } from "./types";
import { SkillCurriculumDefinition } from "./skill-curriculum-registry";

export interface JdAdaptationResult {
  adaptedModules: LearningModuleDTO[];
  adaptedCapstone: CapstoneProjectDTO;
  jdKeyHighlights: string[];
  recommendedFocusTopicId?: string;
  recommendedFocusReason?: string;
}

export class JdAwareCurriculumService {
  /**
   * Adapts the curriculum and capstone project to the specific requirements of the target JD.
   */
  public static async adaptCurriculumForJd(
    curriculum: SkillCurriculumDefinition,
    jdContext: {
      jdId?: string;
      jobDescription?: string;
      targetRole?: string;
      company?: string;
    }
  ): Promise<JdAdaptationResult> {
    const jdText = (jdContext.jobDescription || "").toLowerCase();
    const roleText = (jdContext.targetRole || "").toLowerCase();
    const combinedJd = `${roleText} ${jdText}`;

    const highlights: string[] = [];
    let recommendedFocusTopicId: string | undefined;
    let recommendedFocusReason: string | undefined;

    // Deep copy modules
    const modules: LearningModuleDTO[] = curriculum.modules.map((m) => ({
      id: m.id,
      curriculumId: curriculum.skillId,
      title: m.title,
      description: m.description,
      level: m.level,
      order: m.order,
      estimatedHours: m.estimatedHours,
      topics: m.topics.map((t) => {
        let isJdRequired = false;
        let relevanceScore = 1.0;
        let matchReason = "";

        // Check topic keywords against JD text
        const topicWords = t.title.toLowerCase().split(/[\s,&-]+/).filter((w) => w.length > 3);
        const descriptionWords = t.description.toLowerCase().split(/[\s,&-]+/).filter((w) => w.length > 3);

        const matchedWord = [...topicWords, ...descriptionWords].find((w) => combinedJd.includes(w));

        if (matchedWord) {
          isJdRequired = true;
          relevanceScore = 1.5;
          matchReason = `Directly matches requirement "${matchedWord}" in target job description.`;
          if (!highlights.includes(t.title)) {
            highlights.push(t.title);
          }

          // If this is an advanced or performance-oriented topic, elevate as recommended focus
          if (!recommendedFocusTopicId && (t.id.includes("indexes") || t.id.includes("explain") || t.id.includes("multistage") || t.id.includes("performance") || t.id.includes("security"))) {
            recommendedFocusTopicId = t.id;
            recommendedFocusReason = `Target job specifically stresses ${t.title}. Focusing on this module delivers the highest interview impact.`;
          }
        }

        return {
          id: t.id,
          moduleId: m.id,
          title: t.title,
          description: t.description,
          order: t.order,
          required: t.required,
          estimatedMinutes: t.estimatedMinutes,
          prerequisites: t.prerequisites,
          primaryResource: t.primaryResource
            ? { ...t.primaryResource, skillId: curriculum.skillId, topicId: t.id }
            : null,
          alternativeResource: t.alternativeResource
            ? { ...t.alternativeResource, skillId: curriculum.skillId, topicId: t.id }
            : null,
          practiceTasks: (t.practiceTasks || []).map((pt) => ({ ...pt, topicId: t.id })),
          checkpoint: t.checkpoint ? { ...t.checkpoint, topicId: t.id } : undefined,
          jdRelevance: {
            isJdRequired,
            relevanceScore,
            reason: matchReason || undefined,
          },
        };
      }),
    }));

    // If JD emphasized specific performance / advanced topics, sort required topics higher
    if (combinedJd.includes("performance") || combinedJd.includes("optimization") || combinedJd.includes("scale") || combinedJd.includes("high throughput")) {
      if (!highlights.includes("Query Optimization & EXPLAIN ANALYZE") && curriculum.skillId === "PostgreSQL") {
        highlights.push("Query Optimization & EXPLAIN ANALYZE");
      }
    }

    // Adapt the Capstone Project to the target job
    const baseCapstone = curriculum.capstoneProject;
    const companyPrefix = jdContext.company ? `for ${jdContext.company}` : "";
    const targetRoleTitle = jdContext.targetRole || "Target Job Application";

    // Detect complementary technologies from the JD to weave into the capstone
    const complementaryTech: string[] = [];
    const knownStack = ["Node.js", "Python", "Docker", "AWS", "PostgreSQL", "Redis", "TypeScript", "React", "GraphQL", "Kubernetes"];
    for (const tech of knownStack) {
      if (combinedJd.includes(tech.toLowerCase()) && tech.toLowerCase() !== curriculum.skillId.toLowerCase()) {
        complementaryTech.push(tech);
      }
    }

    const adaptedRequirements = [...baseCapstone.requirements];
    if (complementaryTech.length > 0) {
      adaptedRequirements.push(
        `Integrate seamless compatibility with target stack: ${complementaryTech.join(", ")}.`
      );
    }

    const adaptedCapstone: CapstoneProjectDTO = {
      ...baseCapstone,
      title: jdContext.targetRole
        ? `${baseCapstone.title} (${jdContext.targetRole} Edition ${companyPrefix})`.trim()
        : baseCapstone.title,
      description: jdContext.targetRole
        ? `${baseCapstone.description} Custom-tailored to generate verifiable portfolio evidence for ${targetRoleTitle}.`
        : baseCapstone.description,
      requirements: adaptedRequirements,
      expectedTechnologies: Array.from(new Set([...baseCapstone.expectedTechnologies, ...complementaryTech])),
      jobContext: {
        adaptedForJob: !!(jdContext.jobDescription || jdContext.targetRole),
        targetRole: jdContext.targetRole,
        company: jdContext.company,
        targetJobTitle: targetRoleTitle,
      },
    };

    // Record LearningRequirement in Database if jdId is provided
    if (jdContext.jdId) {
      try {
        for (const highlight of highlights.slice(0, 5)) {
          await prisma.learningRequirement.create({
            data: {
              skillId: curriculum.skillId,
              jdId: jdContext.jdId,
              relevanceScore: 1.5,
              reason: `Target JD emphasized requirement for ${highlight}.`,
            },
          });
        }
      } catch (err) {
        // Soft-fail: logging non-fatal requirement record
      }
    }

    return {
      adaptedModules: modules,
      adaptedCapstone,
      jdKeyHighlights: highlights,
      recommendedFocusTopicId,
      recommendedFocusReason,
    };
  }
}
