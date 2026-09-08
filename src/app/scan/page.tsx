import Link from "next/link";
import { FreeScanFlow } from "@/components/free-scan-flow";
import { ArrowLeft, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export const metadata = {
  title: "Free Instant Resume & Job Match Scanner | JobFit",
  description: "Scan your resume against any job description for free with zero signup required. Get your ATS match score and 2-3 concrete improvement recommendations instantly.",
  openGraph: {
    title: "Free Resume Job Match Scanner | JobFit",
    description: "Scan your resume against any job description with zero signup required.",
    url: "https://jobfit.co.in/scan",
    type: "website",
  },
};

export default async function FreeScanPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/15">
      {/* Header */}
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

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">Sign Up Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Scanner Section */}
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Free Scanner</span>
        </div>

        <FreeScanFlow />

        {/* Diagnostic reassurance */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4 text-center border-t pt-8 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5 p-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-foreground">100% Privacy Protected</span>
            <p>Your resume text is parsed in memory and not stored until you create an account.</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Deterministic Multi-Factor Scoring</span>
            <p>Scores required skills, keywords, experience duration, and functional role alignment.</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-foreground">Actionable Recommendations</span>
            <p>Clear, specific steps to adjust bullet points and terminology for your target role.</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} JobFit • ATS Resume Alignment & Profiler</p>
      </footer>
    </div>
  );
}
