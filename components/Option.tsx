"use client";

import { ReactNode } from "react";
import { MdCheck } from "react-icons/md";

interface OptionProps {
    children: ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

export default function Option({ children, isSelected, onClick, className = "" }: OptionProps) {
    return (
        <div
            onClick={onClick}
            className={`
        flex items-center justify-between px-4 py-3 cursor-pointer text-sm transition-colors
        hover:bg-background-default
        ${isSelected ? "text-primary-main font-bold bg-primary-light/5" : "text-text-primary"}
        ${className}
      `}>
            <span className="truncate">{children}</span>
            {isSelected && <MdCheck size={16} className="text-primary-main shrink-0" />}
        </div>
    );
}
