"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User } from "next-auth";
import { toast } from "sonner";
import { updateProfile } from "@/actions/update-profile";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().optional(),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
}).refine((data) => {
    if (data.newPassword && !data.password) {
        return false;
    }
    return true;
}, {
    message: "Current password is required to set a new password",
    path: ["password"],
});

interface SettingsFormProps {
    user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || "",
            password: "",
            newPassword: "",
        },
    });

    function onSubmit(values: z.infer<typeof profileSchema>) {
        startTransition(() => {
            updateProfile(values)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error);
                    }
                    if (data.success) {
                        toast.success(data.success);
                        form.reset({
                            name: values.name,
                            password: "",
                            newPassword: "",
                        });
                    }
                })
                .catch(() => toast.error("Something went wrong!"));
        });
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        Update your personal information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={isPending} placeholder="John Doe" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Change Password</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={isPending} type="password" placeholder="******" />
                                                </FormControl>
                                                <FormDescription>Required to set a new password.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={isPending} type="password" placeholder="******" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
