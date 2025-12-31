import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RefundPolicy() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Refund & Cancellation Policy</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">1. No Refunds Integration</h2>
                        <p>
                            Due to the digital nature of our product (JobFit), all sales are final. Once credits are purchased or a subscription is activated, we do not offer refunds, exchanges, or cancellations, except as required by Indian law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">2. Subscription Cancellation</h2>
                        <p>
                            You may cancel your "Job Hunt Mode" subscription at any time via your dashboard. Your access will remain active until the end of the current billing period. No partial refunds will be issued for unused time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">3. Technical Issues</h2>
                        <p>
                            If a technical error prevents you from using your purchased credits (e.g., resume generation failure), please contact us at <a href="mailto:support@jobfit.co.in" className="text-primary hover:underline">support@jobfit.co.in</a> within 7 days. We will investigate and, at our discretion, restore your credits or issue a refund if the service was undeliverable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">4. Contact Us</h2>
                        <p>
                            For any billing-related questions, please contact us at:<br />
                            <strong>Email:</strong> support@jobfit.co.in
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
