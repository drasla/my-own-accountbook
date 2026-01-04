"use client";

import { useState } from "react";
import Dropdown from "@/components/Dropdown"; // 껍데기
import Option from "@/components/Option"; // 알맹이
import { MdKeyboardArrowDown } from "react-icons/md";

interface SelectOption {
    label: string;
    value: string | number;
}

interface SelectProps {
    label?: string;
    options: SelectOption[];
    value?: string | number;
    onChange: (value: any) => void;
    placeholder?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

export default function Select({
    label,
    options,
    value,
    onChange,
    placeholder = "선택하세요",
    error,
    helperText,
    disabled,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    // 현재 선택된 옵션 찾기
    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val: any) => {
        onChange(val);
        setIsOpen(false); // 선택 후 닫기
    };

    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium text-text-primary">{label}</label>}

            {/* Dropdown 컴포넌트 사용 */}
            <Dropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                trigger={
                    // 트리거: Input 처럼 생긴 버튼
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={`
              flex items-center justify-between w-full p-3 rounded-xl border text-left transition-all
              bg-background-paper
              ${
                  error
                      ? "border-error-main focus:ring-2 focus:ring-error-light/20"
                      : "border-divider focus:border-primary-main focus:ring-2 focus:ring-primary-light/20"
              }
              ${disabled ? "opacity-50 cursor-not-allowed bg-background-default" : "cursor-pointer"}
            `}>
                        <span
                            className={selectedOption ? "text-text-primary" : "text-text-disabled"}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <MdKeyboardArrowDown
                            size={20}
                            className={`text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                }>
                {/* 내용물: Option 리스트 */}
                {options.length > 0 ? (
                    options.map(option => (
                        <Option
                            key={option.value}
                            isSelected={option.value === value}
                            onClick={() => handleSelect(option.value)}>
                            {option.label}
                        </Option>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-text-disabled text-center">
                        항목이 없습니다.
                    </div>
                )}
            </Dropdown>

            {/* 에러 메시지 */}
            {helperText && (
                <p className={`text-xs ${error ? "text-error-main" : "text-text-secondary"}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
