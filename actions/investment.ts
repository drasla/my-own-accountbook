"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";

// 상세 정보 가져오기
export async function getInvestmentDetail(accountId: string, startDate?: string, endDate?: string) {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        const dateFilter =
            startDate && endDate
                ? {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                  }
                : undefined;

        return await prisma.investmentAccount.findUnique({
            where: { id: accountId, userId: user.id },
            include: {
                // 1. 입출금 로그 (기간 필터 적용)
                investmentLogs: {
                    where: {
                        date: dateFilter, // 날짜 범위가 있으면 적용
                    },
                    orderBy: { date: "desc" },
                    // 날짜 지정이 없으면 최근 30개, 있으면 제한 없음
                    take: dateFilter ? undefined : 30,
                },
                // 2. 차트 스냅샷 (기간 필터 적용)
                investmentSnapshots: {
                    where: {
                        date: dateFilter,
                    },
                    orderBy: { date: "asc" },
                    take: dateFilter ? undefined : 90,
                },
            },
        });
    } catch (error) {
        return null;
    }
}

// 평가금액 수동 업데이트 (핵심 기능)
export async function updateValuationAction(accountId: string, newValuation: number) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    try {
        // 1. 현재 계좌 정보 가져오기 (현재 원금을 알기 위해)
        const account = await prisma.investmentAccount.findUnique({
            where: { id: accountId },
        });
        if (!account) throw new Error("계좌 없음");

        await prisma.$transaction(async tx => {
            // 2. 계좌 평가금 업데이트
            await tx.investmentAccount.update({
                where: { id: accountId },
                data: { currentValuation: newValuation },
            });

            // 3. 스냅샷(히스토리) 생성 - 차트용
            // 같은 날짜에 이미 스냅샷이 있으면 업데이트, 없으면 생성
            const today = new Date();
            today.setHours(0, 0, 0, 0); // 시간 절삭

            await tx.investmentSnapshot.upsert({
                where: {
                    investmentAccountId_date: {
                        investmentAccountId: accountId,
                        date: today,
                    },
                },
                update: {
                    totalValue: newValuation,
                    investedAmount: account.investedAmount, // 원금은 그대로 유지
                },
                create: {
                    investmentAccountId: accountId,
                    date: today,
                    totalValue: newValuation,
                    investedAmount: account.investedAmount,
                },
            });
        });

        revalidatePath(`/investment/${accountId}`);
        revalidatePath("/");
        return { success: true, message: "반영되었습니다." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "오류가 발생했습니다." };
    }
}

// 삭제
export async function deleteInvestmentAccountAction(id: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "권한 없음" };

    await prisma.investmentAccount.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
}

// 투자금 입출금 기록 추가 (수동)
export async function addInvestmentLogAction(data: {
    accountId: string;
    type: "DEPOSIT" | "WITHDRAW" | "DIVIDEND"; // DEPOSIT: 투입, WITHDRAW: 회수, DIVIDEND: 배당금
    amount: number;
    date: string;
    note?: string;
}) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    const { accountId, type, amount, date, note } = data;
    const numericAmount = Number(amount);

    try {
        await prisma.$transaction(async tx => {
            // 1. 로그 생성
            await tx.investmentLog.create({
                data: {
                    investmentAccountId: accountId,
                    type,
                    amount: numericAmount,
                    date: new Date(date),
                    note,
                },
            });

            // 2. 계좌 잔액 업데이트
            // 입금(DEPOSIT) -> 원금 증가, 평가금 증가
            // 출금(WITHDRAW) -> 원금 감소, 평가금 감소
            if (type === "DEPOSIT") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { increment: numericAmount },
                        currentValuation: { increment: numericAmount },
                    },
                });
            } else if (type === "WITHDRAW") {
                // [출금] 원금 감소 O, 평가금 감소 O
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { decrement: numericAmount },
                        currentValuation: { decrement: numericAmount },
                    },
                });
            } else if (type === "DIVIDEND") {
                // ✅ [배당] 원금 변동 X, 평가금 증가 O, 누적배당금 증가 O
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        // investedAmount는 건드리지 않음!
                        cumulativeDividend: { increment: numericAmount },
                        currentValuation: { increment: numericAmount },
                    },
                });
            }
        });

        revalidatePath(`/investment/${accountId}`);
        return { success: true, message: "기록되었습니다." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "오류가 발생했습니다." };
    }
}

// 투자 로그 수정
export async function updateInvestmentLogAction(data: {
    logId: string;
    type: "DEPOSIT" | "WITHDRAW" | "DIVIDEND";
    amount: number;
    date: string;
    note?: string;
}) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    try {
        await prisma.$transaction(async tx => {
            // 1. 기존 로그 조회
            const oldLog = await tx.investmentLog.findUnique({
                where: { id: data.logId },
                include: { investmentAccount: true },
            });
            if (!oldLog) throw new Error("로그를 찾을 수 없습니다.");

            const accountId = oldLog.investmentAccountId;

            // 2. [Rollback] 기존 로그가 계좌에 미친 영향 취소하기
            // (예: 예전에 입금했었다면, 그만큼 원금을 다시 빼줘야 함)
            if (oldLog.type === "DEPOSIT") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { decrement: oldLog.amount },
                        currentValuation: { decrement: oldLog.amount },
                    },
                });
            } else if (oldLog.type === "WITHDRAW") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { increment: oldLog.amount },
                        currentValuation: { increment: oldLog.amount },
                    },
                });
            } else if (oldLog.type === "DIVIDEND") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        cumulativeDividend: { decrement: oldLog.amount },
                        currentValuation: { decrement: oldLog.amount },
                    },
                });
            }

            // 3. 로그 데이터 업데이트
            await tx.investmentLog.update({
                where: { id: data.logId },
                data: {
                    type: data.type,
                    amount: Number(data.amount),
                    date: new Date(data.date),
                    note: data.note,
                },
            });

            // 4. [Apply] 새로운 데이터로 계좌 다시 업데이트
            const newAmount = Number(data.amount);
            if (data.type === "DEPOSIT") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { increment: newAmount },
                        currentValuation: { increment: newAmount },
                    },
                });
            } else if (data.type === "WITHDRAW") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { decrement: newAmount },
                        currentValuation: { decrement: newAmount },
                    },
                });
            } else if (data.type === "DIVIDEND") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        cumulativeDividend: { increment: newAmount },
                        currentValuation: { increment: newAmount },
                    },
                });
            }
        });

        revalidatePath("/");
        return { success: true, message: "수정되었습니다." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "수정 중 오류 발생" };
    }
}

// 투자 로그 삭제
export async function deleteInvestmentLogAction(logId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    try {
        await prisma.$transaction(async tx => {
            const log = await tx.investmentLog.findUnique({ where: { id: logId } });
            if (!log) throw new Error("로그 없음");

            const accountId = log.investmentAccountId;

            // 1. [Rollback] 삭제되는 로그의 영향 취소
            if (log.type === "DEPOSIT") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { decrement: log.amount },
                        currentValuation: { decrement: log.amount },
                    },
                });
            } else if (log.type === "WITHDRAW") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        investedAmount: { increment: log.amount },
                        currentValuation: { increment: log.amount },
                    },
                });
            } else if (log.type === "DIVIDEND") {
                await tx.investmentAccount.update({
                    where: { id: accountId },
                    data: {
                        cumulativeDividend: { decrement: log.amount },
                        currentValuation: { decrement: log.amount },
                    },
                });
            }

            // 2. 로그 삭제
            await tx.investmentLog.delete({ where: { id: logId } });
        });

        revalidatePath("/");
        return { success: true, message: "삭제되었습니다." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "삭제 중 오류 발생" };
    }
}
