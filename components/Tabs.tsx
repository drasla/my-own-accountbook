"use client";

import React, { createContext, useContext } from "react";
import { twMerge } from "tailwind-merge";

// ----------------------------------------------------------------------
// Context: 부모(Tabs)와 자식(Tab) 간의 데이터 공유
// ----------------------------------------------------------------------
export interface TabsContextType {
    value: any;
    onChange: (value: any) => void;
    fullWidth?: boolean;
}

export const TabsContext = createContext<TabsContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// 1. Parent Component: Tabs
// ----------------------------------------------------------------------
interface TabsProps {
    value: any; // 현재 선택된 탭의 값 (state)
    onChange: (val: any) => void; // 변경 핸들러 (setState)
    children: React.ReactNode;
    fullWidth?: boolean; // 탭 너비를 꽉 채울지 여부
    className?: string;
}

export function Tabs({ value, onChange, children, fullWidth = false, className }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onChange, fullWidth }}>
            <div className={twMerge("flex border-b border-divider w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}