import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeId } = await params;

  try {
    const scores = await prisma.profileScore.findMany({
      where: {
        userId: session.user.id,
        resumeId,
      },
      orderBy: { assessedAt: "desc" },
    });

    // Extract the latest scores per platform
    const latestByPlatform: Record<string, any> = {};
    for (const s of scores) {
      if (!latestByPlatform[s.platform]) {
        latestByPlatform[s.platform] = s;
      }
    }

    return NextResponse.json({
      latest: latestByPlatform,
      history: scores,
    });
  } catch (error: any) {
    console.error("GET /api/profile-score/[resumeId] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profile scores." }, { status: 500 });
  }
}
