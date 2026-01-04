"use client";

import { useState, useEffect, use, useCallback } from "react"; // ✅ useEffect 추가
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import UpdateValuationModal from "@/components/investment/UpdateValuationModal";
import AddInvestmentLogModal from "@/components/investment/AddInvestmentLogModal"; // ✅ 아까 만든 모달 import 확인
import { MdArrowBack, MdDelete, MdTrendingUp, MdTrendingDown, MdEdit, MdAdd } from "react-icons/md";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { deleteInvestmentAccountAction, getInvestmentDetail } from "@/actions/investment";
import InvestmentChart from "@/components/charts/InvetmentChart";
import { twMerge } from "tailwind-merge";
import EditInvestmentLogModal from "@/components/investment/EditInvestmentLogModal";

type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";

export default function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedPeriod, setSelectedPeriod] = useState<Period>("3M");
    const [dateRange, setDateRange] = useState({
        start: dayjs().subtract(3, "month").format("YYYY-MM-DD"),
        end: dayjs().endOf("day").format("YYYY-MM-DD"), // 오늘 23:59:59까지
    });

    // 모달 상태
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isEditLogModalOpen, setIsEditLogModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        // "ALL"일 경우 날짜 인자 없이 호출 -> 서버에서 기본값 or 전체 처리
        // 여기서는 서버 로직에 맞춰 날짜를 보냄
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

    // 기간 변경 시 날짜 계산 및 fetch 트리거
    useEffect(() => {
        fetchData().then(() => {});
    }, [fetchData]);

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
            case "1Y":
                start = dayjs().subtract(1, "year").format("YYYY-MM-DD");
                break;
            case "ALL":
                start = "";
                break; // 전체 조회
        }

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

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;
    if (!account) return null;

    // 수익률 계산
    const profit = account.currentValuation - account.investedAmount;
    const roi = account.investedAmount === 0 ? 0 : (profit / account.investedAmount) * 100;
    const isPositive = profit >= 0;

    const startDate = dayjs(account.accountOpenDate ?? account.createdAt);
    const diffDays = dayjs().diff(startDate, "day");
    let cagr = 0;
    if (account.investedAmount > 0 && account.currentValuation > 0 && diffDays > 30) {
        const years = diffDays / 365;
        const growthRatio = account.currentValuation / account.investedAmount;
        cagr = (Math.pow(growthRatio, 1 / years) - 1) * 100;
    } else if (diffDays <= 30) {
        cagr = roi;
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* 1. 헤더 */}
            <div className="px-5 py-4 flex items-center justify-between bg-background-default sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="text" size="sm" color="primary" onClick={() => router.back()}>
                        <MdArrowBack size={24} />
                    </Button>
                    <h1 className="text-xl font-bold text-text-primary">{account.name}</h1>
                </div>
                <Button variant="text" color="error" size="sm" onClick={handleDelete}>
                    <MdDelete size={20} />
                </Button>
            </div>

            <div className="px-5 space-y-6">
                {/* 2. 핵심 요약 카드 */}
                <div className="bg-background-paper p-6 rounded-2xl border border-divider">
                    {/* 상단: 뱃지 및 수정 버튼 */}
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-secondary-main bg-secondary-light/20 px-2 py-0.5 rounded">
                            {account.detailType}
                        </span>
                        <button
                            onClick={() => setIsUpdateModalOpen(true)}
                            className="flex items-center gap-1 text-xs font-bold text-text-secondary bg-background-default px-3 py-1.5 rounded-full border border-divider hover:border-primary-main transition-colors">
                            <MdEdit /> 평가금 수정
                        </button>
                    </div>

                    {/* 메인 데이터 영역 (Flex 사용으로 모바일 대응) */}
                    <div className="flex justify-between items-end gap-2">
                        {/* 좌측: 총 평가금액 (내 돈) */}
                        <div className="flex flex-col">
                            <p className="text-sm text-text-secondary mb-1">총 평가금액</p>
                            <p
                                className={`text-2xl sm:text-3xl font-bold tracking-tight ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                                {account.currentValuation.toLocaleString()}
                                <span className="text-lg sm:text-xl font-normal ml-0.5">원</span>
                            </p>
                            {/* 2. 수익금액 */}
                            <p
                                className={`text-sm ${isPositive ? "text-error-main" : "text-primary-main"} opacity-90`}>
                                {isPositive ? "+" : ""}
                                {profit.toLocaleString()}원
                            </p>
                        </div>

                        {/* 우측: 성과 (수익률 + 수익금) */}
                        <div className="flex flex-col items-end">
                            <p className="text-sm text-text-secondary mb-1">수익률</p>

                            {/* 1. 수익률 (CAGR 포함) */}
                            <div className="flex flex-col items-end">
                                <p
                                    className={`flex items-center gap-1 text-2xl sm:text-3xl font-bold ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                                    {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                                    {roi.toFixed(1)}%
                                </p>
                                {/* 연환산 수익률 (작게) */}
                                <p className="text-sm text-text-disabled">
                                    (연 {cagr.toFixed(1)}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 하단: 원금 및 배당 정보 */}
                    <div
                        className={twMerge(
                            ["mt-5", "pt-4"],
                            ["flex", "flex-col", "gap-2"],
                            ["border-t", "border-divider"],
                        )}>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">투자 원금</span>
                            <span className="font-medium text-text-primary">
                                {account.investedAmount.toLocaleString()}원
                            </span>
                        </div>
                        {(account.cumulativeDividend || 0) > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary">누적 배당</span>
                                <span className="font-medium text-success-main">
                                    +{account.cumulativeDividend.toLocaleString()}원
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ [추가] 기간 선택 버튼 그룹 */}
                <div className="flex p-1 bg-background-paper border border-divider rounded-xl overflow-x-auto no-scrollbar">
                    {(["1M", "3M", "6M", "1Y", "ALL"] as Period[]).map(period => (
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

                {/* 3. 차트 (필터링된 데이터 반영) */}
                <div className="relative">
                    {/* 로딩 인디케이터 (데이터 갱신 시 깜빡임 방지용) */}
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

                {/* 4. 입출금 기록 & 추가 버튼 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-text-primary">
                            입출금 내역 (시드머니)
                        </h3>

                        {/* ✅ 기록 추가 버튼 */}
                        <Button
                            size="sm"
                            variant="text"
                            className="text-primary-main gap-1"
                            onClick={() => setIsLogModalOpen(true)}>
                            <MdAdd size={18} /> 기록 추가
                        </Button>
                    </div>

                    {account.investmentLogs.length > 0 ? (
                        <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                            {account.investmentLogs.map((log: any) => (
                                <div
                                    key={log.id}
                                    onClick={() => handleLogClick(log)}
                                    className="flex items-center justify-between p-4 border-b border-divider last:border-none">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-text-secondary w-12 text-center">
                                            {dayjs(log.date).format("MM.DD")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">
                                                {log.type === "DEPOSIT"
                                                    ? "투자금 입금"
                                                    : log.type === "DIVIDEND"
                                                      ? "배당금 (재투자)"
                                                      : "투자금 회수"}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {log.note || "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`font-bold ${
                                            log.type === "WITHDRAW"
                                                ? "text-primary-main"
                                                : "text-error-main"
                                        }`}>
                                        {log.type === "WITHDRAW" ? "-" : "+"}
                                        {log.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-secondary text-sm border border-dashed border-divider rounded-2xl">
                            입출금 내역이 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 평가금 수정 모달 */}
            <UpdateValuationModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    fetchData().then(() => {});
                }}
                accountId={id}
                currentValuation={account.currentValuation}
            />

            {/* 입출금 기록 모달 */}
            <AddInvestmentLogModal
                isOpen={isLogModalOpen}
                onClose={() => {
                    setIsLogModalOpen(false);
                    fetchData().then(() => {});
                }}
                accountId={id}
            />

            {/* ✅ [추가] 로그 수정 모달 */}
            <EditInvestmentLogModal
                isOpen={isEditLogModalOpen}
                onClose={() => {
                    setIsEditLogModalOpen(false);
                    fetchData().then(() => {});
                }}
                log={selectedLog}
            />
        </div>
    );
}
