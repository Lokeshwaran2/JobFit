import { auth } from "@/auth";
import { ProfileScoringEngine } from "@/lib/profile-scoring/profile-scoring-engine";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { inputType, jobDescription, role, company } = body;

    if (!inputType || (inputType !== "jd" && inputType !== "role")) {
      return NextResponse.json(
        { error: "Invalid inputType. Must be 'jd' or 'role'." },
        { status: 400 }
      );
    }

    if (inputType === "jd" && (!jobDescription || !jobDescription.trim())) {
      return NextResponse.json(
        { error: "Please provide a job description." },
        { status: 400 }
      );
    }

    if (inputType === "role" && (!role || !role.trim())) {
      return NextResponse.json(
        { error: "Please enter a target role." },
        { status: 400 }
      );
    }

    const engine = new ProfileScoringEngine();
    const result = await engine.checkProfileScore({
      userId: session.user.id,
      inputType,
      jobDescription: jobDescription?.trim(),
      role: role?.trim(),
      company: company?.trim(),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/profile-score/check error:", error);
    return NextResponse.json(
      { error: error.message || "We couldn't complete the analysis. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));

    const checks = await prisma.profileScoreCheck.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        role: true,
        company: true,
        inputType: true,
        githubScore: true,
        linkedinScore: true,
        overallScore: true,
        breakdown: true,
        skillMatches: true,
        strengths: true,
        weaknesses: true,
        recommendations: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      checks,
    });
  } catch (error: any) {
    console.error("GET /api/profile-score/check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load recent profile checks." },
      { status: 500 }
    );
  }
}
