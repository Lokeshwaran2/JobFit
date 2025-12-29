import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts (standard ATS safe fonts usually, but we use internal for now)
// Register fonts (standard ATS safe fonts usually, but we use internal for now)
// Font.register({
//     family: "Open Sans",
//     src: "https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf",
// });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        // fontFamily: "Open Sans", // Use default font
        fontSize: 10,
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 20,
        borderBottom: "1pt solid #000",
        paddingBottom: 10,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    contact: {
        fontSize: 9,
        marginTop: 4,
        color: "#444",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        borderBottom: "1pt solid #ccc",
        marginBottom: 6,
        marginTop: 10,
        textTransform: "uppercase",
        paddingBottom: 2,
    },
    jobBlock: {
        marginBottom: 8,
    },
    jobHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    jobTitle: {
        fontWeight: "bold",
    },
    jobCompany: {
        fontStyle: "italic",
    },
    jobDates: {
        fontSize: 9,
        color: "#666",
    },
    bullet: {
        marginLeft: 10,
        marginBottom: 2,
    },
    skillGroup: {
        flexDirection: "row",
        marginBottom: 2,
    },
    skillLabel: {
        fontWeight: "bold",
        width: 60,
    },
    skillList: {
        flex: 1,
    },
});

export const ResumeDocument = ({ data }: { data: any }) => {
    const { personalInfo, summary, experience, skills, projects, education } = data || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{personalInfo?.name || "Your Name"}</Text>
                    <Text style={styles.contact}>
                        {[
                            personalInfo?.email,
                            personalInfo?.phone,
                            personalInfo?.linkedin,
                            personalInfo?.location
                        ].filter(Boolean).join(" | ")}
                    </Text>
                </View>

                {/* Summary */}
                {summary && (
                    <View>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text>{summary}</Text>
                    </View>
                )}

                {/* Skills */}
                {skills && (
                    <View>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        {skills.hard && skills.hard.length > 0 && (
                            <View style={styles.skillGroup}>
                                <Text style={styles.skillLabel}>Core:</Text>
                                <Text style={styles.skillList}>{skills.hard.join(", ")}</Text>
                            </View>
                        )}
                        {skills.tools && skills.tools.length > 0 && (
                            <View style={styles.skillGroup}>
                                <Text style={styles.skillLabel}>Tools & Environment:</Text>
                                <Text style={styles.skillList}>{skills.tools.join(", ")}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Experience */}
                {experience && experience.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Experience</Text>
                        {experience.map((job: any, index: number) => (
                            <View key={index} style={styles.jobBlock}>
                                <View style={styles.jobHeader}>
                                    <Text style={styles.jobTitle}>
                                        {job.role} <Text style={styles.jobCompany}>at {job.company}</Text>
                                    </Text>
                                    <Text style={styles.jobDates}>{job.startDate} - {job.endDate || "Present"}</Text>
                                </View>
                                {job.description && job.description.map((bullet: any, i: number) => {
                                    const text = typeof bullet === "string" ? bullet : bullet.text;
                                    return (
                                        <Text key={i} style={styles.bullet}>• {text}</Text>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        {projects.map((project: any, index: number) => (
                            <View key={index} style={styles.jobBlock}>
                                <View style={styles.jobHeader}>
                                    <Text style={styles.jobTitle}>{project.name}</Text>
                                    <Text style={styles.jobDates}>{project.year || ""}</Text>
                                </View>
                                <Text style={{ fontSize: 9, fontStyle: 'italic', marginBottom: 2 }}>
                                    {project.techStack || project.technologies?.join(", ")}
                                </Text>
                                {project.description && (Array.isArray(project.description) ? project.description.map((desc: string, i: number) => (
                                    <Text key={i} style={styles.bullet}>• {desc}</Text>
                                )) : <Text style={styles.bullet}>{project.description}</Text>)}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education */}
                {education && education.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {education.map((edu: any, index: number) => (
                            <View key={index} style={styles.jobHeader}>
                                <Text>{edu.degree} - {edu.institution}</Text>
                                <Text style={styles.jobDates}>{edu.year}</Text>
                            </View>
                        ))}
                    </View>
                )}

            </Page>
        </Document>
    );
};
