import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    CheckCircle,
    XCircle,
    Puzzle,
    TrendingUp,
    Zap,
    Briefcase,
    Layers,
    Award
} from "lucide-react";
import { auth } from "@/auth";

export const metadata = {
    title: "Job Fit Resume Builder | Match Your Skills to the Role",
    description: "Don't send generic applications. Create a Job Fit resume that demonstrates your specific alignment with the company's needs and culture.",
    openGraph: {
        title: "Job Fit Resume Builder | JobFit",
        description: "Create a resume that demonstrates your specific alignment with the company's needs.",
        url: "https://jobfit.co.in/job-fit-resume",
        type: "website",
    },
};

export default async function JobFitResume() {
    const session = await auth();

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="JobFit" className="h-8 w-8" />
                            <span>JobFit</span>
                        </Link>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Button asChild>
                            <Link href={session ? "/dashboard" : "/register"}>Get Started</Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                            <span className="text-primary">Job Fit Resume</span> for ATS and Recruiters
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Prove you are the missing piece of the puzzle. Create a resume that perfectly aligns with the skills, culture, and requirements of your target role.
                        </p>
                        <div className="space-x-4">
                            <Button size="lg" asChild>
                                <Link href="/builder/new">Create Job-Fit Resume Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* What is a Job Fit Resume? */}
                <section className="container max-w-4xl py-12 space-y-8 px-4">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg leading-loose">
                            A <strong>Job Fit Resume</strong> is more than just a history of your employment. It is a strategic document curated to demonstrate specific alignment between your capabilities and a company's needs.
                        </p>
                        <p className="text-lg leading-loose mt-4">
                            Recruiters assess candidates on two dimensions: <strong>Person-Job Fit</strong> (do they have the technical skills?) and <strong>Person-Organization Fit</strong> (do they match our values?). A standard resume lists everything you've done. A job-fit resume lists only what matters to <em>this</em> employer, framed in <em>their</em> language.
                        </p>
                    </div>
                </section>

                {/* Generic vs Job-Fit Difference */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-5xl px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">The Difference: Generic vs. Job-Fit</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Generic Card */}
                            <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                                    <h3 className="text-xl font-bold">Generic Resume</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">Detailed history of every task you've ever done.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">Uses your internal company jargon ("Led Project X").</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">Focuses on responsibilities ("Responsible for coding").</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">Sent to 100 job postings without changes.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Job Fit Card */}
                            <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-primary/20 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                <div className="flex items-center gap-3 mb-6">
                                    <Puzzle className="h-6 w-6 text-primary" />
                                    <h3 className="text-xl font-bold">Job-Fit Resume</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <span className="font-medium">Curated list of relevant projects and wins.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <span className="font-medium">Uses the target company's keywords ("Agile", "SaaS").</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <span className="font-medium">Focuses on value & impact ("Improved retention by 20%").</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <span className="font-medium">Tailored uniquely for ONE specific opportunity.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Job-Fit Resumes Perform Better in ATS */}
                <section className="container max-w-4xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-6">Why Job-Fit Resumes Win the ATS Game</h2>
                    <div className="grid gap-6">
                        <div className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors">
                            <TrendingUp className="h-8 w-8 text-blue-600 shrink-0" />
                            <div>
                                <h3 className="font-bold text-lg mb-2">Higher Relevance Score</h3>
                                <p className="text-muted-foreground">
                                    Applicant Tracking Systems rank candidates by relevance. A resume that ignores irrelevant skills and doubles down on required ones naturally scores higher.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors">
                            <Layers className="h-8 w-8 text-purple-600 shrink-0" />
                            <div>
                                <h3 className="font-bold text-lg mb-2">Contextual Keyword Matching</h3>
                                <p className="text-muted-foreground">
                                    It's not just about having the word "Python". It's about showing "Python" in the context of "Data Analysis" if that's what the job demands.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors">
                            <Zap className="h-8 w-8 text-yellow-600 shrink-0" />
                            <div>
                                <h3 className="font-bold text-lg mb-2">Reduced Cognitive Load</h3>
                                <p className="text-muted-foreground">
                                    When a human recruiter finally sees your resume, they don't have to guess why you applied. The fit is obvious, making the "Yes" decision easy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How JobFit Builds Job-Fit Resumes Step-by-Step */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-4xl">
                        <h2 className="text-3xl font-bold text-center mb-12">How We Build Your Job-Fit Resume</h2>
                        <div className="relative border-l-2 border-primary/20 ml-4 md:ml-12 space-y-12">
                            <div className="relative pl-8 md:pl-12">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background"></div>
                                <h3 className="font-bold text-xl mb-2">Step 1: Role Analysis</h3>
                                <p className="text-muted-foreground">
                                    You provide the Job Description. Our AI scans it to identify the "must-have" hard skills, "nice-to-have" qualifications, and cultural values.
                                </p>
                            </div>
                            <div className="relative pl-8 md:pl-12">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background"></div>
                                <h3 className="font-bold text-xl mb-2">Step 2: Experience Mapping</h3>
                                <p className="text-muted-foreground">
                                    We look at your profile. If the job requires "Leadership" and you have "Team Management", we rewrite your bullets to use their preferred terminology.
                                </p>
                            </div>
                            <div className="relative pl-8 md:pl-12">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background"></div>
                                <h3 className="font-bold text-xl mb-2">Step 3: Impact Quantified</h3>
                                <p className="text-muted-foreground">
                                    We prompt you to turn duties into data. "Increased sales" becomes "Drove 15% revenue growth," providing proof of your ability to perform.
                                </p>
                            </div>
                            <div className="relative pl-8 md:pl-12">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background"></div>
                                <h3 className="font-bold text-xl mb-2">Step 4: Final Fit Check</h3>
                                <p className="text-muted-foreground">
                                    We run a final simulation against an ATS parser. We give you a score (0-100) and specific advice to inch closer to a perfect 100.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="container max-w-3xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-bold mb-2">What does "job fit" mean in recruiting?</h4>
                            <p className="text-sm text-muted-foreground">
                                Job fit is the degree to which your skills, values, and personality align with the requirements of a specific role and the culture of the hiring company.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <h4 className="font-bold mb-2">How do I know if my resume fits the job?</h4>
                            <p className="text-sm text-muted-foreground">
                                Use an ATS scanner or Resume Checker like JobFit. If you score above 90%, your resume is well-aligned. A low score indicates you are missing key requirements.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <h4 className="font-bold mb-2">Can I use the same resume for similar jobs?</h4>
                            <p className="text-sm text-muted-foreground">
                                We don't recommend it. Even job titles like "Product Manager" can vary wildly between companies (e.g., technical vs. marketing focus). It is always safer to tailor.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <h4 className="font-bold mb-2">Is JobFit AI better than a human writer?</h4>
                            <p className="text-sm text-muted-foreground">
                                For ATS optimization, yes. Humans might write beautiful prose, but AI knows exactly how algorithms parse data and weight keywords, giving you a technical edge.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 text-center">
                        <Button size="lg" asChild className="h-14 px-8 text-lg">
                            <Link href="/builder/new">Create Job-Fit Resume Free</Link>
                        </Button>
                    </div>
                </section>

            </main>
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2025 JobFit
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:underline">Privacy</Link>
                        <Link href="/terms" className="hover:underline">Terms</Link>
                        <Link href="/contact" className="hover:underline">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
