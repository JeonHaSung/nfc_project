package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.admin.dto.AdminDtos.AdminResponse;
import com.nfc_tag_service.management.admin.dto.AdminDtos.ChangePasswordRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.CreateAdminRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.LoginRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateAdminRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateMeRequest;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminInputValidator inputValidator;

    @Transactional(readOnly = true)
    public AdminEntity authenticate(LoginRequest request) {
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        AdminEntity admin = adminRepository.findByLoginId(loginId)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }
        return admin;
    }

    @Transactional(readOnly = true)
    public AdminResponse getMe(Long adminId) {
        return AdminResponse.from(requireAdmin(adminId));
    }

    @Transactional
    public AdminResponse updateMe(Long adminId, UpdateMeRequest request) {
        AdminEntity admin = requireAdmin(adminId);
        if (!passwordEncoder.matches(request.currentPassword(), admin.getPasswordHash())) {
            throw new CustomException(ErrorCode.CURRENT_PASSWORD_MISMATCH);
        }

        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        ensureUniqueLoginId(loginId, admin.getId());
        admin.updateProfile(loginId, name);

        if (request.newPassword() != null) {
            inputValidator.validatePassword(request.newPassword());
            admin.changePassword(passwordEncoder.encode(request.newPassword()));
        }
        return AdminResponse.from(admin);
    }

    @Transactional(readOnly = true)
    public List<AdminResponse> getAdminAccounts() {
        return adminRepository.findAllByRoleOrderByIdAsc(AdminRole.ADMIN).stream()
                .map(AdminResponse::from)
                .toList();
    }

    @Transactional
    public AdminResponse createAdmin(CreateAdminRequest request) {
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        inputValidator.validatePassword(request.password());
        ensureUniqueLoginId(loginId, null);

        AdminEntity admin = new AdminEntity(
                loginId,
                name,
                passwordEncoder.encode(request.password()),
                AdminRole.ADMIN
        );
        return AdminResponse.from(adminRepository.save(admin));
    }

    @Transactional
    public AdminResponse updateAdmin(Long id, UpdateAdminRequest request) {
        AdminEntity admin = requireMutableAdmin(id);
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        ensureUniqueLoginId(loginId, id);
        admin.updateProfile(loginId, name);

        if (request.password() != null) {
            inputValidator.validatePassword(request.password());
            admin.changePassword(passwordEncoder.encode(request.password()));
        }
        return AdminResponse.from(admin);
    }

    @Transactional
    public AdminResponse changeAdminPassword(Long id, ChangePasswordRequest request) {
        AdminEntity admin = requireMutableAdmin(id);
        inputValidator.validatePassword(request.newPassword());
        admin.changePassword(passwordEncoder.encode(request.newPassword()));
        return AdminResponse.from(admin);
    }

    @Transactional
    public void deleteAdmin(Long id) {
        adminRepository.delete(requireMutableAdmin(id));
    }

    private AdminEntity requireAdmin(Long id) {
        return adminRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
    }

    private AdminEntity requireMutableAdmin(Long id) {
        AdminEntity admin = requireAdmin(id);
        if (admin.getRole() == AdminRole.MASTER) {
            throw new CustomException(ErrorCode.MASTER_ACCOUNT_PROTECTED);
        }
        return admin;
    }

    private void ensureUniqueLoginId(String loginId, Long currentId) {
        boolean exists = currentId == null
                ? adminRepository.existsByLoginId(loginId)
                : adminRepository.existsByLoginIdAndIdNot(loginId, currentId);
        if (exists) {
            throw new CustomException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
    }
}
