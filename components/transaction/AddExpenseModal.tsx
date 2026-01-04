"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select"; // ✅ Custom Component 사용
import Button from "@/components/Button";
import { getPaymentMethodsAction, PaymentMethod } from "@/actions/payment";
import { createExpenseAction } from "@/actions/transaction";
import toast from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface ExpenseInputs {
    paymentMethodId: string;
    amount: number;
    date: string;
    description: string;
}

export default function AddExpenseModal({ isOpen, onClose }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }, // 에러 처리 추가
    } = useForm<ExpenseInputs>();

    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);

    // 모달 열릴 때 결제 수단 목록 불러오기
    useEffect(() => {
        if (isOpen) {
            const fetchMethods = async () => {
                setIsLoadingMethods(true);
                const data = await getPaymentMethodsAction();
                setMethods(data);
                setIsLoadingMethods(false);
            };
            fetchMethods();
        }
    }, [isOpen]);

    const onSubmit: SubmitHandler<ExpenseInputs> = async data => {
        // 선택된 결제 수단의 정보 찾기 (Type 확인용)
        const selectedMethod = methods.find(m => m.id === data.paymentMethodId);

        if (!selectedMethod) {
            toast.error("결제 수단 정보가 올바르지 않습니다.");
            return;
        }

        const payload = {
            ...data,
            methodType: selectedMethod.type, // BANK or CARD
        };

        const toastId = toast.loading("저장 중...");
        const result = await createExpenseAction(payload);

        if (result.success) {
            toast.success("지출이 기록되었습니다.", { id: toastId });
            reset();
            onClose();
            window.location.reload();
        } else {
            toast.error(result.message, { id: toastId });
        }
    };

    // ✅ Select 컴포넌트용 옵션 포맷으로 변환
    const paymentOptions = methods.map(m => ({
        label: m.label, // 예: "[계좌] 월급통장 (잔액: 100원)"
        value: m.id,
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="지출 기록하기">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 1. 결제 수단 선택 (Custom Select 적용) */}
                <Select
                    label="결제 수단"
                    options={paymentOptions}
                    placeholder={
                        isLoadingMethods ? "목록을 불러오는 중..." : "결제 수단을 선택하세요"
                    }
                    disabled={isLoadingMethods}
                    {...register("paymentMethodId", { required: "결제 수단을 선택해주세요." })}
                    error={!!errors.paymentMethodId}
                    helperText={errors.paymentMethodId?.message}
                />

                {/* 2. 금액 */}
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

                {/* 3. 날짜 */}
                <Input
                    label="날짜"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    {...register("date", { required: "날짜를 선택해주세요." })}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                />

                {/* 4. 내용 */}
                <Input
                    label="내용"
                    placeholder="사용 내역 입력 (예: 점심값)"
                    {...register("description", { required: "내용을 입력해주세요." })}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                />

                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="text"
                        color="secondary"
                        fullWidth
                        onClick={onClose}>
                        취소
                    </Button>
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? "저장 중..." : "저장하기"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
