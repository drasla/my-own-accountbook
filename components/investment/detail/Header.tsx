"use client";

import Button from "@/components/Button";
import { MdArrowBack, MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";

interface Props {
    title: string;
    onDelete: () => void;
}

export default function InvestmentDetailHeader({ title, onDelete }: Props) {
    const router = useRouter();
    return (
        <div className="px-5 py-4 flex items-center justify-between bg-background-default sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <Button variant="text" size="sm" color="primary" onClick={() => router.back()}>
                    <MdArrowBack size={24} />
                </Button>
                <h1 className="text-xl font-bold text-text-primary">{title}</h1>
            </div>
            <Button variant="text" color="error" size="sm" onClick={onDelete}>
                <MdDelete size={20} />
            </Button>
        </div>
    );
}
