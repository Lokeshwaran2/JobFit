import { UserAccountNav } from "@/components/user-account-nav";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-50 w-full border-b bg-white">
                <div className="container mx-auto flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-2 border-l pl-4 ml-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <span>Resume Builder</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserAccountNav />
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto py-8 max-w-4xl">
                {children}
            </main>
        </div>
    );
}
