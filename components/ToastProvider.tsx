"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center" // 위치: 상단 중앙
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                // 1. 기본 스타일 (파스텔 테마 적용)
                className: "",
                style: {
                    background: "var(--background-paper)", // 배경: 카드색
                    color: "var(--text-primary)", // 글자: 기본 텍스트
                    border: "1px solid var(--divider)", // 테두리: 구분선
                    padding: "16px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                },

                // 2. 성공 메시지 스타일
                success: {
                    iconTheme: {
                        primary: "var(--color-success-main)", // 아이콘: 녹색
                        secondary: "white",
                    },
                    style: {
                        border: "1px solid var(--color-success-light)", // 테두리: 연한 녹색
                        background: "var(--background-paper)",
                    },
                },

                // 3. 에러 메시지 스타일
                error: {
                    iconTheme: {
                        primary: "var(--color-error-main)", // 아이콘: 빨강
                        secondary: "white",
                    },
                    style: {
                        border: "1px solid var(--color-error-light)", // 테두리: 연한 빨강
                        background: "var(--background-paper)",
                    },
                },

                // 4. 로딩 등 커스텀 (필요시)
                loading: {
                    style: {
                        border: "1px solid var(--color-info-light)",
                    },
                },
            }}
        />
    );
}
