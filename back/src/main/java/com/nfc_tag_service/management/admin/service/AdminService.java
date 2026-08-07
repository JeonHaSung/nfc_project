package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.domain.EmailVerificationEntity;
import com.nfc_tag_service.domain.EmailVerificationPurpose;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.admin.dto.AdminDtos.AdminResponse;
import com.nfc_tag_service.management.admin.dto.AdminDtos.ChangePasswordRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.CreateAdminRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.LoginRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.SignupRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateAdminRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateMeRequest;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import com.nfc_tag_service.management.admin.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final EmailVerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminInputValidator inputValidator;

    @Transactional(readOnly = true)
    public AdminEntity authenticate(LoginRequest request) {
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        AdminEntity admin = adminRepository.findByLoginIdAndDelFalse(loginId)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (admin.isSuspended()) {
            throw new CustomException(ErrorCode.ACCOUNT_SUSPENDED);
        }
        return admin;
    }

    @Transactional
    public AdminResponse signup(SignupRequest request) {
        inputValidator.requirePrivacyAgreed(request.privacyAgreed());
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        String phone = inputValidator.normalizePhone(request.phone());
        String email = inputValidator.normalizeEmail(request.email());
        inputValidator.validatePassword(request.password());
        ensureUniqueLoginId(loginId, null);
        ensureUniqueEmail(email, null);
        EmailVerificationEntity verification = requireVerifiedSignup(email);

        AdminEntity admin = new AdminEntity(
                loginId,
                name,
                passwordEncoder.encode(request.password()),
                AdminRole.NORMAL,
                phone,
                email,
                LocalDateTime.now()
        );
        AdminResponse response = AdminResponse.from(adminRepository.save(admin));
        verification.consume(Instant.now());
        return response;
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
        boolean master = admin.getRole() == AdminRole.MASTER;
        String phone = (request.phone() == null || request.phone().isBlank())
                ? (master ? admin.getPhone() : inputValidator.normalizePhone(request.phone()))
                : inputValidator.normalizePhone(request.phone());
        String email = (request.email() == null || request.email().isBlank())
                ? (master ? admin.getEmail() : inputValidator.normalizeEmail(request.email()))
                : inputValidator.normalizeEmail(request.email());
        ensureUniqueLoginId(loginId, admin.getId());
        if (!java.util.Objects.equals(email, admin.getEmail())) {
            ensureUniqueEmail(email, admin.getId());
        }
        admin.updateProfile(loginId, name, phone, email);

        if (request.newPassword() != null) {
            inputValidator.validatePassword(request.newPassword());
            admin.changePassword(passwordEncoder.encode(request.newPassword()));
        }
        return AdminResponse.from(admin);
    }

    @Transactional(readOnly = true)
    public List<AdminResponse> getAdminAccounts() {
        return adminRepository.findAllByRoleAndDelFalseOrderByIdAsc(AdminRole.NORMAL).stream()
                .map(AdminResponse::from)
                .toList();
    }

    @Transactional
    public AdminResponse createAdmin(CreateAdminRequest request) {
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        String phone = inputValidator.normalizePhone(request.phone());
        String email = inputValidator.normalizeEmail(request.email());
        inputValidator.validatePassword(request.password());
        ensureUniqueLoginId(loginId, null);
        ensureUniqueEmail(email, null);

        AdminEntity admin = new AdminEntity(
                loginId,
                name,
                passwordEncoder.encode(request.password()),
                AdminRole.NORMAL,
                phone,
                email,
                LocalDateTime.now()
        );
        return AdminResponse.from(adminRepository.save(admin));
    }

    @Transactional
    public AdminResponse updateAdmin(Long id, UpdateAdminRequest request) {
        AdminEntity admin = requireMutableAdmin(id);
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        String phone = inputValidator.normalizePhone(request.phone());
        String email = inputValidator.normalizeEmail(request.email());
        ensureUniqueLoginId(loginId, id);
        if (!java.util.Objects.equals(email, admin.getEmail())) {
            ensureUniqueEmail(email, id);
        }
        admin.updateProfile(loginId, name, phone, email);

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
    public AdminResponse setSuspended(Long id, boolean suspended) {
        AdminEntity admin = requireMutableAdmin(id);
        admin.setSuspended(suspended);
        return AdminResponse.from(admin);
    }

    @Transactional
    public void deleteAdmin(Long id) {
        requireMutableAdmin(id).destroyPersonalData();
    }

    private AdminEntity requireAdmin(Long id) {
        return adminRepository.findByIdAndDelFalse(id)
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
                ? adminRepository.existsByLoginIdAndDelFalse(loginId)
                : adminRepository.existsByLoginIdAndIdNotAndDelFalse(loginId, currentId);
        if (exists) {
            throw new CustomException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
    }

    private void ensureUniqueEmail(String email, Long currentId) {
        boolean exists = currentId == null
                ? adminRepository.existsByEmailAndDelFalse(email)
                : adminRepository.existsByEmailAndIdNotAndDelFalse(email, currentId);
        if (exists) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    private EmailVerificationEntity requireVerifiedSignup(String email) {
        EmailVerificationEntity verification = verificationRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                        email,
                        EmailVerificationPurpose.SIGNUP
                )
                .orElseThrow(() -> new CustomException(ErrorCode.SIGNUP_EMAIL_NOT_VERIFIED));
        if (!verification.isVerified()
                || verification.isConsumed()
                || verification.isExpired(Instant.now())) {
            throw new CustomException(ErrorCode.SIGNUP_EMAIL_NOT_VERIFIED);
        }
        return verification;
    }
}
