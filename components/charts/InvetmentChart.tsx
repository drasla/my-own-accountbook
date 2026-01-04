"use client";

import {
    ResponsiveContainer,
    ComposedChart, // ✅ 변경: AreaChart -> ComposedChart (혼합 차트용)
    Area,
    Line, // ✅ 추가: 수익률 선 그래프용
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import dayjs from "dayjs";
import { InvestmentSnapshot } from "@prisma/client";

interface Props {
    data: InvestmentSnapshot[];
    accountOpenDate: string | Date;
}

export default function InvestmentChart({ data, accountOpenDate }: Props) {
    // 데이터 가공
    const chartData = data.map(d => {
        const profit = d.totalValue - d.investedAmount;

        // 단순 총 수익률
        const totalRate = d.investedAmount === 0 ? 0 : (profit / d.investedAmount) * 100;

        // ✅ 연평균 수익률 (CAGR) 계산 로직
        const startDate = dayjs(accountOpenDate);
        const currentDate = dayjs(d.date);
        const diffDays = currentDate.diff(startDate, "day"); // 경과 일수

        let cagr = 0;

        // 원금이 있고, 가치가 있으며, 하루라도 지났을 때 계산
        if (d.investedAmount > 0 && d.totalValue > 0 && diffDays > 0) {
            const years = diffDays / 365; // 연 단위 변환
            // 공식: (기말가치 / 기초가치)^(1/n) - 1
            // 1년 미만일 경우에도 연환산(Projected)해서 보여줄지, 단순수익률로 할지 결정해야 함.
            // 여기서는 수학적 연환산을 적용하되, 너무 극단적인 값 방지를 위해 30일 이후부터 계산 추천
            if (diffDays > 30) {
                const growthRatio = d.totalValue / d.investedAmount;
                cagr = (Math.pow(growthRatio, 1 / years) - 1) * 100;
            } else {
                // 30일 미만은 연환산하면 왜곡이 심하므로 단순 수익률과 동일하게 처리하거나 0
                cagr = totalRate;
            }
        }

        return {
            date: dayjs(d.date).format("MM.DD"),
            principal: d.investedAmount,
            value: d.totalValue,
            profit: profit,
            rate: totalRate, // 단순 수익률
            cagr: cagr, // ✅ 연평균 수익률
        };
    });

    return (
        <div className="bg-background-paper p-5 rounded-2xl border border-divider h-80 pb-14">
            <h3 className="font-bold text-text-primary mb-4">자산 성장 및 수익률</h3>
            <ResponsiveContainer width="100%" height="100%" className="-ml-2">
                <ComposedChart data={chartData}>
                    {/* ... Gradients, CartesianGrid, XAxis, YAxis (기존 동일) ... */}
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#9CA3AF" }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />

                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickFormatter={val => `${(val / 10000).toFixed(0)}만`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "#F59E0B" }}
                        unit="%"
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" align={"center"} />

                    {/* Area, Line 컴포넌트 기존 동일 */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="principal"
                        name="원금"
                        stroke="#94a3b8"
                        fill="transparent"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="value"
                        name="평가금"
                        stroke="#f43f5e"
                        fill="url(#colorValue)"
                        strokeWidth={2}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rate"
                        name="수익률(%)"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.profit >= 0;

        return (
            <div className="bg-background-paper p-3 border border-divider rounded-xl shadow-lg text-xs z-50 min-w-[160px]">
                <p className="font-bold mb-2 text-text-primary border-b border-divider pb-1">
                    {label}
                </p>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">평가금</span>
                        <span className="font-bold text-error-main">
                            {data.value.toLocaleString()}원
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">원금</span>
                        <span className="font-medium text-text-primary">
                            {data.principal.toLocaleString()}원
                        </span>
                    </div>
                    <div className="h-px bg-divider my-1" />

                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">수익금</span>
                        <span
                            className={`font-bold ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                            {isPositive ? "+" : ""}
                            {data.profit.toLocaleString()}원
                        </span>
                    </div>

                    {/* ✅ 수익률 (연평균) 표시 */}
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">수익률</span>
                        <div className="text-right">
                            <span
                                className={`font-bold ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                                {data.rate.toFixed(2)}%
                            </span>
                            {/* 연평균 수익률 괄호 표시 */}
                            <span className="text-[10px] text-text-disabled block">
                                (연 {data.cagr.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
