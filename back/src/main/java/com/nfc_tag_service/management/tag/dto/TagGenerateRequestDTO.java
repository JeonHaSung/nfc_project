package com.nfc_tag_service.management.tag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TagGenerateRequestDTO {
    private String type;
    @Builder.Default
    private String experienceType = "STANDARD";
    @Builder.Default
    private int count = 1;
}
