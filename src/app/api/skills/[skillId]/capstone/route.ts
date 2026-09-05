import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillLearningEngine } from "@/lib/skills/engine/skill-learning-engine";

/**
 * GET /api/skills/:skillId/capstone?jdId=...&role=...&company=...
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

    const path = await SkillLearningEngine.generateLearningPath({
      userId,
      skill: decodedSkill,
      jdId,
      targetRole: role,
      company,
    });

    return NextResponse.json({
      success: true,
      skill: path.skill,
      capstoneProject: path.capstoneProject,
    });
  } catch (error: any) {
    console.error("[API GET /skills/:skillId/capstone] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch capstone project" },
      { status: 500 }
    );
  }
}
