"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import dayjs from "dayjs";
import { addInvestmentLogAction } from "@/actions/investment";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
}

type FormValues = {
    amount: number;
    date: string;
    note: string;
};

type LogType = "DEPOSIT" | "WITHDRAW" | "DIVIDEND";

export default function AddInvestmentLogModal({ isOpen, onClose, accountId }: Props) {
    const [type, setType] = useState<LogType>("DEPOSIT");

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            date: dayjs().format("YYYY-MM-DD"),
            amount: 0,
        },
    });

    const onSubmit = async (data: FormValues) => {
        const res = await addInvestmentLogAction({
            accountId,
            type,
            amount: data.amount,
            date: data.date,
            note: data.note,
        });

        if (res.success) {
            toast.success(
                type === "DEPOSIT" ? "투자금이 추가되었습니다." : "투자금이 회수되었습니다.",
            );
            reset();
            onClose();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="투자금 입출금 기록">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 타입 선택 버튼 (입금 vs 출금) */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-background-default rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType("DEPOSIT")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "DEPOSIT"
                                ? "bg-error-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        + 입금 (투자)
                    </button>

                    {/* ✅ 배당금 버튼 추가 */}
                    <button
                        type="button"
                        onClick={() => setType("DIVIDEND")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "DIVIDEND"
                                ? "bg-success-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        + 배당 (재투자)
                    </button>

                    <button
                        type="button"
                        onClick={() => setType("WITHDRAW")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "WITHDRAW"
                                ? "bg-primary-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        - 출금 (회수)
                    </button>
                </div>

                <Input
                    label="금액"
                    type="number"
                    placeholder="0"
                    {...register("amount", { required: true, min: 1 })}
                />

                <Input label="날짜" type="date" {...register("date", { required: true })} />

                <Input
                    label="메모 (선택)"
                    placeholder={type === "DEPOSIT" ? "예: 월급 불입" : "예: 수익금 인출"}
                    {...register("note")}
                />

                <Button type="submit" fullWidth disabled={isSubmitting}>
                    {type === "DEPOSIT" ? "투자금 추가하기" : "투자금 회수하기"}
                </Button>
            </form>
        </Modal>
    );
}
