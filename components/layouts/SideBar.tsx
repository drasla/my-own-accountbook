"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { NAV_ITEMS } from "@/lib/constants";

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            className={twMerge(
                ["hidden", "md:fixed", "md:flex", "flex-col", "w-64", "h-full"],
                ["bg-background-paper", "border-r", "border-divider"],
            )}>
            <div
                className={twMerge(
                    ["h-16", "px-6", "flex", "items-center"],
                    ["border-b", "border-divider"],
                )}>
                <h1 className={twMerge(["text-xl", "font-bold", "text-primary-main"])}>
                    Money Manager
                </h1>
            </div>

            <nav className={twMerge(["flex-1", "p-4", "space-y-2"])}>
                {NAV_ITEMS.map(item => {
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
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* 하단 정보 (선택 사항) */}
            <div className="p-4 border-t border-divider">
                <p className="text-xs text-text-disabled">© 2026 My Account Book</p>
            </div>
        </aside>
    );
}
