"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import toast from "react-hot-toast";

// Actions
import { deleteInvestmentAccountAction, getInvestmentDetail } from "@/actions/investment";

// Components
import InvestmentChart from "@/components/charts/InvetmentChart";
import UpdateValuationModal from "@/components/investment/UpdateValuationModal";
import AddInvestmentLogModal from "@/components/investment/AddInvestmentLogModal";
import EditInvestmentLogModal from "@/components/investment/EditInvestmentLogModal";

// Detail Components (Refactored)
import InvestmentDetailHeader from "@/components/investment/detail/Header";
import InvestmentOverviewCard from "@/components/investment/detail/OverviewCard";
import PeriodSelector, { Period } from "@/components/investment/detail/PeriodSelector";
import PerformanceSummary from "@/components/investment/detail/PerformanceSummary";
import TransactionList from "@/components/investment/detail/TransactionList";

export default function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedPeriod, setSelectedPeriod] = useState<Period>("3M");
    const [dateRange, setDateRange] = useState({
        start: dayjs().subtract(3, "month").format("YYYY-MM-DD"),
        end: dayjs().endOf("day").format("YYYY-MM-DD"),
    });

    // Modals
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isEditLogModalOpen, setIsEditLogModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const start = selectedPeriod === "ALL" ? undefined : dateRange.start;
        const end = selectedPeriod === "ALL" ? undefined : dateRange.end;

        const data = await getInvestmentDetail(id, start, end);
        if (!data) {
            toast.error("계좌를 찾을 수 없습니다.");
            router.push("/");
            return;
        }
        setAccount(data);
        setIsLoading(false);
    }, [id, router, dateRange, selectedPeriod]);

    // Fetch Data
    useEffect(() => {
        fetchData().then(() => {});
    }, [fetchData]);

    // Handlers
    const handlePeriodChange = (period: Period) => {
        setSelectedPeriod(period);
        const end = dayjs().format("YYYY-MM-DD");
        let start = "";

        if (period === "1M") start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
        else if (period === "3M") start = dayjs().subtract(3, "month").format("YYYY-MM-DD");
        else if (period === "6M") start = dayjs().subtract(6, "month").format("YYYY-MM-DD");
        else if (period === "1Y") start = dayjs().subtract(1, "year").format("YYYY-MM-DD");

        setDateRange({ start, end });
    };

    const handleDelete = async () => {
        if (confirm("정말 이 투자 계좌를 삭제하시겠습니까?")) {
            await deleteInvestmentAccountAction(id);
            router.replace("/");
        }
    };

    const handleLogClick = (log: any) => {
        setSelectedLog(log);
        setIsEditLogModalOpen(true);
    };

    const refresh = () => fetchData();

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;
    if (!account) return null;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* 1. Header */}
            <InvestmentDetailHeader title={account.name} onDelete={handleDelete} />

            <div className="px-5 space-y-6">
                {/* 2. Overview Card */}
                <InvestmentOverviewCard
                    account={account}
                    onEditValuation={() => setIsUpdateModalOpen(true)}
                />

                {/* 3. Period Selector */}
                <PeriodSelector selectedPeriod={selectedPeriod} onChange={handlePeriodChange} />

                {/* 4. Chart */}
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background-default/50 z-10 flex items-center justify-center rounded-2xl">
                            <span className="text-xs font-bold">로딩 중...</span>
                        </div>
                    )}
                    {account.investmentSnapshots.length > 0 ? (
                        <InvestmentChart
                            data={account.investmentSnapshots}
                            accountOpenDate={account.accountOpenDate}
                        />
                    ) : (
                        <div className="text-center py-10 border border-dashed border-divider rounded-2xl bg-background-paper/50 text-text-secondary text-sm">
                            선택한 기간에 차트 기록이 없습니다.
                        </div>
                    )}
                </div>

                {/* 5. Performance Summary (New Logic Inside) */}
                <PerformanceSummary
                    logs={account.investmentLogs}
                    snapshots={account.investmentSnapshots}
                    currentValuation={account.currentValuation}
                    currentInvestedAmount={account.investedAmount}
                    dateRange={dateRange}
                    createdAt={account.createdAt}
                />

                {/* 6. Transaction List */}
                <TransactionList
                    logs={account.investmentLogs}
                    onAddClick={() => setIsLogModalOpen(true)}
                    onLogClick={handleLogClick}
                />
            </div>

            {/* Modals */}
            <UpdateValuationModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    refresh().then(() => {});
                }}
                accountId={id}
                currentValuation={account.currentValuation}
            />
            <AddInvestmentLogModal
                isOpen={isLogModalOpen}
                onClose={() => {
                    setIsLogModalOpen(false);
                    refresh().then(() => {});
                }}
                accountId={id}
            />
            <EditInvestmentLogModal
                isOpen={isEditLogModalOpen}
                onClose={() => {
                    setIsEditLogModalOpen(false);
                    refresh().then(() => {});
                }}
                log={selectedLog}
            />
        </div>
    );
}
