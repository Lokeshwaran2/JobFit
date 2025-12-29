import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://jobfit.co.in'),
  title: {
    default: "JobFit.ai - ATS Resume Optimizer",
    template: "%s | JobFit.ai",
  },
  description: "AI-powered resume tailoring for job seekers. Increase your interview chances with ATS-optimized resumes.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobfit.co.in",
    title: "JobFit.ai - ATS Resume Optimizer",
    description: "Tailor your resume to any job description and improve ATS score instantly.",
    siteName: "JobFit.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobFit.ai - ATS Resume Optimizer",
    description: "Tailor your resume to any job description and improve ATS score instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
