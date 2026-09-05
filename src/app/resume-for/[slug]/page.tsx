import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Upload, FileText, Target, TrendingUp, Users, Building2 } from "lucide-react";
import resumePages from "@/data/resumePages.json";
import { Metadata } from "next";

// Force static generation for these paths
export async function generateStaticParams() {
    return resumePages.map((page) => ({
        slug: page.slug,
    }));
}

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const pageData = resumePages.find((p) => p.slug === slug);

    if (!pageData) {
        return {
            title: "Resume Builder | JobFit",
        };
    }

    const title = pageData.company
        ? `ATS-Friendly Resume for ${pageData.role} at ${pageData.company} (India) | JobFit`
        : `ATS-Friendly Resume for ${pageData.role} (India) – Free Builder | JobFit`;

    const description = pageData.company
        ? `Create an ATS-friendly resume for ${pageData.role} roles at ${pageData.company} in India. Optimized for Naukri, LinkedIn, and corporate ATS scans.`
        : `Build a professional, ATS-compliant resume for ${pageData.role} jobs in India. Tailored format for freshers and experienced professionals. Free download.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
        },
    };
}

export default async function ResumeForPage({ params }: PageProps) {
    const { slug } = await params;
    const pageData = resumePages.find((p) => p.slug === slug);

    if (!pageData) {
        notFound();
    }

    const { role, company } = pageData;
    const targetName = company ? `${role} at ${company}` : role;

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-16 md:py-24 overflow-hidden bg-slate-50 dark:bg-black">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
                    </div>

                    <div className="container px-4 md:px-6 mx-auto text-center space-y-6">
                        <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-bottom-3">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
                            #1 ATS Resume Builder for India
                        </div>

                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 delay-100">
                            Resume for <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{targetName}</span> – ATS Friendly Format (India)
                        </h1>

                        <p className="max-w-3xl mx-auto text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-5 delay-200">
                            Create a professional <strong>{role}</strong> resume tailored for the Indian job market. Optimized for <strong>Naukri, Indeed, and LinkedIn</strong> to help you beat the ATS and get hired {company ? `at ${company}` : ""}.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6 animate-in fade-in slide-in-from-bottom-6 delay-300">
                            <Button size="lg" className="h-12 px-8 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto" asChild>
                                <Link href="/register">
                                    Build My {role} Resume <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Intro / Recruiter Expectations */}
                <section className="py-12 bg-background">
                    <div className="container px-4 mx-auto max-w-4xl space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold tracking-tight">Recruiter Expectations for {role} in India</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                In the competitive Indian job market, hiring managers for <strong>{role}</strong> roles received hundreds of applications daily.
                                {company ? ` Companies like ${company} use` : " Top companies use"} automated Applicant Tracking Systems (ATS) to filter candidates before a human ever sees your CV.
                                To stand out, your resume needs to be more than just a list of responsibilities—it needs to clearly demonstrate your impact and technical proficiency in a format that parses perfectly on portals like Naukri.com.
                            </p>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 border shadow-sm">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                Top Skills for {role}
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    "Domain Knowledge & Technical Expertise",
                                    "Problem Solving & Analytical Skills",
                                    "Communication & Stakeholder Management",
                                    "Agile/Scrum Methodologies (if applicable)",
                                    "Tools & Technologies Proficiency",
                                    "Project Execution & Delivery"
                                ].map((skill, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                        <span>{skill}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                * JobFit's AI automatically suggests specific technical keywords for {role} based on the job description you provide.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ATS Optimization Tips (India) */}
                <section className="py-12 bg-slate-50 dark:bg-transparent">
                    <div className="container px-4 mx-auto max-w-4xl">
                        <h2 className="text-2xl font-bold tracking-tight mb-8">ATS Optimization Tips for India (Naukri & Indeed)</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-background p-6 rounded-lg border">
                                <TrendingUp className="h-8 w-8 text-green-500 mb-4" />
                                <h3 className="font-semibold mb-2">Keyword Density</h3>
                                <p className="text-sm text-muted-foreground">Indian recruiters often search by specific keywords on Naukri. Ensure your {role} resume includes exact terms from the JD.</p>
                            </div>
                            <div className="bg-background p-6 rounded-lg border">
                                <FileText className="h-8 w-8 text-blue-500 mb-4" />
                                <h3 className="font-semibold mb-2">Simple Formatting</h3>
                                <p className="text-sm text-muted-foreground">Avoid tables, columns, and graphics. Standard reverse-chronological text formats parse best on Indian portals.</p>
                            </div>
                            <div className="bg-background p-6 rounded-lg border">
                                <Building2 className="h-8 w-8 text-purple-500 mb-4" />
                                <h3 className="font-semibold mb-2">Company Targeting</h3>
                                <p className="text-sm text-muted-foreground">If applying to {company || "MNCs like TCS or Infosys"}, align your project descriptions with their service domains.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Common Mistakes */}
                <section className="py-12 bg-background">
                    <div className="container px-4 mx-auto max-w-4xl">
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-8 border border-red-100 dark:border-red-900">
                            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-6 flex items-center gap-2">
                                <CheckCircle className="h-6 w-6" /> Common Resume Mistakes in India
                            </h2>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">✕</span>
                                    <span><strong>Including Personal Details:</strong> Avoid marital status, religion, or full full address. City and State are sufficient.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">✕</span>
                                    <span><strong>Photo on Resume:</strong> Unless you are a model or actor, photos are generally not required and confuse ATS parsers.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">✕</span>
                                    <span><strong>Declaration Section:</strong> The "I hereby declare..." statement is outdated. Use that space for skills or projects instead.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container px-4 mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-5xl font-bold">Optimize Your Resume with JobFit</h2>
                        <p className="max-w-2xl mx-auto text-primary-foreground/90 text-lg">
                            Ready to land your dream job as a {role}? Build an ATS-compliant resume in minutes.
                        </p>
                        <Button size="lg" variant="secondary" className="h-12 px-8 text-lg" asChild>
                            <Link href="/register">Create Your ATS Resume Free</Link>
                        </Button>
                    </div>
                </section>

                <section className="py-8 bg-slate-50 dark:bg-black border-t">
                    <div className="container px-4 mx-auto text-center">
                        <p className="text-muted-foreground">
                            Browse more guides → <Link href="/resume-for" className="text-primary hover:underline font-medium">View all resume guides</Link>
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
