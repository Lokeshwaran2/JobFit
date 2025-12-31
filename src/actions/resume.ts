"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteResume(resumeId: string) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const resume = await prisma.resume.findUnique({
        where: {
            id: resumeId,
        },
    });

    if (!resume || resume.userId !== userId) {
        throw new Error("Resume not found or unauthorized");
    }

    await prisma.resume.delete({
        where: {
            id: resumeId,
        },
    });

    revalidatePath("/dashboard");
}

export async function updateResume(resumeId: string, data: any) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
        throw new Error("Resume not found or unauthorized");
    }

    await prisma.resume.update({
        where: { id: resumeId },
        data: {
            structuredData: data,
        },
    });

    revalidatePath(`/builder/${resumeId}`);
}
