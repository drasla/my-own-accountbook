export const CHART_COLORS = [
    "#FFADAD", // 1. 부드러운 빨강
    "#FFD6A5", // 2. 살구색
    "#FDFFB6", // 3. 연한 노랑
    "#CAFFBF", // 4. 연두색
    "#9BF6FF", // 5. 하늘색
    "#A0C4FF", // 6. 연한 파랑
    "#BDB2FF", // 7. 연보라
    "#FFC6FF", // 8. 핑크
    "#FFFFFC", // 9. 크림
    "#D4C1EC", // 10. 라벤더
    "#84DCC6", // 11. 민트
    "#A5D8FF", // 12. 베이비 블루
    "#FFC8DD", // 13. 벚꽃색
    "#CDB4DB", // 14. 딥 라벤더
    "#56E39F", // 15. 에메랄드 그린
    "#F4D35E", // 16. 머스타드 옐로우
    "#EE964B", // 17. 탠저린
    "#0D3B66", // 18. 네이비 (강조용)
    "#F95738", // 19. 다홍색 (강조용)
    "#FAF0CA", // 20. 레몬 크림
];

// 색상을 순환해서 가져오는 유틸 함수 (데이터가 20개 넘을 경우 대비)
export const getChartColor = (index: number) => {
    return CHART_COLORS[index % CHART_COLORS.length];
};
