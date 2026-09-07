"use client";

import React from "react";
import { Mail, Phone, MapPin, Linkedin, Github, ExternalLink, Sparkles, Building2, Calendar, GraduationCap, Award, Briefcase, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TailoredResumeViewProps {
  data: any;
}

export function TailoredResumeView({ data }: TailoredResumeViewProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
        No resume content available to preview.
      </div>
    );
  }

  const personalInfo = data.personalInfo || {};
  const summary = data.summary || "";
  const skills = data.skills || {};
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const certifications = Array.isArray(data.certifications) ? data.certifications : [];

  const hardSkills: string[] = Array.isArray(skills.hard)
    ? skills.hard
    : typeof skills.hard === "string"
    ? skills.hard.split(",").map((s: string) => s.trim())
    : [];

  const softSkills: string[] = Array.isArray(skills.soft)
    ? skills.soft
    : typeof skills.soft === "string"
    ? skills.soft.split(",").map((s: string) => s.trim())
    : [];

  const tools: string[] = Array.isArray(skills.tools)
    ? skills.tools
    : typeof skills.tools === "string"
    ? skills.tools.split(",").map((s: string) => s.trim())
    : [];

  const hasSkills = hardSkills.length > 0 || softSkills.length > 0 || tools.length > 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6 sm:p-10 font-sans text-foreground max-w-4xl mx-auto space-y-8">
      {/* 1. Header / Contact Info */}
      <header className="border-b pb-6 text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {personalInfo.name || "Candidate Name"}
        </h1>
        {personalInfo.title && (
          <p className="text-lg font-medium text-primary">
            {personalInfo.title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground pt-1">
          {personalInfo.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground/80" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/80" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" />
              {personalInfo.location}
            </span>
          )}
          {personalInfo.linkedin && (
            <a
              href={personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          )}
          {personalInfo.github && (
            <a
              href={personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* 2. Professional Summary (Only if present) */}
      {summary && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {summary}
          </p>
        </section>
      )}

      {/* 3. Core Skills (Only if present) */}
      {hasSkills && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1 flex items-center gap-2">
            <Code className="h-4 w-4" />
            Skills & Competencies
          </h2>
          <div className="space-y-2 text-sm">
            {hardSkills.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-xs text-muted-foreground uppercase min-w-[90px]">Technical:</span>
                <div className="flex flex-wrap gap-1.5">
                  {hardSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {tools.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-xs text-muted-foreground uppercase min-w-[90px]">Tools:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="font-normal text-xs bg-slate-50 dark:bg-slate-800">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {softSkills.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-xs text-muted-foreground uppercase min-w-[90px]">Interpersonal:</span>
                <div className="flex flex-wrap gap-1.5">
                  {softSkills.map((skill, idx) => (
                    <span key={idx} className="text-xs text-muted-foreground">
                      {skill}{idx < softSkills.length - 1 ? " •" : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Professional Experience */}
      {experience.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp: any, expIdx: number) => {
              const bullets: Array<{ text: string; isOptimized?: boolean }> = Array.isArray(exp.description)
                ? exp.description.map((b: any) =>
                    typeof b === "string" ? { text: b, isOptimized: false } : { text: b.text || "", isOptimized: Boolean(b.isOptimized) }
                  )
                : [];

              return (
                <div key={expIdx} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div>
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {exp.role || "Role"}
                      </span>
                      {exp.company && (
                        <span className="text-sm font-semibold text-primary ml-1.5">
                          • {exp.company}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {(exp.startDate || exp.endDate) && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exp.startDate || ""} {exp.startDate && exp.endDate ? "–" : ""} {exp.endDate || ""}
                        </span>
                      )}
                      {exp.location && (
                        <span>({exp.location})</span>
                      )}
                    </div>
                  </div>

                  {bullets.length > 0 && (
                    <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 pl-4 list-disc list-outside">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">
                          <span>{bullet.text}</span>
                          {bullet.isOptimized && (
                            <span className="inline-flex items-center gap-0.5 ml-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                              <Sparkles className="h-2.5 w-2.5" />
                              Tailored
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Projects (Only if present) */}
      {projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {proj.name}
                  </span>
                  {proj.link && (
                    <a
                      href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Project <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {proj.description}
                  </p>
                )}
                {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((t: string, tIdx: number) => (
                      <span key={tIdx} className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Education (Only if present) */}
      {education.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-sm">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {edu.degree || edu.institution}
                  </span>
                  {edu.degree && edu.institution && (
                    <span className="text-muted-foreground ml-1.5">
                      — {edu.institution}
                    </span>
                  )}
                </div>
                {edu.year && (
                  <span className="text-xs text-muted-foreground">
                    {edu.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Certifications (Only if present) */}
      {certifications.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase border-b pb-1 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certifications
          </h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside text-slate-700 dark:text-slate-300">
            {certifications.map((cert: any, idx: number) => {
              const text = typeof cert === "string" ? cert : cert.name || "";
              const issuer = typeof cert === "object" && cert.issuer ? ` (${cert.issuer})` : "";
              const date = typeof cert === "object" && cert.date ? ` — ${cert.date}` : "";
              return (
                <li key={idx}>
                  <span className="font-medium">{text}</span>
                  <span className="text-muted-foreground text-xs">{issuer}{date}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
