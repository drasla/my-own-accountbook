import {
    BankAccount,
    InvestmentAccount,
    Card,
    BankType,
    InvestType,
    CardType,
    MoneyTransaction,
    Category,
} from "@prisma/client";

// 1. Prisma 모델 타입 Re-export (편의성)
export type { BankAccount, InvestmentAccount, Card, MoneyTransaction, Category };

export { BankType, InvestType, CardType };

// 2. 대시보드 데이터 타입
export interface DashboardData {
    totalAssets: number;
    bankAccounts: BankAccount[];
    investmentAccounts: InvestmentAccount[];
    cards: Card[];
}

// 3. 공통 응답 타입 (Server Action 리턴값)
export interface ActionResponse {
    success: boolean;
    message: string;
}
