"use client";

import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { Tabs } from "@/components/Tabs";
import { Tab } from "@/components/Tab";
import {
    getInvestmentTrendAction,
    getNetWorthTrendAction,
    getStatsAction,
    InvestmentTrendItem,
    NetWorthTrendItem,
    StatItem,
} from "@/actions/stats";
import NetWorthTab from "@/components/stats/NetWorthTab";
import InvestmentTab from "@/components/stats/InvestmentTab";
import CategoryPieTab from "@/components/stats/CategoryPieTab";

type TabType = "EXPENSE" | "INCOME" | "INVESTMENT" | "NET_WORTH";

export default function StatsPage() {
    const [dateRange, setDateRange] = useState({
        startDate: dayjs().startOf("month").toDate(),
        endDate: dayjs().endOf("day").toDate(),
    });
    const [activeTab, setActiveTab] = useState<TabType>("NET_WORTH");

    // 데이터 상태
    const [pieData, setPieData] = useState<{ totalAmount: number; stats: StatItem[] } | null>(null);
    const [trendData, setTrendData] = useState<InvestmentTrendItem[]>([]);
    const [netWorthData, setNetWorthData] = useState<NetWorthTrendItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const { startDate, endDate } = dateRange;

        if (activeTab === "INVESTMENT") {
            const data = await getInvestmentTrendAction(startDate, endDate);
            setTrendData(data);
        } else if (activeTab === "NET_WORTH") {
            const data = await getNetWorthTrendAction(startDate, endDate);
            setNetWorthData(data);
        } else {
            // 수입 또는 지출
            const data = await getStatsAction(startDate, endDate, activeTab as any);
            setPieData(data);
        }
        setIsLoading(false);
    }, [dateRange, activeTab]);

    useEffect(() => {
        fetchData().then(() => {});
    }, [fetchData]);

    // 퀵 버튼 핸들러
    const handleQuickRange = (months: number) => {
        const end = dayjs().endOf("day").toDate();
        const start = dayjs().subtract(months, "month").startOf("day").toDate();
        setDateRange({ startDate: start, endDate: end });
    };

    const handleThisMonth = () => {
        setDateRange({
            startDate: dayjs().startOf("month").toDate(),
            endDate: dayjs().endOf("day").toDate(),
        });
    };

    return (
        <div className="pb-20">
            {/* 1. 헤더 */}
            <header className="py-4 bg-background-default sticky top-0 z-10 flex flex-col gap-4">
                <h1 className="text-xl font-bold text-text-primary">통계</h1>

                {/* 기간 선택기 */}
                <div className="bg-background-paper p-4 rounded-2xl border border-divider shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="date"
                                className="w-full bg-background-default border border-divider rounded-lg p-2 text-sm font-bold text-text-primary outline-none focus:border-primary-main"
                                value={dayjs(dateRange.startDate).format("YYYY-MM-DD")}
                                onChange={e =>
                                    setDateRange(prev => ({
                                        ...prev,
                                        startDate: new Date(e.target.value),
                                    }))
                                }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none text-xs">
                                부터
                            </span>
                        </div>
                        <span className="text-text-disabled">~</span>
                        <div className="flex-1 relative">
                            <input
                                type="date"
                                className="w-full bg-background-default border border-divider rounded-lg p-2 text-sm font-bold text-text-primary outline-none focus:border-primary-main"
                                value={dayjs(dateRange.endDate).format("YYYY-MM-DD")}
                                onChange={e =>
                                    setDateRange(prev => ({
                                        ...prev,
                                        endDate: new Date(e.target.value),
                                    }))
                                }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none text-xs">
                                까지
                            </span>
                        </div>
                    </div>

                    {/* 퀵 버튼 그룹 */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <QuickButton label="이번달" onClick={handleThisMonth} />
                        <QuickButton label="1개월" onClick={() => handleQuickRange(1)} />
                        <QuickButton label="3개월" onClick={() => handleQuickRange(3)} />
                        <QuickButton label="6개월" onClick={() => handleQuickRange(6)} />
                        <QuickButton label="1년" onClick={() => handleQuickRange(12)} />
                    </div>
                </div>

                {/* 탭 메뉴 */}
                <Tabs value={activeTab} onChange={val => setActiveTab(val as TabType)} fullWidth>
                    <Tab value="EXPENSE" label="지출" />
                    <Tab value="INCOME" label="수입" />
                    <Tab value="INVESTMENT" label="투자" />
                    <Tab value="NET_WORTH" label="자산" />
                </Tabs>
            </header>

            {/* 2. 컨텐츠 영역 */}
            <div className="space-y-6 mt-4">
                {isLoading ? (
                    <div className="py-20 text-center text-text-secondary">로딩 중...</div>
                ) : (
                    <>
                        {/* ✅ 탭 상태에 따라 명확하게 분기 처리 */}
                        {activeTab === "NET_WORTH" && <NetWorthTab data={netWorthData} />}

                        {activeTab === "INVESTMENT" && <InvestmentTab data={trendData} />}

                        {(activeTab === "INCOME" || activeTab === "EXPENSE") && (
                            <CategoryPieTab data={pieData} type={activeTab} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// 퀵 버튼 컴포넌트 (파일 하단에 유지)
function QuickButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border bg-white text-text-secondary border-divider hover:bg-gray-50 hover:text-text-primary">
            {label}
        </button>
    );
}