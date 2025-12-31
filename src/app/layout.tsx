import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://jobfit.co.in'),
  title: {
    default: "JobFit - ATS Resume Optimizer",
    template: "%s | JobFit",
  },
  description: "AI-powered resume tailoring for job seekers. Increase your interview chances with ATS-optimized resumes.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobfit.co.in",
    title: "JobFit - ATS Resume Optimizer",
    description: "Tailor your resume to any job description and improve ATS score instantly.",
    siteName: "JobFit",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobFit - ATS Resume Optimizer",
    description: "Tailor your resume to any job description and improve ATS score instantly.",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/icon-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden`}>{children}</body>
    </html>
  );
}
