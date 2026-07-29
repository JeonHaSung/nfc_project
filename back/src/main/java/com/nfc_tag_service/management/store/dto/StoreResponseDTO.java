package com.nfc_tag_service.management.store.dto;

import com.nfc_tag_service.domain.StoreEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StoreResponseDTO {
    private String id;
    private String category;
    private String name;
    private String address;
    private String detailAddress;
    private String description;
    private String totalTagCount;
    private String redirectUrl;

    public StoreResponseDTO(String id, String category, String name,
                            String address, String detailAddress,
                            String description, Long totalTagCount, String redirectUrl) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.address = address;
        this.detailAddress = detailAddress;
        this.description = description;
        this.totalTagCount = (totalTagCount != null) ? String.valueOf(totalTagCount) : "0";
        this.redirectUrl = redirectUrl;
    }

    public StoreResponseDTO(String id, String name) {
        this.id = id;
        this.name = name;
    }
}
