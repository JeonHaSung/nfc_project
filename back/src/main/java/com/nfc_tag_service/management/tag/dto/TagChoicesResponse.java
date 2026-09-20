package com.nfc_tag_service.management.tag.dto;

import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;

import java.util.List;

public record TagChoicesResponse(
        String storeName,
        List<RedirectingResponseDTO> items
) {
}
