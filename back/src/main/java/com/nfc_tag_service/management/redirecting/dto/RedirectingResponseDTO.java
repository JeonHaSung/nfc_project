package com.nfc_tag_service.management.redirecting.dto;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingTypeEntity;
import com.nfc_tag_service.management.redirecting.RedirectingLocales;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

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
    private boolean quick;
    private Map<String, String> labels;

    public static RedirectingResponseDTO from(RedirectingEntity entity, RedirectingTypeEntity type) {
        Map<String, String> labels = type == null ? Map.of() : RedirectingLocales.copy(type.getLabels());
        String typeKey = type != null && type.getId() != null
                ? String.valueOf(type.getId())
                : entity.getRedirectingType();
        String label = type != null
                ? RedirectingLocales.pick(type.getLabels(), RedirectingLocales.KO)
                : entity.getRedirectingType();
        String color = type != null ? type.getColor() : "#94a3b8";
        return RedirectingResponseDTO.builder()
                .id(entity.getId())
                .tagId(entity.getTagId())
                .type(typeKey)
                .label(label)
                .color(color)
                .value(entity.getValue())
                .count(entity.getCount() == null ? 0L : entity.getCount())
                .quick(entity.isQuick())
                .labels(labels)
                .build();
    }

    public RedirectingResponseDTO forPublicChoice() {
        return RedirectingResponseDTO.builder()
                .id(id)
                .type(type)
                .label(label)
                .color(color)
                .labels(labels)
                .build();
    }
}
