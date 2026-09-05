import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";

/**
 * GET /api/skills/gaps/[skillId]
 * Returns detailed history and occurrences for a specific missing skill.
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
      data: details,
    });
  } catch (error: any) {
    console.error("[API GET /skills/gaps/:skillId] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch skill gap details" },
      { status: 500 }
    );
  }
}
