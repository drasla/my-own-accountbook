import {
    MdDashboard,
    MdSettings,
    MdAccountBalanceWallet,
    MdPieChart,
    MdCategory,
} from "react-icons/md";

export const NAV_ITEMS = [
    { name: "대시보드", href: "/", icon: MdDashboard },
    { name: "자산 관리", href: "/accounts", icon: MdAccountBalanceWallet },
    { name: "분류 관리", href: "/categories", icon: MdCategory },
    { name: "통계", href: "/stats", icon: MdPieChart },
    { name: "설정", href: "/settings", icon: MdSettings },
];
