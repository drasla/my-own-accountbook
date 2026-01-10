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
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }, // 비밀번호 제외
        });
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function deleteAccountAction() {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인이 필요합니다." };

    try {
        await prisma.$transaction([
            prisma.moneyTransaction.deleteMany({ where: { userId: user.id } }),
            prisma.bankAccount.deleteMany({ where: { userId: user.id } }),
            prisma.investmentSnapshot.deleteMany({
                where: { investmentAccount: { userId: user.id } },
            }),
            prisma.investmentLog.deleteMany({ where: { investmentAccount: { userId: user.id } } }),
            prisma.investmentAccount.deleteMany({ where: { userId: user.id } }),
            prisma.card.deleteMany({ where: { userId: user.id } }),
            prisma.category.deleteMany({ where: { userId: user.id } }),
            prisma.user.delete({ where: { id: user.id } }),
        ]);

        // 세션 쿠키 삭제
        (await cookies()).delete("session");

        return { success: true, message: "계정이 삭제되었습니다." };
    } catch (error) {
        console.error("Delete Account Error:", error);
        return { success: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
    }
}