"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { MdDelete, MdArrowBack, MdAdd } from "react-icons/md";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Tabs } from "@/components/Tabs";
import { Tab } from "@/components/Tab";
import {
    getCategoriesAction,
    createCategoryAction,
    deleteCategoryAction,
} from "@/actions/category";
import { TxType } from "@prisma/client";

type FormValues = {
    name: string;
};

interface CategoryItem {
    label: string;
    value: string;
}

export default function CategorySettingsPage() {
    const router = useRouter();
    // ✅ [수정] 상태 타입 변경
    const [activeTab, setActiveTab] = useState<TxType>(TxType.EXPENSE);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<FormValues>();

    const loadCategories = useCallback(async (type: TxType) => {
        setIsLoading(true);
        try {
            const data = await getCategoriesAction(type);
            setCategories(data);
        } catch (error) {
            console.error(error);
            toast.error("데이터를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []); // 의존성 없음 (안정적인 함수)

    // activeTab이 바뀔 때만 실행됨
    useEffect(() => {
        loadCategories(activeTab).then(() => {});
    }, [activeTab, loadCategories]);

    const onSubmit = async (data: FormValues) => {
        const res = await createCategoryAction(data.name, activeTab);
        if (res.success) {
            toast.success(res.message);
            reset();
            loadCategories(activeTab).then(() => {});
        } else {
            toast.error(res.message);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 카테고리를 삭제하시겠습니까?`)) return;

        const res = await deleteCategoryAction(id);
        if (res.success) {
            toast.success(res.message);
            loadCategories(activeTab).then(() => {});
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen pb-20">
            {/* ... 헤더 부분 동일 ... */}
            <div className="px-5 py-4 flex items-center gap-4 bg-background-default sticky top-0 z-10">
                <Button variant="text" size="sm" color="primary" onClick={() => router.back()}>
                    <MdArrowBack size={24} />
                </Button>
                <h1 className="text-xl font-bold text-text-primary">카테고리 관리</h1>
            </div>

            <div className="px-5">
                <div className="mb-6">
                    {/* ✅ Tabs: value 타입 캐스팅 주의 */}
                    <Tabs value={activeTab} onChange={val => setActiveTab(val as TxType)} fullWidth>
                        <Tab value="EXPENSE" label="지출" />
                        <Tab value="INCOME" label="수입" />
                    </Tabs>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 mb-8">
                    <div className="flex-1">
                        <Input
                            placeholder={
                                activeTab === "EXPENSE" ? "예: 식비, 교통비" : "예: 월급, 용돈"
                            }
                            {...register("name", { required: true })}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="h-10.5">
                        <MdAdd size={20} />
                    </Button>
                </form>

                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-text-secondary mb-2">
                        {activeTab === "EXPENSE" ? "지출" : "수입"} 카테고리 목록
                    </h3>

                    {isLoading ? (
                        <div className="text-center py-10 text-sm text-text-secondary">
                            로딩 중...
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="bg-background-paper rounded-xl border border-divider divide-y divide-divider">
                            {categories.map(cat => (
                                <div
                                    key={cat.value}
                                    className="flex items-center justify-between p-4 hover:bg-background-default transition-colors">
                                    <span className="font-medium text-text-primary">
                                        {cat.label}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(cat.value, cat.label)}
                                        className="text-text-disabled hover:text-error-main p-2 transition-colors">
                                        <MdDelete size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border border-dashed border-divider rounded-xl text-sm text-text-secondary">
                            등록된 카테고리가 없습니다.
                            <br />
                            위에서 추가해주세요.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
