"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Github, 
  Linkedin, 
  FileDown, 
  GraduationCap,
  RefreshCw,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  score: number;
  targetRole: string;
  company: string | null;
  breakdown: {
    requiredSkills: number;
    preferredSkills: number;
    experience: number;
    responsibilities: number;
    keywords: number;
    education: number;
  };
  matchedSkillsCount: number;
  missingSkillsCount: number;
  matchedSkillsSample: string[];
  missingSkillsSample: string[];
  strengths: string[];
  freeRecommendations: string[];
  remainingScans: number;
  isLoggedIn: boolean;
  gatedFeatures: Record<string, {
    title: string;
    description: string;
    bulletsReadyCount?: number;
    locked: boolean;
  }>;
}

export function FreeScanFlow() {
  const [loading, setLoading] = useState(false);
  const [resumeMode, setResumeMode] = useState<"file" | "paste">("file");
  const [jdMode, setJdMode] = useState<"paste" | "url">("paste");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (resumeMode === "file" && !resumeFile) {
      setErrorMessage("Please select your resume file (PDF or DOCX).");
      return;
    }
    if (resumeMode === "paste" && !resumeText.trim()) {
      setErrorMessage("Please paste your resume content.");
      return;
    }
    if (jdMode === "paste" && !jobDescription.trim()) {
      setErrorMessage("Please paste the job description.");
      return;
    }
    if (jdMode === "url" && !jobUrl.trim()) {
      setErrorMessage("Please provide a job posting URL.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (resumeMode === "file" && resumeFile) {
        formData.append("resumeFile", resumeFile);
      } else {
        formData.append("resumeText", resumeText.trim());
      }

      if (jdMode === "paste") {
        formData.append("jobDescription", jobDescription.trim());
      } else {
        formData.append("jobUrl", jobUrl.trim());
      }

      const res = await fetch("/api/resume/scan-free", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ANON_QUOTA_EXHAUSTED") {
          setErrorMessage("You have used your 3 free scans. Please create a free account to unlock unlimited scans.");
          return;
        }
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      setScanResult(data);
      toast.success("Job Match Score calculated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to analyze resume. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setResumeFile(null);
    setResumeText("");
    setJobDescription("");
    setJobUrl("");
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!scanResult ? (
        <Card className="border-border/80 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center gap-2 self-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-1 text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Zero Signup Required • Instant Free Results
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Free ATS Resume & Job Match Scanner
            </CardTitle>
            <CardDescription className="text-sm sm:text-base max-w-xl mx-auto">
              Upload your resume and paste any target job description. Get your instant match score and priority improvements in seconds.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleScan} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                    {errorMessage.includes("free account") && (
                      <div className="mt-2">
                        <Button size="sm" asChild>
                          <Link href="/register">Create Free Account <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Resume Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <span className="flex h-5 w-5 rounded-full bg-primary/15 text-primary text-xs font-bold items-center justify-center">1</span>
                    Your Resume
                  </label>
                  <Tabs value={resumeMode} onValueChange={(v) => setResumeMode(v as "file" | "paste")}>
                    <TabsList className="h-8">
                      <TabsTrigger value="file" className="text-xs px-2.5 h-7">Upload PDF/DOCX</TabsTrigger>
                      <TabsTrigger value="paste" className="text-xs px-2.5 h-7">Paste Text</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {resumeMode === "file" ? (
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                    <input
                      type="file"
                      id="resume-upload-free"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) setResumeFile(files[0]);
                      }}
                    />
                    <label htmlFor="resume-upload-free" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      {resumeFile ? (
                        <div>
                          <p className="text-sm font-semibold text-foreground">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(0)} KB • Click to replace</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-foreground">Click to upload your resume</p>
                          <p className="text-xs text-muted-foreground">PDF or DOCX (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Paste the full text of your resume here..."
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="font-mono text-xs leading-relaxed"
                  />
                )}
              </div>

              {/* Step 2: Job Description Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <span className="flex h-5 w-5 rounded-full bg-primary/15 text-primary text-xs font-bold items-center justify-center">2</span>
                    Target Job Description
                  </label>
                  <Tabs value={jdMode} onValueChange={(v) => setJdMode(v as "paste" | "url")}>
                    <TabsList className="h-8">
                      <TabsTrigger value="paste" className="text-xs px-2.5 h-7">Paste Job Text</TabsTrigger>
                      <TabsTrigger value="url" className="text-xs px-2.5 h-7">Job URL</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {jdMode === "paste" ? (
                  <Textarea
                    placeholder="Paste the job description (requirements, qualifications, role overview)..."
                    rows={6}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="text-xs leading-relaxed"
                  />
                ) : (
                  <Input
                    type="url"
                    placeholder="https://www.linkedin.com/jobs/view/... or company career link"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>

              <Button type="submit" size="lg" disabled={loading} className="w-full h-12 text-base font-semibold shadow-md">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Scanning Resume & Calculating Match...
                  </>
                ) : (
                  <>
                    Scan Free & Get Match Score <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span>✓ 100% Free</span>
                <span>•</span>
                <span>✓ No credit card</span>
                <span>•</span>
                <span>✓ No account required</span>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Results View */
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Header Score Card */}
          <Card className="border-border/80 shadow-xl overflow-hidden bg-gradient-to-b from-card to-card/90">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b">
                <div className="text-center sm:text-left space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Target Role Analysis
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {scanResult.targetRole} {scanResult.company ? `at ${scanResult.company}` : ""}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Multi-factor evaluation based on technical requirements, duration, and keyword density.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border">
                  <div className="text-center">
                    <div className={`text-4xl sm:text-5xl font-extrabold ${
                      scanResult.score >= 80 ? "text-emerald-500" :
                      scanResult.score >= 60 ? "text-amber-500" : "text-rose-500"
                    }`}>
                      {scanResult.score}%
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {scanResult.score >= 80 ? "Strong Alignment" :
                       scanResult.score >= 60 ? "Moderate Alignment" : "Needs Improvement"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-6 text-center">
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Req Skills</div>
                  <div className="text-base font-bold">{scanResult.breakdown.requiredSkills}%</div>
                </div>
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Keywords</div>
                  <div className="text-base font-bold">{scanResult.breakdown.keywords}%</div>
                </div>
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className="text-base font-bold">{scanResult.breakdown.experience}%</div>
                </div>
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Preferred</div>
                  <div className="text-base font-bold">{scanResult.breakdown.preferredSkills}%</div>
                </div>
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Role Duties</div>
                  <div className="text-base font-bold">{scanResult.breakdown.responsibilities}%</div>
                </div>
                <div className="p-2.5 rounded-xl border bg-background space-y-1">
                  <div className="text-xs text-muted-foreground">Education</div>
                  <div className="text-base font-bold">{scanResult.breakdown.education}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FREE BENEFIT: 2-3 Concrete Improvement Suggestions */}
          <Card className="border-emerald-500/30 bg-emerald-500/[0.02] shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold">
                      Free Instant Recommendations
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Apply these priority fixes immediately to increase your ATS match score
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300">
                  Included Free
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanResult.freeRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-background border shadow-xs">
                  <span className="flex h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0 items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                    {rec}
                  </p>
                </div>
              ))}

              {scanResult.missingSkillsSample && scanResult.missingSkillsSample.length > 0 && (
                <div className="pt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Top Missing Skills: </span>
                  {scanResult.missingSkillsSample.map((s, i) => (
                    <span key={i} className="inline-block bg-muted px-2 py-0.5 rounded mr-1.5 my-1 text-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GATED DEEP FEATURES: Behind Free Signup */}
          <Card className="border-border/80 shadow-lg bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold">
                      Unlock Full Resume Rewrite & Professional Tools
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Create a free JobFit account to unlock the full AI builder and export your optimized resume
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  Free Account
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-2 opacity-90 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Google X-Y-Z Bullet Rewrite
                    </div>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI transforms all your bullet points into quantifiable metrics ("Accomplished [X], measured by [Y], by doing [Z]").
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Ready to generate
                  </span>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-2 opacity-90 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <FileDown className="h-4 w-4 text-blue-500" />
                      Machine-Readable Vector PDF
                    </div>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Clean single-column vector layout built with standard typography to pass corporate applicant tracking parsers.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    1-Click PDF Export
                  </span>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-2 opacity-90 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Github className="h-4 w-4 text-foreground" />
                      GitHub & LinkedIn Technical Audit
                    </div>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Audits your public repositories and LinkedIn headline keyword discoverability for technical recruiters.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                    Candidate Profiler
                  </span>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-2 opacity-90 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <GraduationCap className="h-4 w-4 text-violet-500" />
                      Free Skill Gap Roadmaps
                    </div>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Personalized learning roadmap with verified documentation and capstones for every missing technology.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                    100% Free Resources
                  </span>
                </div>
              </div>

              {/* Call to action */}
              <div className="p-6 rounded-2xl bg-primary text-primary-foreground flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 shadow-md">
                <div>
                  <h4 className="font-bold text-lg">Ready to tailor your resume and download?</h4>
                  <p className="text-xs text-primary-foreground/85">
                    Sign up free in 30 seconds. Includes 3 full free optimization credits.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto font-bold shadow">
                    <Link href="/register">
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Scan Another Resume
            </Button>
            <p className="text-xs text-muted-foreground">
              {scanResult.remainingScans > 0 
                ? `${scanResult.remainingScans} free scans remaining`
                : "Free scans exhausted. Sign up to continue."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
