"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

// 1. 카드 상세 조회
export async function getCardDetail(cardId: string, startDate?: string, endDate?: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        // 날짜 필터
        const dateFilter =
            startDate && endDate
                ? {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                  }
                : undefined;

        const card = await prisma.card.findUnique({
            where: { id: cardId, userId: user.id },
            include: {
                linkedBankAccount: true, // 연결된 계좌 정보 가져오기
                transactions: {
                    where: {
                        date: dateFilter,
                    },
                    orderBy: { date: "desc" },
                    include: { category: true },
                    take: dateFilter ? undefined : 30, // 필터 없으면 30개만
                },
            },
        });
        return card;
    } catch (error) {
        console.error("Card Detail Error:", error);
        return null;
    }
}

// 2. 카드 대금 납부 (핵심 기능)
export async function payCardBillAction(data: {
    cardId: string;
    bankAccountId: string;
    amount: number;
    date: string;
}) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    const { cardId, bankAccountId, amount, date } = data;

    try {
        await prisma.$transaction(async tx => {
            // (1) 출금 계좌 잔액 확인 및 차감
            const bank = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
            if (!bank) throw new Error("출금 계좌를 찾을 수 없습니다.");
            if (bank.currentBalance < amount) throw new Error("계좌 잔액이 부족합니다.");

            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: { currentBalance: { decrement: amount } },
            });

            // (2) 카드 사용액(부채) 차감
            const card = await tx.card.findUnique({ where: { id: cardId } });
            if (!card) throw new Error("카드를 찾을 수 없습니다.");

            await tx.card.update({
                where: { id: cardId },
                data: { currentBalance: { decrement: amount } },
            });

            // (3) 거래 기록 남기기 (이체/지출 성격)
            // '이체'로 기록하여 지출 통계 중복을 막을지, '지출'로 할지 결정 필요.
            // 보통 카드 대금 납부는 '이체(Transfer)'로 처리하여 통계에서 제외하는 게 일반적입니다.
            await tx.moneyTransaction.create({
                data: {
                    userId: user.id,
                    type: "EXPENSE", // 돈이 나감
                    amount: amount,
                    date: new Date(date),
                    description: `카드대금 납부 (${card.name})`,
                    bankAccountId: bankAccountId,
                    cardId: cardId,
                    isTransfer: true, // ✅ 통계 제외용 플래그 (카드 쓸 때 이미 지출로 잡혔으므로)
                },
            });
        });

        revalidatePath(`/cards/${cardId}`);
        revalidatePath("/");
        return { success: true, message: "카드 대금이 납부되었습니다." };
    } catch (error: any) {
        return { success: false, message: error.message || "오류 발생" };
    }
}

// 3. 카드 삭제
export async function deleteCardAction(cardId: string) {
    try {
        await prisma.card.delete({ where: { id: cardId } });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
