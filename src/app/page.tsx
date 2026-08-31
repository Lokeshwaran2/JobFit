import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, FileText, Sparkles, Upload, AlertTriangle, ShieldCheck, BarChart, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

import { auth } from "@/auth";
import { UserAccountNav } from "@/components/user-account-nav";
import { PricingSection } from "@/components/pricing-section";

export const metadata = {
  title: "ATS Resume Builder | Resume Based on Job Description – JobFit",
  description: "Generate an ATS-optimized resume based on any job description. Improve your resume match score instantly and apply with confidence.",
  openGraph: {
    title: "ATS Resume Builder – JobFit",
    description: "Tailor your resume to any job description and improve ATS score instantly.",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this ATS safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, 100%. We use standard PDF formats and text-based layouts that are fully compatible with all major Applicant Tracking Systems (ATS) like Workday, Taleo, and Greenhouse."
        }
      },
      {
        "@type": "Question",
        "name": "Is JobFit free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can try JobFit for free. We offer a 'Check Your Fit' plan that gives you an ATS score and insights. For downloads and full rewrites, we have affordable plans starting at ₹99/month."
        }
      },
      {
        "@type": "Question",
        "name": "How accurate is ATS score?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our scoring engine mimics real ATS algorithms. It checks for keyword matching, formatting issues, and section ordering. A 95+ score on JobFit is highly likely to pass corporate screening tools."
        }
      },
      {
        "@type": "Question",
        "name": "Can I download PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Once optimized, you can download your resume as a perfectly formatted PDF. The 'Job Hunt Mode' plan allows unlimited downloads."
        }
      }
    ]
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="JobFit" className="h-8 w-8" />
              <span>JobFit</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserAccountNav />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:underline">
                  Login
                </Link>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">

        {/* H1: Hero Section */}
        <section className="relative space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 overflow-hidden">
          {/* Background Gradient/Grid */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
          </div>

          <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4 relative">
            <div className="rounded-full border bg-white/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium shadow-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-1000">
              <span className="mr-1">🏆</span> #1 Rated by Job Seekers
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-gray-400">
                ATS Resume Builder
              </span>
              <br className="hidden md:block" />
              {" "}
              <span className="text-foreground">Based on Job Description</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
              Don't let a bot reject your hard work. Create a resume that mirrors the job description and passes the <span className="font-semibold text-foreground">Applicant Tracking System (ATS)</span> every time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
              <Button size="lg" asChild className="h-12 px-8 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <Link href={dbUser ? ((dbUser.credits > 0 || dbUser.isPro) ? "/builder/new" : "/subscription") : "/dashboard"}>
                  Generate ATS Resume Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-8 text-lg bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all">
                <Link href="#steps">How it Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* H2: What is an ATS and Why Resumes Fail */}
        <section className="container mx-auto max-w-5xl px-4 md:px-0 space-y-8">
          <div className="bg-slate-50 border py-12 px-6 md:px-12 dark:bg-transparent rounded-2xl shadow-sm space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">
                What is an ATS and Why Do Resumes Fail?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                An Applicant Tracking System (ATS) is software used by 99% of Fortune 500 companies to filter candidates. It acts as a gatekeeper, scanning your resume for specific keywords, formatting, and relevance before a human ever sees it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-500" /> Why You Get Rejected
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Missing Keywords:</strong> If the JD says "Project Management" and you write "Led Projects", you might lose points.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Complex Formatting:</strong> Columns, tables, and icons confuse older parsers.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Generic Content:</strong> Sending the same document to every company signals a lack of specific interest.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" /> How JobFit Fixes It
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Contextual Matching:</strong> We inject exact phrases from the job description naturally into your experience.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Clean Layouts:</strong> Our templates are single-column text-based designs known to be 100% parsable.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-2 shrink-0"></div>
                    <span><strong className="text-foreground">Tailored Narratives:</strong> We rewrite your achievements to prove you are the perfect fit for <em>this</em> specific role.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* H2: How JobFit Works */}
        <section id="steps" className="container mx-auto py-12 lg:py-24 space-y-12 px-4">
          <div className="text-center space-y-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              How JobFit Works: 3 Steps to Hired
            </h2>
            <p className="max-w-[85%] mx-auto text-lg text-muted-foreground">
              Our AI-powered process takes the guesswork out of job applications.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center p-6 border-none shadow-md">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Upload Resume</h3>
              <p className="text-muted-foreground">
                Upload your existing PDF or DOCX. We extract your skills, history, and education into our secure system.
              </p>
            </Card>
            <Card className="text-center p-6 border-none shadow-md">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Paste Job Description</h3>
              <p className="text-muted-foreground">
                Copy the full job description from the job board. This tells us exactly what the employer wants.
              </p>
            </Card>
            <Card className="text-center p-6 border-none shadow-md">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Optimize & Download</h3>
              <p className="text-muted-foreground">
                Our algorithm rewrites your points, adds keywords, and hands you a 95+ scoring resume PDF.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" asChild className="mt-8">
              <Link href="/register">Generate ATS Resume Free</Link>
            </Button>
          </div>
        </section>

        {/* H2: ATS Match Score Explained */}
        <section className="container mx-auto px-4 md:px-0">
          <div className="space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 rounded-lg">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold">
                ATS Match Score Explained
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Most companies require a match score of at least 80% to be considered for an interview.
              </p>
              <div className="bg-background rounded-lg border p-8 w-full max-w-3xl shadow-sm mt-8">
                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-500 mb-2">30%</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Standard Resume</div>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[150px] mx-auto">Generic, unoptimized, and likely ignored.</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-500 mb-2">95%+</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">JobFit Score</div>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[150px] mx-auto">Highly relevant, keyword-rich, and tailored.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H2: Why JobFit is Better than Generic Builders */}
        <section className="container mx-auto py-12 lg:py-24 px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Why JobFit is Better than Generic Builders
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Templates like Canva or basic text editors focus on design. We focus on <strong>data</strong>. An ATS doesn't care if your resume is pretty; it cares if it's readable.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                JobFit is engineered for the machine first, ensuring you get past the filter so a human can appreciate your skills.
              </p>
              <Button size="lg" asChild>
                <Link href="/register">Generate ATS Resume Free</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 border rounded-lg shadow-sm bg-background">
                <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Parsing Guarantee</h3>
                  <p className="text-muted-foreground text-sm">Our formats are verified to parse correctly on major platforms.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border rounded-lg shadow-sm bg-background">
                <BarChart className="h-10 w-10 text-blue-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Live Feedback</h3>
                  <p className="text-muted-foreground text-sm">See your score increase in real-time as you optimize sections.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border rounded-lg shadow-sm bg-background">
                <Sparkles className="h-10 w-10 text-yellow-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">AI-Powered Logic</h3>
                  <p className="text-muted-foreground text-sm">We don't just prompt; we analyze semantic relevance between words.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H2: Frequently Asked Questions */}
        <section className="container mx-auto px-4 md:px-0">
          <div className="space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 rounded-lg">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold">
                Frequently Asked Questions
              </h2>
              <div className="w-full max-w-3xl text-left space-y-4 mt-8">
                <details className="group border rounded-lg bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-lg">
                    <span className="font-semibold">Is this ATS safe?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0 transition duration-300 group-open:-rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
                    Yes, 100%. We use standard PDF formats and text-based layouts that are fully compatible with all major Applicant Tracking Systems (ATS) like Workday, Taleo, and Greenhouse.
                  </p>
                </details>
                <details className="group border rounded-lg bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-lg">
                    <span className="font-semibold">Is JobFit free?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0 transition duration-300 group-open:-rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
                    Yes, you can try JobFit for free. We offer a "Check Your Fit" plan that gives you an ATS score and insights. For downloads and full rewrites, we have affordable plans starting at ₹99/month.
                  </p>
                </details>
                <details className="group border rounded-lg bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-lg">
                    <span className="font-semibold">How accurate is ATS score?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0 transition duration-300 group-open:-rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
                    Our scoring engine mimics real ATS algorithms. It checks for keyword matching, formatting issues, and section ordering. A 95+ score on JobFit is highly likely to pass corporate screening tools.
                  </p>
                </details>
                <details className="group border rounded-lg bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-lg">
                    <span className="font-semibold">Can I download the resume?</span>
                    <span className="shrink-0 rounded-full bg-white p-1.5 text-gray-900 sm:p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0 transition duration-300 group-open:-rotate-180" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">
                    Yes! Once optimized, you can download your resume as a perfectly formatted PDF. The "Job Hunt Mode" plan allows unlimited downloads.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <PricingSection
          userId={session?.user?.id || ""}
          isPro={false} // Will fetch from DB later
          credits={3}   // Will fetch from DB later
        />
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2026 JobFit
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:underline hover:text-foreground">Terms</Link>
            <Link href="/refund" className="hover:underline hover:text-foreground">Refunds</Link>
            <Link href="/contact" className="hover:underline hover:text-foreground">Contact</Link>
            <Link href="/resume-for" className="hover:underline hover:text-foreground">Resume Guides</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
