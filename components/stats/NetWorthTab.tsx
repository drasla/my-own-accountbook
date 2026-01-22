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
import { NetWorthTrendItem } from "@/actions/stats";

interface Props {
    data: NetWorthTrendItem[];
}

export default function NetWorthTab({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="py-20 text-center text-text-secondary border border-dashed border-divider rounded-2xl">
                <span className="text-4xl block mb-2">📉</span>
                데이터가 부족하여 순자산을 계산할 수 없습니다.
            </div>
        );
    }

    return (
        <div className="bg-background-paper p-5 rounded-2xl border border-divider h-100">
            <h3 className="font-bold text-text-primary mb-4 text-sm">
                월간 순자산 변동 (자산 - 부채)
            </h3>
            <ResponsiveContainer width="100%" height="100%" className="-ml-4">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickFormatter={val => `${(val / 10000).toFixed(0)}만`}
                        axisLine={false}
                        tickLine={false}
                        domain={["auto", "auto"]}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value: any) => [
                            `${Number(value).toLocaleString()}원`,
                            "순자산",
                        ]}
                        labelStyle={{
                            color: "#374151",
                            fontWeight: "bold",
                            marginBottom: "4px",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="netWorth"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorNetWorth)"
                    />
                </AreaChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-text-secondary mt-2">
                * 거래 내역과 투자 기록을 바탕으로 추산된 금액입니다.
            </p>
        </div>
    );
}
