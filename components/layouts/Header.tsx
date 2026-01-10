"use client";

import { logoutAction } from "@/actions/auth";
import Button from "@/components/Button";
import { MdLogout, MdPerson } from "react-icons/md";
import { twMerge } from "tailwind-merge";

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
        <header
            className={twMerge(
                ["sticky", "top-0", "z-40", "h-16", "px-4"],
                ["flex", "justify-between", "items-center"],
                ["bg-background-paper", "backdrop-blur-md", "border-b", "border-divider"],
            )}>
            <h2 className="text-lg font-bold text-text-primary md:hidden">나만의 가계부</h2>

            {/* PC에서는 사이드바가 있으니 좌측 공백 채우기용 (flex-1) */}
            <div className="hidden md:block flex-1" />

            {/* 우측 유저 정보 및 로그아웃 */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-text-primary bg-primary-main px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-secondary-light flex items-center justify-center text-secondary-contrastText">
                        <MdPerson size={14} />
                    </div>
                    {/* 모바일 등 좁은 화면에선 이름 숨김 */}
                    <span className="font-medium hidden sm:block truncate max-w-25">
                        {userName || "사용자"}님
                    </span>
                </div>

                <Button
                    variant="text"
                    color="error"
                    size="sm"
                    onClick={handleLogout}
                    className="text-xs px-2 min-w-0">
                    <MdLogout size={18} />
                    <span className="hidden sm:inline ml-1">로그아웃</span>
                </Button>
            </div>
        </header>
    );
}
