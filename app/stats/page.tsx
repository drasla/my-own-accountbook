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
import DateRangeSelector from "@/components/common/DateRangeSelector";

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

                <DateRangeSelector
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
                />

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
