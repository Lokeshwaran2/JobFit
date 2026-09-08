import { Card, CardContent } from "@/components/ui/card";
import { Quote, ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import testimonialsData from "@/data/testimonials.json";

interface TestimonialItem {
  id: string;
  isExample?: boolean;
  name: string;
  role?: string;
  targetRole?: string;
  quote: string;
  beforeScore?: number;
  afterScore?: number;
}

export function TestimonialsSection() {
  const testimonials = (testimonialsData as TestimonialItem[]) || [];

  if (testimonials.length === 0) return null;

  return (
    <section className="container mx-auto px-4 md:px-0 max-w-5xl py-12 lg:py-16">
      <div className="space-y-4 text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Candidate Experiences
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          How Candidates Improve Their Match Score
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          See how evidence-based tailoring helps job seekers identify keyword gaps and structure their experience for ATS parsers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.id} className="relative flex flex-col justify-between border-border/80 bg-card/80 backdrop-blur-xs hover:border-primary/40 transition-all duration-300 shadow-xs">
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Quote className="h-4 w-4" />
                  </div>
                  {item.beforeScore !== undefined && item.afterScore !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>{item.beforeScore}% → {item.afterScore}% Match</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                  {item.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {item.name}
                  </div>
                  {(item.role || item.targetRole) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.role || item.targetRole}
                      {item.targetRole && item.role && (
                        <span className="text-foreground/80 font-medium"> → {item.targetRole}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
