"use client";

import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { InvestmentTrendItem } from "@/actions/stats";

interface Props {
    data: InvestmentTrendItem[];
}

export default function InvestmentTab({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="py-20 text-center text-text-secondary border border-dashed border-divider rounded-2xl">
                <span className="text-4xl block mb-2">📉</span>이 기간의 투자 기록이 없습니다.
            </div>
        );
    }

    return (
        <div className="bg-background-paper p-5 rounded-2xl border border-divider h-100">
            <h3 className="font-bold text-text-primary mb-4 text-sm">일별 전체 자산 수익률 추이</h3>
            <ResponsiveContainer width="100%" height="100%" className="-ml-4">
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis yAxisId="left" hide />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: "#F59E0B" }}
                        unit="%"
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        content={<CustomTrendTooltip />}
                        cursor={{
                            stroke: "#cbd5e1",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                        }}
                        wrapperStyle={{ zIndex: 1000 }}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalValue"
                        fill="#3B82F6"
                        fillOpacity={0.05}
                        stroke="transparent"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="roi"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: "#F59E0B" }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-text-secondary mt-2">
                * 매일 자정에 기록된 평가금 기준입니다.
            </p>
        </div>
    );
}

// 툴팁 컴포넌트 (내부 사용)
const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const profit = data.totalValue - data.investedAmount;
        const isPositive = profit >= 0;

        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 min-w-[200px]">
                <p className="text-gray-500 text-xs font-bold mb-3 border-b border-gray-100 pb-2">
                    {dayjs().year()}.{data.date} 기준
                </p>
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
