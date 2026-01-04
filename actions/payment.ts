"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";

export type PaymentMethod = {
    id: string;
    name: string;
    type: "BANK" | "CARD";
    balance: number; // 계좌면 잔액, 카드면 누적 사용액
    label: string; // UI 표시용 (예: [계좌] 월급통장)
};

export async function getPaymentMethodsAction(): Promise<PaymentMethod[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const [accounts, cards] = await Promise.all([
            prisma.bankAccount.findMany({
                where: { userId: user.id },
                orderBy: { currentBalance: "desc" },
            }),
            prisma.card.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // 1. 은행 계좌 포맷팅
        const bankOptions: PaymentMethod[] = accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: "BANK",
            balance: acc.currentBalance,
            label: `[계좌] ${acc.name} (잔액: ${acc.currentBalance.toLocaleString()}원)`,
        }));

        // 2. 카드 포맷팅
        const cardOptions: PaymentMethod[] = cards.map(card => ({
            id: card.id,
            name: card.name,
            type: "CARD",
            balance: card.currentBalance,
            label: `[카드] ${card.name} (사용: ${card.currentBalance.toLocaleString()}원)`,
        }));

        // 하나로 합쳐서 반환
        return [...bankOptions, ...cardOptions];
    } catch (error) {
        console.error(error);
        return [];
    }
}
