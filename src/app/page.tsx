import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  FileCheck, 
  Target, 
  Upload, 
  ShieldCheck, 
  BarChart, 
  XCircle,
  Github,
  Linkedin,
  GraduationCap,
  Cpu,
  Layers,
  Zap,
  Code2,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserAccountNav } from "@/components/user-account-nav";
import { PricingSection } from "@/components/pricing-section";

export const metadata = {
  title: "ATS Resume Builder | Resume Based on Job Description – JobFit",
  description: "Generate an ATS-optimized resume based on any job description. Audit your GitHub & LinkedIn profiles, close skill gaps with free roadmaps, and apply with confidence.",
  openGraph: {
    title: "ATS Resume Builder & Candidate Profiler – JobFit",
    description: "Tailor your resume to any job description, audit your profiles, and improve job match alignment instantly.",
    url: "https://jobfit.co.in",
    type: "website",
  },
};

export default async function Home() {
  const session = await auth();

  let dbUser = null;
  if (session?.user?.id) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isPro: true, credits: true }
      });
    } catch (error) {
      console.error("Database user fetch error:", error);
    }
  }

  const newResumeHref = dbUser
    ? ((dbUser.credits > 0 || dbUser.isPro) ? "/builder/new" : "/subscription")
    : (session?.user ? "/dashboard" : "/register");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this ATS safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use standard single-column text layouts and machine-readable vector PDFs designed to avoid common parsing issues like multi-column tables, text boxes, and complex graphics."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Multi-Factor Job Match Score?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike primitive keyword counters, JobFit evaluates your resume against the target job across key dimensions: Role Alignment, Keyword Coverage, Quantified Impact, Action Verbs, Skill Synonyms, Tools Section, Tech Stack Recency, Core Competencies, and Section Structure."
        }
      },
      {
        "@type": "Question",
        "name": "How does the GitHub and LinkedIn Profile Audit work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recruiters verify candidates beyond the resume. JobFit audits your public GitHub repositories, commit activity, and tech stack match against the job description, while analyzing your LinkedIn headline and skill endorsements for maximum recruiter discoverability."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Autonomous Skill Learning Engine?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "As you tailor resumes for different jobs, JobFit tracks recurring missing skills. It then generates personalized, level-aware learning paths with verified free official documentation, interactive sandbox exercises, and capstone projects to fill those gaps."
        }
      },
      {
        "@type": "Question",
        "name": "Is JobFit free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can try JobFit for free. Every account gets free credits to calculate job match scores, identify missing skills, and audit candidate profiles. For full AI bullet rewrites and unlimited PDF downloads, plans start at ₹99/month."
        }
      },
      {
        "@type": "Question",
        "name": "Can I download the resume as a PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Once optimized in our side-by-side interactive editor, you can download your resume as a clean, machine-readable PDF ready for corporate job portals."
        }
      }
    ]
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/15">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Modern, Clean Header (Preserving Original Structure & Dimensions) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-center transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="JobFit" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight">JobFit</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#steps" className="hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="#scoring" className="hover:text-foreground transition-colors">
              Job Match Score
            </Link>
            <Link href="#profiler" className="hover:text-foreground transition-colors">
              Candidate Profiler
            </Link>
            <Link href="#learning" className="hover:text-foreground transition-colors">
              Skill Roadmaps
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="h-9">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    <span>Dashboard</span>
                    {dbUser && (
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {dbUser.isPro ? "PRO" : `${dbUser.credits} cr`}
                      </span>
                    )}
                  </Link>
                </Button>
                <UserAccountNav />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Button asChild size="sm" className="h-9 px-4 shadow-xs">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION (Preserving Background Grid & Fuchsia Glow with Modern Polish) */}
        <section className="relative space-y-6 pb-12 pt-8 md:pb-16 md:pt-14 lg:py-28 overflow-hidden">
          {/* Background Gradient/Grid */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_28px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[340px] w-[340px] rounded-full bg-fuchsia-400/25 opacity-25 blur-[120px]"></div>
            <div className="absolute left-1/3 top-20 -z-10 h-[220px] w-[220px] rounded-full bg-blue-400/20 opacity-20 blur-[100px]"></div>
          </div>

          <div className="container mx-auto flex max-w-[66rem] flex-col items-center gap-5 text-center px-4 relative">
            {/* Pill Badge with Active Pulse */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-medium shadow-xs text-foreground/80 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Resume & Job Alignment Engine</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-primary font-semibold">Multi-Factor Match</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-[1.1]">
              <span className="bg-gradient-to-r from-gray-950 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-400">
                ATS Resume Builder
              </span>
              <br className="hidden md:block" />
              {" "}
              <span className="text-foreground">Based on Job Description</span>
            </h1>

            {/* Sub-headline */}
            <p className="max-w-[46rem] leading-normal text-muted-foreground sm:text-lg md:text-xl sm:leading-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              See how closely your resume matches the job. Tailor your experience with <span className="font-semibold text-foreground">evidence-based impact</span>, audit your <span className="font-semibold text-foreground">GitHub & LinkedIn profiles</span>, and improve <span className="font-semibold text-foreground">ATS parsing readiness & keyword alignment</span>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-center pt-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full sm:w-auto">
              <Button size="lg" asChild className="h-12 px-8 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto">
                <Link href={newResumeHref}>
                  Tailor Your Resume Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-7 text-base font-medium bg-background/60 backdrop-blur-sm hover:bg-muted/60 transition-all w-full sm:w-auto">
                <Link href="#steps">How it Works</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 3 Free Scans Included
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Clean ATS-Friendly Structure
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No Credit Card Required
              </span>
            </div>

            {/* HERO VISUAL PREVIEW CARD: Live ATS Score Preview Mockup */}
            <div className="w-full max-w-3xl mt-6 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/90 p-5 sm:p-6 shadow-xl text-left space-y-4 backdrop-blur-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Role Analysis
                  </span>
                  <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    Senior Software Engineer
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Computed Match:</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    94% Job Match Score
                  </span>
                </div>
              </div>

              {/* Bullet transformation snippet */}
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/[0.03] space-y-1.5">
                  <div className="flex items-center justify-between text-red-600 dark:text-red-400 font-semibold">
                    <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Before (Generic Bullet)</span>
                    <span className="text-[10px] bg-red-100 dark:bg-red-950 px-1.5 py-0.2 rounded">Score: 42%</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11.5px]">
                    "Worked on frontend checkout forms and backend payment processing using React, Node.js and database queries. Improved latency."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> After (Google X-Y-Z Optimized)</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">Score: 98%</span>
                  </div>
                  <p className="text-foreground leading-relaxed text-[11.5px]">
                    "Architected high-throughput Next.js payment service with Redis caching, <strong className="text-emerald-600 dark:text-emerald-400">reducing checkout latency by 42%</strong> and processing $2.4M monthly volume."
                  </p>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">✓ Multi-Factor Aligned</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">✓ Exact Synonyms Added</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">✓ GitHub Code Verified</span>
                </div>
                <Link href={newResumeHref} className="text-primary font-semibold hover:underline flex items-center gap-1">
                  Try on your resume <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: What is an ATS and Why Resumes Fail (Enhanced with Clean Color Tint Cards) */}
        <section className="container mx-auto max-w-5xl px-4 md:px-0 space-y-8">
          <div className="bg-slate-50/80 border py-12 px-6 md:px-12 dark:bg-card/40 rounded-2xl shadow-xs space-y-8">
            <div className="text-center space-y-3">
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                How Do Applicant Tracking Systems Screen Resumes?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Applicant Tracking Systems (ATS) are software tools used by employers to organize, index, and search candidate resumes. They scan documents to identify relevant skills, role keywords, and qualifications so recruiters can prioritize applications for review.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Failure Side */}
              <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/[0.02] dark:bg-red-950/10 space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <XCircle className="h-4 w-4" />
                  </div>
                  Why Resumes Get Overlooked
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Unclear Experience:</strong> Stating generic duties without clear actions, methodology, or outcomes makes it harder for recruiters and parsers to evaluate your impact.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Missing Keyword Synonyms:</strong> If the JD asks for "PostgreSQL" and you wrote "Relational DB", automated filters mark a deficit.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Parsing Traps:</strong> Multi-column graphics, text boxes, and table designs from Canva break parser readers.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Unverified Digital Claims:</strong> Recruiters check GitHub and LinkedIn; if your actual code or endorsements don't match, applications stall.</span>
                  </li>
                </ul>
              </div>

              {/* Fix Side */}
              <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-950/10 space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  How JobFit Fixes It
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Google X-Y-Z Standard:</strong> Rewrites experience into "Accomplished [X], measured by [Y], by doing [Z]" with measurable business outcomes.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Top 20 Keyword Weaving:</strong> Automatically extracts high-weight JD keywords and embeds them naturally into your bullets.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Machine-Readable Vector PDF:</strong> Exports clean single-column layouts engineered with @react-pdf/renderer designed for reliable text extraction.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Candidate Profiler Verification:</strong> Correlates your claims against GitHub code repositories and LinkedIn searchability.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: How JobFit Works: 4 Steps (Modern Card Lift + Number Badges) */}
        <section id="steps" className="container mx-auto py-12 lg:py-24 space-y-12 px-4 max-w-5xl">
          <div className="text-center space-y-3">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
              How JobFit Works: Complete Application Intelligence
            </h2>
            <p className="max-w-[85%] mx-auto text-base sm:text-lg text-muted-foreground">
              From targeted resume tailoring to candidate profile audits and personalized skill gap roadmaps.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 border bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">01</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Upload Resume</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Upload your existing PDF or DOCX. We parse your skills, history, and education into a structured candidate model.
              </p>
            </Card>

            <Card className="p-6 border bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">02</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Match Job Post</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Paste the target job description. We extract top 20 keywords, required technologies, and seniority requirements.
              </p>
            </Card>

            <Card className="p-6 border bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">03</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Audit Profiles</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Scan your public GitHub repos for code proof and audit your LinkedIn headline for recruiter keyword discoverability.
              </p>
            </Card>

            <Card className="p-6 border bg-card hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600">
                  <FileCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">04</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Optimize & Export</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                AI rewrites bullets with Google X-Y-Z metrics, closes skill gaps with free roadmaps, and exports clean PDF.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" asChild className="shadow-sm">
              <Link href={newResumeHref}>Check Your Job Match Free</Link>
            </Button>
          </div>
        </section>

        {/* SECTION 3: ATS Match Score Explained (High-Tech Dashboard Score Transformation) */}
        <section id="scoring" className="container mx-auto px-4 md:px-0">
          <div className="space-y-6 bg-slate-50/80 py-10 dark:bg-card/40 md:py-16 rounded-2xl border max-w-5xl mx-auto">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-3 text-center px-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Target className="h-3.5 w-3.5 text-primary" /> Algorithmic Benchmark
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Multi-Dimension Job Match Score Explained
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg">
                See how closely your resume aligns with job requirements, discover missing skills, and strengthen keyword coverage before applying.
              </p>

              {/* Modern Transformation Card */}
              <div className="bg-background rounded-2xl border border-border/80 p-6 sm:p-8 w-full max-w-3xl shadow-sm mt-6">
                <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                  {/* Before Score */}
                  <div className="text-center p-4 rounded-xl border border-red-500/20 bg-red-500/[0.02] w-full md:w-auto">
                    <div className="text-5xl font-extrabold text-red-500 mb-1">30%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Standard Resume</div>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[170px] mx-auto">
                      Generic wording, unquantified bullets, and missing target keywords.
                    </p>
                  </div>

                  {/* High-Tech Center Connector */}
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Cpu className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">JobFit Engine</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
                  </div>

                  {/* After Score */}
                  <div className="text-center p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] w-full md:w-auto shadow-xs">
                    <div className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">92%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">JobFit Optimized</div>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[170px] mx-auto">
                      Google X-Y-Z metrics, exact role title, and top 20 keywords.
                    </p>
                  </div>
                </div>

                {/* 10 Dimensions Pills */}
                <div className="mt-8 pt-6 border-t border-border/70 text-left space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Evaluated Across Key Job Alignment Dimensions:</span>
                    <span className="text-muted-foreground hidden sm:inline">Parsing Ready</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Target Title Match</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Top 20 Keywords</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Google X-Y-Z Metrics</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Action Verbs</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Skill Synonyms</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Dedicated Tools</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Tech Stack Recency</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Soft Competencies</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Location Alignment</div>
                    <div className="p-2 rounded-lg bg-muted/60 hover:bg-muted font-medium text-center transition-colors">Standard Hierarchy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: GitHub & LinkedIn Candidate Profiler (Modern Cards with Visual Score Indicators) */}
        <section id="profiler" className="container mx-auto py-12 lg:py-24 px-4 max-w-5xl">
          <div className="bg-slate-50/80 border py-12 px-6 md:px-12 dark:bg-card/40 rounded-2xl shadow-xs space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Code2 className="h-3.5 w-3.5 text-purple-600" /> Multi-Platform Verification
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                Recruiters Don't Stop at Resumes. They Audit Your Profiles.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                80% of hiring teams inspect your GitHub and LinkedIn presence before scheduling an interview. JobFit evaluates all three platforms against the target role.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* GitHub Card */}
              <div className="bg-background p-6 rounded-xl border shadow-xs space-y-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-foreground/5 text-foreground">
                      <Github className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">GitHub Technical Audit</h3>
                      <p className="text-xs text-muted-foreground">Code proof & commit velocity</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                    88/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Validates whether you have real code proof matching the technologies demanded in the job description, analyzing repository languages, commit frequency, and documentation quality.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ Repos Analyzed</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ Commits Validated</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ Star Count Verified</span>
                </div>
              </div>

              {/* LinkedIn Card */}
              <div className="bg-background p-6 rounded-xl border shadow-xs space-y-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600">
                      <Linkedin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">LinkedIn Presence Audit</h3>
                      <p className="text-xs text-muted-foreground">Headline & keyword searchability</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                    92/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Analyzes your headline keyword density, role relevance, and endorsed skills so recruiters actively searching for your target role find and shortlist your profile first.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ Headline Matched</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ Skills Endorsed</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">✓ SEO Search Ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Recurring Skill Gaps & Autonomous Learning (Modern Split Cards) */}
        <section id="learning" className="container mx-auto py-12 lg:py-24 px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <GraduationCap className="h-3.5 w-3.5 text-violet-600" /> Continuous Career Growth
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                Turn Missing Skills into Interview Strengths
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                As you tailor resumes for multiple job applications, JobFit's <strong>Skill Gap Tracker</strong> automatically identifies technologies that repeatedly show up as requirements.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Our <strong>Autonomous Learning Engine</strong> instantly generates personalized, level-adapted roadmaps with 100% verified free official documentation, interactive sandboxes, and capstone projects.
              </p>
              <Button size="lg" asChild className="shadow-sm">
                <Link href={newResumeHref}>Track Your Skill Gaps Free</Link>
              </Button>
            </div>

            <div className="space-y-3.5">
              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cross-Job Gap Tracker</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                    Aggregates missing skills across all job applications and ranks them by hiring market demand.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">100% Free Verified Resources</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                    Curated official documentation, interactive browser sandboxes, and verified courses for Docker, Postgres, React, and Kafka.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Hands-on Capstones</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                    Build practical project deliverables to commit to GitHub and turn gaps into verified portfolio proof.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Why JobFit is Better than Generic Builders */}
        <section className="container mx-auto py-12 lg:py-24 px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                Why JobFit is Better than Generic Builders
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-5 leading-relaxed">
                Templates like Canva or basic text editors focus on design. We focus on <strong>data</strong>. An ATS doesn't care if your resume is colorful; it cares if it's readable, keyword-dense, and quantified.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                JobFit ensures your resume is structured for reliable machine parsing and clearly highlights relevant skills so hiring teams can easily assess your qualifications.
              </p>
              <Button size="lg" asChild className="shadow-sm">
                <Link href={newResumeHref}>Tailor Your Resume Free</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">ATS Parsing Readiness</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Clean single-column vector PDF formatting designed for machine readability across recruitment portals without layout corruption.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <BarChart className="h-10 w-10 text-blue-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Live Match Feedback</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">See your score increase in real-time as you optimize sections and add missing keywords.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border rounded-xl shadow-xs bg-background hover:border-primary/40 transition-colors">
                <Target className="h-10 w-10 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Semantic Matching Engine</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Deep keyword relevance, skills gap detection, and Google X-Y-Z bullet rewrites.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: Frequently Asked Questions (Polished Modern Accordion Details) */}
        <section className="container mx-auto px-4 md:px-0 max-w-5xl">
          <div className="space-y-6 bg-slate-50/80 py-10 dark:bg-card/40 md:py-16 rounded-2xl border">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center px-4">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
              <div className="w-full max-w-3xl text-left space-y-3.5 mt-8">
                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">Is this ATS safe?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    We use clean single-column text layouts and machine-readable vector PDFs designed to avoid common parsing issues like multi-column tables, text boxes, and complex graphics.
                  </p>
                </details>

                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">How does the Job Match Score work?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    JobFit analyzes how closely your resume matches the job description requirements. It evaluates keyword overlap, role alignment, action verbs, technical tools, and structural readability to give you evidence-based feedback on where your application is strong and what can be improved.
                  </p>
                </details>

                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">How does GitHub and LinkedIn profile scoring work?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    Recruiters verify technical candidates on GitHub and LinkedIn. JobFit scans your public GitHub repos, languages, and commit activity to verify technical proof, while auditing your LinkedIn headline and skill endorsements for maximum recruiter discoverability.
                  </p>
                </details>

                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">What is the Autonomous Skill Learning Engine?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    When you apply to multiple jobs, JobFit tracks missing skills that repeatedly appear across job descriptions. It then generates tailored, level-adapted roadmaps with 100% verified free resources (official documentation, interactive sandboxes) and practical capstones to turn weaknesses into strengths.
                  </p>
                </details>

                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">Is JobFit free?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    Yes, you can try JobFit for free. Every account gets free credits to calculate job match scores, identify missing skills, and audit candidate profiles. For full AI bullet rewrites and unlimited PDF downloads, affordable plans start at ₹99/month.
                  </p>
                </details>

                <details className="group border rounded-xl bg-background p-4.5 [&_summary::-webkit-details-marker]:hidden hover:border-primary/40 transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-base sm:text-lg">
                    <span className="font-semibold">Can I download the resume?</span>
                    <span className="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground sm:p-2 group-open:-rotate-180 transition duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-sm sm:text-base text-muted-foreground">
                    Yes! Once optimized in our side-by-side builder, you can download your resume as a clean, machine-readable PDF formatted for easy applicant tracking system parsing. The "Job Hunt Mode" plan allows unlimited downloads.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Connected with real DB user credits & Pro status) */}
        <PricingSection
          userId={session?.user?.id || ""}
          isPro={dbUser?.isPro || false}
          credits={dbUser?.credits ?? 3}
        />
      </main>

      {/* Footer (Preserving Original Clean Layout with Polished Links) */}
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 max-w-5xl">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} JobFit
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:underline hover:text-foreground transition-colors">Terms</Link>
            <Link href="/refund" className="hover:underline hover:text-foreground transition-colors">Refunds</Link>
            <Link href="/contact" className="hover:underline hover:text-foreground transition-colors">Contact</Link>
            <Link href="/resume-for" className="hover:underline hover:text-foreground transition-colors">Resume Guides</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
