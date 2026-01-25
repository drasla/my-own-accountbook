"use client";

import { useState } from "react";
import Input from "@/components/Input";
import dayjs from "@/lib/dayjs";

interface Props {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
    className?: string;
}

type PeriodLabel = "이번달" | "1개월" | "3개월" | "6개월" | "1년" | "전체";

export default function DateRangeSelector({ startDate, endDate, onChange, className = "" }: Props) {
    const [activeLabel, setActiveLabel] = useState<PeriodLabel | null>(null);

    const handleQuickBtn = (label: PeriodLabel, months: number | "THIS_MONTH" | "ALL") => {
        setActiveLabel(label);

        const end = dayjs().endOf("day").toDate();
        let start = dayjs().toDate();

        if (months === "THIS_MONTH") {
            start = dayjs().startOf("month").toDate();
        } else if (months === "ALL") {
            start = dayjs("2020-01-01").toDate();
        } else {
            start = dayjs().subtract(months, "month").startOf("day").toDate();
        }

        onChange(start, end);
    };

    // 날짜 직접 변경 핸들러
    const handleManualChange = (type: "start" | "end", dateStr: string) => {
        setActiveLabel(null); // 직접 수정하면 퀵 버튼 활성화 해제
        const date = new Date(dateStr);
        if (type === "start") onChange(date, endDate);
        else onChange(startDate, date);
    };

    return (
        <div
            className={`bg-background-paper p-4 rounded-2xl border border-divider space-y-3 ${className}`}>
            {/* 1. 날짜 입력 영역 */}
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <Input
                        type="date"
                        className="bg-background-default text-sm font-bold"
                        value={dayjs(startDate).format("YYYY-MM-DD")}
                        onChange={e => handleManualChange("start", e.target.value)}
                    />
                </div>
                <span className="text-text-disabled">~</span>
                <div className="flex-1 relative">
                    <Input
                        type="date"
                        className="bg-background-default text-sm font-bold"
                        value={dayjs(endDate).format("YYYY-MM-DD")}
                        onChange={e => handleManualChange("end", e.target.value)}
                    />
                </div>
            </div>

            {/* 2. 퀵 버튼 영역 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <QuickButton
                    label="이번달"
                    isActive={activeLabel === "이번달"}
                    onClick={() => handleQuickBtn("이번달", "THIS_MONTH")}
                />
                <QuickButton
                    label="1개월"
                    isActive={activeLabel === "1개월"}
                    onClick={() => handleQuickBtn("1개월", 1)}
                />
                <QuickButton
                    label="3개월"
                    isActive={activeLabel === "3개월"}
                    onClick={() => handleQuickBtn("3개월", 3)}
                />
                <QuickButton
                    label="6개월"
                    isActive={activeLabel === "6개월"}
                    onClick={() => handleQuickBtn("6개월", 6)}
                />
                <QuickButton
                    label="1년"
                    isActive={activeLabel === "1년"}
                    onClick={() => handleQuickBtn("1년", 12)}
                />
                <QuickButton
                    label="전체"
                    isActive={activeLabel === "전체"}
                    onClick={() => handleQuickBtn("전체", "ALL")}
                />
            </div>
        </div>
    );
}

function QuickButton({
    label,
    onClick,
    isActive,
}: {
    label: string;
    onClick: () => void;
    isActive: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border
                ${
                    isActive
                        ? "bg-primary-main text-white border-primary-main shadow-md shadow-primary-main/20"
                        : "bg-white text-text-secondary border-divider hover:bg-gray-50 hover:text-text-primary"
                }
            `}>
            {label}
        </button>
    );
}
