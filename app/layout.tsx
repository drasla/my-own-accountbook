import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
    title: "Money Manager",
    description: "Smart Personal Finance Management",
};

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="ko">
            <body>
                {/* Toast 알림을 위한 Provider 추가 */}
                <ToastProvider />
                {children}
            </body>
        </html>
    );
}
