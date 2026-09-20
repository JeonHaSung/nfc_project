package com.nfc_tag_service.management.onboarding.dto;

import com.nfc_tag_service.management.redirecting.dto.RedirectingUpsertRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public final class OnboardingDtos {

    private OnboardingDtos() {
    }

    public record RegisterStoreRequest(
            @NotBlank String tagId,
            @NotBlank String name,
            @NotEmpty List<RedirectingUpsertRequest> redirectings,
            String description,
            @NotBlank String cardNickname,
            String category,
            /** MASTER 대리등록 대상 계정. NORMAL은 무시되고 본인으로 고정. */
            Long registeredById
    ) {
    }

    public record AttachCardRequest(
            @NotBlank String tagId,
            @NotBlank String storeId,
            @NotBlank String cardNickname,
            @NotEmpty List<RedirectingUpsertRequest> redirectings
    ) {
    }

    public record OnboardingStoreItem(String id, String name) {
    }

    public record TagPreview(String tagId, String category, String tagUrl, String status) {
    }
}
