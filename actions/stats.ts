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

export interface NetWorthTrendItem {
    date: string; // "MM.DD"
    netWorth: number; // 순자산
    assets: number; // 총 자산 (은행 + 투자)
    liabilities: number; // 총 부채 (카드)
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

export async function getNetWorthTrendAction(year: number, month: number) {
    const user = await getCurrentUser();
    if (!user) return [];

    const startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    try {
        // 1. [현재] 시점의 자산/부채 상태 조회
        const [banks, cards, investments] = await Promise.all([
            prisma.bankAccount.findMany({ where: { userId: user.id } }),
            prisma.card.findMany({ where: { userId: user.id } }),
            prisma.investmentAccount.findMany({ where: { userId: user.id } }),
        ]);

        // 현재 유동자산 (은행 + 현금)
        const currentLiquidAssets = banks.reduce((sum, b) => sum + b.currentBalance, 0);
        // 현재 부채 (카드값)
        const currentLiabilities = cards.reduce((sum, c) => sum + c.currentBalance, 0);
        // 현재 투자자산
        const currentInvestments = investments.reduce((sum, i) => sum + i.currentValuation, 0);

        // 2. 이번 달 [거래 내역] 조회 (수입/지출만, 이체 제외)
        const transactions = await prisma.moneyTransaction.findMany({
            where: {
                userId: user.id,
                date: { gte: startDate, lte: endDate },
                type: { in: ["INCOME", "EXPENSE"] },
                isTransfer: false, // 이체(카드대금 납부 등)는 순자산 변동 없음
            },
            orderBy: { date: "desc" }, // 역산하기 위해 최신순 정렬
        });

        // 3. 이번 달 [투자 스냅샷] 조회
        const snapshots = await prisma.investmentSnapshot.findMany({
            where: {
                investmentAccount: { userId: user.id },
                date: { gte: startDate, lte: endDate },
            },
        });

        // 투자 스냅샷을 날짜별로 묶기 (Map<"YYYY-MM-DD", 총평가금>)
        const investmentMap = new Map<string, number>();
        snapshots.forEach(snap => {
            const dateKey = dayjs(snap.date).format("YYYY-MM-DD");
            investmentMap.set(dateKey, (investmentMap.get(dateKey) || 0) + snap.totalValue);
        });

        // 4. 날짜별 데이터 생성 (오늘 -> 1일 역순 계산)
        const daysInMonth = dayjs(startDate).daysInMonth();
        const result: NetWorthTrendItem[] = [];
        const todayStr = dayjs().format("YYYY-MM-DD");

        // "유동 자산 - 부채" (순수 현금성 자산)의 변동을 추적할 변수
        let trackingLiquidNet = currentLiquidAssets - currentLiabilities;

        // 오늘 날짜 이후의 미래 데이터는 보여주지 않기 위해 루프 조정
        const lastDayToProcess = Math.min(daysInMonth, dayjs().date());

        // 계산 편의를 위해 Transaction을 Map으로 변환
        const txMap = new Map<string, { income: number; expense: number }>();
        transactions.forEach(tx => {
            const d = dayjs(tx.date).format("YYYY-MM-DD");
            const val = txMap.get(d) || { income: 0, expense: 0 };
            if (tx.type === "INCOME") val.income += tx.amount;
            else val.expense += tx.amount;
            txMap.set(d, val);
        });

        // 역순 루프 (오늘 -> 1일)
        for (let i = lastDayToProcess; i >= 1; i--) {
            const dateObj = dayjs(`${year}-${month}-${i}`);
            const dateKey = dateObj.format("YYYY-MM-DD");

            // 1. 해당 날짜의 투자 자산 확인
            // (스냅샷이 없으면 가장 최근인 현재 값 혹은 0 처리. 여기선 없으면 0으로 가정하되 로직 보완 가능)
            // *과거 데이터가 없다면 정확도가 떨어질 수 있음*
            const dailyInvest = investmentMap.has(dateKey)
                ? investmentMap.get(dateKey)!
                : dateKey === todayStr
                  ? currentInvestments
                  : 0; // 오늘인데 스냅샷 없으면 현재가

            // 2. 현재 trackingLiquidNet은 "이 날짜의 마감(End of Day)" 기준임.
            // 기록을 배열에 추가
            result.push({
                date: dateObj.format("MM.DD"),
                netWorth: trackingLiquidNet + dailyInvest,
                assets: 0, // 상세 표시는 생략하거나 별도 계산 필요 (여기선 순자산 위주)
                liabilities: 0,
            });

            // 3. 다음 루프(어제)로 가기 위해, 오늘의 변동분을 '제거' (역산)
            // 어제 잔액 = 오늘 잔액 - 수입 + 지출
            const dayTx = txMap.get(dateKey);
            if (dayTx) {
                trackingLiquidNet = trackingLiquidNet - dayTx.income + dayTx.expense;
            }
        }

        // 날짜 오름차순 정렬
        return result.sort((a, b) => (a.date > b.date ? 1 : -1));
    } catch (error) {
        console.error("Net Worth Trend Error:", error);
        return [];
    }
}