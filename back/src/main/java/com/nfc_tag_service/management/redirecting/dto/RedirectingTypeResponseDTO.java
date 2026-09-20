package com.nfc_tag_service.management.redirecting.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class RedirectingTypeResponseDTO {
    private String type;
    private Long id;
    private String label;
    private String color;
    private Map<String, String> labels;
}
