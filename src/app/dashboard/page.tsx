import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Resume } from "@prisma/client";

export default async function DashboardPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return null;

    const [resumes, dbUser] = await Promise.all([
        prisma.resume.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, credits: true }
        })
    ]);

    const newResumeHref = (dbUser?.isPro || (dbUser?.credits ?? 0) > 0) ? "/builder/new" : "/subscription";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Resumes</h1>
                    <p className="text-muted-foreground">Manage your AI-tailored resumes.</p>
                </div>
                <Button asChild>
                    <Link href={newResumeHref}>
                        <Plus className="mr-2 h-4 w-4" /> New Resume
                    </Link>
                </Button>
            </div>

            {resumes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-primary/10 p-4 mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">No resumes yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            Create your first tailored resume by matching your skills to a job description.
                        </p>
                        <Button asChild>
                            <Link href={newResumeHref}>Create Resume</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resumes.map((resume: Resume) => (
                        <Card key={resume.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{resume.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(resume.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm font-medium">
                                        Score: <span className={resume.atsScore > 80 ? "text-green-600" : "text-yellow-600"}>{resume.atsScore}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/builder/${resume.id}`}>Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
