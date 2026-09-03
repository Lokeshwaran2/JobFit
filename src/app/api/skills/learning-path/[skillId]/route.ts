import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";

/**
 * GET /api/skills/learning-path/[skillId]
 * Returns the structured learning path for a skill along with current user progress.
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

    const details = await SkillGapTracker.getSkillGapDetails(userId, decodedSkill);

    if (!details) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      canonicalSkill: details.canonicalSkill,
      learningPath: details.learningPath,
      gap: details.gap,
    });
  } catch (error: any) {
    console.error("[API GET /skills/learning-path/:skillId] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch learning path" },
      { status: 500 }
    );
  }
}
