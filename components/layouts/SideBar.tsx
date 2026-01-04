"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { MdAccountBalanceWallet, MdDashboard, MdPieChart, MdSettings } from "react-icons/md";

const MENU_ITEMS = [
    { name: "대시보드", href: "/", icon: MdDashboard },
    { name: "자산 관리", href: "/accounts", icon: MdAccountBalanceWallet },
    { name: "분류 관리", href: "/categories", icon: MdPieChart },
    { name: "설정", href: "/settings", icon: MdSettings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-background-paper border-r border-divider h-full flex flex-col hidden md:flex">
            {/* 로고 영역 */}
            <div className="h-16 flex items-center px-6 border-b border-divider">
                <span className="text-xl font-bold text-primary-main">Money Manager</span>
            </div>

            {/* 메뉴 리스트 */}
            <nav className="flex-1 p-4 space-y-1">
                {MENU_ITEMS.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={twMerge(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary-light/20 text-primary-dark" // 활성 상태: 연한 파랑 배경 + 진한 파랑 글씨
                                    : "text-text-secondary hover:bg-background-default hover:text-text-primary", // 비활성 상태
                            )}>
                            <item.icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* 하단 정보 (선택 사항) */}
            <div className="p-4 border-t border-divider">
                <p className="text-xs text-text-disabled">v1.0.0</p>
            </div>
        </aside>
    );
}
