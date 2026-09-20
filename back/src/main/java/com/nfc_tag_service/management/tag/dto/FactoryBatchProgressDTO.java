package com.nfc_tag_service.management.tag.dto;

public record FactoryBatchProgressDTO(
        long orderSeq,
        long remainingCount,
        long assignedCount,
        int initialCount,
        boolean inProgress
) {
}
