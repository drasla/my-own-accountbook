"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { revalidatePath } from "next/cache";
// ✅ [수정] TxType import
import { TxType } from "@prisma/client";

// 기본 카테고리 목록
const DEFAULT_EXPENSE = [
    "식비",
    "교통/차량",
    "쇼핑",
    "주거/통신",
    "의료/건강",
    "카페/간식",
    "생활",
    "경조사",
];
const DEFAULT_INCOME = ["월급", "용돈", "상여금", "금융소득", "기타"];

export async function getCategoriesAction(type: TxType) {
    const user = await getCurrentUser();
    if (!user) return [];

    if (type === "TRANSFER") return [];

    try {
        let categories = await prisma.category.findMany({
            where: {
                userId: user.id,
                type: type, // 이제 타입이 일치합니다.
            },
            orderBy: { name: "asc" },
        });

        // 2. 카테고리가 없으면 기본값 생성
        if (categories.length === 0) {
            const defaults = type === "INCOME" ? DEFAULT_INCOME : DEFAULT_EXPENSE;

            await prisma.category.createMany({
                data: defaults.map(name => ({
                    name,
                    type: type,
                    userId: user.id,
                })),
            });

            // 다시 조회
            categories = await prisma.category.findMany({
                where: { userId: user.id, type: type },
                orderBy: { name: "asc" },
            });
        }

        return categories.map(c => ({
            label: c.name,
            value: c.id,
        }));
    } catch (error) {
        console.error("Get Categories Error:", error);
        return [];
    }
}

// 2. 카테고리 추가
// ✅ [수정] 인자 타입을 TxType으로 변경
export async function createCategoryAction(name: string, type: TxType) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    if (!name.trim()) return { success: false, message: "이름을 입력해주세요." };

    try {
        const existing = await prisma.category.findFirst({
            where: { userId: user.id, type, name: name.trim() },
        });
        if (existing) return { success: false, message: "이미 존재하는 카테고리입니다." };

        await prisma.category.create({
            data: {
                userId: user.id,
                name: name.trim(),
                type: type,
            },
        });

        revalidatePath("/settings/categories");
        return { success: true, message: "추가되었습니다." };
    } catch (error) {
        console.error("Create Categories Error:", error);
        return { success: false, message: "오류가 발생했습니다." };
    }
}

// 3. 카테고리 삭제 (동일함)
export async function deleteCategoryAction(categoryId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "로그인 필요" };

    try {
        const count = await prisma.moneyTransaction.count({
            where: { categoryId: categoryId },
        });

        if (count > 0) {
            return {
                success: false,
                message: `이 카테고리를 사용 중인 내역이 ${count}개 있습니다. 내역을 먼저 정리해주세요.`,
            };
        }

        await prisma.category.delete({
            where: { id: categoryId, userId: user.id },
        });

        revalidatePath("/settings/categories");
        return { success: true, message: "삭제되었습니다." };
    } catch (error) {
        console.error("Delete Categories Error:", error);
        return { success: false, message: "삭제 중 오류 발생" };
    }
}
