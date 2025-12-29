import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditions() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Terms & Conditions</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
                        <p>
                            These Terms & Conditions govern your use of JobFit.ai. By accessing or using our website, you agree to be bound by these terms. If you disagree with any part of these terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">2. Accounts</h2>
                        <p>
                            When you create an account with us, you must provide ensuring that the information is accurate and complete. You are responsible for safeguarding the password that you use to access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">3. Subscription & Payments</h2>
                        <p>
                            Usage of our premium features requires purchase of credits or a subscription. Payments are processed securely via Razorpay. Prices are subject to change with notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">4. Acceptable Use</h2>
                        <p>
                            You agree not to misuse the service, including but not limited to reverse engineering our AI, attempting to bypass restriction, or using the service for illegal activities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
                        <p>
                            In no event shall JobFit.ai, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">6. Governing Law</h2>
                        <p>
                            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <a href="mailto:support@jobfit.co.in" className="text-primary hover:underline">support@jobfit.co.in</a>.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
