"use client";

import { logoutAction } from "@/app/actions/auth";
import Button from "@/components/Button"; // 이전에 만든 로그아웃 액션
import { MdLogout, MdMenu, MdPerson } from "react-icons/md";

interface HeaderProps {
    userName?: string | null;
}

export default function Header({ userName }: HeaderProps) {
    const handleLogout = async () => {
        if (confirm("정말 로그아웃 하시겠습니까?")) {
            await logoutAction();
        }
    };

    return (
        <header className="h-16 bg-background-paper border-b border-divider flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            {/* 모바일용 메뉴 버튼 (지금은 모양만) */}
            <button className="md:hidden p-2 text-text-secondary hover:bg-background-default rounded-md">
                <MdMenu size={20} />
            </button>

            {/* 우측 유저 정보 및 로그아웃 */}
            <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                    <div className="w-8 h-8 rounded-full bg-secondary-light flex items-center justify-center text-secondary-contrastText">
                        <MdPerson size={16} />
                    </div>
                    <span className="font-medium hidden sm:block">{userName || "사용자"}님</span>
                </div>

                <Button
                    variant="text"
                    color="error"
                    size="sm"
                    onClick={handleLogout}
                    className="text-xs">
                    <MdLogout size={14} className="mr-1" />
                    로그아웃
                </Button>
            </div>
        </header>
    );
}
