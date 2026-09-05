import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateAndNormalizeGithubUrl, validateAndNormalizeLinkedinUrl } from "@/lib/profile-scoring/url-validator";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      githubUrl: true,
      linkedinUrl: true,
      linkedinData: true,
    },
  });

  return NextResponse.json({
    githubUrl: user?.githubUrl || null,
    linkedinUrl: user?.linkedinUrl || null,
    linkedinData: user?.linkedinData || null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { githubUrl, linkedinUrl, linkedinData } = body;

    let cleanGithubUrl: string | null = null;
    if (githubUrl && typeof githubUrl === "string" && githubUrl.trim()) {
      const ghVal = validateAndNormalizeGithubUrl(githubUrl);
      if (!ghVal.isValid) {
        return NextResponse.json({ error: ghVal.error || "Invalid GitHub profile URL." }, { status: 400 });
      }
      cleanGithubUrl = ghVal.normalizedUrl || null;
    }

    let cleanLinkedinUrl: string | null = null;
    if (linkedinUrl && typeof linkedinUrl === "string" && linkedinUrl.trim()) {
      const liVal = validateAndNormalizeLinkedinUrl(linkedinUrl);
      if (!liVal.isValid) {
        return NextResponse.json({ error: liVal.error || "Invalid LinkedIn profile URL." }, { status: 400 });
      }
      cleanLinkedinUrl = liVal.normalizedUrl || null;
    }

    const updateData: any = {
      githubUrl: cleanGithubUrl,
      linkedinUrl: cleanLinkedinUrl,
    };

    if (linkedinData !== undefined) {
      updateData.linkedinData = linkedinData;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        githubUrl: true,
        linkedinUrl: true,
        linkedinData: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT /api/profile/social-links error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong." }, { status: 500 });
  }
}
