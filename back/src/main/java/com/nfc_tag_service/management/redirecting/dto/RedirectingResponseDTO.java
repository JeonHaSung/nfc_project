package com.nfc_tag_service.management.redirecting.dto;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedirectingResponseDTO {
    private Long id;
    private String tagId;
    private String type;
    private String label;
    private String color;
    private String value;
    private Long count;

    public static RedirectingResponseDTO from(RedirectingEntity entity) {
        RedirectingType type = entity.getRedirectingType();
        return RedirectingResponseDTO.builder()
                .id(entity.getId())
                .tagId(entity.getTagId())
                .type(type.name())
                .label(type.getLabel())
                .color(type.getColor())
                .value(entity.getValue())
                .count(entity.getCount() == null ? 0L : entity.getCount())
                .build();
    }
}
