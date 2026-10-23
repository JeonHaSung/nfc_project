package com.nfc_tag_service.management.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public final class StoreReviewKeywordDtos {

    private StoreReviewKeywordDtos() {
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeywordResponse {
        private Long id;
        private String storeId;
        private String keyword;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeywordRequest {
        private String keyword;
    }
}
