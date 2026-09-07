import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { getTemplateConfig, resolveTemplateId, TemplateId } from "@/lib/templates/template-registry";

interface ResumeDocumentProps {
  data: any;
  templateId?: TemplateId | string | null;
}

export const ResumeDocument = ({ data, templateId }: ResumeDocumentProps) => {
  const resolvedTemplate = resolveTemplateId(templateId);
  const config = getTemplateConfig(resolvedTemplate);
  const { pdfStyles } = config;

  const { personalInfo, summary, experience, skills, projects, education, certifications } = data || {};

  const styles = StyleSheet.create({
    page: {
      padding: pdfStyles.pagePadding,
      fontSize: pdfStyles.bodyFontSize,
      lineHeight: pdfStyles.lineHeight,
      color: pdfStyles.textColor,
      backgroundColor: "#FFFFFF",
    },
    header: {
      marginBottom: 12,
      borderBottom: pdfStyles.headingBorderBottom,
      paddingBottom: 8,
    },
    name: {
      fontSize: pdfStyles.nameFontSize,
      fontWeight: "bold",
      color: pdfStyles.primaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    contact: {
      fontSize: 8.5,
      marginTop: 2,
      color: pdfStyles.mutedColor,
    },
    sectionContainer: {
      marginTop: pdfStyles.sectionMarginTop,
      marginBottom: 3,
    },
    sectionTitle: {
      fontSize: pdfStyles.headingFontSize,
      fontWeight: "bold",
      color: pdfStyles.primaryColor,
      borderBottom: pdfStyles.headingBorderBottom,
      marginBottom: 5,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingBottom: 2,
    },
    jobBlock: {
      marginBottom: pdfStyles.jobBlockMarginBottom,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 2,
    },
    jobTitle: {
      fontWeight: "bold",
      color: pdfStyles.primaryColor,
      fontSize: 10,
    },
    jobCompany: {
      fontStyle: "italic",
      color: pdfStyles.textColor,
    },
    jobDates: {
      fontSize: 8.5,
      color: pdfStyles.mutedColor,
    },
    bulletList: {
      marginTop: 2,
      paddingLeft: 4,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 2.5,
      alignItems: "flex-start",
    },
    bulletPoint: {
      width: 10,
      fontSize: 10,
      color: pdfStyles.primaryColor,
    },
    bulletContent: {
      flex: 1,
      fontSize: 9,
      lineHeight: 1.4,
    },
    skillGroup: {
      flexDirection: "row",
      marginBottom: 3,
      alignItems: "flex-start",
    },
    skillLabel: {
      fontWeight: "bold",
      width: 110,
      fontSize: 9,
      color: pdfStyles.primaryColor,
    },
    skillList: {
      flex: 1,
      fontSize: 9,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.45,
      textAlign: "justify",
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 2,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Protected from page break */}
        <View style={styles.header} wrap={false}>
          <Text style={styles.name}>{personalInfo?.name || "Your Name"}</Text>
          <Text style={styles.contact}>
            {[
              personalInfo?.email,
              personalInfo?.phone,
              personalInfo?.linkedin,
              personalInfo?.location,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </Text>
        </View>

        {/* Professional Summary */}
        {summary && typeof summary === "string" && summary.trim().length > 0 && (
          <View style={styles.sectionContainer} minPresenceAhead={40}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{summary.trim()}</Text>
          </View>
        )}

        {/* Skills Section */}
        {skills && (
          <View style={styles.sectionContainer} minPresenceAhead={40}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills.hard && skills.hard.length > 0 && (
              <View style={styles.skillGroup} wrap={false}>
                <Text style={styles.skillLabel}>Technical Skills:</Text>
                <Text style={styles.skillList}>
                  {Array.isArray(skills.hard) ? skills.hard.join(", ") : skills.hard}
                </Text>
              </View>
            )}
            {skills.tools && skills.tools.length > 0 && (
              <View style={styles.skillGroup} wrap={false}>
                <Text style={styles.skillLabel}>Tools & Environment:</Text>
                <Text style={styles.skillList}>
                  {Array.isArray(skills.tools) ? skills.tools.join(", ") : skills.tools}
                </Text>
              </View>
            )}
            {skills.soft && skills.soft.length > 0 && (
              <View style={styles.skillGroup} wrap={false}>
                <Text style={styles.skillLabel}>Core Competencies:</Text>
                <Text style={styles.skillList}>
                  {Array.isArray(skills.soft) ? skills.soft.join(", ") : skills.soft}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Experience Section with Page-Break Protection */}
        {experience && experience.length > 0 && (
          <View style={styles.sectionContainer} minPresenceAhead={50}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {experience.map((job: any, index: number) => (
              <View key={index} style={styles.jobBlock} wrap={false}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>
                    {job.role} <Text style={styles.jobCompany}>at {job.company}</Text>
                  </Text>
                  <Text style={styles.jobDates}>
                    {job.startDate} - {job.endDate || "Present"}
                  </Text>
                </View>
                {job.description && (
                  <View style={styles.bulletList}>
                    {job.description.map((bullet: any, i: number) => {
                      const text = typeof bullet === "string" ? bullet : bullet?.text || "";
                      if (!text.trim()) return null;
                      return (
                        <View key={i} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.bulletContent}>{text.trim()}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects Section with Page-Break Protection */}
        {projects && projects.length > 0 && (
          <View style={styles.sectionContainer} minPresenceAhead={40}>
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {projects.map((project: any, index: number) => (
              <View key={index} style={styles.jobBlock} wrap={false}>
                <View style={styles.itemHeader}>
                  <Text style={styles.jobTitle}>{project.name}</Text>
                  {project.year ? <Text style={styles.jobDates}>{project.year}</Text> : null}
                </View>
                {(project.techStack || project.technologies) && (
                  <Text style={{ fontSize: 8.5, color: pdfStyles.mutedColor, fontStyle: "italic", marginBottom: 2 }}>
                    {Array.isArray(project.technologies)
                      ? project.technologies.join(", ")
                      : project.techStack || ""}
                  </Text>
                )}
                {project.description && (
                  <View style={styles.bulletList}>
                    {Array.isArray(project.description) ? (
                      project.description.map((desc: any, i: number) => {
                        const text = typeof desc === "string" ? desc : desc?.text || "";
                        if (!text.trim()) return null;
                        return (
                          <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletContent}>{text.trim()}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletContent}>{String(project.description).trim()}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        {education && education.length > 0 && (
          <View style={styles.sectionContainer} minPresenceAhead={40}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu: any, index: number) => (
              <View key={index} style={styles.itemHeader} wrap={false}>
                <Text style={styles.jobTitle}>
                  {edu.degree} <Text style={styles.jobCompany}>— {edu.institution}</Text>
                </Text>
                {edu.year ? <Text style={styles.jobDates}>{edu.year}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Certifications Section (if present) */}
        {certifications && certifications.length > 0 && (
          <View style={styles.sectionContainer} minPresenceAhead={30}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert: any, index: number) => {
              const certName = typeof cert === "string" ? cert : cert?.name || "";
              const certYear = typeof cert === "object" ? cert?.year : null;
              return (
                <View key={index} style={styles.itemHeader} wrap={false}>
                  <Text style={styles.jobTitle}>{certName}</Text>
                  {certYear ? <Text style={styles.jobDates}>{certYear}</Text> : null}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
};
