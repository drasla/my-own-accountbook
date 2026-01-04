"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { createAccountAction } from "@/app/actions/account";

// 옵션 상수 정의
const ACCOUNT_TYPES = [
    { label: "은행 (입출금/예적금)", value: "BANK" },
    { label: "투자 (주식/펀드)", value: "INVESTMENT" },
    { label: "지갑 (현금)", value: "WALLET" },
];

const DETAIL_TYPES = [
    { label: "일반 주식 계좌", value: "NORMAL_STOCK" },
    { label: "연금저축", value: "PENSION" },
    { label: "IRP (퇴직연금)", value: "IRP" },
    { label: "ISA (종합자산)", value: "ISA" },
    { label: "기타", value: "ETC" },
];

interface CreateAccountInputs {
    name: string;
    type: string;
    detailType: string;
    currentBalance: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateAccountModal({ isOpen, onClose }: Props) {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateAccountInputs>();

    const selectedType = watch("type");

    const onSubmit: SubmitHandler<CreateAccountInputs> = async data => {
        const toastId = toast.loading("자산 추가 중...");

        try {
            const result = await createAccountAction(data);

            if (result.success) {
                toast.success("자산이 성공적으로 추가되었습니다!", { id: toastId });
                reset(); // 폼 초기화
                onClose(); // 모달 닫기
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            toast.error("오류가 발생했습니다.", { id: toastId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="새 자산 추가">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 1. 자산 이름 */}
                <Input
                    label="자산 이름 (별칭)"
                    placeholder="예: 월급통장, 비상금"
                    {...register("name", { required: "자산 이름을 입력해주세요." })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                {/* 2. 자산 유형 */}
                <Select
                    label="자산 유형"
                    options={ACCOUNT_TYPES}
                    placeholder="유형을 선택하세요"
                    {...register("type", { required: "자산 유형을 선택해주세요." })}
                    error={!!errors.type}
                    helperText={errors.type?.message}
                />

                {/* 3. 상세 유형 (투자인 경우에만 표시) */}
                {selectedType === "INVESTMENT" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <Select
                            label="상세 유형"
                            options={DETAIL_TYPES}
                            placeholder="상세 유형 선택"
                            {...register("detailType")}
                        />
                    </div>
                )}

                {/* 4. 현재 잔액 */}
                <Input
                    label="현재 잔액"
                    type="number"
                    placeholder="0"
                    {...register("currentBalance", {
                        valueAsNumber: true,
                        min: { value: 0, message: "잔액은 0원 이상이어야 합니다." },
                    })}
                    error={!!errors.currentBalance}
                    helperText={errors.currentBalance?.message}
                />

                {/* 버튼 그룹 */}
                <div className="flex gap-3 pt-2">
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
