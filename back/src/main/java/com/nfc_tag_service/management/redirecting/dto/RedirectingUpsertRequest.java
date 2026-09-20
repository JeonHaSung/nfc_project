package com.nfc_tag_service.management.redirecting.dto;

public record RedirectingUpsertRequest(
        Long id,
        String type,
        String value,
        Boolean quick
) {
}
