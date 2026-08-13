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
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    @Transactional(noRollbackFor = CustomException.class)
    public AdminEntity authenticate(LoginRequest request) {
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        AdminEntity admin = adminRepository.findByLoginIdAndDelFalse(loginId)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));
        if (admin.isSuspended()) {
            if (admin.getFailedLoginAttempts() >= AdminEntity.MAX_FAILED_LOGIN_ATTEMPTS) {
                throw new CustomException(ErrorCode.ACCOUNT_LOCKED_BY_LOGIN_ATTEMPTS);
            }
            throw new CustomException(ErrorCode.ACCOUNT_SUSPENDED);
        }
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            if (admin.recordFailedLogin()) {
                throw new CustomException(ErrorCode.ACCOUNT_LOCKED_BY_LOGIN_ATTEMPTS);
            }
            int attempts = admin.getFailedLoginAttempts();
            if (attempts >= AdminEntity.WARN_FAILED_LOGIN_ATTEMPTS) {
                int remaining = AdminEntity.MAX_FAILED_LOGIN_ATTEMPTS - attempts;
                throw new CustomException(
                        ErrorCode.INVALID_CREDENTIALS,
                        "비밀번호를 " + attempts + "회 틀렸습니다. "
                                + remaining + "회 더 틀리면 계정이 정지됩니다."
                );
            }
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }
        admin.clearFailedLoginAttempts();
        return admin;
    }

    @Transactional(readOnly = true)
    public void checkSignupLoginIdAvailable(String rawLoginId) {
        String loginId = inputValidator.normalizeLoginId(rawLoginId);
        if (adminRepository.existsByLoginIdAndDelFalse(loginId)) {
            throw new CustomException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
    }

    @Transactional
    public AdminResponse signup(SignupRequest request) {
        inputValidator.requirePrivacyAgreed(request.privacyAgreed());
        String loginId = inputValidator.normalizeLoginId(request.loginId());
        String name = inputValidator.normalizeName(request.name());
        String phone = inputValidator.normalizePhone(request.phone());
        String email = inputValidator.normalizeEmail(request.email());
        inputValidator.validatePassword(request.password());
        if (loginId.equals(request.password())) {
            throw new CustomException(
                    ErrorCode.INVALID_INPUT,
                    "아이디와 비밀번호는 같을 수 없습니다."
            );
        }
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

    @Transactional(readOnly = true)
    public AdminEntity requireActiveAdmin(Long adminId) {
        AdminEntity admin = requireAdmin(adminId);
        if (admin.isSuspended()) {
            throw new CustomException(ErrorCode.ACCOUNT_SUSPENDED);
        }
        return admin;
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
        return adminRepository.findAllByDelFalseOrderByIdAsc().stream()
                .map(AdminResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<AdminResponse> searchAdminAccounts(PageRequestDTO request, String roleFilter) {
        int page = Math.max(request.getPage(), 1);
        int size = request.getSize() < 1 ? 20 : Math.min(request.getSize(), 50);
        String keyword = request.getSearchText() == null ? "" : request.getSearchText().trim();
        PageRequestDTO normalized = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .searchText(keyword)
                .build();

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "id"));
        Page<AdminEntity> result;
        if (roleFilter != null && "ALL".equalsIgnoreCase(roleFilter.trim())) {
            result = adminRepository.searchAllActive(keyword, pageable);
        } else {
            AdminRole role = AdminRole.NORMAL;
            if (roleFilter != null && !roleFilter.isBlank()) {
                try {
                    role = AdminRole.valueOf(roleFilter.trim().toUpperCase());
                } catch (IllegalArgumentException ignored) {
                    role = AdminRole.NORMAL;
                }
            }
            result = adminRepository.searchActiveByRole(role, keyword, pageable);
        }
        return PageResponseDTO.<AdminResponse>withAll()
                .dtoList(result.getContent().stream().map(AdminResponse::from).toList())
                .pageRequestDTO(normalized)
                .totalCount(result.getTotalElements())
                .build();
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
                .findFirstByEmailAndPurposeAndVerifiedAtIsNotNullAndConsumedAtIsNullOrderByCreatedAtDesc(
                        email,
                        EmailVerificationPurpose.SIGNUP
                )
                .orElseThrow(() -> new CustomException(ErrorCode.SIGNUP_EMAIL_NOT_VERIFIED));
        Instant now = Instant.now();
        if (verification.getVerifiedAt() == null
                || !verification.getVerifiedAt().plus(EmailVerificationService.SIGNUP_VERIFIED_TTL).isAfter(now)) {
            throw new CustomException(ErrorCode.SIGNUP_EMAIL_VERIFICATION_EXPIRED);
        }
        return verification;
    }
}
