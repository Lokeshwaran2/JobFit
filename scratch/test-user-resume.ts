import { prisma } from "../src/lib/prisma";
import { generateResumePdfBuffer } from "../src/lib/export/pdf-generator";
import { generateResumeDocxBuffer } from "../src/lib/export/docx-generator";
import { getExportableResumeData } from "../src/lib/export/resume-data-resolver";
import fs from "fs";
import path from "path";

async function main() {
  const resumeId = "cmtr7or0o0003izwbx0mge5p0";
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    select: {
      id: true,
      userId: true,
      title: true,
      templateId: true,
      structuredData: true,
      originalData: true,
      improvements: true,
    }
  });

  if (!resume) {
    console.log("Resume not found:", resumeId);
    return;
  }

  console.log("Found resume:", resume.id, "Title:", resume.title, "Template:", resume.templateId);
  const data = getExportableResumeData(resume);
  console.log("Candidate Name:", data.personalInfo?.fullName || data.personalInfo?.name);
  console.log("Experience entries count:", data.experience?.length);

  for (const tpl of ["classic", "modern", "minimal"] as const) {
    const pdfBuf = await generateResumePdfBuffer(data, tpl);
    const docxBuf = await generateResumeDocxBuffer(data, tpl);
    console.log(`✓ Template ${tpl} -> PDF size: ${pdfBuf.length}, DOCX size: ${docxBuf.length}`);
    fs.writeFileSync(path.resolve(process.cwd(), `scratch/user_resume_${tpl}.pdf`), pdfBuf);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
