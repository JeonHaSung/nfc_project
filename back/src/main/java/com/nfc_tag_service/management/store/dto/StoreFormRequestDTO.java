package com.nfc_tag_service.management.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StoreFormRequestDTO {
    private String category;
    private String name;
    private String description;
    private String redirectUrl;
    private String id;
}
