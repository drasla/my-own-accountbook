"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { StatItem } from "@/actions/stats";
import { getChartColor } from "@/constants/colors"; // ✅ 색상 상수 사용

interface Props {
    data: { totalAmount: number; stats: StatItem[] } | null;
    type: "INCOME" | "EXPENSE";
}

export default function CategoryPieTab({ data, type }: Props) {
    if (!data || data.totalAmount === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-text-secondary border border-dashed border-divider rounded-2xl bg-background-paper/50">
                <span className="text-4xl mb-2">📊</span>
                <p>내역이 없습니다.</p>
            </div>
        );
    }

    // ✅ 색상 매핑
    const chartData = data.stats.map((item, index) => ({
        ...item,
        fill: getChartColor(index),
    }));

    return (
        <>
            <div className="bg-background-paper p-6 rounded-2xl border border-divider flex flex-col items-center relative h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="amount"
                            cornerRadius={4}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ zIndex: 1000 }}
                            cursor={{ fill: "transparent" }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
                    <p className="text-xs text-text-secondary font-medium mb-1">
                        총 {type === "EXPENSE" ? "지출" : "수입"}
                    </p>
                    <p className="text-xl font-bold text-text-primary tracking-tight">
                        {(data.totalAmount / 10000).toFixed(0)}
                        <span className="text-sm font-normal ml-0.5">만</span>
                    </p>
                </div>
            </div>

            {/* 리스트 목록 */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-text-primary">카테고리별 상세</h3>
                <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                    {chartData.map((item, index) => (
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
                                    <p className="text-xs text-text-secondary">{item.count}건</p>
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
    );
}

// 툴팁 컴포넌트
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                    <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: data.fill }}
                    />
                    <span className="font-bold text-gray-700 text-sm">{data.categoryName}</span>
                </div>
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
