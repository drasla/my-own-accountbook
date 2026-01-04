import React, { forwardRef, InputHTMLAttributes, useId } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: boolean;
    helperText?: string;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, fullWidth = true, id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className={twMerge("flex flex-col gap-1.5", fullWidth && "w-full")}>
                {/* Label */}
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-text-primary ml-1">
                        {label}
                    </label>
                )}

                {/* Input Field */}
                <input
                    id={inputId}
                    ref={ref}
                    className={twMerge(
                        // 기본 스타일
                        "px-4 py-2.5 rounded-lg border bg-transparent text-text-primary placeholder:text-text-disabled outline-none transition-all duration-200",
                        // 평상시 스타일 (Divider 색상 활용)
                        "border-divider hover:border-text-secondary",
                        // Focus 스타일 (Primary 색상 활용)
                        "focus:border-primary-main focus:ring-2 focus:ring-primary-main/20",
                        // Error 스타일 (Error 색상 활용)
                        error &&
                            "border-error-main focus:border-error-main focus:ring-error-main/20 text-error-main",
                        // Disabled 스타일
                        props.disabled && "bg-background-default opacity-60 cursor-not-allowed",
                        className,
                    )}
                    {...props}
                />

                {/* Helper Text */}
                {helperText && (
                    <p
                        className={twMerge(
                            ["text-xs", "ml-1", "animate-pulse"],
                            error ? "text-error-main" : "text-text-secondary",
                        )}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";

export default Input;
