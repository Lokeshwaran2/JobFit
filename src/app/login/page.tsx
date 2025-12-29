"use client";

import { Social } from "@/components/auth/social";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login } from "@/actions/login";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
    const [error, setError] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        startTransition(async () => {
            const formData = new FormData();
            formData.append("email", values.email);
            formData.append("password", values.password);

            // This relies on the server action catching errors. 
            // Note: SignIng credentials usually throws error on fail in V5 server actions unless caught.
            // My action catches it.
            const res = await login(undefined, formData);
            if (res) {
                setError(res);
            } else {
                // Success (redirect handled by middleware or action usually throws if not caught)
                // But since my action returns string on error, null usually means success/redirect happening via NextAuth internals or we should manually redirect
                // Actually, standard login action with signIn("credentials") redirects by default.
                // If it returns, it means error if redirect: false, but default is true.
                // Wait, standard signIn throws error if redirect happens (NEXT_REDIRECT).
                // My action catches AuthError but re-throws others.
            }
        });
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" disabled={isPending} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" disabled={isPending} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && (
                                <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                                    <p>{error}</p>
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Social />
                    <p className="text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link></p>
                </CardFooter>
            </Card>
        </div>
    );
}
