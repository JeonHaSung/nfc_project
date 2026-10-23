package com.nfc_tag_service.management.tag.dto;

import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

public record TagChoicesResponse(
        String storeName,
        WifiInfo wifi,
        List<RelayEvent> events,
        List<String> keywords,
        List<RedirectingResponseDTO> items
) {
    public record WifiInfo(String name, String password) {
    }

    public record RelayEvent(
            Long id,
            String name,
            String nameEn,
            String nameJa,
            String nameZh,
            String nameFr,
            String description,
            String descriptionEn,
            String descriptionJa,
            String descriptionZh,
            String descriptionFr,
            boolean noTimeLimit,
            LocalDateTime endAt,
            List<RelayEventItem> items
    ) {
    }

    public record RelayEventItem(
            String name,
            String price,
            String quantity,
            String imageUrl
    ) {
    }
}
