"use client";

import { MdEdit, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { twMerge } from "tailwind-merge";

interface Props {
    account: any;
    onEditValuation: () => void;
}

export default function InvestmentOverviewCard({ account, onEditValuation }: Props) {
    // 수익률 계산
    const profit = account.currentValuation - account.investedAmount;
    const roi = account.investedAmount === 0 ? 0 : (profit / account.investedAmount) * 100;
    const isPositive = profit >= 0;

    return (
        <div className="bg-background-paper p-6 rounded-2xl border border-divider">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-secondary-main bg-secondary-light/20 px-2 py-0.5 rounded">
                    {account.detailType}
                </span>
                <button
                    onClick={onEditValuation}
                    className="flex items-center gap-1 text-xs font-bold text-text-secondary bg-background-default px-3 py-1.5 rounded-full border border-divider hover:border-primary-main transition-colors">
                    <MdEdit /> 평가금 수정
                </button>
            </div>

            <div className="flex justify-between items-end gap-2">
                <div className="flex flex-col">
                    <p className="text-sm text-text-secondary mb-1">총 평가금액</p>
                    <p
                        className={`text-2xl sm:text-3xl font-bold tracking-tight ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                        {account.currentValuation.toLocaleString()}
                        <span className="text-lg sm:text-xl font-normal ml-0.5">원</span>
                    </p>
                    <p
                        className={`text-sm ${isPositive ? "text-error-main" : "text-primary-main"} opacity-90`}>
                        {isPositive ? "+" : ""}
                        {profit.toLocaleString()}원
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <p className="text-sm text-text-secondary mb-1">수익률</p>
                    <div className="flex flex-col items-end">
                        <p
                            className={`flex items-center gap-1 text-2xl sm:text-3xl font-bold ${isPositive ? "text-error-main" : "text-primary-main"}`}>
                            {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
                            {roi.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={twMerge(
                    ["mt-5", "pt-4"],
                    ["flex", "flex-col", "gap-2"],
                    ["border-t", "border-divider"],
                )}>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">투자 원금</span>
                    <span className="font-medium text-text-primary">
                        {account.investedAmount.toLocaleString()}원
                    </span>
                </div>
                {(account.cumulativeDividend || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">누적 배당</span>
                        <span className="font-medium text-success-main">
                            +{account.cumulativeDividend.toLocaleString()}원
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
