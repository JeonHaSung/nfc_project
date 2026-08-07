package com.nfc_tag_service.management.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class EmailRecoveryDtos {

    private EmailRecoveryDtos() {
    }

    public record EmailRequest(@NotBlank String email) {
    }

    public record EmailCodeRequest(
            @NotBlank String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code
    ) {
    }

    public record FindIdResponse(String loginId) {
    }

    public record ResetPasswordSendRequest(
            @NotBlank String loginId,
            @NotBlank String email
    ) {
    }

    public record ResetPasswordVerifyRequest(
            @NotBlank String loginId,
            @NotBlank String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code
    ) {
    }
}
