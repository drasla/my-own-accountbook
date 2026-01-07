"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { TxType } from "@prisma/client";
import dayjs from "dayjs";

export interface StatItem {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    count: number;
    [key: string]: string | number;
}

export interface InvestmentTrendItem {
    date: string; // "MM.DD"
    totalValue: number; // 총 평가금 (모든 계좌 합)
    investedAmount: number; // 총 원금
    roi: number; // 통합 수익률 (%)
}

export async function getMonthlyStatsAction(year: number, month: number, type: TxType) {
    const user = await getCurrentUser();
    if (!user) return { totalAmount: 0, stats: [] };

    // 1. 날짜 범위 계산 (해당 월 1일 ~ 말일)
    const startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    try {
        // 2. 해당 기간, 해당 타입의 내역 모두 조회
        const transactions = await prisma.moneyTransaction.findMany({
            where: {
                userId: user.id,
                type: type, // INCOME or EXPENSE
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                // 카테고리가 없는 내역(이체 등)은 제외하거나 별도 처리
                categoryId: { not: null },
            },
            include: {
                category: true,
            },
        });

        // 3. 전체 합계 계산
        const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

        if (totalAmount === 0) {
            return { totalAmount: 0, stats: [] };
        }

        // 4. 카테고리별 그룹화 및 합계 계산
        const statsMap = new Map<string, StatItem>();

        transactions.forEach(tx => {
            if (!tx.category) return;

            const catId = tx.categoryId!;
            const current = statsMap.get(catId) || {
                categoryId: catId,
                categoryName: tx.category.name,
                amount: 0,
                percentage: 0,
                count: 0,
            };

            current.amount += tx.amount;
            current.count += 1;
            statsMap.set(catId, current);
        });

        // 5. 배열로 변환하고 비율(%) 계산 및 정렬 (금액 큰 순)
        const stats = Array.from(statsMap.values())
            .map(item => ({
                ...item,
                percentage: (item.amount / totalAmount) * 100,
            }))
            .sort((a, b) => b.amount - a.amount);

        return { totalAmount, stats };
    } catch (error) {
        console.error("Stats Error:", error);
        return { totalAmount: 0, stats: [] };
    }
}

export async function getInvestmentTrendAction(year: number, month: number) {
    const user = await getCurrentUser();
    if (!user) return [];

    const startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    try {
        // 1. 기간 내 내 모든 투자 계좌의 스냅샷 조회
        const snapshots = await prisma.investmentSnapshot.findMany({
            where: {
                investmentAccount: {
                    userId: user.id, // 내 계좌의 스냅샷만
                },
                date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: "asc" },
        });

        // 2. 날짜별로 그룹화하여 합산
        const dailyMap = new Map<string, { totalValue: number; investedAmount: number }>();

        snapshots.forEach(snap => {
            const dateKey = dayjs(snap.date).format("MM.DD");

            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { totalValue: 0, investedAmount: 0 });
            }

            const current = dailyMap.get(dateKey)!;
            current.totalValue += snap.totalValue;
            current.investedAmount += snap.investedAmount;
        });

        // 3. 수익률 계산 및 배열 변환
        const result: InvestmentTrendItem[] = Array.from(dailyMap.entries()).map(([date, data]) => {
            let roi = 0;
            if (data.investedAmount > 0) {
                const profit = data.totalValue - data.investedAmount;
                roi = (profit / data.investedAmount) * 100;
            }

            return {
                date,
                totalValue: data.totalValue,
                investedAmount: data.investedAmount,
                roi: parseFloat(roi.toFixed(2)), // 소수점 2자리
            };
        });

        // 날짜순 정렬 (Map 순서 보장되지만 확실하게)
        return result.sort((a, b) => (a.date > b.date ? 1 : -1));
    } catch (error) {
        console.error("Investment Trend Error:", error);
        return [];
    }
}
