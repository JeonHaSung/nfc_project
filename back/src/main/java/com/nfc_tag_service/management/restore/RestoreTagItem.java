package com.nfc_tag_service.management.restore;

public record RestoreTagItem(
        String id,
        String nickname,
        String category,
        String experienceType,
        boolean deleted
) {
}
