"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { NAV_ITEMS } from "@/lib/constants";

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className={twMerge(
                ["md:hidden", "fixed", "bottom-0", "left-0", "right-0", "z-50"],
                ["bg-white", "border-t", "border-divider", "pb-[env(safe-area-inset-bottom)]"],
            )}>
            <div className={twMerge(["flex", "justify-around", "items-center", "h-15"])}>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={twMerge(
                                ["w-full", "h-full", "transition-colors"],
                                ["flex", "flex-col", "items-center", "justify-center", "gap-1"],
                                isActive
                                    ? "text-primary-main"
                                    : "text-text-disabled hover:text-text-secondary",
                            )}>
                            <Icon size={24} />
                            <span className={twMerge(["text-xs", "font-medium"])}>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
