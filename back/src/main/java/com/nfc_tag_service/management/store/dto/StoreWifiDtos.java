package com.nfc_tag_service.management.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public final class StoreWifiDtos {

    private StoreWifiDtos() {
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class WifiResponse {
        private String storeId;
        private String wifiName;
        private String wifiPassword;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class WifiUpdateRequest {
        private String wifiName;
        private String wifiPassword;
    }
}
