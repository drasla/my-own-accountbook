"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { DashboardData } from "@/types";

export async function getDashboardData(): Promise<DashboardData> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            totalAssets: 0,
            bankAccounts: [],
            investmentAccounts: [],
            cards: [],
        };
    }

    try {
        // 3가지 데이터를 병렬로 동시에 조회 (성능 최적화)
        const [bankAccounts, investmentAccounts, cards] = await Promise.all([
            // 1. 은행/현금 계좌
            prisma.bankAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentBalance: "desc" }, // 잔액 많은 순
            }),
            // 2. 투자 계좌
            prisma.investmentAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentValuation: "desc" }, // 평가금 많은 순
            }),
            // 3. 카드
            prisma.card.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // 자산 합계 계산
        const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
        const totalInvestmentValue = investmentAccounts.reduce(
            (sum, acc) => sum + acc.currentValuation,
            0,
        );

        // 총 순자산 (은행 + 투자) - 카드는 부채 성격이 있지만 현재 '사용액' 필드가 없으므로 제외
        const totalAssets = totalBankBalance + totalInvestmentValue;

        return {
            totalAssets,
            bankAccounts,
            investmentAccounts,
            cards,
        };
    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return {
            totalAssets: 0,
            bankAccounts: [],
            investmentAccounts: [],
            cards: [],
        };
    }
}
