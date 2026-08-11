package com.nfc_tag_service.management.tag.dto;

import com.nfc_tag_service.domain.TagStatus;

/**
 * 태그 오픈(리다이렉트)용 경량 조회 결과.
 * 영속 엔티티를 올리지 않아 hitCount 원자 업데이트와 충돌하지 않는다.
 */
public record TagOpenView(
        TagStatus status,
        String storeId,
        String redirectUrl,
        Boolean storeDeleted
) {
    public boolean hasUsableStore() {
        return storeId != null
                && !storeId.isBlank()
                && !Boolean.TRUE.equals(storeDeleted)
                && redirectUrl != null
                && !redirectUrl.isBlank();
    }
}
