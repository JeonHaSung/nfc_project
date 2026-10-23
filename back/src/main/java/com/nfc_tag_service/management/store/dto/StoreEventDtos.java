package com.nfc_tag_service.management.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public final class StoreEventDtos {

    private StoreEventDtos() {
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        private String name;
        private String price;
        private String quantity;
        private String imageUrl;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private String name;
        private String price;
        private String quantity;
        private String imageUrl;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventRequest {
        private Boolean enabled;
        private String name;
        private String nameEn;
        private String nameJa;
        private String nameZh;
        private String nameFr;
        private String description;
        private String descriptionEn;
        private String descriptionJa;
        private String descriptionZh;
        private String descriptionFr;
        private Boolean noTimeLimit;
        private Boolean showOnReviewRelay;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private List<ItemRequest> items;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventResponse {
        private Long id;
        private String storeId;
        private String name;
        private String nameEn;
        private String nameJa;
        private String nameZh;
        private String nameFr;
        private String description;
        private String descriptionEn;
        private String descriptionJa;
        private String descriptionZh;
        private String descriptionFr;
        private boolean enabled;
        private boolean noTimeLimit;
        private boolean showOnReviewRelay;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private boolean expired;
        private boolean live;
        private List<ItemResponse> items;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleRequest {
        private Boolean enabled;
    }
}
