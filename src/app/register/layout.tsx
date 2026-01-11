import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Register | JobFit",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
    alternates: {
        canonical: "https://jobfit.co.in/register",
    },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return children;
}
