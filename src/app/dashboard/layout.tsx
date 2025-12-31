import { UserAccountNav } from "@/components/user-account-nav";
import Link from "next/link";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-50 w-full border-b bg-white">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="JobFit" className="h-8 w-8" />
                            <span>JobFit</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">

                        <UserAccountNav />
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto py-8 px-4">
                {children}
            </main>
        </div>
    );
}
