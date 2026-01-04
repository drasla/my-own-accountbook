"use client";

import { useEffect, useState, use } from "react"; // use import 필요
import { useRouter } from "next/navigation";
import { getAccountDetail, deleteAccountAction } from "@/actions/account";
import Button from "@/components/Button";
import { MdArrowBack, MdDelete, MdEdit, MdAdd } from "react-icons/md";
import toast from "react-hot-toast";
import Chip from "@/components/Chip";
import { getInvestmentDetail } from "@/actions/investment";

// 타입 정의 (Prisma Schema 기준)
interface Transaction {
    id: string;
    amount: number;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    description: string | null;
    date: Date;
    category?: { name: string } | null;
}

interface AccountDetail {
    id: string;
    name: string;
    currentBalance: number;
    type: string;
    detailType: string | null;
    transactions: Transaction[];
}

// Next.js 15+ 에서는 params가 Promise입니다.
export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // params 언래핑
    const { id } = use(params);

    const router = useRouter();
    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isSnapModalOpen, setIsSnapModalOpen] = useState(false); // 평가금 기록
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<"CHART" | "HISTORY">("CHART");

    // 데이터 불러오기
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            let data = await getAccountDetail(id);

            // 투자 계좌라면 투자 전용 상세 조회 (스냅샷 포함)
            if (data && data.type === "INVESTMENT") {
                data = await getInvestmentDetail(id);
            }
            // Date 객체 처리를 위해 casting 필요할 수 있음 (Client Component 경계)
            setAccount(data);
            setIsLoading(false);
        };;
        fetchData();
    }, [id, router]);

    // 계좌 삭제 핸들러
    const handleDelete = async () => {
        if (
            !confirm(
                "정말 이 계좌를 삭제하시겠습니까?\n포함된 거래 내역도 모두 삭제될 수 있습니다.",
            )
        )
            return;

        const result = await deleteAccountAction(id);
        if (result.success) {
            toast.success("계좌가 삭제되었습니다.");
            router.replace("/");
        } else {
            toast.error(result.message);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(
            amount,
        );
    };

    const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
        });
    };

    const handleCloseTxModal = () => {
        setIsTxModalOpen(false);
        // fetchData는 useEffect 안에 있어서 직접 호출이 어려울 수 있습니다.
        // 가장 쉬운 방법은 router.refresh()를 쓰거나,
        // fetchData 함수를 useCallback으로 빼는 것입니다.
        // 여기서는 간단히 페이지 전체 새로고침(데이터 재요청) 효과를 위해 router.refresh()를 씁니다.
        // Server Action에서 revalidatePath를 썼으므로 데이터는 이미 최신입니다.
        window.location.reload();
        // 혹은 useEffect dependency를 활용하는 방법도 있습니다.
    };

    if (isLoading) {
        return <div className="p-8 text-center text-text-secondary">로딩 중...</div>;
    }

    if (!account) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* 1. 상단 네비게이션 & 헤더 */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-background-paper rounded-full transition-colors text-text-secondary">
                    <MdArrowBack size={24} />
                </button>
                <h1 className="text-xl font-bold text-text-primary">계좌 상세</h1>
            </div>

            {/* 2. 계좌 정보 카드 */}
            <div className="bg-background-paper p-6 rounded-2xl border border-divider shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="inline-block px-2 py-1 bg-primary-light/20 text-primary-main text-xs font-bold rounded mb-2">
                            {account.type} {account.detailType && ` · ${account.detailType}`}
                        </span>
                        <h2 className="text-2xl font-bold text-text-primary">{account.name}</h2>
                    </div>

                    {/* 관리 버튼 그룹 */}
                    <div className="flex gap-2">
                        <Button
                            variant="text"
                            size="sm"
                            color="secondary"
                            onClick={() => toast("준비 중입니다.")}>
                            <MdEdit size={18} />
                        </Button>
                        <Button variant="text" size="sm" color="error" onClick={handleDelete}>
                            <MdDelete size={18} />
                        </Button>
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-sm text-text-secondary">현재 잔액</p>
                    <p className="text-3xl font-bold text-text-primary mt-1">
                        {formatCurrency(account.currentBalance)}
                    </p>
                </div>
            </div>

            {/* 3. 거래 내역 리스트 */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary">거래 내역</h3>
                    {/* ✅ 버튼 클릭 시 모달 열기 */}
                    <Button size="sm" className="gap-1" onClick={() => setIsTxModalOpen(true)}>
                        <MdAdd size={16} />
                        내역 추가
                    </Button>
                </div>

                {/* 리스트 영역 */}
                {account.transactions.length > 0 ? (
                    <div className="bg-background-paper rounded-xl border border-divider overflow-hidden">
                        {account.transactions.map(tx => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-4 border-b border-divider last:border-none hover:bg-background-default/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-text-secondary">
                                        {formatDate(tx.date)}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-primary">
                                            {tx.description || "내용 없음"}
                                        </span>

                                        {/* ✅ Chip 컴포넌트 적용 */}
                                        {tx.category && <Chip label={tx.category.name} />}
                                    </div>
                                </div>

                                <div
                                    className={`font-bold ${
                                        tx.type === "INCOME"
                                            ? "text-success-main"
                                            : tx.type === "EXPENSE"
                                              ? "text-error-main"
                                              : "text-text-primary"
                                    }`}>
                                    {tx.type === "EXPENSE" ? "-" : tx.type === "INCOME" ? "+" : ""}
                                    {formatCurrency(tx.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-text-secondary bg-background-paper rounded-xl border border-dashed border-divider">
                        아직 거래 내역이 없습니다.
                    </div>
                )}
            </div>

        </div>
    );
}
