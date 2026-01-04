"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

export async function getBankAccountDetail(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        return await prisma.bankAccount.findUnique({
            where: {
                id: accountId,
                userId: user.id, // 본인 계좌 확인
            },
            include: {
                // 이 계좌와 연결된 거래 내역 조회
                transactions: {
                    orderBy: { date: "desc" }, // 최신순
                    include: {
                        category: true, // 카테고리 정보 포함 (색상/이름 표시용)
                    },
                    take: 50, // 일단 최근 50개만
                },
            },
        });
    } catch (error) {
        console.error("Bank Detail Error:", error);
        return null;
    }
}

export async function deleteBankAccountAction(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "권한이 없습니다." };

    try {
        // 본인 확인
        const count = await prisma.bankAccount.count({
            where: { id: accountId, userId: user.id },
        });

        if (count === 0) return { success: false, message: "계좌를 찾을 수 없습니다." };

        // 삭제
        await prisma.bankAccount.delete({
            where: { id: accountId },
        });

        revalidatePath("/"); // 대시보드 갱신
        return { success: true, message: "계좌가 삭제되었습니다." };
    } catch (error) {
        console.error("Delete Bank Error:", error);
        return { success: false, message: "삭제 중 오류가 발생했습니다." };
    }
}
