"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { updateTransactionAction, deleteTransactionAction } from "@/actions/transaction";
import { getCategoriesAction } from "@/actions/category";
import { MoneyTransaction, Category } from "@prisma/client";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    transaction: (MoneyTransaction & { category: Category | null }) | null;
}

interface EditTxInputs {
    amount: number;
    date: string;
    description: string;
    categoryId: string;
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: Props) {
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { isSubmitting, errors },
    } = useForm<EditTxInputs>();

    // 모달 열릴 때 데이터 채워넣기 (초기화)
    useEffect(() => {
        if (isOpen && transaction) {
            // 1. 폼 데이터 세팅
            setValue("amount", transaction.amount);
            setValue("description", transaction.description || "");
            setValue("date", dayjs(transaction.date).format("YYYY-MM-DD"));
            setValue("categoryId", transaction.categoryId || "");

            // 2. 카테고리 목록 불러오기
            const fetchCats = async () => {
                setIsCategoryLoading(true);
                // 트랜잭션 타입(수입/지출)에 맞는 카테고리 로드
                // (TRANSFER인 경우 카테고리가 없을 수 있으므로 예외처리)
                const type = transaction.type === "TRANSFER" ? "EXPENSE" : transaction.type;
                const cats = await getCategoriesAction(type as "INCOME" | "EXPENSE");
                setCategories(cats);
                setIsCategoryLoading(false);
            };
            fetchCats();
        }
    }, [isOpen, transaction, setValue]);

    const onSubmit: SubmitHandler<EditTxInputs> = async data => {
        if (!transaction) return;
        const toastId = toast.loading("수정 중...");

        const result = await updateTransactionAction({
            ...data,
            transactionId: transaction.id,
            type: transaction.type, // 타입은 기존 유지
        });

        if (result.success) {
            toast.success("수정 완료", { id: toastId });
            onClose();
            window.location.reload();
        } else {
            toast.error(result.message, { id: toastId });
        }
    };

    const handleDelete = async () => {
        if (!transaction) return;
        if (!confirm("정말 삭제하시겠습니까?\n삭제된 내역은 복구할 수 없습니다.")) return;

        const toastId = toast.loading("삭제 중...");
        const result = await deleteTransactionAction(transaction.id);

        if (result.success) {
            toast.success("삭제 완료", { id: toastId });
            onClose();
            window.location.reload();
        } else {
            toast.error(result.message, { id: toastId });
        }
    };

    if (!transaction) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내역 상세 / 수정">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 타입 표시 (수정 불가, 정보성) */}
                <div className="flex items-center justify-between p-3 bg-background-default rounded-lg border border-divider">
                    <span className="text-sm text-text-secondary font-bold">거래 유형</span>
                    <span
                        className={`font-bold ${
                            transaction.type === "INCOME" ? "text-success-main" : "text-error-main"
                        }`}>
                        {transaction.type === "INCOME" ? "수입 (입금)" : "지출 (출금)"}
                    </span>
                </div>

                {/* 카테고리 선택 */}
                <Controller
                    control={control}
                    name="categoryId"
                    rules={{ required: false }} // 수정 시엔 선택 안 해도 되도록 유연하게
                    render={({ field: { onChange, value } }) => (
                        <Select
                            label="카테고리"
                            options={categories}
                            placeholder={isCategoryLoading ? "로딩 중..." : "카테고리 선택"}
                            disabled={isCategoryLoading}
                            value={value}
                            onChange={onChange}
                        />
                    )}
                />

                <Input
                    label="금액"
                    type="number"
                    {...register("amount", { required: "금액을 입력해주세요.", min: 1 })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                />

                <Input label="날짜" type="date" {...register("date", { required: true })} />

                <Input label="내용" {...register("description")} />

                <div className="pt-4 flex gap-2">
                    {/* 삭제 버튼 */}
                    <Button
                        type="button"
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleDelete}>
                        삭제
                    </Button>

                    {/* 저장 버튼 */}
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        수정 완료
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
