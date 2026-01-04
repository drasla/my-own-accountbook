import { getCurrentUser } from "@/app/actions/user";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layouts/SideBar";
import Header from "@/components/layouts/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 서버 컴포넌트에서 유저 정보 Fetch
    const user = await getCurrentUser();

    // 비로그인 상태면 로그인 페이지로 튕겨내기 (보안)
    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="flex h-screen bg-background-default text-text-primary">
            {/* 좌측 사이드바 (데스크탑) */}
            <Sidebar />

            {/* 우측 메인 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 상단 헤더 */}
                <Header userName={user.name} />

                {/* 페이지 콘텐츠 (스크롤 가능 영역) */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
