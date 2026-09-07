import { ResumeUploadForm } from "@/components/resume-upload-form";

export const metadata = {
    title: "Analyze a New Job | JobFit",
    description: "Analyze your fit for the role, identify gaps, and create an evidence-backed tailored resume.",
    openGraph: {
        title: "Analyze a New Job | JobFit",
        description: "Analyze your fit for the role, identify gaps, and create an evidence-backed tailored resume.",
        url: "https://jobfit.co.in/builder/new",
        type: "website",
    },
};

export default function NewResumePage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Analyze a New Job</h1>
                <p className="text-muted-foreground">
                    Analyze your fit for the role, identify gaps, and create an evidence-backed tailored resume.
                </p>
            </div>

            <ResumeUploadForm />
        </div>
    );
}
