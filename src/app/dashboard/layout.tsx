import { UserAccountNav } from "@/components/user-account-nav";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-50 w-full border-b bg-white">
                <div className="container mx-auto flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/" className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <span>JobFit.ai</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">

                        <UserAccountNav />
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto py-8">
                {children}
            </main>
        </div>
    );
}
