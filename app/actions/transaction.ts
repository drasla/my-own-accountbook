"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";
import { TxType } from "@prisma/client";

export async function createExpenseAction(data: any) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    // paymentMethodId: 선택한 계좌 또는 카드의 ID
    // methodType: 'BANK' | 'CARD'
    const { paymentMethodId, methodType, amount, date, description, categoryId } = data;
    const numericAmount = parseFloat(amount);

    try {
        await prisma.$transaction(async tx => {
            // 1. 거래 내역 생성 (공통)
            const transactionData: any = {
                type: "EXPENSE",
                amount: numericAmount,
                date: new Date(date),
                description,
                categoryId: categoryId || null,
            };

            // 연결 고리 설정
            if (methodType === "BANK") {
                transactionData.bankAccountId = paymentMethodId;
            } else {
                transactionData.cardId = paymentMethodId;
            }

            await tx.moneyTransaction.create({ data: transactionData });

            // 2. 잔액/사용액 업데이트 (여기가 핵심!)
            if (methodType === "BANK") {
                // 계좌는 돈이 나감 (잔액 감소)
                await tx.bankAccount.update({
                    where: { id: paymentMethodId },
                    data: { currentBalance: { decrement: numericAmount } },
                });
            } else {
                // 카드는 빚이 늘어남 (사용액 증가)
                await tx.card.update({
                    where: { id: paymentMethodId },
                    data: { currentBalance: { increment: numericAmount } },
                });
            }
        });

        revalidatePath("/"); // 대시보드 갱신
        return { success: true, message: "지출이 기록되었습니다." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "오류가 발생했습니다." };
    }
}

export async function createBankTransactionAction(data: any) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    const { bankAccountId, type, amount, date, description, categoryId } = data;
    const numericAmount = parseFloat(amount);

    if (!bankAccountId) return { success: false, message: "계좌 정보가 없습니다." };

    try {
        await prisma.$transaction(async tx => {
            // 1. 거래 내역 생성
            await tx.moneyTransaction.create({
                data: {
                    type: type as TxType, // INCOME | EXPENSE
                    amount: numericAmount,
                    date: new Date(date),
                    description,
                    bankAccountId: bankAccountId, // 계좌 연결
                    categoryId: categoryId || null,
                },
            });

            // 2. 잔액 업데이트
            if (type === "INCOME") {
                // 수입: 잔액 증가 (+)
                await tx.bankAccount.update({
                    where: { id: bankAccountId },
                    data: { currentBalance: { increment: numericAmount } },
                });
            } else {
                // 지출: 잔액 감소 (-)
                await tx.bankAccount.update({
                    where: { id: bankAccountId },
                    data: { currentBalance: { decrement: numericAmount } },
                });
            }
        });

        revalidatePath(`/bank/${bankAccountId}`); // 해당 페이지 갱신
        revalidatePath("/"); // 대시보드 갱신
        return { success: true, message: "거래 내역이 추가되었습니다." };
    } catch (error) {
        console.error("Create Bank Tx Error:", error);
        return { success: false, message: "오류가 발생했습니다." };
    }
}
