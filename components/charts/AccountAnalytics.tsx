"use client";

import { useMemo, useState } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import dayjs from "dayjs";
import { MoneyTransaction } from "@prisma/client";
import { MdBarChart, MdPieChart } from "react-icons/md";

interface Props {
    transactions: MoneyTransaction[];
    startDate: string;
    endDate: string;
    currentBalance: number;
}

// 데이터 타입 정의
interface DailyChartData {
    date: string;
    income: number;
    expense: number;
    balance: number;
}

interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    payload: DailyChartData;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

export default function AccountAnalytics({
    transactions,
    startDate,
    endDate,
    currentBalance,
}: Props) {
    const [chartType, setChartType] = useState<"BAR" | "PIE">("BAR");

    // 1. 데이터 가공
    const chartData = useMemo(() => {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const diffDays = end.diff(start, "day");

        // (1) 날짜별 맵 초기화
        const dataMap = new Map<string, DailyChartData>();
        for (let i = 0; i <= diffDays; i++) {
            const d = start.add(i, "day").format("YYYY-MM-DD");
            dataMap.set(d, { date: d, income: 0, expense: 0, balance: 0 });
        }

        // (2) 수입/지출 집계
        transactions.forEach(tx => {
            const dateKey = dayjs(tx.date).format("YYYY-MM-DD");
            if (dataMap.has(dateKey)) {
                const item = dataMap.get(dateKey)!;
                if (tx.type === "INCOME") item.income += tx.amount;
                else if (tx.type === "EXPENSE") item.expense += tx.amount;
            }
        });

        const dataArray = Array.from(dataMap.values());

        // (3) 잔고(Balance) 라인 계산 (역산 방식)
        // 논리: 오늘 잔고에서 시작해서 과거로 갈수록 -> (수입은 빼고, 지출은 더해서) 어제 잔고를 구함
        // 주의: 이 방식은 '조회 종료일'이 '오늘(최신)'일 때 가장 정확합니다.
        let runningBalance = currentBalance;

        // 배열을 뒤에서부터 순회 (최신 날짜 -> 과거)
        for (let i = dataArray.length - 1; i >= 0; i--) {
            // 그 날의 최종 잔고 기록
            dataArray[i].balance = runningBalance;

            // 그 날 있었던 변동분을 되돌려 놓음 (어제 잔고를 구하기 위해)
            // 오늘 잔고 = 어제 잔고 + 수입 - 지출
            // ∴ 어제 잔고 = 오늘 잔고 - 수입 + 지출
            runningBalance = runningBalance - dataArray[i].income + dataArray[i].expense;
        }

        return dataArray;
    }, [transactions, startDate, endDate, currentBalance]);

    // 파이 차트 데이터
    const pieData = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === "INCOME")
            .reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === "EXPENSE")
            .reduce((acc, t) => acc + t.amount, 0);

        return [
            { name: "수입", value: totalIncome },
            { name: "지출", value: totalExpense },
        ];
    }, [transactions]);

    const PIE_COLORS = ["#10B981", "#EF4444"];

    return (
        <div className="bg-background-paper rounded-2xl border border-divider p-5 shadow-sm">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text-primary">자산 흐름 분석</h3>
                <div className="flex bg-background-default rounded-lg p-1 border border-divider">
                    <button
                        onClick={() => setChartType("BAR")}
                        className={`p-1.5 rounded-md transition-all ${
                            chartType === "BAR"
                                ? "bg-white shadow-sm text-primary-main"
                                : "text-text-disabled"
                        }`}>
                        <MdBarChart size={20} />
                    </button>
                    <button
                        onClick={() => setChartType("PIE")}
                        className={`p-1.5 rounded-md transition-all ${
                            chartType === "PIE"
                                ? "bg-white shadow-sm text-primary-main"
                                : "text-text-disabled"
                        }`}>
                        <MdPieChart size={20} />
                    </button>
                </div>
            </div>

            <div className="h-[250px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "BAR" ? (
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E5E7EB"
                            />

                            <XAxis
                                dataKey="date"
                                tickFormatter={val => dayjs(val).format("DD")}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF" }}
                                dy={10}
                            />

                            {/* ✅ 왼쪽 Y축 (수입/지출용) */}
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF" }}
                                tickFormatter={val => `${Math.abs(val) / 10000}만`}
                            />

                            {/* ✅ 오른쪽 Y축 (잔고용) */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#3B82F6" }} // 파란색 텍스트
                                tickFormatter={val => `${val / 10000}만`}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F3F4F6" }} />

                            {/* 수입 Bar (왼쪽 축) */}
                            <Bar
                                yAxisId="left"
                                dataKey="income"
                                name="income"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={30}
                            />

                            {/* 지출 Bar (왼쪽 축) */}
                            <Bar
                                yAxisId="left"
                                dataKey="expense"
                                name="expense"
                                fill="#EF4444"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={30}
                            />

                            {/* ✅ 잔고 Line (오른쪽 축) */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="balance"
                                name="balance"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false} // 점 없애기 (깔끔하게)
                                activeDot={{ r: 4 }}
                            />
                        </ComposedChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | string | undefined) => {
                                    if (typeof value === "number") {
                                        return `${value.toLocaleString()}원`;
                                    }
                                    return value;
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        // payload 순서: [0]수입, [1]지출, [2]잔고 (차트 정의 순서에 따름)
        // 안전하게 name으로 찾기
        const inc = payload.find(p => p.name === "income");
        const exp = payload.find(p => p.name === "expense");
        const bal = payload.find(p => p.name === "balance");

        return (
            <div className="bg-background-paper p-3 border border-divider rounded-lg shadow-lg text-xs z-50">
                <p className="font-bold mb-2 text-text-primary border-b border-divider pb-1">
                    {dayjs(label).format("MM월 DD일")}
                </p>
                <div className="space-y-1">
                    <p className="text-primary-main font-bold">
                        잔고: {bal?.value.toLocaleString()}
                    </p>
                    <p className="text-success-main">수입: +{inc?.value.toLocaleString()}</p>
                    <p className="text-error-main">지출: -{exp?.value.toLocaleString()}</p>
                </div>
            </div>
        );
    }
    return null;
};
