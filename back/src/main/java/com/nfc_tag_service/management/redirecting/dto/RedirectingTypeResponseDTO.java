package com.nfc_tag_service.management.redirecting.dto;

import com.nfc_tag_service.domain.RedirectingType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RedirectingTypeResponseDTO {
    private String type;
    private String label;
    private String color;

    public static RedirectingTypeResponseDTO from(RedirectingType type) {
        return new RedirectingTypeResponseDTO(type.name(), type.getLabel(), type.getColor());
    }
}
