"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface SnapData {
    date: string | Date;
    totalValue: number;
}

export default function InvestmentChart({ data }: { data: SnapData[] }) {
    // 날짜 포맷팅 (MM.DD)
    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);
        return `${date.getMonth() + 1}.${date.getDate()}`;
    };

    if (data.length === 0) {
        return (
            <div className="h-64 bg-background-default/50 rounded-xl flex items-center justify-center text-text-disabled">
                데이터가 없습니다.
            </div>
        );
    }

    return (
        <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatXAxis}
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        hide // Y축 숫자는 공간 차지하므로 숨김 (Tooltip으로 확인)
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--background-paper)",
                            border: "1px solid var(--divider)",
                            borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`₩ ${value.toLocaleString()}`, "평가금"]}
                        labelFormatter={label => new Date(label).toLocaleDateString()}
                    />
                    <Area
                        type="monotone"
                        dataKey="totalValue"
                        stroke="#8884d8"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
