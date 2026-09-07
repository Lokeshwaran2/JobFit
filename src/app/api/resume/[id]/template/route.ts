import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveTemplateId, TemplateId } from "@/lib/templates/template-registry";

/**
 * PATCH /api/resume/[id]/template
 *
 * Persists selected resume template (classic, modern, minimal).
 *
 * Rules:
 * 1. Requires authentication via NextAuth.
 * 2. IDOR Protection: verifies resume.userId === session.user.id.
 * 3. Resolves invalid/unknown templates safely to "classic".
 * 4. Persists directly to Resume.templateId column.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing resume ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const rawTemplateId = body.templateId;
    const resolvedTemplateId = resolveTemplateId(rawTemplateId as TemplateId);

    // Verify ownership before updating
    const existing = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: { templateId: resolvedTemplateId },
      select: { id: true, templateId: true },
    });

    return NextResponse.json({ success: true, templateId: updated.templateId });
  } catch (error: any) {
    console.error("[Resume Template Update Error]:", error?.message || "Internal server error");
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
