"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().optional(),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function updateProfile(formData: {
    name: string;
    password?: string;
    newPassword?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = profileSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { name, password, newPassword } = validatedFields.data;

    // Prepare update data
    const updateData: any = { name };

    // If changing password
    if (newPassword && password) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return { error: "User not found or uses OAuth" };
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            return { error: "Incorrect current password" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
    } else if (newPassword || password) {
        // If one is provided but not the other
        return { error: "To change password, provide both current and new password." }
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
