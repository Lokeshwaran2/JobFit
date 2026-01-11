import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | JobFit",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
    alternates: {
        canonical: "https://jobfit.co.in/login",
    },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
