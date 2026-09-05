import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";
import { SkillLearningEngine } from "@/lib/skills/engine/skill-learning-engine";

/**
 * GET /api/skills/learning-path/[skillId]
 * Returns the personalized, skill-specific, role-aware, free learning path.
 * Supports query parameters: ?jdId=...&role=...&company=...
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ skillId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skillId } = await context.params;
    const decodedSkill = decodeURIComponent(skillId);

    const { searchParams } = new URL(req.url);
    const jdId = searchParams.get("jdId") || undefined;
    const role = searchParams.get("role") || undefined;
    const company = searchParams.get("company") || undefined;

    const [details, personalizedPath] = await Promise.all([
      SkillGapTracker.getSkillGapDetails(userId, decodedSkill),
      SkillLearningEngine.generateLearningPath({
        userId,
        skill: decodedSkill,
        jdId,
        targetRole: role,
        company,
      }),
    ]);

    if (!details) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...personalizedPath, // Section 31 format
      learningPath: details.learningPath, // Legacy format
      gap: details.gap,
      occurrences: details.occurrences,
      personalizedPath,
    });
  } catch (error: any) {
    console.error("[API GET /skills/learning-path/:skillId] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch learning path" },
      { status: 500 }
    );
  }
}
