import { ResumeUploadForm } from "@/components/resume-upload-form";

export const metadata = {
    title: "Resume Builder | Create Tailored Resume",
    description: "Upload your existing resume and job description to create a perfectly tailored, ATS-friendly resume in seconds.",
    openGraph: {
        title: "Resume Builder | JobFit",
        description: "Create a tailored, ATS-optimized resume in seconds.",
        url: "https://jobfit.co.in/builder/new",
        type: "website",
    },
};

export default function NewResumePage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Create New Resume</h1>
                <p className="text-muted-foreground">
                    Our AI will analyze the Job Description and your Resume to create a perfectly tailored version.
                </p>
            </div>

            <ResumeUploadForm />
        </div>
    );
}
