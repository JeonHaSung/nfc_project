package com.nfc_tag_service.domain;

/**
 * 태그가 매장에 등록된 뒤 제공하는 사용자 경험 유형.
 * NFC/QR 물리 유형 및 생성/발주/등록 상태와 독립적으로 관리한다.
 */
public enum TagExperienceType {
    STANDARD,
    SPECIAL
}
