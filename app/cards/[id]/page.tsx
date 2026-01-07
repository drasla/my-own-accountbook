"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCardDetail, deleteCardAction } from "@/actions/card";
import Button from "@/components/Button";
import PayBillModal from "@/components/card/PayBillModal";
import { MdArrowBack, MdDelete, MdCreditCard, MdPayment, MdAdd } from "react-icons/md";
import dayjs from "dayjs";
import toast from "react-hot-toast";

// 기간 필터 (기존 로직 재사용)
type Period = "1M" | "3M" | "6M" | "ALL";

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [card, setCard] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    // 기간 필터
    const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");
    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf("month").format("YYYY-MM-DD"), // 기본: 이번 달 1일부터
        end: dayjs().format("YYYY-MM-DD"),
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const start = selectedPeriod === "ALL" ? undefined : dateRange.start;
        const end = selectedPeriod === "ALL" ? undefined : dateRange.end;

        const data = await getCardDetail(id, start, end);
        if (!data) {
            toast.error("카드를 찾을 수 없습니다.");
            router.push("/");
            return;
        }
        setCard(data);
        setIsLoading(false);
    }, [id, router, dateRange, selectedPeriod]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 기간 변경 핸들러
    const handlePeriodChange = (period: Period) => {
        setSelectedPeriod(period);
        const end = dayjs().format("YYYY-MM-DD");
        let start = "";
        switch (period) {
            case "1M":
                start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
                break;
            case "3M":
                start = dayjs().subtract(3, "month").format("YYYY-MM-DD");
                break;
            case "6M":
                start = dayjs().subtract(6, "month").format("YYYY-MM-DD");
                break;
            case "ALL":
                start = "";
                break;
        }
        setDateRange({ start, end });
    };

    const handleDelete = async () => {
        if (confirm("정말 이 카드를 삭제하시겠습니까?")) {
            await deleteCardAction(id);
            router.replace("/");
        }
    };

    if (isLoading && !card) return <div className="p-10 text-center">로딩 중...</div>;
    if (!card) return null;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* 헤더 */}
            <div className="px-5 py-4 flex items-center justify-between bg-background-default sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="text" size="sm" color="primary" onClick={() => router.back()}>
                        <MdArrowBack size={24} />
                    </Button>
                    <h1 className="text-xl font-bold text-text-primary">{card.name}</h1>
                </div>
                <Button variant="text" color="error" size="sm" onClick={handleDelete}>
                    <MdDelete size={20} />
                </Button>
            </div>

            <div className="px-5 space-y-6">
                {/* 1. 카드 요약 정보 (실물 카드 느낌) */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    {/* 배경 데코레이션 */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MdCreditCard size={100} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
                                {card.type === "CREDIT" ? "신용카드" : "체크카드"}
                            </span>
                            {card.paymentDate && (
                                <span className="text-xs text-gray-300">
                                    매월 {card.paymentDate}일 결제
                                </span>
                            )}
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-1">
                                이번 달 사용 금액 (결제 예정)
                            </p>
                            <p className="text-3xl font-bold">
                                {card.currentBalance.toLocaleString()}원
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                                연결계좌:{" "}
                                {card.linkedBankAccount ? card.linkedBankAccount.name : "미설정"}
                            </div>

                            {/* 결제하기 버튼 */}
                            <button
                                onClick={() => setIsPayModalOpen(true)}
                                className="flex items-center gap-1 bg-primary-main text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-md">
                                <MdPayment />
                                즉시 결제 (납부)
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. 기간 필터 */}
                <div className="flex p-1 bg-background-paper border border-divider rounded-xl overflow-x-auto no-scrollbar">
                    {(["1M", "3M", "6M", "ALL"] as Period[]).map(period => (
                        <button
                            key={period}
                            onClick={() => handlePeriodChange(period)}
                            className={`flex-1 min-w-[60px] py-1.5 text-xs font-bold rounded-lg transition-all ${
                                selectedPeriod === period
                                    ? "bg-primary-main text-white shadow-sm"
                                    : "text-text-secondary hover:bg-background-default"
                            }`}>
                            {period === "ALL" ? "전체" : period}
                        </button>
                    ))}
                </div>

                {/* 3. 사용 내역 (Transactions) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-text-primary">사용 내역</h3>
                        {/* 수동 내역 추가 버튼 (필요시 구현) */}
                    </div>

                    {card.transactions.length > 0 ? (
                        <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                            {card.transactions.map((tx: any) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 border-b border-divider last:border-none">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-text-secondary w-12 text-center">
                                            {dayjs(tx.date).format("MM.DD")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">
                                                {tx.description}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {tx.category?.name || "기타"}
                                                {tx.isTransfer && (
                                                    <span className="ml-1 text-primary-main">
                                                        (납부)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`font-bold ${tx.isTransfer ? "text-primary-main" : "text-text-primary"}`}>
                                        {/* 납부(이체)면 파란색, 지출이면 기본색 */}
                                        {tx.amount.toLocaleString()}원
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-secondary text-sm border border-dashed border-divider rounded-2xl">
                            사용 내역이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 결제 모달 */}
            <PayBillModal
                isOpen={isPayModalOpen}
                onClose={() => {
                    setIsPayModalOpen(false);
                    fetchData();
                }}
                card={card}
            />
        </div>
    );
}
