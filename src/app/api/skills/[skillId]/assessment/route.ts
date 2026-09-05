import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AssessmentService } from "@/lib/skills/engine/assessment-service";
import { z } from "zod";

const assessmentSchema = z.object({
  assessmentType: z.enum(["checkpoint", "mcq", "practical", "capstone"]),
  answers: z.record(z.union([z.string(), z.number()])).optional(),
  practicalOutput: z.string().optional(),
  githubRepoUrl: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/skills/:skillId/assessment
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
    const parseResult = assessmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const result = await AssessmentService.evaluateAndRecordAssessment({
      userId,
      skillId: decodedSkill,
      ...parseResult.data,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error("[API POST /skills/:skillId/assessment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/skills/:skillId/assessment
 * Returns assessment history for the skill.
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

    const assessments = await AssessmentService.getUserAssessments(userId, decodedSkill);

    return NextResponse.json({
      success: true,
      assessments,
    });
  } catch (error: any) {
    console.error("[API GET /skills/:skillId/assessment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
