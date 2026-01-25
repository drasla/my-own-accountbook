"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { Tabs } from "@/components/Tabs";
import {
    createBankAccountAction,
    createInvestmentAccountAction,
    createCardAction,
} from "@/actions/create_assets";
import { BankType, InvestType, CardType } from "@prisma/client";
import { Tab } from "@/components/Tab";
import { getBankOptionsAction } from "@/actions/bank";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface AssetFormInputs {
    name: string;
    type: string;
    currentBalance?: number;
    detailType?: string;
    currentValuation?: number;
    paymentDate?: number;
    accountOpenDate?: string;
    linkedBankAccountId?: string;
}

type AssetTab = "BANK" | "INVESTMENT" | "CARD";

export default function CreateAssetModal({ isOpen, onClose }: Props) {
    const [assetType, setAssetType] = useState<AssetTab>("BANK");
    const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]); // ✅ 은행 목록 상태

    const {
        register,
        handleSubmit,
        reset,
        control, // ✅ control 가져오기
        formState: { isSubmitting, errors },
    } = useForm<AssetFormInputs>({
        defaultValues: {
            accountOpenDate: new Date().toISOString().split("T")[0],
        },
    });

    useEffect(() => {
        if (isOpen) {
            getBankOptionsAction().then(banks => {
                const options = banks.map(b => ({
                    label: `${b.name} (잔액: ${b.currentBalance.toLocaleString()}원)`,
                    value: b.id,
                }));
                setBankOptions(options);
            });
        }
    }, [isOpen]);

    const handleTabChange = (type: AssetTab) => {
        setAssetType(type);
        reset({
            accountOpenDate: new Date().toISOString().split("T")[0],
        });
    };

    const onSubmit: SubmitHandler<AssetFormInputs> = async data => {
        const toastId = toast.loading("자산 생성 중...");
        let result;

        try {
            if (assetType === "BANK") {
                result = await createBankAccountAction({
                    name: data.name,
                    type: data.type as BankType,
                    currentBalance: Number(data.currentBalance) || 0,
                });
            } else if (assetType === "INVESTMENT") {
                result = await createInvestmentAccountAction({
                    name: data.name,
                    detailType: data.detailType as InvestType,
                    currentValuation: Number(data.currentValuation) || 0,
                    accountOpenDate: data.accountOpenDate,
                });
            } else {
                result = await createCardAction({
                    name: data.name,
                    type: data.type as CardType,
                    paymentDate: data.paymentDate,
                    linkedBankAccountId: data.linkedBankAccountId,
                });
            }

            if (result.success) {
                toast.success(result.message, { id: toastId });
                reset();
                onClose();
                window.location.reload();
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            toast.error("알 수 없는 오류가 발생했습니다.", { id: toastId });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="새 자산 추가">
            <div className="mb-5">
                <Tabs value={assetType} onChange={val => handleTabChange(val)} fullWidth>
                    <Tab value="BANK" label="은행/현금" />
                    <Tab value="INVESTMENT" label="투자" />
                    <Tab value="CARD" label="카드" />
                </Tabs>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="이름 (별칭)"
                    placeholder={assetType === "CARD" ? "예: 현대카드 M3" : "예: 월급통장"}
                    {...register("name", { required: "이름을 입력해주세요." })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                {/* 1. 은행 폼 */}
                {assetType === "BANK" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* ✅ Controller로 교체 */}
                        <Controller
                            control={control}
                            name="type"
                            rules={{ required: "유형을 선택해주세요." }}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    label="유형"
                                    options={[
                                        { label: "입출금 통장", value: "CHECKING" },
                                        { label: "예적금", value: "SAVINGS" },
                                        { label: "현금 지갑", value: "CASH" },
                                    ]}
                                    value={value}
                                    onChange={onChange}
                                    error={!!errors.type}
                                    helperText={errors.type?.message}
                                />
                            )}
                        />

                        <Input
                            label="현재 잔액"
                            type="number"
                            placeholder="0"
                            {...register("currentBalance", {
                                required: "현재 잔액을 입력해주세요.",
                            })}
                        />
                    </div>
                )}

                {/* 2. 투자 폼 */}
                {assetType === "INVESTMENT" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* ✅ Controller로 교체 (name 주의: type -> detailType) */}
                        <Controller
                            control={control}
                            name="detailType"
                            rules={{ required: "투자 대상을 선택해주세요." }}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    label="투자 대상"
                                    options={[
                                        { label: "주식 (국내/해외)", value: "STOCK" },
                                        { label: "연금저축", value: "PENSION_SAVINGS" },
                                        { label: "IRP (퇴직연금)", value: "IRP" },
                                        { label: "ISA (만능통장)", value: "ISA" },
                                        { label: "코인 (암호화폐)", value: "COIN" },
                                        { label: "부동산", value: "REAL_ESTATE" },
                                        { label: "채권", value: "BOND" },
                                        { label: "기타", value: "ETC" },
                                    ]}
                                    value={value}
                                    onChange={onChange}
                                    error={!!errors.detailType}
                                    helperText={errors.detailType?.message}
                                />
                            )}
                        />

                        <Input
                            label="계좌 개설일"
                            type="date"
                            helperText="연평균 수익률(CAGR) 계산의 기준일이 됩니다."
                            {...register("accountOpenDate", { required: "개설일을 입력해주세요." })}
                        />

                        <Input
                            label="현재 평가금액"
                            type="number"
                            placeholder="0"
                            {...register("currentValuation", {
                                required: "현재 평가금액을 입력해주세요.",
                            })}
                        />
                    </div>
                )}

                {/* 3. 카드 폼 */}
                {assetType === "CARD" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* ✅ Controller로 교체 */}
                        <Controller
                            control={control}
                            name="type"
                            rules={{ required: "카드 종류를 선택해주세요." }}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    label="카드 종류"
                                    options={[
                                        { label: "신용카드", value: "CREDIT" },
                                        { label: "체크카드", value: "CHECK" },
                                    ]}
                                    value={value}
                                    onChange={onChange}
                                    error={!!errors.type}
                                    helperText={errors.type?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="linkedBankAccountId"
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    label="결제 계좌 (선택)"
                                    options={bankOptions}
                                    placeholder="연동할 계좌를 선택하세요"
                                    value={value}
                                    onChange={onChange}
                                    helperText="카드 대금이 빠져나갈 통장입니다."
                                />
                            )}
                        />

                        <Input
                            label="결제일 (선택)"
                            type="number"
                            placeholder="예: 14"
                            {...register("paymentDate")}
                        />
                    </div>
                )}

                <div className="pt-2">
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? "생성 중..." : "추가하기"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
