import { ButtonHTMLAttributes, ReactNode, useContext } from "react";
import { TabsContext } from "@/components/Tabs";
import { twMerge } from "tailwind-merge";

interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    value: any; // 이 탭이 가진 고유 값
    label?: ReactNode; // 탭에 표시할 내용 (문자열 or 컴포넌트)
    children?: ReactNode; // label 대신 children 사용 가능
}

export function Tab({ value, label, children, className, ...props }: TabProps) {
    const context = useContext(TabsContext);

    if (!context) {
        throw new Error("Tab 컴포넌트는 Tabs 컴포넌트 내부에서만 사용되어야 합니다.");
    }

    const { value: selectedValue, onChange, fullWidth } = context;
    const isActive = selectedValue === value;

    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={twMerge(
                ["relative", "py-3", "px-4", "text-sm", "font-medium", "cursor-pointer"],
                ["transition-colors", "outline-none", "border-b-2", "hover:text-text-primary"],
                fullWidth ? "flex-1" : "min-w-20",
                isActive
                    ? "border-primary-main text-primary-main"
                    : "border-transparent text-text-secondary",

                className,
            )}
            {...props}>
            {label || children}
        </button>
    );
}
