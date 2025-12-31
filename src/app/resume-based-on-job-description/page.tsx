import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, XCircle, Search, Target, FileText, Zap } from "lucide-react";
import { PricingSection } from "@/components/pricing-section";
import { auth } from "@/auth";

export const metadata = {
    title: "Create Resume Based on Job Description | Tailored & Optimized",
    description: "Stop guessing. Use our AI to write a resume based on the job description. Match keywords, skills, and requirements to pass the ATS scan.",
    openGraph: {
        title: "Create Resume Based on Job Description | JobFit",
        description: "Generate an ATS-optimized resume tailored to any job description.",
        url: "https://jobfit.co.in/resume-based-on-job-description",
        type: "website",
    },
};

export default async function ResumeBasedOnJobDescription() {
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
                            Resume Based on <span className="text-primary">Job Description</span>
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Stop guessing what recruiters want. Create a resume tailored to the exact job description you are applying for and triple your interview callbacks.
                        </p>
                        <div className="space-x-4">
                            <Button size="lg" asChild>
                                <Link href="/builder/new">Paste Job Description & Generate Resume <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Introduction: Why Context Matters */}
                <section className="container max-w-4xl py-12 space-y-8 px-4">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg leading-loose">
                            In today's competitive job market, sending a generic "one-size-fits-all" resume is the fastest way to the rejection pile.
                            Recruiters spend an average of 6 seconds scanning a resume. If they don't see the specific keywords, skills, and
                            experience relevant to <em>their</em> open role immediately, they move on.
                        </p>
                        <p className="text-lg leading-loose mt-4">
                            Creating a <strong>resume based on the job description</strong> is not just a "nice-to-have"—it is a necessity.
                            By mirroring the language of the job post, you prove two things: you read the requirements, and you are explicitly qualified to solve their problems.
                        </p>
                    </div>
                </section>

                {/* Why Generic Resumes Fail */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-5xl px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Why Generic Resumes Fail</h2>
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full h-fit">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-2">The "Spray and Pray" Problem</h3>
                                        <p className="text-muted-foreground">
                                            When you send the same resume to 50 companies, you are essentially telling 50 hiring managers,
                                            "I didn't care enough to customize this for you." Generic resumes lack focus and fail to address specific company pain points.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full h-fit">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-2">They Are Invisible to ATS</h3>
                                        <p className="text-muted-foreground">
                                            Applicant Tracking Systems scan for exact keyword matches. If the job description asks for "SaaS Sales"
                                            and your resume says "Software Selling", an older ATS might miss the connection entirely.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-background border rounded-xl p-8 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-center">The ATS Filter Reality</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border-b">
                                        <span className="text-sm">Candidates Applied</span>
                                        <span className="font-bold">250+</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border-b text-muted-foreground">
                                        <span className="text-sm">Filtered by Keywords</span>
                                        <span className="font-bold">-75%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border-b text-muted-foreground">
                                        <span className="text-sm">Filtered by Formatting</span>
                                        <span className="font-bold">-15%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded font-bold text-primary">
                                        <span className="text-sm">Seen by Humans</span>
                                        <span>Top 10%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why ATS Prefers JD-Aligned Resumes */}
                <section className="container max-w-4xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-6">Why ATS Systems Prefer JD-Aligned Resumes</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="border p-6 rounded-lg hover:border-primary/50 transition-colors">
                            <Target className="h-8 w-8 text-blue-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Keyword Density</h3>
                            <p className="text-sm text-muted-foreground">
                                ATS algorithms calculate a "match score" based on the frequency of important terms found in both the job description and your resume.
                            </p>
                        </div>
                        <div className="border p-6 rounded-lg hover:border-primary/50 transition-colors">
                            <FileText className="h-8 w-8 text-purple-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Semantic Relevance</h3>
                            <p className="text-sm text-muted-foreground">
                                Modern systems look for related skills. A resume tailored to the JD groups these skills logically, making it easier for the bot to parse context.
                            </p>
                        </div>
                        <div className="border p-6 rounded-lg hover:border-primary/50 transition-colors">
                            <Search className="h-8 w-8 text-green-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Hard & Soft Skills</h3>
                            <p className="text-sm text-muted-foreground">
                                Job descriptions often list soft skills like "Agile Leadership". Tailoring ensures you don't just list technical tools but also the required methodologies.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Real Example Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-5xl">
                        <h2 className="text-3xl font-bold text-center mb-12">See the Difference: Before vs After</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Before Card */}
                            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                                <div className="mb-4">
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase">Generic Resume</span>
                                </div>
                                <p className="text-sm font-mono text-muted-foreground mb-2">Experience Bullet Point:</p>
                                <p className="italic text-lg mb-4">"Responsible for managing sales team and handling customer accounts."</p>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                    <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Passive language ("Responsible for")</li>
                                    <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> No metrics or data</li>
                                    <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Vague "customer accounts"</li>
                                </ul>
                            </div>

                            {/* After Card */}
                            <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                <div className="mb-4">
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">Tailored to JD</span>
                                </div>
                                <p className="text-sm font-mono text-muted-foreground mb-2">JobFit Optimized Version:</p>
                                <p className="font-medium text-lg mb-4">"Led a high-performing sales team of 10 to generate $2M in ARR, exceeding quarterly targets by 15% through strategic account management."</p>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Action verb ("Led", "Exceeding")</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Concrete metrics ($2M ARR, 15%)</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Matches JD keyword "Strategic Account Management"</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How JobFit Creates a Job-Specific Resume */}
                <section className="container max-w-4xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-4">How JobFit Creates a Job-Specific Resume</h2>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg text-muted-foreground">
                            Manual tailoring takes hours. You have to read the JD, enable "Track Changes", rewrite every bullet, and check for synonyms.
                            JobFit automates this entire workflow in seconds.
                        </p>
                    </div>

                    <div className="space-y-6 mt-8">
                        <div className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">1. Structural Analysis</h3>
                                <p className="text-muted-foreground">
                                    We analyze the job description to understand the seniority level, required tech stack, and core responsibilities.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">2. Intelligent Rewriting</h3>
                                <p className="text-muted-foreground">
                                    Our AI takes your existing experience and rewrites it to highlight the specific skills requested. It acts like a professional resume writer sitting next to you.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-primary/10 p-3 rounded-lg h-fit">
                                <CheckCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">3. Score Verification</h3>
                                <p className="text-muted-foreground">
                                    Before you download, we provide an ATS Match Score. If it's below 95, we suggest specific improvements to get you there.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 text-center">
                        <Button size="lg" asChild className="h-14 px-8 text-lg">
                            <Link href="/builder/new">Paste Job Description & Generate Resume</Link>
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                            No credit card required for initial fit check.
                        </p>
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
