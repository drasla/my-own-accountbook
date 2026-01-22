"use client";

export type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface Props {
    selectedPeriod: Period;
    onChange: (period: Period) => void;
}

export default function PeriodSelector({ selectedPeriod, onChange }: Props) {
    const periods: Period[] = ["1M", "3M", "6M", "1Y", "ALL"];

    return (
        <div className="flex p-1 bg-background-paper border border-divider rounded-xl overflow-x-auto no-scrollbar">
            {periods.map(period => (
                <button
                    key={period}
                    onClick={() => onChange(period)}
                    className={`flex-1 min-w-15 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedPeriod === period
                            ? "bg-primary-main text-white shadow-sm"
                            : "text-text-secondary hover:bg-background-default"
                    }`}>
                    {period === "ALL" ? "전체" : period}
                </button>
            ))}
        </div>
    );
}
