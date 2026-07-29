package com.nfc_tag_service.management.admin.dto;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record LoginRequest(
            @NotBlank String loginId,
            @NotBlank String password
    ) {
    }

    public record AdminResponse(Long id, String loginId, String name, AdminRole role) {
        public static AdminResponse from(AdminEntity admin) {
            return new AdminResponse(admin.getId(), admin.getLoginId(), admin.getName(), admin.getRole());
        }
    }

    public record UpdateMeRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @NotBlank String currentPassword,
            @Size(min = 10, max = 64) String newPassword
    ) {
    }

    public record CreateAdminRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @NotBlank @Size(min = 10, max = 64) String password
    ) {
    }

    public record UpdateAdminRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @Size(min = 10, max = 64) String password
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank @Size(min = 10, max = 64) String newPassword
    ) {
    }
}
