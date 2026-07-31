package com.nfc_tag_service.management.tag.dto;

public record TagExcelOrderResponseDTO(
        Long id,
        long orderSeq,
        String fileName,
        String storageUrl,
        String category,
        int tagCount,
        String createdAt
) {
}
