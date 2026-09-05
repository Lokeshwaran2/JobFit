import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";
import { z } from "zod";

const acquireSchema = z.object({
  skill: z.string().min(1, "Skill name is required"),
});

/**
 * POST /api/skills/acquire
 * Marks a previously missing skill as acquired in the user profile.
 * Preserves historical missingCount and occurrence logs.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = acquireSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const result = await SkillGapTracker.resolveSkillGap(userId, parseResult.data.skill);

    return NextResponse.json({
      success: true,
      message: `Skill "${result.canonicalSkill}" marked as acquired!`,
      data: result,
    });
  } catch (error: any) {
    console.error("[API POST /skills/acquire] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark skill as acquired" },
      { status: 500 }
    );
  }
}
