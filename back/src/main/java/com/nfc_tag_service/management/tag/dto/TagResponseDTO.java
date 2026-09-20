package com.nfc_tag_service.management.tag.dto;

import com.nfc_tag_service.domain.TagExperienceType;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class TagResponseDTO {
    private String id;
    private String storeId;
    private String category;
    private String nickname;
    private String tagUrl;
    private Long hitCount;
    private TagStatus status;
    private Long factoryOrderSeq;
    private TagExperienceType experienceType;
    private boolean registrationInProgress;
    private List<RedirectingResponseDTO> redirectings = new ArrayList<>();

    /** JPQL projection constructor */
    public TagResponseDTO(
            String id,
            String storeId,
            String category,
            String nickname,
            String tagUrl,
            Long hitCount,
            TagStatus status,
            Long factoryOrderSeq,
            TagExperienceType experienceType
    ) {
        this.id = id;
        this.storeId = storeId;
        this.category = category;
        this.nickname = nickname;
        this.tagUrl = tagUrl;
        this.hitCount = hitCount;
        this.status = status;
        this.factoryOrderSeq = factoryOrderSeq;
        this.experienceType = experienceType;
        this.registrationInProgress = false;
        this.redirectings = new ArrayList<>();
    }
}
