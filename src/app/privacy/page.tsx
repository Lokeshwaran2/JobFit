import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <p>
                        Welcome to JobFit.ai. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and use our AI resume services.
                    </p>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">1. Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Identity Data:</strong> Name, email address (via Google Auth/Login).</li>
                            <li><strong>Resume Data:</strong> Content you upload or input for resume generation (work history, skills, etc.). We do not share this publicly.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our website and services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
                        <p>
                            We use your data primarily to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Provide and improve our AI resume optimization services.</li>
                            <li>Process payments and manage your subscription.</li>
                            <li>Communicate with you regarding updates or support.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Security</h2>
                        <p>
                            We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">4. Third-Party Services</h2>
                        <p>
                            We use third-party services like Razorpay for payments and Google for authentication. Your interaction with these services is governed by their respective privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">5. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy, please contact us at: <a href="mailto:support@jobfit.co.in" className="text-primary hover:underline">support@jobfit.co.in</a>.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
