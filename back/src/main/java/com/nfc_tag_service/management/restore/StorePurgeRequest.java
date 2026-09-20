package com.nfc_tag_service.management.restore;

public record StorePurgeRequest(
        String reason,
        String confirmation,
        Boolean recycleTags
) {
}
