import { getCategoryColor } from "@/lib/colorUtil";
import { twMerge } from "tailwind-merge";

interface ChipProps {
    label: string;
    className?: string;
}

export default function Chip({ label, className }: ChipProps) {
    // 이름에 따른 색상 가져오기
    const { bg, text } = getCategoryColor(label);

    return (
        <span
            className={twMerge(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                bg,
                text,
                className,
            )}>
            {label}
        </span>
    );
}
