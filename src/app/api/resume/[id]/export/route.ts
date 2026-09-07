import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateResumePdfBuffer } from "@/lib/export/pdf-generator";
import { generateResumeDocxBuffer } from "@/lib/export/docx-generator";
import { resolveTemplateId, TemplateId } from "@/lib/templates/template-registry";
import { getExportableResumeData } from "@/lib/export/resume-data-resolver";

/**
 * GET /api/resume/[id]/export?format=pdf|docx&template=classic|modern|minimal
 *
 * Secure export endpoint for PDF and DOCX.
 *
 * Rules:
 * 1. Requires authentication via NextAuth session.
 * 2. Ownership verification: checks resume.userId === session.user.id (prevents IDOR).
 * 3. Never alters resume facts: uses validated tailored structuredData (or originalData fallback).
 * 4. Never logs sensitive resume contents or PII.
 * 5. Returns real binary attachment with correct MIME type and Content-Disposition.
 */
export async function GET(
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

    const resume = await prisma.resume.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        templateId: true,
        structuredData: true,
        originalData: true,
        improvements: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // IDOR Protection: resume must belong to authenticated user
    if (resume.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "pdf").toLowerCase();
    const requestedTemplate = searchParams.get("template") || resume.templateId;
    const templateId = resolveTemplateId(requestedTemplate as TemplateId);

    // Prefer validated tailored resume content, falling back to structured or original resume data
    const resumeData = getExportableResumeData(resume);

    // Sanitize file name for Content-Disposition header
    const candidateName = (resumeData.personalInfo?.fullName || resumeData.personalInfo?.name || "Candidate")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const baseFilename = `Resume_${candidateName}_${templateId}`;

    if (format === "docx") {
      const docxBuffer = await generateResumeDocxBuffer(resumeData, templateId);
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseFilename}.docx"`,
          "Content-Length": docxBuffer.length.toString(),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (format === "pdf") {
      const pdfBuffer = await generateResumePdfBuffer(resumeData, templateId);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${baseFilename}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported export format '${format}'. Supported formats: pdf, docx` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Resume Export Error]:", error?.message || "Internal server error");
    return NextResponse.json({ error: "Export generation failed" }, { status: 500 });
  }
}
