"use client";

import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface Props {
    data: any[];
    dataKey: string;
    color: string;
}

export default function Sparkline({ data, dataKey, color }: Props) {
    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <YAxis domain={["auto", "auto"]} hide />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false} // 깜빡임 방지
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
