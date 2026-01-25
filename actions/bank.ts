"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";
import { InvestType } from "@prisma/client";
import dayjs from "@/lib/dayjs";

export async function getBankAccountDetail(
    accountId: string,
    startDate?: string,
    endDate?: string,
) {
    const user = await getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    try {
        const start = startDate
            ? dayjs.tz(startDate, "Asia/Seoul").startOf("day").toDate()
            : undefined;

        const end = endDate ? dayjs.tz(endDate, "Asia/Seoul").endOf("day").toDate() : undefined;

        return await prisma.bankAccount.findUnique({
            where: {
                id: accountId,
                userId: user.id, // 본인 계좌만 조회 가능하도록 안전장치
            },
            include: {
                // 거래 내역 함께 가져오기 (최신순 정렬)
                transactions: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                    include: {
                        category: true, // 카테고리 정보 포함
                    },
                },
            },
        });
    } catch (error) {
        console.error("Bank Detail Error:", error);
        return null;
    }
}

export async function getAllTransferTargets(currentAccountId: string) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // 1. 다른 은행 계좌 조회
        const bankAccounts = await prisma.bankAccount.findMany({
            where: {
                userId: user.id,
                id: { not: currentAccountId },
            },
            select: { id: true, name: true, type: true },
        });

        // 2. 투자 계좌 조회 (주식, 코인, 연금 등)
        const investAccounts = await prisma.investmentAccount.findMany({
            where: {
                userId: user.id,
            },
            select: { id: true, name: true, detailType: true }, // detailType: STOCK, ISA, etc.
        });

        // 3. 리스트 합치기 & 포맷팅
        const bankList = bankAccounts.map(acc => ({
            label: `[은행] ${acc.name}`,
            value: acc.id,
            type: "BANK", // 구분용 태그
        }));

        const investList = investAccounts.map(acc => ({
            label: `[투자] ${acc.name} (${getInvestLabel(acc.detailType)})`,
            value: acc.id,
            type: "INVESTMENT",
        }));

        return [...bankList, ...investList];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function getInvestLabel(type: InvestType | string) {
    const map: Record<string, string> = {
        STOCK: "주식",
        COIN: "코인",
        REAL_ESTATE: "부동산",
        BOND: "채권",
        PENSION_SAVINGS: "연금저축",
        IRP: "IRP",
        ISA: "ISA",
    };
    return map[type] || "기타";
}

export async function deleteBankAccountAction(accountId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "권한이 없습니다." };

    try {
        // 본인 확인
        const count = await prisma.bankAccount.count({
            where: { id: accountId, userId: user.id },
        });

        if (count === 0) return { success: false, message: "계좌를 찾을 수 없습니다." };

        // 삭제
        await prisma.bankAccount.delete({
            where: { id: accountId },
        });

        revalidatePath("/"); // 대시보드 갱신
        return { success: true, message: "계좌가 삭제되었습니다." };
    } catch (error) {
        console.error("Delete Bank Error:", error);
        return { success: false, message: "삭제 중 오류가 발생했습니다." };
    }
}

export async function getBankOptionsAction() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const banks = await prisma.bankAccount.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                currentBalance: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return banks;
    } catch (error) {
        return [];
    }
}