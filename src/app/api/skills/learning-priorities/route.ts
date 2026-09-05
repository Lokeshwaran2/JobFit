import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";

/**
 * GET /api/skills/learning-priorities
 * Returns prioritized missing skills for the authenticated user,
 * optimized for dashboard widgets and quick learning path access.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "learning";

    const allGaps = await SkillGapTracker.getUserSkillGaps(userId, { status });
    const topPriorities = allGaps.slice(0, limit);

    // Summary insights
    const totalMissingFrequency = allGaps.reduce((sum, g) => sum + g.frequency, 0);
    const highPriorityCount = allGaps.filter((g) => g.priority === "High").length;

    return NextResponse.json({
      success: true,
      priorities: topPriorities,
      summary: {
        totalGapsCount: allGaps.length,
        totalMissingFrequency,
        highPriorityCount,
      },
    });
  } catch (error: any) {
    console.error("[API GET /skills/learning-priorities] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch learning priorities" },
      { status: 500 }
    );
  }
}
