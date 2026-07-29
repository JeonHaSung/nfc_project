package com.nfc_tag_service.management.store.dto;

import com.nfc_tag_service.global.type.StoreCategory;
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
    private String address;
    private String detailAddress;
    private String description;
    private String redirectUrl;
    //수정
    private String id;
}
