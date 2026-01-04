"use client";

import { useState, useEffect } from "react";
// ✅ Controller 추가 import
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import toast from "react-hot-toast";

// Components
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select"; // Custom Select (Dropdown + Option)
import Button from "@/components/Button";
import { Tabs } from "@/components/Tabs";

// Server Actions
import { createBankTransactionAction } from "@/app/actions/transaction";
import { getCategoriesAction } from "@/app/actions/category";
import { Tab } from "@/components/Tab";

interface Props {
    bankAccountId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface TxInputs {
    amount: number;
    date: string;
    description: string;
    categoryId: string;
}

type TxTab = "EXPENSE" | "INCOME";

export default function AddTransactionModal({ bankAccountId, isOpen, onClose }: Props) {
    const [txType, setTxType] = useState<TxTab>("EXPENSE");

    // 카테고리 목록 상태
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

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
        const fetchCategories = async () => {
            if (!isOpen) return;

            setIsCategoryLoading(true);

            // 1. 카테고리 값 초기화 (지출<->수입 전환 시 이전 값 제거)
            setValue("categoryId", "");

            // 2. 서버에서 카테고리 가져오기
            try {
                const data = await getCategoriesAction(txType);
                setCategories(data);
            } catch (error) {
                toast.error("카테고리를 불러오지 못했습니다.");
            } finally {
                setIsCategoryLoading(false);
            }
        };

        fetchCategories();
    }, [txType, isOpen, setValue]);

    const onSubmit: SubmitHandler<TxInputs> = async data => {
        const toastId = toast.loading("저장 중...");

        try {
            const result = await createBankTransactionAction({
                ...data,
                type: txType,
                bankAccountId,
            });

            if (result.success) {
                toast.success(result.message, { id: toastId });
                reset();
                onClose();
                window.location.reload(); // 데이터 갱신
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            toast.error("알 수 없는 오류가 발생했습니다.", { id: toastId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="거래 내역 추가">
            {/* 1. 입금/출금 탭 */}
            <div className="mb-5">
                <Tabs value={txType} onChange={setTxType} fullWidth>
                    <Tab
                        value="EXPENSE"
                        label="출금 (-)"
                        className="text-error-main data-[state=active]:text-error-main"
                    />
                    <Tab
                        value="INCOME"
                        label="입금 (+)"
                        className="text-success-main data-[state=active]:text-success-main"
                    />
                </Tabs>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* ✅ 2. 카테고리 선택 (Controller 사용으로 에러 해결) */}
                <Controller
                    control={control}
                    name="categoryId"
                    rules={{ required: "카테고리를 선택해주세요." }}
                    render={({ field: { onChange, value } }) => (
                        <Select
                            label="카테고리"
                            options={categories}
                            placeholder={isCategoryLoading ? "불러오는 중..." : "카테고리 선택"}
                            disabled={isCategoryLoading}
                            // Controller가 관리하는 값과 핸들러 연결
                            value={value}
                            onChange={onChange}
                            error={!!errors.categoryId}
                            helperText={errors.categoryId?.message}
                        />
                    )}
                />

                {/* 3. 금액 */}
                <Input
                    label="금액"
                    type="number"
                    placeholder="0"
                    {...register("amount", {
                        required: "금액을 입력해주세요.",
                        min: { value: 1, message: "1원 이상 입력해야 합니다." },
                    })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                />

                {/* 4. 날짜 */}
                <Input
                    label="날짜"
                    type="date"
                    {...register("date", { required: "날짜를 선택해주세요." })}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                />

                {/* 5. 내용 */}
                <Input
                    label="내용"
                    placeholder={txType === "INCOME" ? "예: 월급, 용돈" : "예: 점심 식사, 커피"}
                    {...register("description", { required: "내용을 입력해주세요." })}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        fullWidth
                        disabled={isSubmitting}
                        color={txType === "INCOME" ? "success" : "primary"}>
                        {txType === "INCOME" ? "입금하기" : "출금하기"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
