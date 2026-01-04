"use client";

import { useState, ReactNode } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

interface DropdownProps {
    trigger: ReactNode; // 클릭해서 열기 위한 요소 (버튼 등)
    children: ReactNode; // 펼쳐질 내용물 (메뉴 리스트 등)
    isOpen?: boolean; // (선택) 외부에서 열림 상태 제어 가능
    onClose?: () => void; // 닫힐 때 실행할 함수
}

export default function Dropdown({
    trigger,
    children,
    isOpen: controlledIsOpen,
    onClose,
}: DropdownProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // 외부 제어(controlled) 여부 확인
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleClose = () => {
        if (onClose) onClose();
        if (!isControlled) setInternalIsOpen(false);
    };

    const toggle = () => {
        if (isOpen) {
            handleClose();
        } else {
            if (!isControlled) setInternalIsOpen(true);
        }
    };

    // 바깥 클릭 감지
    const ref = useClickOutside(handleClose);

    return (
        <div className="relative w-full" ref={ref}>
            {/* 1. 트리거 (클릭 시 토글) */}
            <div onClick={toggle} className="cursor-pointer">
                {trigger}
            </div>

            {/* 2. 내용물 (펼침 메뉴) */}
            {isOpen && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-background-paper border border-divider rounded-xl shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    {children}
                </div>
            )}
        </div>
    );
}
