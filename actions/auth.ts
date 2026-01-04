"use server";

import { prisma } from "@/lib/prisma"; // 위에서 만든 prisma 인스턴스
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 응답 타입 정의
type ActionResponse = {
    success: boolean;
    message?: string;
};

/**
 * 회원가입 액션 (Real DB)
 */
export async function signUpAction(data: any): Promise<ActionResponse> {
    const { email, password, name } = data;

    try {
        // 1. 중복 이메일 확인
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, message: "이미 사용 중인 이메일입니다." };
        }

        // 2. 비밀번호 해싱 (Salt rounds: 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. DB에 유저 생성
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null, // 스키마에 name은 optional(String?)
            },
        });

        return { success: true, message: "회원가입 성공" };
    } catch (error) {
        console.error("SignUp Error:", error);
        return { success: false, message: "회원가입 처리 중 오류가 발생했습니다." };
    }
}

/**
 * 로그인 액션 (Real DB)
 */
export async function loginAction(data: any): Promise<ActionResponse> {
    const { email, password } = data;

    try {
        // 1. 유저 조회
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { success: false, message: "가입되지 않은 이메일입니다." };
        }

        // 2. 비밀번호 일치 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { success: false, message: "비밀번호가 일치하지 않습니다." };
        }

        // 3. 세션 처리 (쿠키 설정)
        // 실제 프로덕션에선 JWT(jose)나 NextAuth 사용 권장하지만,
        // 여기선 간단히 httpOnly 쿠키에 userId를 심습니다.
        const cookieStore = await cookies(); // Next.js 15부터는 await 필요

        cookieStore.set("userId", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 7일
            path: "/",
        });

        return { success: true, message: "로그인 성공" };
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, message: "로그인 처리 중 오류가 발생했습니다." };
    }
}

/**
 * 로그아웃 액션
 */
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("userId");
    redirect("/sign-in");
}
