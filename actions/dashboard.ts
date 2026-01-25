"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import dayjs from "@/lib/dayjs"; // ✅ Timezone 설정된 dayjs

export async function getDashboardDataAction() {
    const user = await getCurrentUser();
    if (!user) return null;

    // 1. 날짜 기준 설정 (KST 00:00 ~ 23:59)
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();

    // 어제 범위 (투자 변동분 계산용)
    const yesterdayStart = dayjs().subtract(1, "day").startOf("day").toDate();
    const yesterdayEnd = dayjs().subtract(1, "day").endOf("day").toDate();

    // 차트 조회 시작일 (최근 7일)
    const chartStartDate = dayjs().subtract(7, "day").startOf("day").toDate();

    // 2. 데이터 병렬 조회
    const [banks, cards, investments, dailyStats, investSnapshots, todaysTransactions] =
        await Promise.all([
            // (A) 자산 및 부채 현재 잔액
            prisma.bankAccount.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "asc" },
            }),
            prisma.card.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),

            // (B) 투자 자산 (어제 스냅샷 포함 -> 일간 변동 계산용)
            prisma.investmentAccount.findMany({
                where: { userId: user.id },
                include: {
                    investmentSnapshots: {
                        where: { date: { gte: yesterdayStart, lte: yesterdayEnd } },
                        take: 1,
                    },
                },
                orderBy: { createdAt: "asc" },
            }),

            // (C) 차트용 과거 데이터
            prisma.dailyStat.findMany({
                where: { userId: user.id, date: { gte: chartStartDate } },
                orderBy: { date: "asc" },
            }),
            prisma.investmentSnapshot.findMany({
                where: { investmentAccount: { userId: user.id }, date: { gte: chartStartDate } },
                orderBy: { date: "asc" },
            }),

            // (D) 오늘의 거래 내역
            // ✅ [수정] 1차 date(거래일), 2차 createdAt(입력순) 내림차순 정렬
            prisma.moneyTransaction.findMany({
                where: {
                    userId: user.id,
                    date: { gte: todayStart, lte: todayEnd },
                },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                // ✅ [수정] 통장명, 카드명, 카테고리명 포함
                include: {
                    bankAccount: { select: { name: true } },
                    card: { select: { name: true } },
                    category: { select: { name: true } },
                },
            }),
        ]);

    // 3. 자산 요약 (Summary)
    const currentCash = banks.reduce((sum, b) => sum + b.currentBalance, 0);
    const currentDebt = cards.reduce((sum, c) => sum + c.currentBalance, 0);
    const currentInvest = investments.reduce((sum, i) => sum + i.currentValuation, 0);
    const currentNetWorth = currentCash + currentInvest - currentDebt;

    // 4. Sparkline 차트 데이터 생성 (최근 7일)
    const historyMap = new Map<string, { cash: number; invest: number }>();

    dailyStats.forEach(stat => {
        const key = dayjs(stat.date).tz().format("YYYY-MM-DD");
        const curr = historyMap.get(key) || { cash: 0, invest: 0 };
        curr.cash = stat.closingBalance;
        historyMap.set(key, curr);
    });

    investSnapshots.forEach(snap => {
        const key = dayjs(snap.date).tz().format("YYYY-MM-DD");
        const curr = historyMap.get(key) || { cash: 0, invest: 0 };
        curr.invest += snap.totalValue;
        historyMap.set(key, curr);
    });

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, "day");
        const key = d.format("YYYY-MM-DD");

        if (i === 0) {
            chartData.push({
                date: key,
                netWorth: currentNetWorth,
                cash: currentCash - currentDebt,
                invest: currentInvest,
            });
        } else {
            const data = historyMap.get(key);
            const cashVal = data?.cash || 0;
            const investVal = data?.invest || 0;
            chartData.push({
                date: key,
                netWorth: cashVal + investVal,
                cash: cashVal,
                invest: investVal,
            });
        }
    }

    // 5. 어제 대비 순자산 증감
    const todayData = chartData[chartData.length - 1];
    const yesterdayData = chartData[chartData.length - 2] || todayData;

    const diff = {
        netWorth: todayData.netWorth - yesterdayData.netWorth,
        cash: todayData.cash - yesterdayData.cash,
        invest: todayData.invest - yesterdayData.invest,
    };

    // 6. [핵심 수정] 투자 계좌별 '수익금 변동' 및 '수익률 변화(%p)' 계산
    const investmentPerformance = investments
        .map(account => {
            const yesterdaySnapshot = account.investmentSnapshots[0];

            // (A) 오늘 상태
            const currentProfit = account.currentValuation - account.investedAmount;
            const currentROI =
                account.investedAmount === 0 ? 0 : (currentProfit / account.investedAmount) * 100;

            // (B) 어제 상태 (스냅샷 활용)
            let yesterdayProfit = 0;
            let yesterdayROI = 0;

            if (yesterdaySnapshot) {
                yesterdayProfit = yesterdaySnapshot.totalValue - yesterdaySnapshot.investedAmount;
                yesterdayROI =
                    yesterdaySnapshot.investedAmount === 0
                        ? 0
                        : (yesterdayProfit / yesterdaySnapshot.investedAmount) * 100;
            } else {
                // 어제 데이터 없으면 오늘과 동일하게 처리 (변동 0)
                yesterdayProfit = currentProfit;
                yesterdayROI = currentROI;
            }

            // (C) 변동 계산
            // 1. 수익금 증감액 (오늘 수익 - 어제 수익)
            const dailyProfitChange = currentProfit - yesterdayProfit;

            // 2. 수익률 변화량 (오늘 수익률 - 어제 수익률) -> %p 단위
            const roiChange = currentROI - yesterdayROI;

            return {
                id: account.id,
                name: account.name,
                currentValuation: account.currentValuation,

                // UI용 데이터
                dailyChange: dailyProfitChange, // 수익금 변동 (원)
                dailyChangeRate: roiChange, // 수익률 변동 (%p)
            };
        })
        .sort((a, b) => b.dailyChange - a.dailyChange); // 수익금 많이 늘어난 순 정렬

    return {
        summary: {
            currentNetWorth,
            currentCash,
            currentDebt,
            currentInvest,
        },
        diff,
        chartData,
        accounts: {
            banks,
            cards,
            investments,
        },
        todaysTransactions,
        investmentPerformance,
    };
}
