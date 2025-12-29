"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export const Social = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const onClick = (provider: "google") => {
        signIn(provider, {
            callbackUrl: callbackUrl || "/dashboard",
        });
    };

    return (
        <div className="flex w-full items-center gap-x-2">
            <Button
                size="lg"
                className="w-full"
                variant="outline"
                onClick={() => onClick("google")}
            >
                <FcGoogle className="h-5 w-5 mr-2" />
                Continue with Google
            </Button>
        </div>
    );
};
