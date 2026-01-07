"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { payCardBillAction } from "@/actions/card"; // 방금 만든 액션
import dayjs from "dayjs";
import { getDashboardData } from "@/actions/dashboard"; // 계좌 목록 불러오기용

interface Props {
    isOpen: boolean;
    onClose: () => void;
    card: any; // 현재 카드 정보
}

export default function PayBillModal({ isOpen, onClose, card }: Props) {
    const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            amount: card.currentBalance,
            date: dayjs().format("YYYY-MM-DD"),
            bankAccountId: card.linkedBankAccountId || "", // 연결된 계좌 있으면 기본값
        },
    });

    // 모달 열릴 때 최신 잔액으로 업데이트 & 내 계좌 목록 가져오기
    useEffect(() => {
        if (isOpen) {
            setValue("amount", card.currentBalance);

            // 계좌 목록 로딩 (간단히 대시보드 액션 재사용하거나 별도 액션 생성)
            getDashboardData().then(data => {
                const options = data.bankAccounts.map((b: any) => ({
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
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="카드 대금 납부">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 출금 계좌 선택 */}
                <Select
                    label="출금 계좌"
                    options={bankOptions}
                    placeholder="돈이 빠져나갈 통장 선택"
                    {...register("bankAccountId", { required: true })}
                />

                {/* 납부 금액 (기본값: 현재 이용금액 전체) */}
                <Input
                    label="납부 금액"
                    type="number"
                    {...register("amount", { required: true })}
                />

                <Input label="납부일" type="date" {...register("date", { required: true })} />

                <div className="pt-2">
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        결제하기 (납부)
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
