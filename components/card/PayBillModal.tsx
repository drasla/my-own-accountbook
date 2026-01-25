"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { payCardBillAction } from "@/actions/card";
import dayjs from "dayjs";
import { getBankOptionsAction } from "@/actions/bank";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    card: any;
}

export default function PayBillModal({ isOpen, onClose, card }: Props) {
    const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        control, // ✅ Select 제어를 위해 control 추가
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            amount: card.currentBalance,
            date: dayjs().format("YYYY-MM-DD"),
            bankAccountId: card.linkedBankAccountId || "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            // 1. 카드 잔액을 기본값으로 세팅 (음수면 양수로 변환해서 보여주는게 일반적이나, 여기선 데이터 그대로)
            // 보통 카드 잔액이 마이너스로 저장되어 있다면 Math.abs() 처리 필요
            setValue("amount", Math.abs(card.currentBalance));
            setValue("date", dayjs().format("YYYY-MM-DD"));

            // 2. ✅ 은행 목록 로딩 (가벼운 액션 사용)
            getBankOptionsAction().then(banks => {
                const options = banks.map(b => ({
                    label: `${b.name} (${b.currentBalance.toLocaleString()}원)`,
                    value: b.id,
                }));
                setBankOptions(options);
            });
        }
    }, [isOpen, card, setValue]);

    const onSubmit = async (data: any) => {
        const res = await payCardBillAction({
            cardId: card.id,
            bankAccountId: data.bankAccountId,
            amount: Number(data.amount),
            date: data.date,
        });

        if (res.success) {
            toast.success("납부 완료!");
            onClose();
            // 페이지 새로고침 or 데이터 갱신
            window.location.reload();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="카드 대금 납부">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* ✅ [수정] Select는 register 대신 Controller 사용 권장 */}
                <Controller
                    control={control}
                    name="bankAccountId"
                    rules={{ required: "출금 계좌를 선택해주세요." }}
                    render={({ field: { onChange, value } }) => (
                        <Select
                            label="출금 계좌"
                            options={bankOptions}
                            placeholder="돈이 빠져나갈 통장 선택"
                            value={value}
                            onChange={onChange}
                        />
                    )}
                />

                <Input
                    label="납부 금액"
                    type="number"
                    {...register("amount", { required: true })}
                />

                <Input label="납부일" type="date" {...register("date", { required: true })} />

                <div className="pt-2">
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? "처리 중..." : "결제하기 (납부)"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
