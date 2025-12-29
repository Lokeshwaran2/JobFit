import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/builder");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true;
        },
    },
    providers: [], // Providers are configured in auth.ts
} satisfies NextAuthConfig;
