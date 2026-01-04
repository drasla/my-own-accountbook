"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { signUpAction } from "@/app/actions/auth";
import toast from "react-hot-toast"; // 작성해주신 Server Action

// Prisma Schema의 User 모델 + 확인용 비밀번호
interface SignUpInputs {
    name: string; // User.name (String?)
    email: string; // User.email (String, unique)
    password: string; // User.password (String)
    passwordConfirm: string; // UI Only
}

export default function SignUpPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignUpInputs>({
        mode: "onBlur", // 입력 후 포커스 잃을 때 검사
    });

    // 비밀번호 일치 검사를 위해 값 관찰
    const password = watch("password");

    const onSubmit: SubmitHandler<SignUpInputs> = async data => {
        // 1. 서버로 보낼 데이터 정제 (passwordConfirm 제외)
        const { passwordConfirm, ...requestData } = data;

        const toastId = toast.loading("회원가입 처리 중...");

        try {
            const result = await signUpAction(requestData);

            if (result.success) {
                // 로딩 토스트 제거 후 성공 메시지
                toast.dismiss(toastId);
                toast.success("회원가입 완료! 로그인 페이지로 이동합니다.", {
                    duration: 3000,
                });
                router.push("/sign-in");
            } else {
                toast.dismiss(toastId);
                // 서버 메시지 에러 토스트
                toast.error(result.message || "회원가입에 실패했습니다.");

                // 필요하다면 폼 에러도 함께 표시
                setError("root", { message: result.message });
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-background-default flex items-center justify-center p-4">
            {/* 카드 컨테이너 */}
            <div className="bg-background-paper border border-divider rounded-xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">회원가입</h1>
                    <p className="text-text-secondary mt-1">가계부 관리를 시작해보세요.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* 1. 이름 (User.name) */}
                    <Input
                        label="이름"
                        placeholder="홍길동"
                        {...register("name", {
                            required: "이름을 입력해주세요.",
                            minLength: { value: 2, message: "이름은 2글자 이상이어야 합니다." },
                        })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />

                    {/* 2. 이메일 (User.email) */}
                    <Input
                        label="이메일"
                        type="email"
                        placeholder="example@email.com"
                        {...register("email", {
                            required: "이메일은 필수입니다.",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "올바른 이메일 형식이 아닙니다.",
                            },
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />

                    {/* 3. 비밀번호 (User.password) */}
                    <Input
                        label="비밀번호"
                        type="password"
                        placeholder="8자 이상 입력"
                        {...register("password", {
                            required: "비밀번호를 입력해주세요.",
                            minLength: { value: 8, message: "비밀번호는 8자 이상이어야 합니다." },
                        })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />

                    {/* 4. 비밀번호 확인 (UI Only) */}
                    <Input
                        label="비밀번호 확인"
                        type="password"
                        placeholder="비밀번호 재입력"
                        {...register("passwordConfirm", {
                            required: "비밀번호 확인을 입력해주세요.",
                            validate: val => val === password || "비밀번호가 일치하지 않습니다.",
                        })}
                        error={!!errors.passwordConfirm}
                        helperText={errors.passwordConfirm?.message}
                    />

                    {/* 서버 에러 메시지 표시 영역 */}
                    {errors.root && (
                        <div className="bg-error-light/10 text-error-main text-sm p-3 rounded-lg text-center font-medium">
                            {errors.root.message}
                        </div>
                    )}

                    {/* 가입 버튼 */}
                    <div className="pt-2">
                        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
                            {isSubmitting ? "가입 처리 중..." : "회원가입"}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-text-secondary">
                        이미 계정이 있으신가요?{" "}
                        <Link
                            href="/sign-in"
                            className="text-primary-main hover:underline font-medium">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
