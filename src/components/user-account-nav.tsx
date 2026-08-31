import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma"; // Import prisma
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";

export async function UserAccountNav() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch fresh user data
    let dbUser = null;
    try {
        dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, isPro: true }
        });
    } catch (error) {
        console.error("Database user fetch error in nav:", error);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-slate-200">
                    <span className="sr-only">Open user menu</span>
                    <User className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                        </p>
                        <div className="pt-2">
                            {dbUser?.isPro ? (
                                <span className="inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-xs font-semibold text-white">
                                    PRO PLAN
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-primary">
                                    {dbUser?.credits ?? 0} Credits
                                </span>
                            )}
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/" });
                        }}
                        className="w-full"
                    >
                        <button type="submit" className="flex w-full items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
