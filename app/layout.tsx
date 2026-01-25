import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import BottomNav from "@/components/layouts/BottomNav";
import { twMerge } from "tailwind-merge";
import Sidebar from "@/components/layouts/SideBar";
import Header from "@/components/layouts/Header";
import { getCurrentUser } from "@/actions/user";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
    title: "Money Manager",
    description: "Smart Personal Finance Management",
};

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: PropsWithChildren) {
    const user = await getCurrentUser();

    return (
        <html lang="ko" suppressHydrationWarning={true}>
            <body
                className={twMerge(inter.className, [
                    "bg-background-default",
                    "text-text-primary",
                ])}>
                <ThemeProvider>
                    <div className={twMerge(["flex", "min-h-screen"])}>
                        <Sidebar />
                        <main
                            className={twMerge(
                                ["flex-1", "flex", "flex-col", "min-w-0", "md:ml-64"],
                                ["transition-all", "duration-300"],
                            )}>
                            <Header userName={user?.name} />
                            <div
                                className={twMerge(
                                    ["flex-1", "w-full", "mx-auto", "pb-20"],
                                    ["px-4", "md:px-8"],
                                )}>
                                {children}
                            </div>
                        </main>
                        <BottomNav />
                    </div>
                    <ToastProvider />
                </ThemeProvider>
            </body>
        </html>
    );
}
