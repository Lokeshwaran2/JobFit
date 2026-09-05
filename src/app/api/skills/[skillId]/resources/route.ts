import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillLearningEngine } from "@/lib/skills/engine/skill-learning-engine";

/**
 * GET /api/skills/:skillId/resources
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

    const path = await SkillLearningEngine.generateLearningPath({
      userId,
      skill: decodedSkill,
    });

    return NextResponse.json({
      success: true,
      skill: path.skill,
      resources: path.resources,
      totalCount: path.resources.length,
    });
  } catch (error: any) {
    console.error("[API GET /skills/:skillId/resources] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
