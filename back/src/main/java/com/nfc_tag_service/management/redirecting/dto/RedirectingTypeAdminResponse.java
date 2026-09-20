package com.nfc_tag_service.management.redirecting.dto;

import java.util.Map;

public record RedirectingTypeAdminResponse(
        Long id,
        String code,
        String color,
        int sortOrder,
        Map<String, String> labels,
        boolean inUse
) {
}
