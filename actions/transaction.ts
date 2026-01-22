"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";
import { syncDailyStat, syncInvestmentStat } from "@/lib/sync";

export async function createExpenseAction(data: any) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    // paymentMethodId: 선택한 계좌 또는 카드의 ID
    // methodType: 'BANK' | 'CARD'
    const { paymentMethodId, methodType, amount, date, description, categoryId } = data;
    const numericAmount = parseFloat(amount);
    const txDate = new Date(date);

    try {
        await prisma.$transaction(
            async tx => {
                // 1. 거래 내역 생성 (공통)
                const transactionData: any = {
                    userId: user.id,
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

                await syncDailyStat(user.id, txDate, numericAmount, "EXPENSE");
            },
            {
                maxWait: 5000, // 트랜잭션 시작을 기다리는 최대 시간
                timeout: 20000, // ⭐ 트랜잭션 수행 제한 시간 (20초로 증가)
            },
        );

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

    const { bankAccountId, type, amount, date, description, categoryId, toAccountId } = data;
    const numericAmount = parseFloat(amount);
    const txDate = new Date(date);

    if (!bankAccountId) return { success: false, message: "계좌 정보가 없습니다." };

    try {
        await prisma.$transaction(
            async tx => {
                // ✅ [CASE 1] 이체 (Transfer)
                if (type === "TRANSFER") {
                    if (!toAccountId) throw new Error("받는 계좌가 선택되지 않았습니다.");

                    const sourceBank = await tx.bankAccount.findUnique({
                        where: { id: bankAccountId },
                    });
                    if (!sourceBank) throw new Error("출금 계좌 정보를 찾을 수 없습니다.");

                    let targetName = "알 수 없는 계좌";
                    const targetBank = await tx.bankAccount.findUnique({
                        where: { id: toAccountId },
                    });
                    const targetInvest = !targetBank
                        ? await tx.investmentAccount.findUnique({ where: { id: toAccountId } })
                        : null;

                    if (targetBank) targetName = targetBank.name;
                    if (targetInvest) targetName = targetInvest.name;

                    // 1. 보내는 계좌 (무조건 BankAccount) -> 잔액 감소 & 지출 기록
                    await tx.moneyTransaction.create({
                        data: {
                            userId: user.id,
                            type: "EXPENSE",
                            amount: numericAmount,
                            date: new Date(date),
                            description: description || `이체 (To. ${targetName})`,
                            bankAccountId: bankAccountId,
                            categoryId: null,
                            isTransfer: true,
                        },
                    });

                    await tx.bankAccount.update({
                        where: { id: bankAccountId },
                        data: { currentBalance: { decrement: numericAmount } },
                    });

                    if (targetBank) {
                        // (A) 받는 쪽이 '은행'인 경우 -> Transaction 생성 & 잔액 증가
                        await tx.moneyTransaction.create({
                            data: {
                                userId: user.id,
                                type: "INCOME",
                                amount: numericAmount,
                                date: new Date(date),
                                description: description || `이체 (From. ${sourceBank.name})`,
                                bankAccountId: toAccountId,
                                categoryId: null,
                                isTransfer: true,
                            },
                        });
                        await tx.bankAccount.update({
                            where: { id: toAccountId },
                            data: { currentBalance: { increment: numericAmount } },
                        });
                    } else if (targetInvest) {
                        // (B) 은행 -> 투자 계좌 이체 (🔴 여기를 수정해야 합니다!)

                        // ✅ 1. [필수 추가] InvestmentLog 생성 (이게 빠져 있었습니다)
                        await tx.investmentLog.create({
                            data: {
                                investmentAccountId: toAccountId,
                                type: "DEPOSIT", // 입금 처리
                                amount: numericAmount,
                                date: new Date(date),
                                note: description || `이체 (From. ${sourceBank.name})`, // 출금 계좌명 기록
                            },
                        });

                        // ✅ 2. 투자 계좌 잔액(원금/평가금) 업데이트
                        await tx.investmentAccount.update({
                            where: { id: toAccountId },
                            data: {
                                investedAmount: { increment: numericAmount },
                                currentValuation: { increment: numericAmount },
                            },
                        });

                        // 3. ✅ [핵심] 순자산 보존 로직
                        // (1) 현금 통계에서는 '빠진 돈' 처리 (EXPENSE 취급하여 잔액 차감)
                        await syncDailyStat(user.id, txDate, numericAmount, "EXPENSE");

                        // (2) 투자 통계에서는 '들어온 돈' 처리 (미래 스냅샷 평가금 증가)
                        await syncInvestmentStat(toAccountId, txDate, numericAmount);
                    } else {
                        throw new Error("받는 계좌 정보를 찾을 수 없습니다.");
                    }
                } else {
                    // ... (일반 수입/지출 로직: 기존 코드 유지) ...
                    // ✅ 여기에 기존 로직(INCOME/EXPENSE 처리)을 그대로 두세요.
                    // (지면 관계상 생략했지만, 이전 답변의 else 블록을 그대로 쓰시면 됩니다.)
                    // 기존 코드 복붙 시작:
                    await tx.moneyTransaction.create({
                        data: {
                            userId: user.id,
                            type: type, // INCOME or EXPENSE
                            amount: numericAmount,
                            date: new Date(date),
                            description,
                            bankAccountId,
                            categoryId: categoryId || null,
                            isTransfer: false,
                        },
                    });

                    const balanceUpdate =
                        type === "INCOME"
                            ? { increment: numericAmount }
                            : { decrement: numericAmount };
                    await tx.bankAccount.update({
                        where: { id: bankAccountId },
                        data: { currentBalance: balanceUpdate },
                    });

                    // 일반 내역은 현금 자산 변동이므로 DailyStat 반영
                    await syncDailyStat(user.id, txDate, numericAmount, type);
                    // 기존 코드 끝
                }
            },
            {
                maxWait: 5000, // 트랜잭션 시작을 기다리는 최대 시간
                timeout: 20000, // ⭐ 트랜잭션 수행 제한 시간 (20초로 증가)
            },
        );

        revalidatePath(`/bank/${bankAccountId}`);
        revalidatePath("/");
        return { success: true, message: "이체가 완료되었습니다." };
    } catch (error: any) {
        console.error("Tx Error:", error);
        return { success: false, message: error.message || "오류가 발생했습니다." };
    }
}

export async function updateTransactionAction(data: any) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    const { transactionId, amount, date, description, categoryId } = data;
    const newAmount = parseFloat(amount);
    const newDate = new Date(date);

    try {
        await prisma.$transaction(
            async tx => {
                // 1. 기존 내역 가져오기 (이전 금액 알기 위해)
                const oldTx = await tx.moneyTransaction.findUnique({
                    where: { id: transactionId },
                });
                if (!oldTx) throw new Error("거래 내역이 존재하지 않습니다.");
                if (!oldTx.bankAccountId) {
                    throw new Error("연결된 계좌 정보가 없는 거래 내역입니다.");
                }

                // 2. 기존 잔액 원복 (Rollback)
                // 예: 예전에 10,000원을 썼으면(EXPENSE), 다시 10,000원을 더해줌
                if (oldTx.type === "INCOME") {
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { decrement: oldTx.amount } },
                    });
                } else {
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { increment: oldTx.amount } },
                    });
                }

                // 2-2. ✅ [통계 원복] 기존 날짜, 기존 금액을 '반대 부호'로 동기화
                if (!oldTx.isTransfer) {
                    await syncDailyStat(
                        user.id,
                        oldTx.date,
                        -oldTx.amount, // 마이너스 처리하여 효과 제거
                        oldTx.type as "INCOME" | "EXPENSE",
                    );
                }

                // 3. 새로운 내역으로 업데이트
                await tx.moneyTransaction.update({
                    where: { id: transactionId },
                    data: {
                        amount: newAmount,
                        date: new Date(date),
                        description,
                        categoryId: categoryId || null,
                        // type은 보통 수정하지 않도록 막거나, 수정 시 로직이 복잡해지므로
                        // 여기서는 type이 그대로 유지된다고 가정합니다.
                    },
                });

                // 4. 새로운 금액 반영 (Apply New)
                if (oldTx.type === "INCOME") {
                    // (타입 변경이 없다고 가정)
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { increment: newAmount } },
                    });
                } else {
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { decrement: newAmount } },
                    });
                }

                // 4-2. ✅ [새 통계 반영] 새로운 날짜, 새로운 금액으로 동기화
                if (!oldTx.isTransfer) {
                    await syncDailyStat(
                        user.id,
                        newDate,
                        newAmount,
                        oldTx.type as "INCOME" | "EXPENSE",
                    );
                }
            },
            {
                maxWait: 5000, // 트랜잭션 시작을 기다리는 최대 시간
                timeout: 20000, // ⭐ 트랜잭션 수행 제한 시간 (20초로 증가)
            },
        );

        revalidatePath("/");
        return { success: true, message: "수정되었습니다." };
    } catch (error: any) {
        return { success: false, message: error.message || "수정 중 오류 발생" };
    }
}

// ✅ [추가] 거래 내역 삭제
export async function deleteTransactionAction(transactionId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    try {
        await prisma.$transaction(
            async tx => {
                // 1. 삭제할 내역 조회
                const oldTx = await tx.moneyTransaction.findUnique({
                    where: { id: transactionId },
                });
                if (!oldTx) throw new Error("이미 삭제된 내역입니다.");
                if (!oldTx.bankAccountId) {
                    throw new Error("연결된 계좌 정보가 없는 거래 내역입니다.");
                }

                // 2. 잔액 원복 (Rollback)
                if (oldTx.type === "INCOME") {
                    // 수입을 지우니까 -> 잔액 감소
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { decrement: oldTx.amount } },
                    });
                } else {
                    // 지출을 지우니까 -> 잔액 증가
                    await tx.bankAccount.update({
                        where: { id: oldTx.bankAccountId },
                        data: { currentBalance: { increment: oldTx.amount } },
                    });
                }

                // 3. 통계 원복
                // 일반 수입/지출인 경우
                if (!oldTx.isTransfer) {
                    // 삭제는 반대 부호로 sync 호출
                    await syncDailyStat(
                        user.id,
                        oldTx.date,
                        -oldTx.amount,
                        oldTx.type as "INCOME" | "EXPENSE",
                    );
                } else {
                    // 4. ✅ [투자 이체 삭제 처리]
                    // 은행 -> 투자로 보낸 내역(EXPENSE & isTransfer)인 경우
                    // 연결된 InvestmentLog를 찾아서 지우고, 투자금도 원복해야 함.
                    if (oldTx.type === "EXPENSE" && oldTx.isTransfer) {
                        // 4-1. 연결된 투자 로그 찾기 (날짜, 금액, DEPOSIT 타입으로 추정)
                        // (정확한 매칭을 위해선 Transaction 모델에 investmentLogId를 추가하는게 좋지만, 현재 구조상 추정)
                        const relatedLog = await tx.investmentLog.findFirst({
                            where: {
                                date: oldTx.date,
                                amount: oldTx.amount,
                                type: "DEPOSIT",
                            },
                        });

                        if (relatedLog) {
                            // 4-2. 투자 계좌 잔액 원복 (입금 취소니까 뺌)
                            await tx.investmentAccount.update({
                                where: { id: relatedLog.investmentAccountId },
                                data: {
                                    investedAmount: { decrement: oldTx.amount },
                                    currentValuation: { decrement: oldTx.amount },
                                },
                            });

                            // 4-3. 투자 통계 원복 (스냅샷 감소)
                            await syncInvestmentStat(
                                relatedLog.investmentAccountId,
                                oldTx.date,
                                -oldTx.amount, // 마이너스 처리
                            );

                            // 4-4. 로그 삭제
                            await tx.investmentLog.delete({ where: { id: relatedLog.id } });
                        }

                        // 4-5. 은행 관점에서의 '지출(이체)' 취소이므로, 현금 통계(DailyStat)도 원복해줘야 함
                        // (이체를 취소했으니 내 현금 자산은 다시 늘어난 셈)
                        await syncDailyStat(user.id, oldTx.date, -oldTx.amount, "EXPENSE");
                    }
                }

                // 4. 내역 삭제
                await tx.moneyTransaction.delete({
                    where: { id: transactionId },
                });
            },
            {
                maxWait: 5000, // 트랜잭션 시작을 기다리는 최대 시간
                timeout: 20000, // ⭐ 트랜잭션 수행 제한 시간 (20초로 증가)
            },
        );

        revalidatePath("/");
        return { success: true, message: "삭제되었습니다." };
    } catch (error: any) {
        return { success: false, message: error.message || "삭제 중 오류 발생" };
    }
}
