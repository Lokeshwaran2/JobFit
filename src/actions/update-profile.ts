"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { validateAndNormalizeGithubUrl, validateAndNormalizeLinkedinUrl } from "@/lib/profile-scoring/url-validator";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().optional().nullable().or(z.literal("")),
    newPassword: z.string().optional().nullable().or(z.literal("")),
    githubUrl: z.string().optional().nullable(),
    linkedinUrl: z.string().optional().nullable(),
    linkedinData: z.any().optional().nullable(),
});

export async function updateSocialProfiles(formData: {
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    linkedinData?: any;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Validate and normalize GitHub URL
    let cleanGithubUrl: string | null = null;
    if (formData.githubUrl && formData.githubUrl.trim()) {
        const ghVal = validateAndNormalizeGithubUrl(formData.githubUrl);
        if (!ghVal.isValid) {
            return { error: ghVal.error || "Invalid GitHub profile URL." };
        }
        cleanGithubUrl = ghVal.normalizedUrl || null;
    }

    // Validate and normalize LinkedIn URL
    let cleanLinkedinUrl: string | null = null;
    if (formData.linkedinUrl && formData.linkedinUrl.trim()) {
        const liVal = validateAndNormalizeLinkedinUrl(formData.linkedinUrl);
        if (!liVal.isValid) {
            return { error: liVal.error || "Invalid LinkedIn profile URL." };
        }
        cleanLinkedinUrl = liVal.normalizedUrl || null;
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                githubUrl: cleanGithubUrl,
                linkedinUrl: cleanLinkedinUrl,
                linkedinData: formData.linkedinData ?? undefined,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/settings");
        return { success: "Social profiles updated successfully!" };
    } catch (error) {
        console.error("Social profiles update error:", error);
        return { error: "Failed to update social profiles." };
    }
}

export async function updateProfile(formData: {
    name: string;
    password?: string;
    newPassword?: string;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    linkedinData?: any;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = profileSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { name, password, newPassword, githubUrl, linkedinUrl, linkedinData } = validatedFields.data;

    // Validate and normalize GitHub URL
    let cleanGithubUrl: string | null = null;
    if (githubUrl && githubUrl.trim()) {
        const ghVal = validateAndNormalizeGithubUrl(githubUrl);
        if (!ghVal.isValid) {
            return { error: ghVal.error || "Invalid GitHub profile URL." };
        }
        cleanGithubUrl = ghVal.normalizedUrl || null;
    }

    // Validate and normalize LinkedIn URL
    let cleanLinkedinUrl: string | null = null;
    if (linkedinUrl && linkedinUrl.trim()) {
        const liVal = validateAndNormalizeLinkedinUrl(linkedinUrl);
        if (!liVal.isValid) {
            return { error: liVal.error || "Invalid LinkedIn profile URL." };
        }
        cleanLinkedinUrl = liVal.normalizedUrl || null;
    }

    // Prepare update data
    const updateData: any = { 
        name,
        githubUrl: cleanGithubUrl,
        linkedinUrl: cleanLinkedinUrl,
    };

    if (linkedinData !== undefined) {
        updateData.linkedinData = linkedinData;
    }

    // If changing password
    const hasCurrentPassword = Boolean(password && password.trim());
    const hasNewPassword = Boolean(newPassword && newPassword.trim());

    if (hasNewPassword && hasCurrentPassword) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return { error: "User not found or uses OAuth" };
        }

        const passwordsMatch = await bcrypt.compare(password!, user.password);
        if (!passwordsMatch) {
            return { error: "Incorrect current password" };
        }

        if (newPassword!.length < 6) {
            return { error: "New password must be at least 6 characters" };
        }

        const hashedPassword = await bcrypt.hash(newPassword!, 10);
        updateData.password = hashedPassword;
    } else if (hasNewPassword || hasCurrentPassword) {
        // If one is provided but not the other
        return { error: "To change password, provide both current and new password." };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/settings");
        return { success: "Profile updated successfully!" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Something went wrong." };
    }
}

