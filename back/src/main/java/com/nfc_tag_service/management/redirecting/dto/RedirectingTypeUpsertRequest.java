package com.nfc_tag_service.management.redirecting.dto;

import java.util.Map;

public record RedirectingTypeUpsertRequest(
        String color,
        Integer sortOrder,
        Map<String, String> labels
) {
}
