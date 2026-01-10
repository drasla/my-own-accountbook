"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";

export async function getAllAssetsAction() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const [banks, investments, cards] = await Promise.all([
            prisma.bankAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentBalance: "desc" },
            }),
            prisma.investmentAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentValuation: "desc" },
            }),
            prisma.card.findMany({
                where: { userId: user.id },
                orderBy: { currentBalance: "desc" },
            }),
        ]);

        // 요약 계산
        const totalBank = banks.reduce((acc, cur) => acc + cur.currentBalance, 0);
        const totalInvest = investments.reduce((acc, cur) => acc + cur.currentValuation, 0);
        const totalCard = cards.reduce((acc, cur) => acc + cur.currentBalance, 0);

        return {
            banks,
            investments,
            cards,
            summary: {
                totalAsset: totalBank + totalInvest, // 총 자산
                totalLiability: totalCard, // 총 부채
                netWorth: totalBank + totalInvest - totalCard, // 순자산
            },
        };
    } catch (error) {
        console.error("Get All Assets Error:", error);
        return null;
    }
}
