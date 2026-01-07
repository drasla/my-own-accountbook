"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";
import { BankType, CardType, InvestType } from "@prisma/client";

interface CreateBankInput {
    name: string;
    type: BankType;
    currentBalance: number | string;
}

interface CreateInvestInput {
    name: string;
    detailType: InvestType;
    currentValuation: number | string;
    accountOpenDate?: string;
}

interface CreateCardInput {
    name: string;
    type: CardType;
    paymentDate?: number | string;
    linkedBankAccountId?: string; // 연결 계좌 ID (선택)
}

// 1. 은행 계좌 생성
export async function createBankAccountAction(data: CreateBankInput) {
    console.log("🔄 [Bank] 생성 요청 데이터:", data); // 요청 데이터 확인

    const user = await getCurrentUser();
    if (!user) {
        console.error("❌ [Bank] 로그인 유저 없음");
        return { success: false, message: "로그인이 필요합니다." };
    }

    try {
        const result = await prisma.bankAccount.create({
            data: {
                userId: user.id,
                name: data.name,
                type: data.type,
                currentBalance: Number(data.currentBalance) || 0,
            },
        });
        console.log("✅ [Bank] 생성 성공:", result);

        revalidatePath("/");
        return { success: true, message: "계좌가 생성되었습니다." };
    } catch (e) {
        console.error("❌ [Bank] 생성 에러 상세:", e); // 🔥 여기가 핵심입니다!
        return { success: false, message: "계좌 생성 중 오류가 발생했습니다." };
    }
}

// 2. 투자 계좌 생성
export async function createInvestmentAccountAction(data: CreateInvestInput) {
    console.log("🔄 [Invest] 생성 요청 데이터:", data);

    const user = await getCurrentUser();
    if (!user) {
        console.error("❌ [Invest] 로그인 유저 없음");
        return { success: false, message: "로그인이 필요합니다." };
    }

    try {
        const valuation = Number(data.currentValuation) || 0;

        // ✅ 날짜 변환 (없으면 오늘)
        const openDate = data.accountOpenDate ? new Date(data.accountOpenDate) : new Date();

        // 트랜잭션으로 처리 (계좌 생성 + 초기 입금 로그)
        await prisma.$transaction(async tx => {
            const newAccount = await tx.investmentAccount.create({
                data: {
                    userId: user.id,
                    name: data.name,
                    detailType: data.detailType,
                    investedAmount: valuation,
                    currentValuation: valuation,
                    accountOpenDate: openDate, // ✅ DB 저장
                },
            });

            // 초기 금액이 있으면 로그 남기기 (그래야 입출금 내역에 뜸)
            if (valuation > 0) {
                await tx.investmentLog.create({
                    data: {
                        investmentAccountId: newAccount.id,
                        type: "DEPOSIT",
                        amount: valuation,
                        date: openDate, // 개설일 기준으로 로그 생성
                        note: "초기 잔액 설정",
                    },
                });
            }
        });

        revalidatePath("/");
        return { success: true, message: "투자 계좌가 생성되었습니다." };
    } catch (e) {
        console.error("❌ [Invest] 생성 에러 상세:", e); // 🔥 에러 확인
        return { success: false, message: "투자 계좌 생성 중 오류가 발생했습니다." };
    }
}

// 3. 카드 생성
export async function createCardAction(data: CreateCardInput) {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: "로그인이 필요합니다." };
    }

    try {
        const result = await prisma.card.create({
            data: {
                userId: user.id,
                name: data.name,
                type: data.type,
                paymentDate: data.paymentDate ? Number(data.paymentDate) : null,
                currentBalance: 0,
                linkedBankAccountId: data.linkedBankAccountId || null,
            },
        });

        revalidatePath("/");
        return { success: true, message: "카드가 생성되었습니다." };
    } catch (e) {
        console.error("❌ [Card] 생성 에러 상세:", e); // 🔥 에러 확인
        return { success: false, message: "카드 생성 중 오류가 발생했습니다." };
    }
}
