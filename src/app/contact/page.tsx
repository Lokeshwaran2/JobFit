import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ContactUs() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
            <div className="flex justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" /> Email Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            For any queries, technical support, or billing issues, please email us. We typically respond within 24 hours.
                        </p>
                        <a href="mailto:support@jobfit.co.in" className="text-lg font-medium text-primary hover:underline block text-center">
                            support@jobfit.co.in
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
