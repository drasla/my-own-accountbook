"use client";

import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import dayjs from "dayjs";

interface Props {
    logs: any[];
    snapshots: any[];
    currentValuation: number;
    currentInvestedAmount: number;
    dateRange: { start: string; end: string };
    createdAt: string;
}

export default function PerformanceSummary({
    logs,
    snapshots,
    currentValuation,
    currentInvestedAmount,
    dateRange,
    createdAt,
}: Props) {
    // 1. 기간 내 로그 집계 (배당금 및 순입금 확인용)
    let periodDividend = 0;
    let periodPrincipalChange = 0;

    logs.forEach(log => {
        if (log.type === "DIVIDEND") periodDividend += log.amount;
        else if (log.type === "DEPOSIT") periodPrincipalChange += log.amount;
        else if (log.type === "WITHDRAW") periodPrincipalChange -= log.amount;
    });

    // 2. [핵심 수정] 스냅샷 기반의 '수익금(Valuation - Invested)' 변화량 계산
    // 스냅샷 데이터가 있으면 그것을 쓰고, 없으면(기간이 너무 짧거나 데이터 없음) 현재 상태를 사용

    // (A) 시작 시점 상태
    const startSnapshot = snapshots.length > 0 ? snapshots[0] : null;
    const startVal = startSnapshot ? startSnapshot.totalValue : 0; // 데이터 없으면 0 가정 (혹은 생성일 기준 로직)
    const startInv = startSnapshot ? startSnapshot.investedAmount : 0;
    const startProfit = startVal - startInv; // 시작 시점의 이미 난 수익
    const startRoi = startInv === 0 ? 0 : (startProfit / startInv) * 100;

    // (B) 종료 시점 상태 (보통 현재)
    // 스냅샷의 마지막이 '오늘'이 아닐 수 있으므로, 가장 최신 데이터는 props로 받은 current 값을 우선 고려
    const endVal = currentValuation;
    const endInv = currentInvestedAmount;
    const endProfit = endVal - endInv;
    const endRoi = endInv === 0 ? 0 : (endProfit / endInv) * 100;

    // (C) 이 기간 동안 늘어난 '총 수익금' (자산 증가분 - 원금 증가분)
    // 예: 시작 때 수익 100만 -> 끝 때 수익 150만 = 기간 수익 +50만
    // 스냅샷이 아예 없는 경우(신규 생성 등)는 전체가 기간 수익
    const totalProfitDelta = snapshots.length > 0 ? endProfit - startProfit : endProfit;

    // 3. 순수 평가 손익 (Market PnL)
    // 총 수익 증가분에서 배당으로 인한 증가분을 뺌 -> 순수 주가 상승분만 남음
    const marketProfit = totalProfitDelta - periodDividend;
    const isMarketProfitPositive = marketProfit >= 0;

    // 4. 총 자산 변동 (단순 비교)
    // 시작 스냅샷이 없으면(신규), 0원에서 현재 금액이 된 것이므로 현재 금액 전체가 변동분
    const totalValuationChange = snapshots.length > 0 ? endVal - startVal : endVal - 0;
    const roiChange = endRoi - startRoi;

    const moneyFmt = (num: number) => (isNaN(num) ? "0" : Math.floor(num).toLocaleString());
    const percentFmt = (num: number) => (isNaN(num) ? "0.00" : num.toFixed(2));

    return (
        <div className="bg-background-paper p-5 rounded-2xl border border-divider shadow-sm">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <MdTrendingUp className="text-primary-main" />
                선택 기간 성과 요약
                <span className="text-xs font-normal text-text-secondary">
                    ({dayjs(dateRange.start || createdAt).format("YY.MM.DD")} ~{" "}
                    {dayjs(dateRange.end).format("YY.MM.DD")})
                </span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* 1. ✅ 수익률 변화 (가장 중요해서 2칸 차지하며 강조) */}
                <div className="col-span-2 p-4 bg-primary-main/5 border border-primary-main/20 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-primary-main mb-1">기간 수익률 변화</p>
                        <p className="text-xs text-text-secondary">
                            {percentFmt(startRoi)}% <span className="text-text-disabled">→</span>{" "}
                            {percentFmt(endRoi)}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p
                            className={`text-xl font-bold flex items-center gap-1 ${roiChange >= 0 ? "text-error-main" : "text-primary-main"}`}>
                            {roiChange >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                            {roiChange >= 0 ? "+" : ""}
                            {percentFmt(roiChange)}%p
                        </p>
                    </div>
                </div>

                {/* 2. 평가 손익 변동 */}
                <SummaryItem
                    label="평가 손익 변동"
                    value={marketProfit}
                    colorClass={marketProfit >= 0 ? "text-error-main" : "text-primary-main"}
                    formatter={moneyFmt}
                    unit="원"
                />

                {/* 3. 총 자산 변동 */}
                <SummaryItem
                    label="총 자산 변동"
                    value={totalValuationChange}
                    colorClass={totalValuationChange >= 0 ? "text-error-main" : "text-primary-main"}
                    formatter={moneyFmt}
                    unit="원"
                />

                {/* 4. 기간 내 순입금 */}
                <SummaryItem
                    label="기간 내 순입금"
                    value={periodPrincipalChange}
                    formatter={moneyFmt}
                    unit="원"
                />

                {/* 5. 기간 내 배당 */}
                <SummaryItem
                    label="기간 내 배당"
                    value={periodDividend}
                    isPlusOnly
                    colorClass="text-success-main"
                    formatter={moneyFmt}
                    unit="원"
                />
            </div>

            <p className="text-[10px] text-text-disabled mt-3 text-right">
                * 수익률 변화 = 기말 수익률 - 기초 수익률 (단순 차이)
            </p>
        </div>
    );
}

function SummaryItem({ label, value, colorClass = "text-text-primary", isPlusOnly = false }: any) {
    const displayValue = value.toLocaleString();
    const sign = value > 0 || isPlusOnly ? "+" : "";
    return (
        <div className="p-3 bg-background-default rounded-xl border border-divider">
            <p className="text-xs text-text-secondary mb-1">{label}</p>
            <p className={`text-sm font-bold ${colorClass}`}>
                {sign}
                {displayValue}원
            </p>
        </div>
    );
}
