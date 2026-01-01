import Link from "next/link";
import resumePages from "@/data/resumePages.json";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Resume Guides By Role & Company | JobFit",
    description:
        "Browse ATS-friendly resume guides for freshers, developers and Indian IT companies like TCS, Infosys & Accenture.",
};

export default function ResumeForHubPage() {
    return (
        <main className="max-w-4xl mx-auto py-12 px-4 md:px-6 min-h-screen">
            <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    ATS-Friendly Resume Guides (India)
                </h1>

                <p className="text-lg text-muted-foreground max-w-2xl">
                    Choose your role or target company below to see resume examples,
                    skills, keywords and tips that help you pass ATS screening and
                    get shortlisted.
                </p>

                {/* Categories could be improved later, for now flat list is fine as per request */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    {resumePages.map((page) => (
                        <Link
                            key={page.slug}
                            href={`/resume-for/${page.slug}`}
                            className="block p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow hover:border-primary/50"
                        >
                            <div className="font-medium hover:underline decoration-primary underline-offset-4">
                                {page.role} {page.company ? `at ${page.company}` : ""}
                            </div>
                        </Link>
                    ))}
                </div>

                <p className="mt-12 pt-8 border-t text-center text-muted-foreground">
                    Want a resume tailored to a specific job description?{" "}
                    <Link className="text-primary hover:underline font-medium" href="/register">
                        Try JobFit for free
                    </Link>
                    .
                </p>
            </div>
        </main>
    );
}
