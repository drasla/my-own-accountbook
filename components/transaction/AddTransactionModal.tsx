"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select"; // Custom Select (Dropdown + Option)
import Button from "@/components/Button";
import { Tabs } from "@/components/Tabs";
import { createBankTransactionAction } from "@/actions/transaction";
import { getCategoriesAction } from "@/actions/category";
import { Tab } from "@/components/Tab";
import { getAllTransferTargets } from "@/actions/bank";

interface Props {
    bankAccountId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface TxInputs {
    amount: number;
    date: string;
    description?: string;
    categoryId: string;
    toAccountId: string;
}

type TxTab = "EXPENSE" | "INCOME" | "TRANSFER";

export default function AddTransactionModal({ bankAccountId, isOpen, onClose }: Props) {
    const [txType, setTxType] = useState<TxTab>("EXPENSE");

    // 카테고리 목록 상태
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [accounts, setAccounts] = useState<{ label: string; value: string }[]>([]); // 받는 계좌 목록
    const [isLoadingData, setIsLoadingData] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control, // ✅ Controller 사용을 위해 control 가져오기
        formState: { isSubmitting, errors },
    } = useForm<TxInputs>({
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            categoryId: "",
        },
    });

    // 탭 변경 시 카테고리 목록 불러오기 & 선택값 초기화
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;

            setIsLoadingData(true);
            setValue("categoryId", "");
            setValue("toAccountId", "");

            try {
                if (txType === "TRANSFER") {
                    // ✅ 수정됨: 은행 + 투자 계좌 모두 불러오기
                    const accs = await getAllTransferTargets(bankAccountId);
                    setAccounts(accs);
                } else {
                    const cats = await getCategoriesAction(txType as "INCOME" | "EXPENSE");
                    setCategories(cats);
                }
            } catch (error) {
                toast.error("정보를 불러오지 못했습니다.");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [txType, isOpen, bankAccountId, setValue]);

    const onSubmit: SubmitHandler<TxInputs> = async data => {
        const toastId = toast.loading("처리 중...");

        try {
            const result = await createBankTransactionAction({
                ...data,
                type: txType,
                bankAccountId,
            });

            if (result.success) {
                toast.success("기록되었습니다.", { id: toastId });
                reset();
                onClose();
                window.location.reload();
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.", { id: toastId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내역 추가">
            {/* 1. 탭 메뉴 (이체 추가) */}
            <div className="mb-5">
                <Tabs value={txType} onChange={v => setTxType(v as TxTab)} fullWidth>
                    <Tab
                        value="EXPENSE"
                        label="지출 (-)"
                        className="text-error-main data-[state=active]:text-error-main"
                    />
                    <Tab
                        value="INCOME"
                        label="수입 (+)"
                        className="text-success-main data-[state=active]:text-success-main"
                    />
                    <Tab
                        value="TRANSFER"
                        label="이체 (⇄)"
                        className="text-primary-main data-[state=active]:text-primary-main font-bold"
                    />
                </Tabs>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* 2. 조건부 렌더링: 이체면 '계좌선택', 아니면 '카테고리' */}
                {txType === "TRANSFER" ? (
                    <Controller
                        control={control}
                        name="toAccountId"
                        rules={{ required: "받는 계좌를 선택해주세요." }}
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="받는 계좌 (어디로 보낼까요?)"
                                options={accounts}
                                placeholder={isLoadingData ? "계좌 불러오는 중..." : "계좌 선택"}
                                disabled={isLoadingData}
                                value={value}
                                onChange={onChange}
                                error={!!errors.toAccountId}
                                helperText={errors.toAccountId?.message}
                            />
                        )}
                    />
                ) : (
                    <Controller
                        control={control}
                        name="categoryId"
                        rules={{ required: "카테고리를 선택해주세요." }}
                        render={({ field: { onChange, value } }) => (
                            <Select
                                label="카테고리"
                                options={categories}
                                placeholder={isLoadingData ? "불러오는 중..." : "카테고리 선택"}
                                disabled={isLoadingData}
                                value={value}
                                onChange={onChange}
                                error={!!errors.categoryId}
                                helperText={errors.categoryId?.message}
                            />
                        )}
                    />
                )}

                {/* 3. 금액 */}
                <Input
                    label="금액"
                    type="number"
                    placeholder="0"
                    {...register("amount", { required: "금액을 입력해주세요.", min: 1 })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                />

                {/* 4. 날짜 */}
                <Input
                    label="날짜"
                    type="date"
                    {...register("date", { required: true })}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                />

                {/* 5. 적요 */}
                <Input
                    label="내용 (선택)"
                    placeholder={txType === "TRANSFER" ? "예: 생활비 이체" : "내용을 입력하세요"}
                    {...register("description")}
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        fullWidth
                        disabled={isSubmitting}
                        color={
                            txType === "INCOME"
                                ? "success"
                                : txType === "TRANSFER"
                                  ? "primary"
                                  : "primary"
                        }>
                        {txType === "INCOME"
                            ? "입금하기"
                            : txType === "TRANSFER"
                              ? "송금하기"
                              : "지출하기"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
