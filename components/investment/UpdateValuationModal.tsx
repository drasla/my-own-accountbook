"use client";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { updateValuationAction } from "@/actions/investment";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
    currentValuation: number;
}

export default function UpdateValuationModal({
    isOpen,
    onClose,
    accountId,
    currentValuation,
}: Props) {
    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: { valuation: currentValuation },
    });

    const onSubmit = async (data: { valuation: number }) => {
        const res = await updateValuationAction(accountId, Number(data.valuation));
        if (res.success) {
            toast.success("평가금액이 수정되었습니다.");
            onClose();
        } else {
            toast.error("오류가 발생했습니다.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="평가금액 수정">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-text-secondary">
                    증권사 어플에 표시된 <strong>현재 총 평가금액</strong>을 입력해주세요.
                    <br />
                    (오늘 날짜의 자산 흐름으로 기록됩니다.)
                </p>

                <Input
                    label="현재 총 평가금액"
                    type="number"
                    {...register("valuation", { required: true, min: 0 })}
                />

                <Button type="submit" fullWidth disabled={isSubmitting}>
                    업데이트
                </Button>
            </form>
        </Modal>
    );
}
