package com.nfc_tag_service.domain;

/**
 * 레거시 유형 코드. 운영 목록은 redirecting_types 테이블이 기준이며,
 * 이 enum은 최초 seed 및 기존 redirectings.redirecting_type 값 호환에만 쓴다.
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
