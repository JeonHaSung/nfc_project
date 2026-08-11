package com.nfc_tag_service.management.store.dto;

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
    private String description;
    private String totalHitCount;
    private String cardCount;
    private String redirectUrl;
    private Long registeredById;
    private String registeredByName;
    private String registeredByLoginId;
    private String registeredByPhone;
    /** 보유 카드 중 등급(rank)이 가장 높은 타입 */
    private String representativeExperienceType;
    /** 보유 중인 카드 타입 목록(중복 제거) */
    private java.util.List<String> experienceTypes;

    public StoreResponseDTO(
            String id,
            String category,
            String name,
            String description,
            Long totalHitCount,
            Long cardCount,
            String redirectUrl,
            Long registeredById,
            String registeredByName
    ) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.totalHitCount = totalHitCount != null ? String.valueOf(totalHitCount) : "0";
        this.cardCount = cardCount != null ? String.valueOf(cardCount) : "0";
        this.redirectUrl = redirectUrl;
        this.registeredById = registeredById;
        this.registeredByName = registeredByName;
    }

    public StoreResponseDTO(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public StoreResponseDTO(String id, String name, Long registeredById, String registeredByName) {
        this.id = id;
        this.name = name;
        this.registeredById = registeredById;
        this.registeredByName = registeredByName;
    }
}
