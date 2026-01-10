"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    MdPerson,
    MdCategory,
    MdLogout,
    MdDeleteForever,
    MdChevronRight,
    MdSecurity,
    MdSmartphone,
    MdDarkMode,
    MdLightMode,
    MdInfo,
} from "react-icons/md";
import { getCurrentUser } from "@/actions/user";
import { logoutAction } from "@/actions/auth";
import { deleteAccountAction } from "@/actions/user";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        getCurrentUser().then(setUser);
    }, []);

    const toggleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    const getThemeLabel = () => {
        if (!mounted) return "";
        switch (theme) {
            case "dark":
                return "다크 모드";
            case "light":
                return "라이트 모드";
            default:
                return "시스템 설정";
        }
    };

    const ThemeIcon = () => {
        if (!mounted) return <MdSmartphone />; // 로딩 시 기본값
        if (theme === "dark") return <MdDarkMode />;
        if (theme === "light") return <MdLightMode />;
        return <MdSmartphone />;
    };

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            await logoutAction();
            router.push("/sign-in");
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = prompt(
            "계정을 삭제하면 모든 데이터가 사라지며 복구할 수 없습니다.\n삭제하려면 '삭제'라고 입력해주세요.",
        );

        if (confirmed === "삭제") {
            const res = await deleteAccountAction();
            if (res.success) {
                toast.success("계정이 삭제되었습니다.");
                router.replace("/sign-in");
            } else {
                toast.error(res.message);
            }
        }
    };

    if (!mounted) return null;

    return (
        <div className="pb-24">
            {/* 1. 헤더 */}
            <header className="px-5 py-4 bg-background-default sticky top-0 z-10 border-b border-divider">
                <h1 className="text-xl font-bold text-text-primary">설정</h1>
            </header>

            <div className="px-5 mt-6 space-y-6">
                {/* 2. 프로필 카드 */}
                <section className="bg-background-paper p-5 rounded-2xl border border-divider flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center text-primary-main text-2xl font-bold">
                        {user?.name?.[0] || <MdPerson />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">
                            {user?.name || "사용자"}
                        </h2>
                        <p className="text-sm text-text-secondary">{user?.email}</p>
                    </div>
                    {/* 프로필 수정 버튼 (추후 구현) */}
                    <button className="ml-auto text-xs font-bold text-primary-main border border-primary-main px-3 py-1.5 rounded-full hover:bg-primary-light/10 transition-colors">
                        수정
                    </button>
                </section>

                {/* 3. 앱 설정 그룹 */}
                <section>
                    <h3 className="text-xs font-bold text-text-disabled mb-2 ml-1">앱 설정</h3>
                    <div className="rounded-2xl border border-divider overflow-hidden">
                        <SettingItem
                            icon={ThemeIcon} // 동적 아이콘
                            label="화면 테마"
                            subLabel={getThemeLabel()} // 현재 상태 표시
                            onClick={toggleTheme}
                        />

                        <SettingItem
                            icon={MdCategory}
                            label="분류(카테고리) 관리"
                            subLabel="수입/지출 카테고리 편집"
                            onClick={() => router.push("/categories")}
                        />
                    </div>
                </section>

                {/* 4. 정보 그룹 */}
                <section>
                    <h3 className="text-xs font-bold text-text-disabled mb-2 ml-1">정보</h3>
                    <div className="rounded-2xl border border-divider overflow-hidden">
                        <SettingItem
                            icon={MdInfo}
                            label="버전 정보"
                            subLabel="v1.0.0"
                            onClick={() => {}}
                        />
                        <SettingItem
                            icon={MdSecurity}
                            label="개인정보 처리방침"
                            onClick={() => {}}
                        />
                    </div>
                </section>

                {/* 5. 계정 관리 그룹 (위험 구역) */}
                <section>
                    <h3 className="text-xs font-bold text-text-disabled mb-2 ml-1">계정</h3>
                    <div className="rounded-2xl border border-divider overflow-hidden bg-background-paper">
                        <SettingItem icon={MdLogout} label="로그아웃" onClick={handleLogout} />
                        <SettingItem
                            icon={MdDeleteForever}
                            label="회원 탈퇴"
                            isDestructive
                            onClick={handleDeleteAccount}
                        />
                    </div>
                </section>

                <div className="text-center mt-8">
                    <p className="text-xs text-text-disabled">
                        My Own Accountbook
                        <br />© 2026 All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

const SettingItem = ({ icon: Icon, label, onClick, isDestructive = false, subLabel = "" }: any) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between p-4 bg-background-paper border-b border-divider last:border-none cursor-pointer transition-colors hover:bg-background-default active:bg-gray-100
                ${isDestructive ? "text-error-main" : "text-text-primary"}
            `}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDestructive ? "bg-red-50" : "bg-gray-50"}`}>
                <Icon
                    size={20}
                    className={isDestructive ? "text-error-main" : "text-text-secondary"}
                />
            </div>
            <div>
                <span className="font-medium text-sm">{label}</span>
                {subLabel && <p className="text-xs text-text-secondary mt-0.5">{subLabel}</p>}
            </div>
        </div>
        <MdChevronRight className="text-text-disabled" />
    </div>
);
