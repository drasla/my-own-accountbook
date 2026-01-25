"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardDataAction } from "@/actions/dashboard";
import Sparkline from "@/components/dashboard/Sparkline";
import {
    MdAccountBalance,
    MdTrendingUp,
    MdCreditCard,
    MdReceiptLong,
    MdShowChart,
} from "react-icons/md";
import CreateAssetModal from "@/components/asset/CreateAssetModal";
import dayjs from "@/lib/dayjs";

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await getDashboardDataAction();
            setData(res);
            setIsLoading(false);
        };
        load();
    }, []);

    if (isLoading) return <div className="p-10 text-center text-text-secondary">로딩 중...</div>;
    if (!data) return <div className="p-10 text-center">데이터를 불러올 수 없습니다.</div>;

    const { summary, diff, chartData, accounts, todaysTransactions, investmentPerformance } = data;
    const fmt = (n: number) => Math.floor(n).toLocaleString();

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="pt-8 pb-6">
                <p className="text-text-secondary text-sm font-medium">
                    {dayjs().format("YYYY년 M월 D일 dddd")}
                </p>
                <h1 className="text-3xl font-bold text-text-primary mt-1">오늘의 자산</h1>
            </header>

            {/* 그리드 레이아웃 (좌2 : 우1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ================= 좌측: 자산 현황 ================= */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 메인 카드 */}
                    <div className="bg-background-paper p-6 rounded-3xl border border-divider shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                            <div>
                                <p className="text-sm text-text-secondary font-medium">총 순자산</p>
                                <div className="flex items-baseline gap-3 mt-1">
                                    <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
                                        {fmt(summary.currentNetWorth)}원
                                    </h2>
                                    <div className="flex items-center gap-1 bg-background-default px-2 py-1 rounded-lg">
                                        <span className="text-xs text-text-secondary">
                                            어제보다
                                        </span>
                                        <DiffBadge value={diff.netWorth} />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full sm:w-64 h-16 sm:h-20">
                                <Sparkline data={chartData} dataKey="netWorth" color="#6366f1" />
                            </div>
                        </div>
                    </div>

                    {/* 서브 카드 그리드 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                        <SummarySmallCard
                            title="현금 자산"
                            amount={summary.currentCash}
                            diff={diff.cash}
                            chartData={chartData}
                            dataKey="cash"
                            color="#10B981"
                            icon={<MdAccountBalance />}
                            onClick={() => router.push("/accounts")}
                        />
                        <SummarySmallCard
                            title="투자 자산"
                            amount={summary.currentInvest}
                            diff={diff.invest}
                            chartData={chartData}
                            dataKey="invest"
                            color="#F59E0B"
                            icon={<MdTrendingUp />}
                            onClick={() => router.push("/accounts")}
                        />
                        <div className="col-span-2 md:col-span-1">
                            <SummaryDebtCard
                                amount={summary.currentDebt}
                                onClick={() => router.push("/accounts")}
                            />
                        </div>
                    </div>

                    {/* 숏컷 섹션 */}
                    <section className="mt-8">
                        {/* 자산 없을 때 안내 */}
                        {accounts.banks.length +
                            accounts.investments.length +
                            accounts.cards.length ===
                            0 && (
                            <div className="w-full text-center py-10 text-text-secondary text-sm border border-dashed border-divider rounded-2xl mb-4">
                                등록된 자산이 없습니다. 우측 상단 버튼을 눌러 추가해보세요!
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-text-primary">
                                내 계좌 바로가기
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="text-xs font-bold text-primary-main bg-primary-light/10 px-3 py-1.5 rounded-full">
                                + 자산 추가
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* 1. 현금 */}
                            {accounts.banks.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-text-secondary mb-2 flex items-center gap-2">
                                        💵 현금{" "}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {accounts.banks.length}
                                        </span>
                                    </h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0">
                                        {accounts.banks.map((b: any) => (
                                            <ShortcutCard
                                                key={b.id}
                                                name={b.name}
                                                amount={b.currentBalance}
                                                type="BANK"
                                                onClick={() => router.push(`/bank/${b.id}`)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. 투자 */}
                            {accounts.investments.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-text-secondary mb-2 flex items-center gap-2">
                                        📈 투자{" "}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {accounts.investments.length}
                                        </span>
                                    </h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0">
                                        {accounts.investments.map((i: any) => (
                                            <ShortcutCard
                                                key={i.id}
                                                name={i.name}
                                                amount={i.currentValuation}
                                                type="INVEST"
                                                onClick={() => router.push(`/investment/${i.id}`)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. 카드 */}
                            {accounts.cards.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-text-secondary mb-2 flex items-center gap-2">
                                        💳 카드{" "}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {accounts.cards.length}
                                        </span>
                                    </h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0">
                                        {accounts.cards.map((c: any) => (
                                            <ShortcutCard
                                                key={c.id}
                                                name={c.name}
                                                amount={-c.currentBalance}
                                                type="CARD"
                                                onClick={() => router.push(`/cards/${c.id}`)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* ================= 우측: 오늘의 브리핑 ================= */}
                <div className="lg:col-span-1 space-y-6">
                    {investmentPerformance.length > 0 && (
                        <div className="bg-background-paper p-5 rounded-3xl border border-divider h-fit">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <MdShowChart className="text-text-secondary" />
                                오늘의 투자 변동
                            </h3>

                            <div className="space-y-3">
                                {investmentPerformance.map((item: any) => {
                                    const change = Number(item.dailyChange);

                                    // 2. 정확한 등락 판단 (0은 제외)
                                    const isUp = change > 0;
                                    const isDown = change < 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex justify-between items-center p-3 bg-background-default rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => router.push(`/investment/${item.id}`)}>
                                            <div>
                                                <p className="text-sm font-bold text-text-primary mb-0.5">
                                                    {item.name}
                                                </p>
                                                {/* 현재 평가금 */}
                                                <p className="text-xs text-text-secondary">
                                                    {fmt(item.currentValuation)}원
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {/* 수익금 증감액 (원) */}
                                                <p
                                                    className={`text-sm font-bold ${isUp ? "text-error-main" : isDown ? "text-primary-main" : "text-text-secondary"}`}>
                                                    {isUp ? "▲" : isDown ? "▼" : "-"}{" "}
                                                    {fmt(Math.abs(change))}원
                                                </p>
                                                {/* 수익률 증감폭 (%p) */}
                                                <p
                                                    className={`text-xs mt-0.5 ${isUp ? "text-error-main" : isDown ? "text-primary-main" : "text-text-secondary"}`}>
                                                    ({isUp ? "+" : ""}
                                                    {item.dailyChangeRate.toFixed(2)}%p)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 1. 오늘의 거래 내역 */}
                    <div className="bg-background-paper p-5 rounded-3xl border border-divider h-fit">
                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <MdReceiptLong className="text-text-secondary" />
                            오늘의 거래
                        </h3>

                        <div className="space-y-0 divide-y divide-divider">
                            {todaysTransactions.length > 0 ? (
                                todaysTransactions.map((tx: any) => (
                                    <div
                                        key={tx.id}
                                        className="py-3 flex justify-between items-center hover:bg-background-default/50 transition-colors px-1 rounded-lg">
                                        <div className="flex-1 min-w-0 mr-3">
                                            {/* 통장/카드명 표시 */}
                                            <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-0.5">
                                                <span className="bg-background-default px-1.5 py-0.5 rounded border border-divider">
                                                    {tx.bankAccount?.name ||
                                                        tx.card?.name ||
                                                        "기타"}
                                                </span>
                                            </div>
                                            {/* 내용 (없으면 카테고리명) */}
                                            <p className="text-sm font-medium text-text-primary truncate">
                                                {tx.description || tx.category?.name || "내용 없음"}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-sm font-bold whitespace-nowrap ${tx.type === "INCOME" ? "text-success-main" : "text-text-primary"}`}>
                                            {tx.type === "EXPENSE" && "-"}
                                            {fmt(tx.amount)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center text-sm text-text-disabled">
                                    오늘 발생한 거래가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CreateAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    window.location.reload();
                }}
            />
        </div>
    );
}

// ============================================================================
// 🧩 서브 컴포넌트 (반응형 대응)
// ============================================================================

function SummarySmallCard({ title, amount, diff, chartData, dataKey, color, icon, onClick }: any) {
    const fmt = (n: number) => Math.floor(n).toLocaleString();
    const isPos = diff > 0;

    return (
        <div
            onClick={onClick}
            className="bg-background-paper p-4 lg:p-5 rounded-2xl border border-divider cursor-pointer hover:border-primary-main transition-all hover:shadow-md flex flex-col justify-between h-36 lg:h-40">
            <div className="flex justify-between items-start">
                <div
                    className={`p-2 rounded-xl ${dataKey === "cash" ? "bg-success-light/10 text-success-main" : "bg-warning-light/10 text-warning-main"}`}>
                    {icon}
                </div>
                <div className="w-16 h-8 opacity-70">
                    <Sparkline data={chartData} dataKey={dataKey} color={color} />
                </div>
            </div>

            <div>
                <p className="text-xs lg:text-sm text-text-secondary font-bold mb-1">{title}</p>
                <p className="text-lg lg:text-2xl font-bold text-text-primary">{fmt(amount)}</p>
                <div className="flex items-center gap-1 mt-1">
                    <span
                        className={`text-[10px] lg:text-xs font-bold ${isPos ? "text-error-main" : "text-primary-main"}`}>
                        {isPos ? "+" : ""}
                        {fmt(diff)} ({diff !== 0 ? ((diff / amount) * 100).toFixed(1) : 0}%)
                    </span>
                </div>
            </div>
        </div>
    );
}

// 부채 카드를 별도로 분리하여 스타일링 (반응형 대응)
function SummaryDebtCard({ amount, onClick }: any) {
    const fmt = (n: number) => Math.floor(n).toLocaleString();

    return (
        <div
            onClick={onClick}
            className="bg-background-paper p-4 lg:p-5 rounded-2xl border border-divider cursor-pointer hover:border-primary-main transition-all hover:shadow-md h-36 lg:h-40 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="p-2 bg-error-light/10 text-error-main rounded-xl">
                    <MdCreditCard size={20} />
                </div>
                <span className="text-xs text-text-disabled bg-background-default px-2 py-1 rounded">
                    이번달
                </span>
            </div>

            <div>
                <p className="text-xs lg:text-sm text-text-secondary font-bold mb-1">
                    카드 대금 (부채)
                </p>
                <p className="text-lg lg:text-2xl font-bold text-text-primary">{fmt(amount)}원</p>
                <p className="text-[10px] lg:text-xs text-text-disabled mt-1">
                    결제 예정 금액 합계
                </p>
            </div>
        </div>
    );
}

function ShortcutCard({ name, amount, type, onClick }: any) {
    const colorClass =
        type === "BANK"
            ? "bg-blue-50 text-blue-600"
            : type === "INVEST"
              ? "bg-orange-50 text-orange-600"
              : "bg-red-50 text-red-600";

    return (
        <div
            onClick={onClick}
            className="min-w-35 md:min-w-0 w-full bg-background-paper p-4 rounded-xl border border-divider hover:shadow-md hover:border-primary-main transition-all cursor-pointer flex flex-col h-28">
            {/* 1. 상단: 배지 (확실하게 한 줄 차지) */}
            <div className="flex items-start mb-auto">
                {/* mb-auto를 주면 아래 내용과 최대한 멀어집니다 (justify-between 효과) */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colorClass}`}>
                    {type === "BANK" ? "현금" : type === "INVEST" ? "투자" : "카드"}
                </span>
            </div>

            {/* 2. 하단: 이름 및 금액 (줄바꿈 확실하게) */}
            <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-text-primary truncate w-full">{name}</p>
                <p
                    className={`text-sm font-medium truncate ${
                        type === "CARD" ? "text-error-main" : "text-text-secondary"
                    }`}>
                    {amount.toLocaleString()}원
                </p>
            </div>
        </div>
    );
}

// 증감 표시 헬퍼 컴포넌트
const DiffBadge = ({ value }: { value: number }) => {
    const fmt = (n: number) => Math.floor(n).toLocaleString();

    // 1. 변동이 없을 때 (0원)
    if (value === 0) return <span className="text-xs text-text-disabled">-</span>;

    // 2. 양수인지 확인
    const isPos = value > 0;

    return (
        <span
            // 3. 양수면 빨간색(error-main), 음수면 파란색(primary-main) 적용
            // (한국 증시/금융에서는 보통 상승이 빨강, 하락이 파랑입니다)
            className={`text-xs font-bold ${isPos ? "text-error-main" : "text-primary-main"}`}>
            {/* 4. 화살표 및 절대값 포맷팅 */}
            {isPos ? "▲" : "▼"} {fmt(Math.abs(value))}
        </span>
    );
};
