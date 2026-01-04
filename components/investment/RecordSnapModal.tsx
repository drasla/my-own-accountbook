"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { recordDailySnapAction } from "@/actions/investment";

interface Inputs {
    date: string;
    totalValue: number;
}

interface Props {
    accountId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function RecordSnapModal({ accountId, isOpen, onClose }: Props) {
    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<Inputs>({
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
        },
    });

    const onSubmit: SubmitHandler<Inputs> = async data => {
        const toastId = toast.loading("기록 중...");
        const result = await recordDailySnapAction({ ...data, accountId });

        if (result.success) {
            toast.success("기록되었습니다.", { id: toastId });
            // 페이지 리로드 or router.refresh()
            window.location.reload();
        } else {
            toast.error(result.message, { id: toastId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="일별 평가금 기록">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <p className="text-sm text-text-secondary">
                    오늘 장 마감 후 총 평가금액을 입력하세요.
                    <br />
                    수익률 계산의 기준이 됩니다.
                </p>

                <Input label="날짜" type="date" {...register("date", { required: true })} />

                <Input
                    label="총 평가금액"
                    type="number"
                    placeholder="0"
                    {...register("totalValue", { required: true })}
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
                        기록하기
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
