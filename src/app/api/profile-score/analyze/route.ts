import { auth } from "@/auth";
import { ProfileScoringEngine } from "@/lib/profile-scoring/profile-scoring-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { resumeId, targetJobDesc, role, company } = body;

    const engine = new ProfileScoringEngine();
    const results = await engine.analyzeAndPersist({
      userId: session.user.id,
      resumeId,
      targetJobDesc,
      roleOverride: role,
      persist: true,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("POST /api/profile-score/analyze error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze profile score." }, { status: 500 });
  }
}
