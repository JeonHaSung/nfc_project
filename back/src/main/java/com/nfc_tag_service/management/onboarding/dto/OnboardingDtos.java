package com.nfc_tag_service.management.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public final class OnboardingDtos {

    private OnboardingDtos() {
    }

    public record RegisterStoreRequest(
            @NotBlank String tagId,
            @NotBlank String name,
            @NotBlank String redirectUrl,
            String description,
            @NotBlank String cardNickname,
            String category
    ) {
    }

    public record AttachCardRequest(
            @NotBlank String tagId,
            @NotBlank String storeId,
            @NotBlank String cardNickname
    ) {
    }

    public record OnboardingStoreItem(String id, String name, String redirectUrl) {
    }

    public record TagPreview(String tagId, String category, String tagUrl, String status) {
    }
}
