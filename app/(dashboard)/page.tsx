"use client";

import { useState, useEffect, ElementType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { getDashboardData } from "@/actions/dashboard";
import CreateAssetModal from "@/components/asset/CreateAssetModal";
import AddExpenseModal from "@/components/transaction/AddExpenseModal";
import {
    MdRefresh,
    MdAccountBalance,
    MdTrendingUp,
    MdCreditCard,
    MdAdd,
    MdWallet,
    MdRemoveCircleOutline,
} from "react-icons/md";
import { DashboardData } from "@/types";
import { twMerge } from "tailwind-merge";

export default function DashboardPage() {
    const router = useRouter();

    // 데이터 상태
    const [data, setData] = useState<DashboardData>({
        totalAssets: 0,
        totalIncome: 0,
        totalExpense: 0,
        bankAccounts: [],
        investmentAccounts: [],
        cards: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    // 모달 상태
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        const result = await getDashboardData();
        setData(result);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);

    return (
        <div className={twMerge(["max-w-5xl", "mx-auto", "space-y-8", "pb-10"])}>
            {/* 1. 상단 헤더 & 액션 버튼 */}
            <div
                className={twMerge(
                    ["flex", "flex-col", "justify-between", "gap-4"],
                    ["md:flex-row", "md:items-center"],
                )}>
                <div className={"py-4"}>
                    <h2 className="text-2xl font-bold text-text-primary">대시보드</h2>
                    <p className="text-text-secondary">나의 자산 현황입니다.</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="text"
                        color="secondary"
                        size={"sm"}
                        onClick={fetchData}
                        className="px-3">
                        <MdRefresh size={24} className={isLoading ? "animate-spin" : ""} />
                    </Button>

                    {/* 💸 지출 기록 버튼 */}
                    <Button
                        variant="outlined"
                        color="error"
                        size={"sm"}
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="gap-2">
                        <MdRemoveCircleOutline size={20} />
                        지출 기록
                    </Button>

                    {/* 🏦 자산 추가 버튼 */}
                    <Button onClick={() => setIsAssetModalOpen(true)} size={"sm"} className="gap-2">
                        <MdAdd size={20} />
                        자산 추가
                    </Button>
                </div>
            </div>

            {/* 2. 총 자산 카드 */}
            <div
                className={twMerge(
                    ["p-8"],
                    ["flex", "flex-col", "md:flex-row", "justify-between", "items-center", "gap-4"],
                    ["bg-background-paper", "rounded-2xl", "border", "border-divider"],
                )}>
                <div>
                    <h3 className={twMerge(["text-sm", "font-medium", "text-text-secondary"])}>
                        총 순자산 (현금 + 투자)
                    </h3>
                    <p className={twMerge(["text-4xl", "font-bold", "text-primary-main", "mt-2"])}>
                        {isLoading ? "..." : formatCurrency(data.totalAssets)}
                    </p>
                </div>
                {/* 여기에 월간 변동 그래프나 요약을 작게 넣어도 됨 */}
            </div>

            {/* 3. 은행 / 현금 섹션 */}
            <Section title="은행 / 현금" icon={MdAccountBalance} color="text-primary-main">
                {data.bankAccounts.map(bank => (
                    <AssetCard
                        key={bank.id}
                        title={bank.name}
                        subtitle={
                            bank.type === "CHECKING"
                                ? "입출금"
                                : bank.type === "SAVINGS"
                                  ? "예적금"
                                  : "현금"
                        }
                        amount={bank.currentBalance}
                        icon={bank.type === "CASH" ? MdWallet : MdAccountBalance}
                        iconColor="text-primary-main"
                        iconBg="bg-primary-light/20"
                        onClick={() => router.push(`/bank/${bank.id}`)} // 이동 경로 확인
                    />
                ))}
                {data.bankAccounts.length === 0 && <EmptyState text="등록된 계좌가 없습니다." />}
            </Section>

            {/* 4. 투자 섹션 */}
            <Section title="투자 (주식/코인)" icon={MdTrendingUp} color="text-secondary-main">
                {data.investmentAccounts.map(invest => (
                    <AssetCard
                        key={invest.id}
                        title={invest.name}
                        subtitle={invest.detailType}
                        amount={invest.currentValuation}
                        icon={MdTrendingUp}
                        iconColor="text-secondary-main"
                        iconBg="bg-secondary-light/20"
                        onClick={() => router.push(`/investment/${invest.id}`)}
                    />
                ))}
                {data.investmentAccounts.length === 0 && (
                    <EmptyState text="투자 자산이 없습니다." />
                )}
            </Section>

            {/* 5. 카드 섹션 */}
            <Section title="카드" icon={MdCreditCard} color="text-warning-main">
                {data.cards.map(card => (
                    <AssetCard
                        key={card.id}
                        title={card.name}
                        subtitle={card.type === "CREDIT" ? "신용카드" : "체크카드"}
                        amount={card.currentBalance} // 카드 사용액
                        isDebt={card.type === "CREDIT"} // 신용카드는 빨간색(부채) 느낌
                        icon={MdCreditCard}
                        iconColor="text-warning-main"
                        iconBg="bg-warning-light/20"
                        onClick={() => router.push(`/cards/${card.id}`)}
                    />
                ))}
                {data.cards.length === 0 && <EmptyState text="등록된 카드가 없습니다." />}
            </Section>

            {/* 모달들 */}
            <CreateAssetModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
            />
            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// 내부용 컴포넌트 (파일 분리해도 좋음)
// ----------------------------------------------------------------------

interface SectionProps {
    title: string;
    icon: ElementType;
    color: string;
    children: ReactNode;
}

function Section({ title, icon: Icon, color, children }: SectionProps) {
    return (
        <section>
            <h3 className={`text-lg font-bold text-text-primary mb-3 flex items-center gap-2`}>
                <Icon className={color} /> {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
        </section>
    );
}

interface AssetCardProps {
    title: string;
    subtitle: string;
    amount: number;
    icon: ElementType; // Icon component type
    iconColor: string;
    iconBg: string;
    onClick: () => void;
    isDebt?: boolean;
}

function AssetCard({
    title,
    subtitle,
    amount,
    icon: Icon,
    iconColor,
    iconBg,
    onClick,
    isDebt,
}: AssetCardProps) {
    const formattedAmount = new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    }).format(amount);

    return (
        <div
            onClick={onClick}
            className={twMerge(
                ["p-5", "bg-background-paper"],
                ["rounded-xl", "border", "border-divider", "hover:shadow-md"],
                ["transition-all", "cursor-pointer", "active:scale-[0.98]"],
            )}>
            <div className={twMerge(["flex", "justify-between", "items-start", "mb-4"])}>
                <div className={twMerge(["flex", "items-center", "gap-3"])}>
                    <div className={twMerge(["p-2.5", "rounded-lg", iconBg, iconColor])}>
                        <Icon size={22} />
                    </div>
                    <div>
                        <h4 className={twMerge(["font-bold", "text-text-primary", "line-clamp-1"])}>
                            {title}
                        </h4>
                        <span className={twMerge(["text-xs", "text-text-secondary"])}>
                            {subtitle}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                {isDebt && (
                    <span className={twMerge(["text-xs", "text-text-secondary", "mr-2"])}>
                        사용액
                    </span>
                )}
                <p
                    className={twMerge([
                        "text-lg",
                        "font-bold",
                        isDebt ? "text-text-primary" : "text-text-primary",
                    ])}>
                    {formattedAmount}
                </p>
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="col-span-full p-8 border border-dashed border-divider rounded-xl text-center text-text-secondary bg-background-paper/30">
            {text}
        </div>
    );
}
