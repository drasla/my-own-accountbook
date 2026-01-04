const COLOR_PALETTE = [
    { bg: "bg-red-100", text: "text-red-700" }, // 빨강
    { bg: "bg-orange-100", text: "text-orange-800" }, // 주황
    { bg: "bg-amber-100", text: "text-amber-800" }, // 호박색 (노랑)
    { bg: "bg-green-100", text: "text-green-700" }, // 초록
    { bg: "bg-emerald-100", text: "text-emerald-700" }, // 에메랄드
    { bg: "bg-teal-100", text: "text-teal-700" }, // 청록
    { bg: "bg-cyan-100", text: "text-cyan-700" }, // 시안
    { bg: "bg-blue-100", text: "text-blue-700" }, // 파랑
    { bg: "bg-indigo-100", text: "text-indigo-700" }, // 남색
    { bg: "bg-violet-100", text: "text-violet-700" }, // 보라
    { bg: "bg-purple-100", text: "text-purple-700" }, // 자주
    { bg: "bg-fuchsia-100", text: "text-fuchsia-700" }, // 핑크
    { bg: "bg-pink-100", text: "text-pink-700" }, // 분홍
    { bg: "bg-rose-100", text: "text-rose-700" }, // 장미
];

// 2. 자주 쓰는 카테고리는 고정 색상 지정 (선택 사항)
const FIXED_COLORS: Record<string, number> = {
    식비: 1, // Orange
    "교통/차량": 7, // Blue
    월급: 3, // Green
    쇼핑: 11, // Fuchsia
    "주거/통신": 9, // Violet
    "카페/간식": 12, // Pink
};

/**
 * 문자열(카테고리명)을 받아서 항상 같은 색상 객체를 반환하는 함수
 */
export function getCategoryColor(name: string) {
    if (!name) return { bg: "bg-gray-100", text: "text-gray-600" };

    // 1. 고정 색상이 있는지 확인
    if (FIXED_COLORS[name] !== undefined) {
        return COLOR_PALETTE[FIXED_COLORS[name]];
    }

    // 2. 없으면 이름의 문자 코드를 더해서 인덱스 계산 (해싱)
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash += name.charCodeAt(i);
    }

    // 전체 팔레트 개수로 나눈 나머지 사용
    const index = hash % COLOR_PALETTE.length;

    return COLOR_PALETTE[index];
}
