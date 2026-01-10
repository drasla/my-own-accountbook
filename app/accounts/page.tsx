"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    MdAdd,
    MdAccountBalance,
    MdTrendingUp,
    MdCreditCard,
    MdArrowForwardIos,
} from "react-icons/md";
import { getAllAssetsAction } from "@/actions/asset";
import CreateAssetModal from "@/components/asset/CreateAssetModal";

export default function AccountsPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const res = await getAllAssetsAction();
        setData(res);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData().then(() => {});
    }, [fetchData]);

    if (isLoading) return <div className="p-10 text-center text-text-secondary">로딩 중...</div>;
    if (!data) return <div className="p-10 text-center">데이터를 불러올 수 없습니다.</div>;

    const { summary, banks, investments, cards } = data;

    return (
        <div className="pb-24">
            {/* 1. 헤더 */}
            <header className="px-5 py-4 bg-background-default sticky top-0 z-10 flex justify-between items-center border-b border-divider">
                <h1 className="text-xl font-bold text-text-primary">자산 관리</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-2 text-primary-main hover:bg-primary-main/10 rounded-full transition-colors">
                    <MdAdd size={24} />
                </button>
            </header>

            <div className="px-5 space-y-6 mt-6">
                {/* 2. 총 자산 요약 카드 */}
                <div className="bg-primary-main text-white p-6 rounded-2xl shadow-lg shadow-primary-main/30">
                    <p className="text-blue-100 text-sm mb-1">순자산 (자산 - 부채)</p>
                    <p className="text-3xl font-bold mb-6">{summary.netWorth.toLocaleString()}원</p>
                    <div className="flex divide-x divide-white/20">
                        <div className="flex-1 pr-4">
                            <p className="text-xs text-blue-100 mb-1">총 자산</p>
                            <p className="text-lg font-bold">
                                {summary.totalAsset.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex-1 pl-4">
                            <p className="text-xs text-blue-100 mb-1">총 부채</p>
                            <p className="text-lg font-bold text-red-200">
                                {summary.totalLiability.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                {/* 3. 은행/현금 리스트 */}
                <section>
                    <div className="flex items-center gap-2 mb-3 text-text-secondary">
                        <MdAccountBalance />
                        <h3 className="text-sm font-bold">은행 / 현금</h3>
                        <span className="text-xs ml-auto bg-gray-100 px-2 py-0.5 rounded-full">
                            {banks.length}개
                        </span>
                    </div>

                    <div className="bg-background-paper rounded-2xl border border-divider divide-y divide-divider overflow-hidden">
                        {banks.length > 0 ? (
                            banks.map((bank: any) => (
                                <div
                                    key={bank.id}
                                    // 은행 상세 페이지는 아직 없으므로 클릭 시 반응 없음 (추후 구현)
                                    className="p-4 flex justify-between items-center hover:bg-background-default transition-colors">
                                    <div>
                                        <p className="font-bold text-text-primary">{bank.name}</p>
                                        <p className="text-xs text-text-secondary">
                                            {bank.type === "CHECKING"
                                                ? "입출금"
                                                : bank.type === "SAVINGS"
                                                  ? "예적금"
                                                  : "현금"}
                                        </p>
                                    </div>
                                    <span className="font-bold text-text-primary">
                                        {bank.currentBalance.toLocaleString()}원
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-text-disabled">
                                계좌가 없습니다.
                            </div>
                        )}
                    </div>
                </section>
                {/* 4. 투자 리스트 */}
                <section>
                    <div className="flex items-center gap-2 mb-3 text-text-secondary">
                        <MdTrendingUp />
                        <h3 className="text-sm font-bold">투자</h3>
                        <span className="text-xs ml-auto bg-gray-100 px-2 py-0.5 rounded-full">
                            {investments.length}개
                        </span>
                    </div>

                    <div className="bg-background-paper rounded-2xl border border-divider divide-y divide-divider overflow-hidden">
                        {investments.length > 0 ? (
                            investments.map((invest: any) => {
                                const profit = invest.currentValuation - invest.investedAmount;
                                const isPositive = profit >= 0;

                                return (
                                    <div
                                        key={invest.id}
                                        onClick={() => router.push(`/investment/${invest.id}`)}
                                        className="p-4 flex justify-between items-center hover:bg-background-default cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-bold text-text-primary group-hover:text-primary-main transition-colors">
                                                    {invest.name}
                                                </p>
                                                <p
                                                    className={`text-xs ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                                                    {isPositive ? "+" : ""}
                                                    {profit.toLocaleString()}원
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="font-bold text-text-primary">
                                                    {invest.currentValuation.toLocaleString()}원
                                                </p>
                                            </div>
                                            <MdArrowForwardIos
                                                size={12}
                                                className="text-text-disabled"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-sm text-text-disabled">
                                투자 계좌가 없습니다.
                            </div>
                        )}
                    </div>
                </section>
                {/* 5. 카드(부채) 리스트 */}
                <section>
                    <div className="flex items-center gap-2 mb-3 text-text-secondary">
                        <MdCreditCard />
                        <h3 className="text-sm font-bold">카드 (부채)</h3>
                        <span className="text-xs ml-auto bg-gray-100 px-2 py-0.5 rounded-full">
                            {cards.length}개
                        </span>
                    </div>

                    <div className="bg-background-paper rounded-2xl border border-divider divide-y divide-divider overflow-hidden">
                        {cards.length > 0 ? (
                            cards.map((card: any) => (
                                <div
                                    key={card.id}
                                    onClick={() => router.push(`/cards/${card.id}`)}
                                    className="p-4 flex justify-between items-center hover:bg-background-default cursor-pointer transition-colors group">
                                    <div>
                                        <p className="font-bold text-text-primary group-hover:text-primary-main transition-colors">
                                            {card.name}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {card.paymentDate
                                                ? `매월 ${card.paymentDate}일 결제`
                                                : "결제일 미설정"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-error-main">
                                            -{card.currentBalance.toLocaleString()}원
                                        </span>
                                        <MdArrowForwardIos
                                            size={12}
                                            className="text-text-disabled"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-text-disabled">
                                카드가 없습니다.
                            </div>
                        )}
                    </div>
                </section>
                <div className="h-10" /> {/* 하단 여백 */}
            </div>

            {/* 자산 추가 모달 (기존 모달 재사용) */}
            <CreateAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    fetchData().then(() => {}); // 닫히면 데이터 갱신
                }}
            />
        </div>
    );
}
