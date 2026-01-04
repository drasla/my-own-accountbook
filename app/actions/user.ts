"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }, // 비밀번호 제외
        });
        return user;
    } catch (error) {
        return null;
    }
}
