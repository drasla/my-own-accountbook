"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

// Prisma Enum 타입 재정의 (클라이언트 전송용)
// AccountType, AccountDetailType은 Prisma Client에서 import

export async function createAccountAction(data: any) {
    const user = await getCurrentUser();

    if (!user) {
        return { success: false, message: "로그인이 필요합니다." };
    }

    try {
        // 1. 값 파싱 및 변환
        const { name, type, detailType, currentBalance } = data;

        // detailType이 빈 문자열이면 null로 처리
        const validDetailType = detailType === "" ? null : detailType;

        // 2. DB 저장
        await prisma.account.create({
            data: {
                name,
                type, // BANK, INVESTMENT, WALLET
                detailType: validDetailType,
                currentBalance: parseFloat(currentBalance) || 0,
                userId: user.id,
            },
        });

        // 3. 대시보드 데이터 갱신
        revalidatePath("/");
        revalidatePath("/accounts");

        return { success: true, message: "자산이 추가되었습니다." };
    } catch (error) {
        console.error("Create Account Error:", error);
        return { success: false, message: "자산 추가 중 오류가 발생했습니다." };
    }
}

export async function getAccountDetail(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const account = await prisma.account.findUnique({
            where: {
                id: accountId,
                userId: user.id, // 내 계좌인지 확인
            },
            include: {
                transactions: {
                    // 거래 내역 같이 가져오기
                    orderBy: { date: "desc" }, // 최신순 정렬
                    take: 50, // 일단 최근 50개만
                    include: {
                        category: true,
                    },
                },
            },
        });
        return account;
    } catch (error) {
        console.error("Get Account Detail Error:", error);
        return null;
    }
}

/**
 * 계좌 삭제
 */
export async function deleteAccountAction(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "권한이 없습니다." };

    try {
        // 본인 계좌인지 확인
        const count = await prisma.account.count({
            where: { id: accountId, userId: user.id },
        });

        if (count === 0) return { success: false, message: "계좌를 찾을 수 없습니다." };

        // 삭제 (Cascade 설정이 안되어 있다면 트랜잭션도 지워야 함.
        // Prisma Schema에서 Relation에 onDelete: Cascade가 없다면 에러가 날 수 있음.
        // 여기서는 일단 계좌만 삭제 시도)
        await prisma.account.delete({
            where: { id: accountId },
        });

        revalidatePath("/"); // 대시보드 갱신
        return { success: true, message: "계좌가 삭제되었습니다." };
    } catch (error) {
        console.error("Delete Account Error:", error);
        return { success: false, message: "삭제 중 오류가 발생했습니다." };
    }
}
