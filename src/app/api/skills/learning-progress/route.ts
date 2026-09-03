import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillGapTracker } from "@/lib/skills/skill-gap-tracker";
import { z } from "zod";

const progressUpdateSchema = z.object({
  skill: z.string().min(1, "Skill name is required"),
  stepId: z.string().min(1, "Step ID is required"),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

/**
 * POST /api/skills/learning-progress
 * Updates user learning progress on an individual learning step.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = progressUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { skill, stepId, status } = parseResult.data;

    const result = await SkillGapTracker.updateStepProgress(
      userId,
      skill,
      stepId,
      status
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[API POST /skills/learning-progress] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update learning progress" },
      { status: 500 }
    );
  }
}
