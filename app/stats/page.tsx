"use client";

import { useState, useEffect, useCallback } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { TxType } from "@prisma/client";
import dayjs from "dayjs";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Line,
    Area,
} from "recharts";

import {
    getInvestmentTrendAction,
    getMonthlyStatsAction,
    InvestmentTrendItem,
    StatItem,
} from "@/actions/stats";
import { Tabs } from "@/components/Tabs";
import { Tab } from "@/components/Tab";

// 차트 색상 팔레트 (예쁜 색상들)
const COLORS = [
    "#FFADAD", // 부드러운 빨강
    "#FFD6A5", // 살구색
    "#6EE7B7", // 파스텔 에메랄드 (Emerald-300)
    "#CAFFBF", // 연두색
    "#9BF6FF", // 하늘색
    "#A0C4FF", // 연한 파랑
    "#BDB2FF", // 연보라
    "#FFC6FF", // 핑크
    "#FFFFFC", // 크림
    "#D4C1EC", // 라벤더
];

type TabType = "EXPENSE" | "INCOME" | "INVESTMENT";

export default function StatsPage() {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [activeTab, setActiveTab] = useState<TabType>("EXPENSE");

    // 데이터 상태 분리
    const [pieData, setPieData] = useState<{ totalAmount: number; stats: StatItem[] } | null>(null);
    const [trendData, setTrendData] = useState<InvestmentTrendItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const year = currentDate.year();
        const month = currentDate.month() + 1;

        if (activeTab === "INVESTMENT") {
            // 투자 추이 데이터 로드
            const data = await getInvestmentTrendAction(year, month);
            setTrendData(data);
        } else {
            // 수입/지출 파이 차트 로드
            const data = await getMonthlyStatsAction(year, month, activeTab as TxType);
            setPieData(data);
        }
        setIsLoading(false);
    }, [currentDate, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
    const handleNextMonth = () => setCurrentDate(currentDate.add(1, "month"));

    // 파이 차트용 데이터 가공 (색상 주입)
    const pieChartData =
        pieData?.stats.map((item, index) => ({
            ...item,
            fill: COLORS[index % COLORS.length],
        })) || [];

    return (
        <div className="pb-20">
            {/* 1. 헤더 */}
            <header className="px-5 py-4 bg-background-default sticky top-0 z-10 flex flex-col gap-4">
                <h1 className="text-xl font-bold text-text-primary">통계</h1>

                <div className="flex items-center justify-between bg-background-paper p-2 rounded-xl border border-divider">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary">
                        <MdChevronLeft size={24} />
                    </button>
                    <span className="text-lg font-bold text-text-primary">
                        {currentDate.format("YYYY년 MM월")}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary">
                        <MdChevronRight size={24} />
                    </button>
                </div>

                {/* 탭: 수입 / 지출 / 투자추이 */}
                <Tabs value={activeTab} onChange={val => setActiveTab(val as TabType)} fullWidth>
                    <Tab value="EXPENSE" label="지출" />
                    <Tab value="INCOME" label="수입" />
                    <Tab value="INVESTMENT" label="투자 추이" />
                </Tabs>
            </header>

            <div className="px-5 space-y-6 mt-4">
                {isLoading ? (
                    <div className="py-20 text-center text-text-secondary">로딩 중...</div>
                ) : activeTab === "INVESTMENT" ? (
                    // ===============================================
                    // 📈 [투자 추이 차트] 영역
                    // ===============================================
                    trendData.length > 0 ? (
                        <div className="bg-background-paper p-5 rounded-2xl border border-divider h-100 pb-10 pl-10">
                            <h3 className="font-bold text-text-primary mb-4 text-sm">
                                일별 전체 자산 수익률 추이
                            </h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#E5E7EB"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval="preserveStartEnd"
                                        minTickGap={30} // 날짜가 겹치지 않게 간격 조정
                                    />
                                    {/* Y축 설정은 기존과 동일 */}
                                    <YAxis yAxisId="left" hide />{" "}
                                    {/* 깔끔하게 보려면 Y축 숫자를 숨기는 것도 방법입니다 */}
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 10, fill: "#F59E0B" }}
                                        unit="%"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    {/* ✅ [수정] 커스텀 툴팁 적용 */}
                                    <Tooltip
                                        content={<CustomTrendTooltip />}
                                        cursor={{
                                            stroke: "#cbd5e1",
                                            strokeWidth: 1,
                                            strokeDasharray: "4 4",
                                        }} // 마우스 오버 시 점선 표시
                                        wrapperStyle={{ zIndex: 1000 }}
                                    />
                                    {/* 평가금 (Area) */}
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="totalValue"
                                        fill="#3B82F6"
                                        fillOpacity={0.05} // 아주 연하게 깔아서 방해되지 않게
                                        stroke="transparent"
                                    />
                                    {/* 수익률 (Line) */}
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="roi"
                                        stroke="#F59E0B"
                                        strokeWidth={2}
                                        dot={false} // 평소엔 점 숨김
                                        activeDot={{ r: 5, strokeWidth: 0, fill: "#F59E0B" }} // 마우스 올렸을 때만 점 표시
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                            <p className="text-center text-xs text-text-secondary mt-2">
                                * 매일 자정에 기록된 평가금 기준입니다.
                            </p>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-text-secondary border border-dashed border-divider rounded-2xl">
                            <span className="text-4xl block mb-2">📉</span>이 기간의 투자 기록이
                            없습니다.
                        </div>
                    )
                ) : // ===============================================
                // 🍕 [수입/지출 파이 차트] 영역 (기존 코드)
                // ===============================================
                pieData && pieData.totalAmount > 0 ? (
                    <>
                        <div className="bg-background-paper p-6 rounded-2xl border border-divider flex flex-col items-center relative h-75">
                            {/* ... 기존 PieChart 코드 ... */}
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="amount"
                                        cornerRadius={4}>
                                        {pieChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.fill}
                                                strokeWidth={0}
                                            />
                                        ))}
                                    </Pie>
                                    {/* 커스텀 툴팁 */}
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        wrapperStyle={{ zIndex: 1000 }}
                                        cursor={{ fill: "transparent" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
                                <p className="text-xs text-text-secondary font-medium mb-1">
                                    총 {activeTab === "EXPENSE" ? "지출" : "수입"}
                                </p>
                                <p className="text-xl font-bold text-text-primary tracking-tight">
                                    {(pieData.totalAmount / 10000).toFixed(0)}
                                    <span className="text-sm font-normal ml-0.5">만</span>
                                </p>
                            </div>
                        </div>

                        {/* 리스트 목록 */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-text-primary">카테고리별 상세</h3>
                            <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                                {pieChartData.map((item, index) => (
                                    <div
                                        key={item.categoryId}
                                        className="flex items-center justify-between p-4 border-b border-divider last:border-none">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-text-secondary">
                                                {index + 1}
                                            </span>
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.fill }}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-text-primary">
                                                    {item.categoryName}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {item.count}건
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-text-primary">
                                                {item.amount.toLocaleString()}원
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {item.percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-text-secondary border border-dashed border-divider rounded-2xl bg-background-paper/50">
                        <span className="text-4xl mb-2">📊</span>
                        <p>내역이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // 원본 데이터 (StatItem)

        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 min-w-37.5">
                {/* 헤더: 색상 점 + 카테고리 이름 */}
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                    <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: data.fill }}
                    />
                    <span className="font-bold text-gray-700 text-sm">{data.categoryName}</span>
                </div>

                {/* 내용: 금액 및 비율 */}
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-lg font-bold text-gray-900">
                        {data.amount.toLocaleString()}원
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                        전체의 {data.percentage.toFixed(1)}%
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // InvestmentTrendItem

        // 평가손익 계산 (총 평가금 - 투자 원금)
        const profit = data.totalValue - data.investedAmount;
        const isPositive = profit >= 0;

        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 min-w-50">
                {/* 날짜 헤더 */}
                <p className="text-gray-500 text-xs font-bold mb-3 border-b border-gray-100 pb-2">
                    {dayjs().year()}.{data.date} 기준
                </p>

                {/* 1. 수익률 & 평가손익 (가장 중요하므로 상단 배치) */}
                <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">수익률</span>
                        <span
                            className={`text-sm font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}>
                            {isPositive ? "+" : ""}
                            {data.roi.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">평가손익</span>
                        <span
                            className={`text-sm font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}>
                            {isPositive ? "+" : ""}
                            {profit.toLocaleString()}원
                        </span>
                    </div>
                </div>

                {/* 2. 자산 상세 정보 (배경색으로 구분) */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">총 평가금</span>
                        <span className="text-xs font-bold text-gray-700">
                            {data.totalValue.toLocaleString()}원
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-secondary">투자 원금</span>
                        <span className="text-xs font-medium text-gray-500">
                            {data.investedAmount.toLocaleString()}원
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
