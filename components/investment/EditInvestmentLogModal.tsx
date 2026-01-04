"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import { deleteInvestmentLogAction, updateInvestmentLogAction } from "@/actions/investment";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    log: any; // 선택된 로그 객체
}

type FormValues = {
    amount: number;
    date: string;
    note: string;
};

type LogType = "DEPOSIT" | "WITHDRAW" | "DIVIDEND";

export default function EditInvestmentLogModal({ isOpen, onClose, log }: Props) {
    const [type, setType] = useState<LogType>("DEPOSIT");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { isSubmitting },
    } = useForm<FormValues>();

    // 모달 열릴 때 기존 데이터 세팅
    useEffect(() => {
        if (log) {
            setType(log.type);
            setValue("amount", log.amount);
            setValue("date", dayjs(log.date).format("YYYY-MM-DD"));
            setValue("note", log.note || "");
        }
    }, [log, setValue, isOpen]);

    const onUpdate = async (data: FormValues) => {
        const res = await updateInvestmentLogAction({
            logId: log.id,
            type,
            amount: data.amount,
            date: data.date,
            note: data.note,
        });

        if (res.success) {
            toast.success("수정되었습니다.");
            onClose();
        } else {
            toast.error(res.message);
        }
    };

    const onDelete = async () => {
        if (!confirm("정말 이 내역을 삭제하시겠습니까?\n(관련된 원금/평가금도 되돌려집니다)"))
            return;

        const res = await deleteInvestmentLogAction(log.id);
        if (res.success) {
            toast.success("삭제되었습니다.");
            onClose();
        } else {
            toast.error(res.message);
        }
    };

    if (!log) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내역 수정">
            <form onSubmit={handleSubmit(onUpdate)} className="space-y-5">
                {/* 타입 선택 버튼 (3개) */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-background-default rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType("DEPOSIT")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "DEPOSIT"
                                ? "bg-error-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        입금
                    </button>

                    <button
                        type="button"
                        onClick={() => setType("DIVIDEND")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "DIVIDEND"
                                ? "bg-success-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        배당
                    </button>

                    <button
                        type="button"
                        onClick={() => setType("WITHDRAW")}
                        className={`py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                            type === "WITHDRAW"
                                ? "bg-primary-main text-white shadow-sm"
                                : "text-text-secondary hover:bg-background-paper"
                        }`}>
                        출금
                    </button>
                </div>

                <Input
                    label="금액"
                    type="number"
                    {...register("amount", { required: true, min: 1 })}
                />

                <Input label="날짜" type="date" {...register("date", { required: true })} />

                <Input label="메모" {...register("note")} />

                <div className="flex gap-3 pt-2">
                    <Button type="button" color="error" variant="outlined" onClick={onDelete}>
                        <MdDelete size={20} />
                    </Button>
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        수정 완료
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
