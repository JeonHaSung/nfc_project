package com.nfc_tag_service.management.tag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TagFormRequestDTO {
    private String storeId;
    private String type;
    private String nickname;
    private String tagId;
    @Builder.Default
    private int count = 1;
}
