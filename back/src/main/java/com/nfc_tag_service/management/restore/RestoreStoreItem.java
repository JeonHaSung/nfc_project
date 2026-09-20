package com.nfc_tag_service.management.restore;

public record RestoreStoreItem(
        String id,
        String name,
        String category,
        boolean deleted
) {
}
