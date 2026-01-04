"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { DashboardData } from "@/types";
import dayjs from "dayjs";

export async function getDashboardData(): Promise<DashboardData> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            totalAssets: 0,
            totalIncome: 0,
            totalExpense: 0,
            bankAccounts: [],
            investmentAccounts: [],
            cards: [],
        };
    }

    // dayjs로 이번 달 1일 ~ 말일 구하기
    const startOfMonth = dayjs().startOf("month").toDate();
    const endOfMonth = dayjs().endOf("month").toDate();

    try {
        // ✅ 4가지 데이터를 병렬로 동시에 조회 (성능 최적화 유지)
        const [bankAccounts, investmentAccounts, cards, monthlyTransactions] = await Promise.all([
            // 1. 은행/현금 계좌
            prisma.bankAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentBalance: "desc" },
            }),
            // 2. 투자 계좌
            prisma.investmentAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentValuation: "desc" },
            }),
            // 3. 카드 (모델명 Card 확인)
            prisma.card.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
            }),
            // 4. ✅ 통계용 이번 달 거래 내역 (이체 제외!)
            prisma.moneyTransaction.findMany({
                where: {
                    userId: user.id,
                    date: { gte: startOfMonth, lte: endOfMonth },
                    isTransfer: false, // 이체 제외 핵심 로직
                },
                select: { type: true, amount: true }, // 통계에 필요한 필드만 가져옴 (최적화)
            }),
        ]);

        // 자산 합계 계산
        const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
        const totalInvestmentValue = investmentAccounts.reduce(
            (sum, acc) => sum + acc.currentValuation,
            0,
        );
        const totalAssets = totalBankBalance + totalInvestmentValue;

        // ✅ 수입/지출 합계 계산 (서버에서 계산해서 내려주는 게 클라이언트 부하 감소)
        const totalIncome = monthlyTransactions
            .filter(t => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = monthlyTransactions
            .filter(t => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalAssets,
            totalIncome,
            totalExpense,
            bankAccounts,
            investmentAccounts,
            cards,
        };
    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return {
            totalAssets: 0,
            totalIncome: 0,
            totalExpense: 0,
            bankAccounts: [],
            investmentAccounts: [],
            cards: [],
        };
    }
}
