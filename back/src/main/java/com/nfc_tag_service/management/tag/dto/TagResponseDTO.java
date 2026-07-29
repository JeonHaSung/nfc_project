package com.nfc_tag_service.management.tag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TagResponseDTO {
    private String id;
    private String storeId;
    private String category;
    private String nickname;
    private String tagUrl;
    private Long hitCount;
    private boolean isUsed;
}
