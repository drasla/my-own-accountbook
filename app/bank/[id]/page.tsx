"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { getBankAccountDetail, deleteBankAccountAction } from "@/app/actions/bank";
import Button from "@/components/Button";
import Chip from "@/components/Chip";
import AddTransactionModal from "@/components/transaction/AddTransactionModal";

// Icons
import { MdArrowBack, MdDelete, MdAccountBalance, MdAdd } from "react-icons/md";

// Types
import { BankAccount, MoneyTransaction, Category } from "@prisma/client";

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

    // ... (fetchData, handleDelete 등 로직은 기존과 동일) ...
    const fetchData = async () => {
        // 첫 로딩 외에는 로딩화면 생략 (자연스러운 갱신)
        if (!account) setIsLoading(true);
        const data = await getBankAccountDetail(id);
        if (!data) {
            toast.error("계좌 없음");
            router.push("/");
            return;
        }
        setAccount(data as unknown as BankDetail);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("계좌를 삭제하시겠습니까?")) return;
        const res = await deleteBankAccountAction(id);
        if (res.success) router.replace("/");
    };

    const handleCloseModal = () => {
        setIsTxModalOpen(false);
        fetchData();
    };

    // 날짜 포맷 (MM.DD) - 리스트용으로 짧게
    const formatShortDate = (date: Date | string) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}.${d.getDate()}`;
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat("ko-KR").format(amount);

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;
    if (!account) return null;

    return (
        // 1. 최상위 부모: 패딩 제거 (전체 레이아웃만 잡음)
        <div className="max-w-3xl mx-auto pb-20">
            {/* 2. 상단 헤더 영역 (개별 패딩 적용) */}
            {/* sticky top-0 등을 추가하면 스크롤 시 상단에 붙게 할 수도 있습니다 */}
            <div className="px-5 py-4 flex items-center justify-between bg-background-default">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-background-paper rounded-full transition-colors text-text-secondary">
                        <MdArrowBack size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-text-primary">계좌 상세</h1>
                </div>

                <Button variant="text" color="error" size="sm" onClick={handleDelete}>
                    <MdDelete size={20} />
                </Button>
            </div>

            {/* 3. 내부 메인 컨텐츠 영역 (여기에만 px-5 적용) */}
            <div className="px-5 space-y-6">
                {/* 요약 카드 */}
                <div className="bg-background-paper p-6 rounded-2xl border border-divider shadow-sm relative overflow-hidden">
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
                            <p className="text-4xl font-bold">
                                {formatCurrency(account.currentBalance)}원
                            </p>
                        </div>
                        <Button onClick={() => setIsTxModalOpen(true)} className="gap-1 shadow-md">
                            <MdAdd size={18} /> 거래 추가
                        </Button>
                    </div>
                </div>

                {/* 거래 내역 리스트 */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-text-primary px-1">거래 내역</h3>

                    {account.transactions.length > 0 ? (
                        <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden shadow-sm">
                            {account.transactions.map(tx => (
                                <div
                                    key={tx.id}
                                    className="flex items-center p-4 border-b border-divider last:border-none hover:bg-background-default/50 transition-colors">
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
        </div>
    );
}
