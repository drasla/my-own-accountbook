"use client";

import Button from "@/components/Button";
import { MdAdd } from "react-icons/md";
import dayjs from "dayjs";

interface Props {
    logs: any[];
    onAddClick: () => void;
    onLogClick: (log: any) => void;
}

export default function TransactionList({ logs, onAddClick, onLogClick }: Props) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-text-primary">입출금 내역 (시드머니)</h3>
                <Button
                    size="sm"
                    variant="text"
                    className="text-primary-main gap-1"
                    onClick={onAddClick}>
                    <MdAdd size={18} /> 기록 추가
                </Button>
            </div>

            {logs.length > 0 ? (
                <div className="bg-background-paper rounded-2xl border border-divider overflow-hidden">
                    {logs.map(log => (
                        <div
                            key={log.id}
                            onClick={() => onLogClick(log)}
                            className="flex items-center justify-between p-4 border-b border-divider last:border-none cursor-pointer hover:bg-background-default transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-text-secondary w-12 text-center">
                                    {dayjs(log.date).format("MM.DD")}
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">
                                        {log.type === "DEPOSIT"
                                            ? "투자금 입금"
                                            : log.type === "DIVIDEND"
                                              ? "배당금 (재투자)"
                                              : "투자금 회수"}
                                    </p>
                                    <p className="text-xs text-text-secondary">{log.note || "-"}</p>
                                </div>
                            </div>
                            <span
                                className={`font-bold ${log.type === "WITHDRAW" ? "text-primary-main" : "text-error-main"}`}>
                                {log.type === "WITHDRAW" ? "-" : "+"}
                                {log.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-text-secondary text-sm border border-dashed border-divider rounded-2xl">
                    입출금 내역이 없습니다.
                </div>
            )}
        </div>
    );
}
