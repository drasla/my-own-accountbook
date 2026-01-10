"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getBankAccountDetail, deleteBankAccountAction } from "@/actions/bank";
import Button from "@/components/Button";
import Chip from "@/components/Chip";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";
import {
    MdArrowBack,
    MdDelete,
    MdAccountBalance,
    MdAdd,
    MdKeyboardArrowUp,
    MdKeyboardArrowDown,
} from "react-icons/md";
import { BankAccount, MoneyTransaction, Category } from "@prisma/client";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import EditTransactionModal from "@/components/transaction/EditTransactionModal";
import AccountAnalytics from "@/components/charts/AccountAnalytics"; // 한국어 설정 (필요시)
dayjs.locale("ko");

interface BankDetail extends BankAccount {
    transactions: (MoneyTransaction & {
        category: Category | null;
    })[];
}

export default function BankDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [account, setAccount] = useState<BankDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isDateOptionOpen, setIsDateOptionOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);

    const [dateRange, setDateRange] = useState({
        start: dayjs().startOf("month").format("YYYY-MM-DD"),
        end: dayjs().endOf("month").format("YYYY-MM-DD"),
    });

    const fetchData = async () => {
        // 날짜가 아직 세팅 안 됐으면 실행 스킵 (useEffect 충돌 방지)
        if (!dateRange.start || !dateRange.end) return;

        // 첫 로딩 외에는 로딩화면 생략 (자연스러운 갱신)
        if (!account) setIsLoading(true);

        // Server Action에 날짜 전달
        const data = await getBankAccountDetail(id, dateRange.start, dateRange.end);

        if (!data) {
            toast.error("계좌 정보를 찾을 수 없습니다.");
            router.push("/");
            return;
        }

        setAccount(data as unknown as BankDetail);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData().then(() => {});
    }, [id, dateRange.start, dateRange.end]);

    const handleDelete = async () => {
        if (!confirm("계좌를 삭제하시겠습니까?")) return;
        const res = await deleteBankAccountAction(id);
        if (res.success) router.replace("/");
    };

    const handleCloseModal = () => {
        setIsTxModalOpen(false);
        fetchData().then(() => {});
    };

    const moveMonth = (diff: number) => {
        // 현재 선택된 '시작일'을 기준으로 달을 이동
        const baseDate = dayjs(dateRange.start).add(diff, "month");

        setDateRange({
            start: baseDate.startOf("month").format("YYYY-MM-DD"),
            end: baseDate.endOf("month").format("YYYY-MM-DD"),
        });
    };

    const setTodayMonth = () => {
        setDateRange({
            start: dayjs().startOf("month").format("YYYY-MM-DD"),
            end: dayjs().endOf("month").format("YYYY-MM-DD"),
        });
    };

    const setLastWeek = () => {
        setDateRange({
            start: dayjs().subtract(7, "day").format("YYYY-MM-DD"),
            end: dayjs().format("YYYY-MM-DD"),
        });
    };

    const setThisYear = () => {
        setDateRange({
            start: dayjs().startOf("year").format("YYYY-MM-DD"),
            end: dayjs().endOf("year").format("YYYY-MM-DD"),
        });
    };

    const handleTxClick = (tx: any) => {
        setSelectedTx(tx);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedTx(null);
        fetchData(); // 수정/삭제 후 데이터 갱신
    };

    const totalIncome =
        account?.transactions
            .filter(tx => tx.type === "INCOME")
            .reduce((acc, tx) => acc + tx.amount, 0) || 0;

    const totalExpense =
        account?.transactions
            .filter(tx => tx.type === "EXPENSE")
            .reduce((acc, tx) => acc + tx.amount, 0) || 0;

    const netResult = totalIncome - totalExpense;

    const formatShortDate = (date: Date | string) => {
        return dayjs(date).format("MM.DD"); // 예: 01.05
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat("ko-KR").format(amount);

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;
    if (!account) return null;

    return (
        // 1. 최상위 부모: 패딩 제거 (전체 레이아웃만 잡음)
        <div className="max-w-3xl mx-auto pb-10">
            {/* 2. 상단 헤더 영역 (개별 패딩 적용) */}
            {/* sticky top-0 등을 추가하면 스크롤 시 상단에 붙게 할 수도 있습니다 */}
            <div className="py-4 flex items-center justify-between bg-background-default">
                <div className="flex items-center gap-4">
                    <Button
                        variant={"text"}
                        size={"sm"}
                        color={"primary"}
                        onClick={() => router.back()}>
                        <MdArrowBack size={24} />
                    </Button>
                    <h1 className="text-xl font-bold text-text-primary">계좌 상세</h1>
                </div>

                <Button variant="text" color="error" size="sm" onClick={handleDelete}>
                    <MdDelete size={20} />
                </Button>
            </div>

            {/* 3. 내부 메인 컨텐츠 영역 (여기에만 px-5 적용) */}
            <div className="space-y-6">
                {/* 요약 카드 */}
                <div className="bg-background-paper p-6 rounded-2xl border border-divider relative overflow-hidden">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <span className="text-xs font-bold text-primary-main bg-primary-light/20 px-2 py-0.5 rounded">
                                {account.type}
                            </span>
                            <h2 className="text-2xl font-bold mt-1">{account.name}</h2>
                        </div>
                        <div className="text-primary-main opacity-20">
                            <MdAccountBalance size={40} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-end z-10 relative">
                        <div>
                            <p className="text-sm text-text-secondary">현재 잔액</p>
                            <p className="text-3xl font-bold">
                                {formatCurrency(account.currentBalance)}원
                            </p>
                        </div>
                        <Button
                            size={"sm"}
                            onClick={() => setIsTxModalOpen(true)}
                            className="gap-1 shadow-md">
                            <MdAdd size={18} /> 거래 추가
                        </Button>
                    </div>
                </div>

                {/* 3. 조회 기간 설정 영역 */}
                <div className="bg-background-paper rounded-xl border border-divider overflow-hidden transition-all duration-300">
                    {/* (1) 항상 보이는 날짜 입력부 */}
                    <div className="p-4 flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-text-secondary font-bold mb-1 block">
                                시작일
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 bg-background-default border border-divider rounded-lg text-sm outline-none focus:border-primary-main"
                                value={dateRange.start}
                                onChange={e =>
                                    setDateRange(prev => ({ ...prev, start: e.target.value }))
                                }
                            />
                        </div>
                        <span className="pb-2 text-text-secondary">~</span>
                        <div className="flex-1">
                            <label className="text-xs text-text-secondary font-bold mb-1 block">
                                종료일
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 bg-background-default border border-divider rounded-lg text-sm outline-none focus:border-primary-main"
                                value={dateRange.end}
                                onChange={e =>
                                    setDateRange(prev => ({ ...prev, end: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    {/* (2) 아코디언 토글 버튼 */}
                    <button
                        onClick={() => setIsDateOptionOpen(!isDateOptionOpen)}
                        className="w-full py-2 flex items-center justify-center gap-1 text-xs font-medium text-text-secondary hover:bg-background-default transition-colors border-t border-divider">
                        <span>간편 조회 옵션</span>
                        {isDateOptionOpen ? (
                            <MdKeyboardArrowUp size={16} />
                        ) : (
                            <MdKeyboardArrowDown size={16} />
                        )}
                    </button>

                    {/* (3) 숨겨진 퀵 버튼들 */}
                    {isDateOptionOpen && (
                        <div className="px-4 pb-4 pt-2 bg-background-default/30 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="grid grid-cols-4 gap-2">
                                {/* 지난달 */}
                                <button
                                    onClick={() => moveMonth(-1)}
                                    className="px-3 py-2 bg-background-paper border border-divider rounded-lg text-xs hover:bg-primary-light/10 hover:border-primary-main transition-colors text-text-primary">
                                    &lt; 이전달
                                </button>

                                {/* 이번달 */}
                                <button
                                    onClick={setTodayMonth}
                                    className="col-span-2 px-3 py-2 bg-primary-main text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm">
                                    이번 달 조회
                                </button>

                                {/* 다음달 */}
                                <button
                                    onClick={() => moveMonth(1)}
                                    className="px-3 py-2 bg-background-paper border border-divider rounded-lg text-xs hover:bg-primary-light/10 hover:border-primary-main transition-colors text-text-primary">
                                    다음달 &gt;
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={setLastWeek}
                                    className="px-3 py-2 bg-background-paper border border-divider rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-background-default transition-colors">
                                    최근 1주일
                                </button>
                                <button
                                    onClick={setThisYear}
                                    className="px-3 py-2 bg-background-paper border border-divider rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-background-default transition-colors">
                                    올 해 전체 (1년)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* (1) 수입 */}
                    <div className="bg-background-paper p-4 rounded-xl border border-divider flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-bold text-text-secondary">총 수입</span>
                        <span className="text-sm sm:text-base font-bold text-success-main break-all">
                            +{formatCurrency(totalIncome)}
                        </span>
                    </div>

                    {/* (2) 지출 */}
                    <div className="bg-background-paper p-4 rounded-xl border border-divider flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-bold text-text-secondary">총 지출</span>
                        <span className="text-sm sm:text-base font-bold text-error-main break-all">
                            -{formatCurrency(totalExpense)}
                        </span>
                    </div>

                    {/* (3) 합계 (순수익) */}
                    <div
                        className={`bg-background-paper p-4 rounded-xl border border-divider flex flex-col items-center justify-center gap-1 ${
                            netResult > 0
                                ? "bg-success-light/5"
                                : netResult < 0
                                  ? "bg-error-light/5"
                                  : ""
                        }`}>
                        <span className="text-xs font-bold text-text-secondary">합계</span>
                        <span
                            className={`text-sm sm:text-base font-bold break-all ${
                                netResult > 0
                                    ? "text-success-main"
                                    : netResult < 0
                                      ? "text-error-main"
                                      : "text-text-disabled"
                            }`}>
                            {netResult > 0 ? "+" : ""}
                            {formatCurrency(netResult)}
                        </span>
                    </div>
                </div>

                {/* 차트 섹션 */}
                {/* 거래 내역이 있을 때만 보여줍니다. */}
                {account.transactions.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                        <AccountAnalytics
                            transactions={account.transactions}
                            startDate={dateRange.start}
                            endDate={dateRange.end}
                            currentBalance={account.currentBalance}
                        />
                    </div>
                )}

                {/* 거래 내역 리스트 */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-text-primary px-1">거래 내역</h3>

                    {account.transactions.length > 0 ? (
                        <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                            {account.transactions.map(tx => (
                                <div
                                    key={tx.id}
                                    onClick={() => handleTxClick(tx)}
                                    className="flex items-center p-4 border-b border-divider last:border-none hover:bg-background-default/50 transition-colors cursor-pointer active:bg-background-default">
                                    <div className="w-14 text-center mr-4">
                                        <span className="text-sm font-bold text-text-secondary block">
                                            {formatShortDate(tx.date)}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-base font-medium text-text-primary truncate">
                                                {tx.description || "내용 없음"}
                                            </span>
                                            {tx.category && (
                                                <Chip
                                                    label={tx.category.name}
                                                    className="scale-90 origin-left"
                                                />
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs flex items-center gap-1 ${
                                                tx.type === "INCOME"
                                                    ? "text-success-main"
                                                    : "text-text-disabled"
                                            }`}>
                                            {tx.type === "INCOME" ? "입금" : "출금"}
                                        </span>
                                    </div>

                                    <div
                                        className={`text-right font-bold text-lg whitespace-nowrap ml-4 ${
                                            tx.type === "INCOME"
                                                ? "text-success-main"
                                                : "text-text-primary"
                                        }`}>
                                        {tx.type === "EXPENSE" && "-"}
                                        {formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-text-secondary border border-dashed border-divider rounded-2xl">
                            내역이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            <AddTransactionModal
                bankAccountId={id}
                isOpen={isTxModalOpen}
                onClose={handleCloseModal}
            />

            <EditTransactionModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                transaction={selectedTx}
            />
        </div>
    );
}
