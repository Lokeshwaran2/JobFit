import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
} from "docx";
import { getTemplateConfig, resolveTemplateId, TemplateId } from "../templates/template-registry";

/**
 * Generates a real Microsoft Word OpenXML (.docx) Buffer using proper
 * Word document primitives, template styling, and validated resume content.
 *
 * Rules:
 * 1. Output is valid OpenXML (.docx), not renamed HTML or plain text.
 * 2. Uses exact same structured candidate data as PDF export.
 * 3. Never alters candidate facts, titles, dates, or metrics.
 */
export async function generateResumeDocxBuffer(
  data: any,
  templateId?: TemplateId | string | null
): Promise<Buffer> {
  const resolvedTemplate = resolveTemplateId(templateId);
  const config = getTemplateConfig(resolvedTemplate);
  const { docxStyles } = config;

  const { personalInfo, summary, experience, skills, projects, education, certifications } = data || {};

  const font = docxStyles.font;
  const primaryColor = docxStyles.primaryColor;
  const textColor = docxStyles.textColor;
  const mutedColor = docxStyles.mutedColor;

  const children: Paragraph[] = [];

  // Helper for section headings with template-specific styling
  const createSectionHeading = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: docxStyles.hasHeadingBorder
        ? {
            bottom: {
              color: primaryColor,
              space: 3,
              style: BorderStyle.SINGLE,
              size: 8,
            },
          }
        : undefined,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: font,
          size: docxStyles.headingSize,
          color: primaryColor,
        }),
      ],
    });
  };

  // 1. Header (Name + Contact Details)
  children.push(
    new Paragraph({
      alignment: docxStyles.headerAlignment === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: (personalInfo?.name || "Your Name").toUpperCase(),
          bold: true,
          font: font,
          size: docxStyles.nameSize,
          color: primaryColor,
        }),
      ],
    })
  );

  const contactItems = [
    personalInfo?.email,
    personalInfo?.phone,
    personalInfo?.linkedin,
    personalInfo?.location,
  ].filter(Boolean);

  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        alignment: docxStyles.headerAlignment === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: 180 },
        children: [
          new TextRun({
            text: contactItems.join("  |  "),
            font: font,
            size: 18, // 9pt
            color: mutedColor,
          }),
        ],
      })
    );
  }

  // 2. Summary
  if (summary && typeof summary === "string" && summary.trim()) {
    children.push(createSectionHeading("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 120, line: 260 },
        children: [
          new TextRun({
            text: summary.trim(),
            font: font,
            size: docxStyles.bodySize,
            color: textColor,
          }),
        ],
      })
    );
  }

  // 3. Skills
  if (skills && (skills.hard?.length || skills.tools?.length || skills.soft?.length)) {
    children.push(createSectionHeading("Skills"));

    if (skills.hard && skills.hard.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 60, line: 240 },
          children: [
            new TextRun({
              text: "Technical Skills: ",
              bold: true,
              font: font,
              size: docxStyles.bodySize,
              color: primaryColor,
            }),
            new TextRun({
              text: Array.isArray(skills.hard) ? skills.hard.join(", ") : skills.hard,
              font: font,
              size: docxStyles.bodySize,
              color: textColor,
            }),
          ],
        })
      );
    }

    if (skills.tools && skills.tools.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 60, line: 240 },
          children: [
            new TextRun({
              text: "Tools & Environment: ",
              bold: true,
              font: font,
              size: docxStyles.bodySize,
              color: primaryColor,
            }),
            new TextRun({
              text: Array.isArray(skills.tools) ? skills.tools.join(", ") : skills.tools,
              font: font,
              size: docxStyles.bodySize,
              color: textColor,
            }),
          ],
        })
      );
    }

    if (skills.soft && skills.soft.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 60, line: 240 },
          children: [
            new TextRun({
              text: "Core Competencies: ",
              bold: true,
              font: font,
              size: docxStyles.bodySize,
              color: primaryColor,
            }),
            new TextRun({
              text: Array.isArray(skills.soft) ? skills.soft.join(", ") : skills.soft,
              font: font,
              size: docxStyles.bodySize,
              color: textColor,
            }),
          ],
        })
      );
    }
  }

  // 4. Professional Experience
  if (experience && experience.length > 0) {
    children.push(createSectionHeading("Professional Experience"));

    for (const job of experience) {
      // Role & Company line
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({
              text: job.role || "Role",
              bold: true,
              font: font,
              size: docxStyles.bodySize + 1,
              color: primaryColor,
            }),
            new TextRun({
              text: ` at ${job.company || "Company"}`,
              italics: true,
              font: font,
              size: docxStyles.bodySize,
              color: textColor,
            }),
            new TextRun({
              text: `  (${job.startDate || ""} - ${job.endDate || "Present"})`,
              font: font,
              size: 18, // 9pt
              color: mutedColor,
            }),
          ],
        })
      );

      // Bullets
      const bullets = job.description || [];
      for (const bullet of bullets) {
        const text = typeof bullet === "string" ? bullet : bullet?.text || "";
        if (!text.trim()) continue;

        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 20, after: 40, line: 240 },
            children: [
              new TextRun({
                text: text.trim(),
                font: font,
                size: docxStyles.bodySize,
                color: textColor,
              }),
            ],
          })
        );
      }
    }
  }

  // 5. Key Projects
  if (projects && projects.length > 0) {
    children.push(createSectionHeading("Key Projects"));

    for (const project of projects) {
      const tech = Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : project.techStack || "";

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({
              text: project.name || "Project",
              bold: true,
              font: font,
              size: docxStyles.bodySize + 1,
              color: primaryColor,
            }),
            ...(tech
              ? [
                  new TextRun({
                    text: ` — ${tech}`,
                    italics: true,
                    font: font,
                    size: 18,
                    color: mutedColor,
                  }),
                ]
              : []),
            ...(project.year
              ? [
                  new TextRun({
                    text: `  (${project.year})`,
                    font: font,
                    size: 18,
                    color: mutedColor,
                  }),
                ]
              : []),
          ],
        })
      );

      if (project.description) {
        if (Array.isArray(project.description)) {
          for (const desc of project.description) {
            const text = typeof desc === "string" ? desc : desc?.text || "";
            if (!text.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 40, line: 240 },
                children: [
                  new TextRun({
                    text: text.trim(),
                    font: font,
                    size: docxStyles.bodySize,
                    color: textColor,
                  }),
                ],
              })
            );
          }
        } else {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 20, after: 40, line: 240 },
              children: [
                new TextRun({
                  text: String(project.description).trim(),
                  font: font,
                  size: docxStyles.bodySize,
                  color: textColor,
                }),
              ],
            })
          );
        }
      }
    }
  }

  // 6. Education
  if (education && education.length > 0) {
    children.push(createSectionHeading("Education"));

    for (const edu of education) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: edu.degree || "Degree",
              bold: true,
              font: font,
              size: docxStyles.bodySize,
              color: primaryColor,
            }),
            new TextRun({
              text: ` — ${edu.institution || "Institution"}`,
              font: font,
              size: docxStyles.bodySize,
              color: textColor,
            }),
            ...(edu.year
              ? [
                  new TextRun({
                    text: `  (${edu.year})`,
                    font: font,
                    size: 18,
                    color: mutedColor,
                  }),
                ]
              : []),
          ],
        })
      );
    }
  }

  // 7. Certifications
  if (certifications && certifications.length > 0) {
    children.push(createSectionHeading("Certifications"));

    for (const cert of certifications) {
      const certName = typeof cert === "string" ? cert : cert?.name || "";
      const certYear = typeof cert === "object" ? cert?.year : null;

      children.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: certName,
              bold: true,
              font: font,
              size: docxStyles.bodySize,
              color: primaryColor,
            }),
            ...(certYear
              ? [
                  new TextRun({
                    text: `  (${certYear})`,
                    font: font,
                    size: 18,
                    color: mutedColor,
                  }),
                ]
              : []),
          ],
        })
      );
    }
  }

  // Assemble full Word Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: docxStyles.margins.top,
              right: docxStyles.margins.right,
              bottom: docxStyles.margins.bottom,
              left: docxStyles.margins.left,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
