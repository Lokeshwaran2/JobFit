import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SkillLearningEngine } from "@/lib/skills/engine/skill-learning-engine";
import { z } from "zod";

const progressSchema = z.object({
  stepId: z.string().min(1, "Step ID is required"),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

/**
 * POST /api/skills/:skillId/progress
 */
export async function POST(
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

    const body = await req.json();

    // Support direct acquisition request
    if (body.status === "acquired" || body.acquire === true) {
      const { SkillGapTracker } = await import("@/lib/skills/skill-gap-tracker");
      const result = await SkillGapTracker.resolveSkillGap(userId, decodedSkill);
      return NextResponse.json({
        success: true,
        canonicalSkill: decodedSkill,
        status: "acquired",
        isAcquired: true,
        overallProgress: 100,
        progressPercentage: 100,
        data: result,
      });
    }

    const parseResult = progressSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { stepId, status } = parseResult.data;

    const result = await SkillLearningEngine.updateStepProgress(
      userId,
      decodedSkill,
      stepId,
      status
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[API POST /skills/:skillId/progress] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update step progress" },
      { status: 500 }
    );
  }
}
