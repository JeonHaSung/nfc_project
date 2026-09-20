package com.nfc_tag_service.domain;

/**
 * 태그 탭 이후 이동할 목적지 종류.
 * 항목을 추가하면 온보딩 목록·선택 화면·도넛 차트에 그대로 반영된다.
 */
public enum RedirectingType {
    NAVER_RECEIPT_REVIEW("네이버 영수증 리뷰 남기기", "#22c55e"),
    GOOGLE_MAPS_REVIEW("구글 지도 (Google Maps) 리뷰", "#3b82f6"),
    KAKAO_MAP_REVIEW("카카오맵 (Kakao Map) 리뷰", "#facc15"),
    INSTAGRAM_OFFICIAL("인스타그램 공식 계정 방문", "#ec4899");

    private final String label;
    private final String color;

    RedirectingType(String label, String color) {
        this.label = label;
        this.color = color;
    }

    public String getLabel() {
        return label;
    }

    public String getColor() {
        return color;
    }
}
