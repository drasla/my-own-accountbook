"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { loginAction } from "@/actions/auth";
import toast from "react-hot-toast"; // 위에서 만든 액션 import

interface SignInInputs {
    email: string;
    password: string;
}

export default function SignInPage() {
    const {
        register,
        handleSubmit,
        setError, // 폼 에러 설정용 함수
        formState: { errors, isSubmitting },
    } = useForm<SignInInputs>({ mode: "onBlur" });

    const onSubmit: SubmitHandler<SignInInputs> = async data => {
        const toastId = toast.loading("로그인 중...");

        try {
            const result = await loginAction(data);

            if (result.success) {
                toast.dismiss(toastId);
                toast.success("환영합니다!", { icon: "👋" }); // 이모지 아이콘 커스텀

                // 페이지 이동 (새로고침 효과)
                window.location.href = "/";
            } else {
                toast.dismiss(toastId);
                toast.error(result.message || "로그인 정보를 확인해주세요.");
                setError("root", { message: result.message });
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("로그인 시스템 오류입니다.");
        }
    };

    return (
        <div className="min-h-screen bg-background-default flex items-center justify-center p-4">
            <div className="bg-background-paper border border-divider rounded-xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">로그인</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="이메일"
                        type="email"
                        {...register("email", { required: "이메일은 필수입니다." })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />

                    <Input
                        label="비밀번호"
                        type="password"
                        {...register("password", { required: "비밀번호를 입력해주세요." })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />

                    {/* 서버 에러 메시지 표시 영역 */}
                    {errors.root && (
                        <div className="bg-error-light/10 text-error-main text-sm p-3 rounded-lg text-center">
                            {errors.root.message}
                        </div>
                    )}

                    <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                        {isSubmitting ? "처리 중..." : "로그인"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-text-secondary">
                        계정이 없으신가요?{" "}
                        <Link
                            href="/sign-up"
                            className="text-primary-main hover:underline font-medium">
                            회원가입
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
