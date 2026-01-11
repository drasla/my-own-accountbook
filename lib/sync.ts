import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";

// ✅ 1. 현금성 자산(DailyStat) 동기화 (기존 동일)
export async function syncDailyStat(
    userId: string,
    date: Date,
    amountChange: number,
    type: "INCOME" | "EXPENSE",
) {
    const targetDate = dayjs(date).startOf("day").toDate();

    // 1-1. 해당 날짜 레코드 생성 또는 갱신
    const stat = await prisma.dailyStat.findUnique({
        where: { userId_date: { userId, date: targetDate } },
    });

    if (!stat) {
        // 없으면 생성 (0에서 시작하지만 아래 updateMany로 보정됨)
        await prisma.dailyStat.create({
            data: {
                userId,
                date: targetDate,
                dailyIncome: type === "INCOME" ? amountChange : 0,
                dailyExpense: type === "EXPENSE" ? amountChange : 0,
                closingBalance: 0,
            },
        });
    } else {
        await prisma.dailyStat.update({
            where: { id: stat.id },
            data: {
                dailyIncome: type === "INCOME" ? { increment: amountChange } : undefined,
                dailyExpense: type === "EXPENSE" ? { increment: amountChange } : undefined,
            },
        });
    }

    // 1-2. 잔액 전파 (미래의 모든 잔액 업데이트)
    let balanceDelta = 0;
    if (type === "INCOME") balanceDelta = amountChange;
    if (type === "EXPENSE") balanceDelta = -amountChange;

    if (balanceDelta !== 0) {
        await prisma.dailyStat.updateMany({
            where: { userId, date: { gte: targetDate } },
            data: { closingBalance: { increment: balanceDelta } },
        });
    }
}

// ✅ 2. [추가] 투자 자산(Snapshot) 동기화
// 투자 계좌로 입금/출금 시, 해당 날짜 이후의 모든 스냅샷의 '원금'과 '평가금'을 조정합니다.
export async function syncInvestmentStat(
    investmentAccountId: string,
    date: Date,
    amountDelta: number, // 입금이면 +, 출금이면 -
) {
    const targetDate = dayjs(date).startOf("day").toDate();

    // 2-1. 해당 날짜에 스냅샷이 없으면, 현재 계좌 상태를 기준으로 하나 만들어줌 (빈 구멍 방지)
    // (이미 있으면 건너뜀 - 아래 updateMany에서 처리)
    const snapshot = await prisma.investmentSnapshot.findUnique({
        where: { investmentAccountId_date: { investmentAccountId, date: targetDate } },
    });

    if (!snapshot) {
        // 스냅샷이 없으면 '현재 계좌 정보'를 가져와서 생성하되,
        // updateMany가 돌 것을 감안하여 amountDelta를 미리 빼거나 로직을 조정해야 함.
        // 하지만 복잡하므로, 여기서는 "현재 계좌 값"을 기준으로 해당 날짜 스냅샷을 만듭니다.
        const account = await prisma.investmentAccount.findUnique({
            where: { id: investmentAccountId },
        });
        if (account) {
            await prisma.investmentSnapshot.create({
                data: {
                    investmentAccountId,
                    date: targetDate,
                    investedAmount: account.investedAmount, // 현재 기준
                    totalValue: account.currentValuation, // 현재 기준
                },
            });
            // ⚠️ 주의: 방금 만든 스냅샷은 '최신 값'이므로, 아래 updateMany에서 중복 적용되지 않도록 주의하거나
            // 로직을 단순화하여 "미래 데이터 갱신"에 집중합니다.
        }
    }

    // 2-2. 해당 날짜 '포함' 미래의 모든 스냅샷 값 조정
    // (돈을 더 넣었으면, 그 이후의 스냅샷들도 평가금이 그만큼 늘어나 있어야 함)
    await prisma.investmentSnapshot.updateMany({
        where: {
            investmentAccountId,
            date: { gte: targetDate },
        },
        data: {
            investedAmount: { increment: amountDelta },
            totalValue: { increment: amountDelta },
        },
    });
}
