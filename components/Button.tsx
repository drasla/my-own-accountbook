import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "contained" | "outlined" | "text";
    color?: "primary" | "secondary" | "error" | "success" | "warning" | "info";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

export default function Button({
    children,
    className,
    variant = "contained",
    color = "primary",
    size = "md",
    fullWidth = false,
    disabled,
    ...props
}: ButtonProps) {
    // 1. 기본 스타일
    const baseStyles =
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    // 2. 크기별 스타일
    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-6 py-3.5 text-lg",
    };

    // 3. 변형(Variant) & 색상(Color) 조합 스타일
    // Tailwind v4 @theme 변수를 활용합니다.
    const variants = {
        contained: {
            primary:
                "bg-primary-main text-primary-contrastText hover:bg-primary-dark focus:ring-primary-main",
            secondary:
                "bg-secondary-main text-secondary-contrastText hover:bg-secondary-dark focus:ring-secondary-main",
            error: "bg-error-main text-error-contrastText hover:bg-error-dark focus:ring-error-main",
            success:
                "bg-success-main text-success-contrastText hover:bg-success-dark focus:ring-success-main",
            warning:
                "bg-warning-main text-warning-contrastText hover:bg-warning-dark focus:ring-warning-main",
            info: "bg-info-main text-info-contrastText hover:bg-info-dark focus:ring-info-main",
        },
        outlined: {
            primary:
                "border border-primary-main text-primary-main hover:bg-primary-main/10 focus:ring-primary-main",
            secondary:
                "border border-secondary-main text-secondary-main hover:bg-secondary-main/10 focus:ring-secondary-main",
            error: "border border-error-main text-error-main hover:bg-error-main/10 focus:ring-error-main",
            success:
                "border border-success-main text-success-main hover:bg-success-main/10 focus:ring-success-main",
            warning:
                "border border-warning-main text-warning-main hover:bg-warning-main/10 focus:ring-warning-main",
            info: "border border-info-main text-info-main hover:bg-info-main/10 focus:ring-info-main",
        },
        text: {
            primary: "text-primary-main hover:bg-primary-main/10 focus:ring-primary-main",
            secondary: "text-secondary-main hover:bg-secondary-main/10 focus:ring-secondary-main",
            error: "text-error-main hover:bg-error-main/10 focus:ring-error-main",
            success: "text-success-main hover:bg-success-main/10 focus:ring-success-main",
            warning: "text-warning-main hover:bg-warning-main/10 focus:ring-warning-main",
            info: "text-info-main hover:bg-info-main/10 focus:ring-info-main",
        },
    };

    return (
        <button
            className={twMerge(
                baseStyles,
                sizeStyles[size],
                variants[variant][color],
                fullWidth && "w-full",
                className,
            )}
            disabled={disabled}
            {...props}>
            {children}
        </button>
    );
}
