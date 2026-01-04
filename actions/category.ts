"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";

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

export async function getCategoriesAction(type: "INCOME" | "EXPENSE" | "TRANSFER") {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // 1. 해당 타입의 카테고리 조회
        let categories = await prisma.category.findMany({
            where: {
                userId: user.id,
                type: type,
            },
            orderBy: { name: "asc" },
        });

        // 2. 만약 카테고리가 하나도 없다면? -> 기본 카테고리 자동 생성 (편의성)
        if (categories.length === 0 && type !== "TRANSFER") {
            const defaults = type === "INCOME" ? DEFAULT_INCOME : DEFAULT_EXPENSE;

            // 병렬로 한꺼번에 생성
            await prisma.category.createMany({
                data: defaults.map(name => ({
                    name,
                    type,
                    userId: user.id,
                })),
            });

            // 다시 조회
            categories = await prisma.category.findMany({
                where: { userId: user.id, type: type },
                orderBy: { name: "asc" },
            });
        }

        // 3. Select 컴포넌트용 포맷으로 변환 ({ label, value })
        return categories.map(c => ({
            label: c.name,
            value: c.id,
        }));
    } catch (error) {
        console.error("Get Categories Error:", error);
        return [];
    }
}
