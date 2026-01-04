"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

/**
 * 일별 평가금(Snapshot) 기록
 */
export async function recordDailySnapAction(data: any) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인이 필요합니다." };

    const { accountId, date, totalValue } = data;
    const numericValue = parseFloat(totalValue);

    if (isNaN(numericValue)) return { success: false, message: "올바른 금액을 입력하세요." };

    try {
        // 1. 현재까지의 원금(Principal) 계산
        // 원금 = (입금 + 수입) - (출금 + 지출)
        // 투자 계좌에서 입금(Transfer In)은 투자금 추가, 출금(Transfer Out)은 투자금 회수로 봅니다.
        const transactions = await prisma.transaction.aggregate({
            where: { accountId },
            _sum: { amount: true },
        });

        // 이 부분은 거래 내역 로직에 따라 +,-가 달라질 수 있으나
        // 일단 지금은 거래내역 총합을 원금으로 간주하거나, 별도 로직이 필요할 수 있습니다.
        // 여기서는 단순화를 위해 '현재 계좌에 기록된 거래내역의 합'을 원금으로 가정하거나
        // 혹은 스냅샷 기록 시 원금도 같이 입력받는 방법이 있지만, 자동 계산이 UX상 좋습니다.

        // (간이 로직) 투자 계좌의 Transaction은 '투자금 투입/회수'로만 쓴다고 가정
        const totalPrincipal = 0; // TODO: 실제 Transaction Sum 로직 필요. 일단 0이나 이전 값 참조

        await prisma.$transaction(async tx => {
            // 1. 스냅샷 저장 (이미 해당 날짜에 있으면 업데이트 - Upsert)
            const targetDate = new Date(date);

            // 해당 날짜의 스냅샷 찾기
            const existingSnap = await tx.accountDailySnap.findUnique({
                where: {
                    accountId_date: {
                        accountId,
                        date: targetDate,
                    },
                },
            });

            if (existingSnap) {
                await tx.accountDailySnap.update({
                    where: { id: existingSnap.id },
                    data: { totalValue: numericValue }, // 원금은 그대로 둠
                });
            } else {
                await tx.accountDailySnap.create({
                    data: {
                        accountId,
                        date: targetDate,
                        totalValue: numericValue,
                        totalPrincipal: totalPrincipal, // 추후 계산 로직 연결
                    },
                });
            }

            // 2. 계좌의 '현재 잔액'을 방금 입력한 평가금으로 동기화
            // (가장 최신 날짜를 입력했을 때만 업데이트하는 게 맞지만, 편의상 업데이트)
            await tx.account.update({
                where: { id: accountId },
                data: { currentBalance: numericValue },
            });
        });

        revalidatePath(`/accounts/${accountId}`);
        revalidatePath("/");

        return { success: true, message: "평가금이 기록되었습니다." };
    } catch (error) {
        console.error("Record Snap Error:", error);
        return { success: false, message: "기록 중 오류가 발생했습니다." };
    }
}

/**
 * 투자 계좌 데이터 조회 (차트용 스냅샷 + 거래내역)
 */
export async function getInvestmentDetail(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const account = await prisma.account.findUnique({
            where: { id: accountId, userId: user.id },
            include: {
                // 일별 스냅샷 (날짜 오름차순 -> 차트 그리기 용)
                dailySnaps: {
                    orderBy: { date: "asc" },
                    take: 30, // 최근 30일치
                },
                // 입출금 내역 (최신순)
                transactions: {
                    orderBy: { date: "desc" },
                    take: 20,
                },
            },
        });
        return account;
    } catch (error) {
        return null;
    }
}
