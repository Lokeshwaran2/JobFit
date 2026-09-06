"use client";

import { useState } from "react";
import { 
  FileText, 
  Github, 
  Linkedin, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"ats" | "profile" | "matrix" | "learning">("ats");
  const [bulletMode, setBulletMode] = useState<"after" | "before">("after");

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Tab Navigation Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-muted/80 backdrop-blur-md rounded-2xl border mb-6 shadow-inner">
        <button
          onClick={() => setActiveTab("ats")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === "ats"
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <span>10-Factor ATS Rewriter</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <div className="flex items-center gap-1">
            <Github className="h-3.5 w-3.5 text-foreground" />
            <Linkedin className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span>Candidate Profiler</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === "matrix"
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Layers className="h-4 w-4 text-emerald-500" />
          <span>Unified Match Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("learning")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === "learning"
              ? "bg-background text-foreground shadow-sm font-semibold ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <GraduationCap className="h-4 w-4 text-violet-500" />
          <span>Autonomous Learning Engine</span>
        </button>
      </div>

      {/* Showcase Card Display Container */}
      <Card className="border-border/60 shadow-xl overflow-hidden bg-gradient-to-b from-card to-card/90">
        <CardContent className="p-4 sm:p-8">
          {/* TAB 1: 10-Factor ATS Resume Rewriter */}
          {activeTab === "ats" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200">
                      Target Role: Senior Full-Stack Engineer
                    </Badge>
                    <span className="text-xs text-muted-foreground">Scored Against Fortune 500 JD</span>
                  </div>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    Google X-Y-Z Achievement Transformation
                  </h3>
                </div>

                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setBulletMode("before")}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      bulletMode === "before"
                        ? "bg-red-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Raw Candidate Bullet
                  </button>
                  <button
                    onClick={() => setBulletMode("after")}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      bulletMode === "after"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    JobFit ATS Optimized ✨
                  </button>
                </div>
              </div>

              {/* Bullet Comparison Display */}
              <div className="grid md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-8 space-y-4">
                  <div
                    className={`p-5 rounded-xl border transition-all ${
                      bulletMode === "after"
                        ? "bg-emerald-500/5 border-emerald-500/30 text-foreground shadow-xs"
                        : "bg-red-500/5 border-red-500/30 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                        {bulletMode === "after" ? "Rewritten Experience Impact" : "Original Unoptimized Experience"}
                      </span>
                      {bulletMode === "after" ? (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Passes 10/10 ATS Filters
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> 74% Risk of Auto-Rejection
                        </span>
                      )}
                    </div>

                    <p className="text-base sm:text-lg leading-relaxed font-normal">
                      {bulletMode === "after" ? (
                        <>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            "Architected high-throughput Next.js & TypeScript payment service
                          </span>{" "}
                          integrating Redis caching and PostgreSQL,{" "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            slashing p99 checkout latency by 42% and processing $2.4M in peak monthly transactions
                          </span>{" "}
                          with 99.99% uptime."
                        </>
                      ) : (
                        `"Worked on frontend checkout forms and backend payment processing using React, Node.js and database queries. Improved latency and fixed bug issues with the payment team."`
                      )}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-muted-foreground">Detected Key Signals:</span>
                      {bulletMode === "after" ? (
                        <>
                          <Badge variant="secondary" className="text-xs font-normal">Next.js</Badge>
                          <Badge variant="secondary" className="text-xs font-normal">TypeScript</Badge>
                          <Badge variant="secondary" className="text-xs font-normal">PostgreSQL</Badge>
                          <Badge variant="secondary" className="text-xs font-normal">Redis</Badge>
                          <Badge variant="secondary" className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                            Metric: 42% latency cut
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                            Volume: $2.4M/mo
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-red-500 font-medium">❌ Missing Quantified Outcome</span>
                          <span className="text-xs text-red-500 font-medium">❌ Passive Verbs ("Worked on")</span>
                          <span className="text-xs text-red-500 font-medium">❌ Vague Stack Terms</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Target className="h-3.5 w-3.5 text-primary" /> Why this matters:
                    </span>
                    <span>Applicant Tracking Systems rank candidates higher when action verbs align directly with JD metrics and tools.</span>
                  </div>
                </div>

                {/* Score Indicators Column */}
                <div className="md:col-span-4 bg-muted/40 p-5 rounded-xl border border-border/70 flex flex-col justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Computed ATS Match
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold ${bulletMode === "after" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {bulletMode === "after" ? "96%" : "44%"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {bulletMode === "after" ? "(Interview Guaranteed Range)" : "(Screening Threshold: 80%)"}
                      </span>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Keyword Density</span>
                          <span className="font-semibold">{bulletMode === "after" ? "98%" : "50%"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${bulletMode === "after" ? "w-[98%] bg-emerald-500" : "w-[50%] bg-red-400"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Quantified Impact (Google X-Y-Z)</span>
                          <span className="font-semibold">{bulletMode === "after" ? "95%" : "25%"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${bulletMode === "after" ? "w-[95%] bg-emerald-500" : "w-[25%] bg-red-400"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Job Title & Tech Stack Match</span>
                          <span className="font-semibold">{bulletMode === "after" ? "100%" : "55%"}</span>
                        </div>
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${bulletMode === "after" ? "w-[100%] bg-emerald-500" : "w-[55%] bg-red-400"}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button asChild size="sm" className="w-full mt-5">
                    <Link href="/builder/new">
                      Rewrite Your Bullets Free <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Candidate Multi-Platform Profiler */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200">
                      Multi-Platform Verification
                    </Badge>
                    <span className="text-xs text-muted-foreground">Goes Beyond the One-Page Resume</span>
                  </div>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    Deep GitHub & LinkedIn Profile Audit
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                  Simulating Recruiter Technical Screening
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* GitHub Analysis Card */}
                <div className="p-5 rounded-xl border bg-card/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-foreground/5">
                        <Github className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">GitHub Repository Audit</h4>
                        <span className="text-xs text-muted-foreground">github.com/candidate</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">88/100</span>
                      <p className="text-[11px] text-muted-foreground">Technical Evidence</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/60 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Verified Tech Stack Alignment:</span>
                        <p className="text-muted-foreground mt-0.5">Found 8 public repositories utilizing TypeScript, Go, Docker, and PostgreSQL.</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/60 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Active Commit Velocity:</span>
                        <p className="text-muted-foreground mt-0.5">142 contributions in the last 90 days with clear semantic Git messages.</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Actionable Recommendation:</span>
                        <p className="text-muted-foreground mt-0.5">Pin repository demonstrating microservice architecture with complete README documentation.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LinkedIn Analysis Card */}
                <div className="p-5 rounded-xl border bg-card/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-600/10">
                        <Linkedin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">LinkedIn Presence Audit</h4>
                        <span className="text-xs text-muted-foreground">linkedin.com/in/candidate</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">92/100</span>
                      <p className="text-[11px] text-muted-foreground">Recruiter Visibility</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/60 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Headline Keyword Density:</span>
                        <p className="text-muted-foreground mt-0.5">Headline contains exact JD titles: "Full-Stack Engineer | Distributed Systems | Cloud Native".</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/60 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Endorsed Skills Match:</span>
                        <p className="text-muted-foreground mt-0.5">Top 15 skills match candidate resume claims, establishing recruiter trust.</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Recruiter Searchability:</span>
                        <p className="text-muted-foreground mt-0.5">Optimal keyword distribution across About, Experience, and Skills sections.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold">Recruiters spend 80% of screening time on LinkedIn & GitHub</h5>
                    <p className="text-xs text-muted-foreground">JobFit aligns your external digital presence with your tailored resume claims.</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href="/dashboard">
                    Audit My Profiles <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: Unified 3-Way Match Matrix */}
          {activeTab === "matrix" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200">
                      Cross-Platform Verification
                    </Badge>
                    <span className="text-xs text-muted-foreground">Zero False Positives</span>
                  </div>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    Unified Candidate Match Matrix
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground">
                  Comparing Job Description Requirements to Proof
                </div>
              </div>

              {/* Table / Matrix View */}
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/60 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">JD Requirement</th>
                      <th className="py-3 px-3">Resume Evidence</th>
                      <th className="py-3 px-3">GitHub Evidence</th>
                      <th className="py-3 px-3">LinkedIn Evidence</th>
                      <th className="py-3 px-4 text-right">Alignment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-foreground">TypeScript & React</td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Stated in Experience
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" /> 14 Repositories
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" /> 24 Endorsements
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border-emerald-300">
                          100% Solid Proof
                        </Badge>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-semibold text-foreground">PostgreSQL & Redis</td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Production Usage
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" /> Database Migrations
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" /> Not In Top Skills
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 border-blue-300">
                          Verified by Code
                        </Badge>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-semibold text-foreground">Docker & Kubernetes</td>
                      <td className="py-3 px-3 text-muted-foreground flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" /> Basic mention
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" /> Dockerfile present
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-red-500">
                          ✕ Missing
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border-amber-300">
                          Strengthen Needed
                        </Badge>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-semibold text-foreground">Kafka / Event Streaming</td>
                      <td className="py-3 px-3 text-red-500 flex items-center gap-1.5">
                        ✕ Missing in Resume
                      </td>
                      <td className="py-3 px-3 text-red-500">
                        ✕ No code commits
                      </td>
                      <td className="py-3 px-3 text-red-500">
                        ✕ Not listed
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/20 border-red-300">
                          Skill Gap Identified
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Identified Skill Gap: "Kafka / Event Streaming"</p>
                  <p className="text-xs text-muted-foreground">JobFit automatically sends this to the Autonomous Learning Engine to generate a 1-week guided roadmap.</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab("learning")} className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white">
                  View Kafka Roadmap <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: Autonomous Learning Engine */}
          {activeTab === "learning" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200">
                      Personalized Curriculum
                    </Badge>
                    <span className="text-xs text-muted-foreground">Adapted to Candidate Level: Intermediate</span>
                  </div>
                  <h3 className="text-xl font-bold mt-1 text-foreground">
                    Closing the Gap: Apache Kafka & Distributed Streaming
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                  100% Free Verified Resources
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Module 1 */}
                <div className="p-4 rounded-xl border bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Module 01</span>
                    <Badge variant="secondary" className="text-[10px]">~3 Hours</Badge>
                  </div>
                  <h4 className="font-bold text-sm">Event-Driven Architecture & Kafka Core</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Topics, Partitions, Consumer Groups, Offsets, and Log-Compacted Broker Architecture.
                  </p>
                  <div className="pt-2 border-t text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span>Confluent Official Kafka Docs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Checkpoint MCQ Completed
                    </div>
                  </div>
                </div>

                {/* Module 2 */}
                <div className="p-4 rounded-xl border bg-card/60 space-y-3 border-violet-500/40 ring-1 ring-violet-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Module 02 (Current)</span>
                    <Badge className="bg-violet-600 text-white text-[10px]">In Progress</Badge>
                  </div>
                  <h4 className="font-bold text-sm">Producers, Consumers & TypeScript SDK</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connecting KafkaJS to Node/Next.js services, handling at-least-once delivery, and retries.
                  </p>
                  <div className="pt-2 border-t text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span>Interactive Kafka Sandbox Lab</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
                      <Zap className="h-3 w-3" /> 2 Coding Challenges
                    </div>
                  </div>
                </div>

                {/* Module 3 */}
                <div className="p-4 rounded-xl border bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Module 03</span>
                    <Badge variant="secondary" className="text-[10px]">Capstone Project</Badge>
                  </div>
                  <h4 className="font-bold text-sm">Real-Time Payment Notification Service</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Build, test, and commit a production microservice repository ready to showcase on GitHub.
                  </p>
                  <div className="pt-2 border-t text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Github className="h-3 w-3 text-muted-foreground" />
                      <span>Auto-Sync to Candidate GitHub</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground" /> Automatically Boosts ATS Score
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Recurring Skill Tracker:</span>
                  <p className="text-xs text-muted-foreground">JobFit automatically prioritizes skills requested in &gt;3 of your targeted job descriptions.</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    Explore My Skill Learning Roadmaps <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
