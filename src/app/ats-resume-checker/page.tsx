import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Search, ShieldAlert, BarChart3, ScanSearch, FileX, Sliders } from "lucide-react";
import { auth } from "@/auth";

export const metadata = {
    title: "Free ATS Resume Checker & Score Scanner | JobFit",
    description: "Will your resume pass? Use our free ATS resume checker to see your match score, identify parsing errors, and fix missing keywords.",
    openGraph: {
        title: "Free ATS Resume Checker & Score Scanner | JobFit",
        description: "Will your resume pass? Use our free ATS resume checker to see your match score.",
        url: "https://jobfit.co.in/ats-resume-checker",
        type: "website",
    },
};

export default async function AtsResumeChecker() {
    const session = await auth();

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-14 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/"><span>JobFit.ai</span></Link>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Button asChild>
                            <Link href={session ? "/dashboard" : "/register"}>Check My Score</Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                            <span className="text-primary">ATS Resume Checker</span>
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Don't get rejected by a robot. Scan your resume against the job description to see exactly what the Applicant Tracking System sees.
                        </p>
                        <div className="space-x-4">
                            <Button size="lg" asChild>
                                <Link href="/builder/new">Check My ATS Resume Score <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Introduction: What is an ATS Resume Checker? */}
                <section className="container max-w-4xl py-12 space-y-8">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg leading-loose">
                            An <strong>ATS Resume Checker</strong> is a diagnostic tool designed to simulate the parsing algorithms used by major hiring platforms like Workday, Greenhouse, and Taleo.
                        </p>
                        <p className="text-lg leading-loose mt-4">
                            Before a human recruiter ever reads your name, a software bot (the Applicant Tracking System) scans your document.
                            It strips away your beautiful formatting, ignores your graphics, and hunts for specific keywords. If your resume
                            isn't optimized for this machine reading, it gets archived instantly—regardless of how qualified you are.
                        </p>
                    </div>
                </section>

                {/* How ATS Systems Parse Resumes */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-5xl">
                        <h2 className="text-3xl font-bold text-center mb-12">How ATS Systems Parse Resumes</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-background p-6 rounded-xl border shadow-sm">
                                <ScanSearch className="h-10 w-10 text-blue-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">1. Text Extraction</h3>
                                <p className="text-sm text-muted-foreground">
                                    The ATS converts your PDF or DOCX into plain text. If you use text boxes, columns, or images for headers, the text often scrambles or disappears entirely.
                                </p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm">
                                <Sliders className="h-10 w-10 text-purple-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">2. Categorization</h3>
                                <p className="text-sm text-muted-foreground">
                                    It looks for standard headings like "Education" and "Experience". Using creative headers like "My Journey" or "Professional Milestones" can confuse the parser.
                                </p>
                            </div>
                            <div className="bg-background p-6 rounded-xl border shadow-sm">
                                <Search className="h-10 w-10 text-green-500 mb-4" />
                                <h3 className="font-bold text-lg mb-2">3. Keyword Scoring</h3>
                                <p className="text-sm text-muted-foreground">
                                    The system compares your extracted text against the Job Description. It counts the frequency of required skills (e.g., "Python", "Project Management").
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Common ATS Mistakes */}
                <section className="container max-w-4xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-6">Common Parsing Failures</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition mb-2">
                            <FileX className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                            <div>
                                <strong className="block text-lg">Graphics & Charts</strong>
                                <p className="text-muted-foreground text-sm">
                                    Skill bars (e.g., "70% Java") are unreadable to most bots. They see an image, not data.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition mb-2">
                            <FileX className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                            <div>
                                <strong className="block text-lg">Headers & Footers</strong>
                                <p className="text-muted-foreground text-sm">
                                    Some older ATS systems actutally ignore information placed in the header/footer regions of a Word doc.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition mb-2">
                            <FileX className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                            <div>
                                <strong className="block text-lg">Multi-Column Layouts</strong>
                                <p className="text-muted-foreground text-sm">
                                    Complex columns can cause the parser to read text across the page instead of down, mixing up your work history.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition mb-2">
                            <FileX className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                            <div>
                                <strong className="block text-lg">Keyword Stuffing</strong>
                                <p className="text-muted-foreground text-sm">
                                    Hiding keywords in white text is an old trick that now gets you flagged as spam by modern algorithms.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What JobFit Checks */}
                <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
                    <div className="container max-w-4xl">
                        <h2 className="text-3xl font-bold text-center mb-8">What JobFit Checks For</h2>
                        <div className="space-y-6">
                            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
                                Our tool goes beyond simple keyword counting. We analyze the semantic relevance of your experience to the job at hand.
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Hard Skills:</strong> Do you have the required technical capabilities?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Soft Skills:</strong> Are you demonstrating leadership and communication?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Job Titles:</strong> Does your history align with the target role?</span>
                                    </li>
                                </ul>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Formatting:</strong> Is the document structure machine-readable?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Metrics:</strong> Are you using numbers to quantify your impact?</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span><strong>Education:</strong> Is your degree listed in a standard format?</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What Does an ATS Score Mean? */}
                <section className="container max-w-4xl py-16 space-y-8">
                    <h2 className="text-3xl font-bold mb-6">What Does an ATS Resume Score Mean?</h2>
                    <div className="p-6 border rounded-xl bg-gradient-to-br from-background to-slate-50 dark:to-slate-900">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="shrink-0 text-center">
                                <div className="text-6xl font-bold text-primary mb-2">95</div>
                                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Target Score</span>
                            </div>
                            <div className="space-y-4">
                                <p className="text-muted-foreground">
                                    An ATS score is a probability indicator. It estimates how likely your resume is to pass the automated filter and be seen by a human recruiter.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                                        <strong>0-50: Critical Risk</strong><br />Likely rejection. Missing core requirements.
                                    </div>
                                    <div className="p-3 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
                                        <strong>50-80: Average</strong><br />May pass, but will be ranked lower than peers.
                                    </div>
                                    <div className="p-3 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                        <strong>80-100: Top Tier</strong><br />Highly relevant. Strong chance of interview.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 mt-6">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <p>
                            <strong>Note:</strong> No tool can guarantee a job offer. A high score means your resume is <em>readable</em> and <em>relevant</em>, removing the technical barriers to getting hired. The rest depends on your actual interview performance.
                        </p>
                    </div>

                    <div className="pt-8 text-center">
                        <Button size="lg" asChild className="h-14 px-8 text-lg">
                            <Link href="/builder/new">Check My ATS Resume Score</Link>
                        </Button>
                    </div>
                </section>

            </main>
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2025 JobFit.ai
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
