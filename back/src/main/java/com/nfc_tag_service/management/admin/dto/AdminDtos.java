package com.nfc_tag_service.management.admin.dto;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record LoginRequest(
            @NotBlank String loginId,
            @NotBlank String password
    ) {
    }

    public record SignupRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank String email,
            String companyName,
            String businessNumber,
            @NotNull Boolean privacyAgreed,
            @NotBlank @Size(min = 10, max = 64) String password
    ) {
    }

    public record AdminResponse(
            Long id,
            String loginId,
            String name,
            String phone,
            String email,
            String companyName,
            String businessNumber,
            AdminRole role,
            boolean suspended,
            LocalDateTime privacyAgreedAt
    ) {
        public static AdminResponse from(AdminEntity admin) {
            return new AdminResponse(
                    admin.getId(),
                    admin.getLoginId(),
                    admin.getName(),
                    admin.getPhone(),
                    admin.getEmail(),
                    admin.getCompanyName(),
                    admin.getBusinessNumber(),
                    admin.getRole(),
                    admin.isSuspended(),
                    admin.getPrivacyAgreedAt()
            );
        }
    }

    public record UpdateMeRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            String phone,
            String email,
            String companyName,
            String businessNumber,
            @NotBlank String currentPassword,
            @Size(min = 10, max = 64) String newPassword
    ) {
    }

    public record CreateAdminRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank String email,
            String companyName,
            String businessNumber,
            @NotBlank @Size(min = 10, max = 64) String password
    ) {
    }

    public record UpdateAdminRequest(
            @NotBlank String loginId,
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank String email,
            String companyName,
            String businessNumber,
            @Size(min = 10, max = 64) String password
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank @Size(min = 10, max = 64) String newPassword
    ) {
    }

    public record SuspendRequest(@NotNull Boolean suspended) {
    }
}
