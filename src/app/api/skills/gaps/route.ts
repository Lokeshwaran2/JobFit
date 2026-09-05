import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";

/**
 * GET /api/skills/gaps
 * Returns the authenticated user's missing skills ordered by priority rank.
 * Query params:
 * - status: "all" | "learning" | "acquired" (default: "all")
 * - limit: number (optional)
 * - page: number (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 50;

    const prioritizedSkills = await SkillGapTracker.getUserSkillGaps(userId, { status });

    // Pagination
    const totalCount = prioritizedSkills.length;
    const startIndex = (page - 1) * limit;
    const paginatedSkills = prioritizedSkills.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      skills: paginatedSkills,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("[API GET /skills/gaps] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch skill gaps" },
      { status: 500 }
    );
  }
}
